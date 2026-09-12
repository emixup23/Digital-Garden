import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Search,
  Filter,
  Sliders,
  Maximize2,
  CheckCircle2,
  FileText,
  Tag,
  Folder as FolderIcon,
  X,
  Compass,
  CircleDot,
  Minus,
} from 'lucide-react';
import { NoteFile, Folder, GraphNode, GraphLink, ThemeConfig } from '../types';
import { buildGraphData } from '../utils/parser';
import { getTagColor, getTagHex, getTagBadgeStyle } from '../utils/tagColors';

interface GraphViewProps {
  notes: NoteFile[];
  folders: Folder[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
  theme?: ThemeConfig;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  folders,
  activeNoteId,
  onSelectNote,
  onClose,
  isEmbedded = false,
  theme,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph display options
  const [includeTags, setIncludeTags] = useState(false);
  const [onlyBidirectional, setOnlyBidirectional] = useState(false);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showControls, setShowControls] = useState(false);

  // Physics & Visual params
  const [chargeStrength, setChargeStrength] = useState(() => {
    try {
      const saved = localStorage.getItem('pkm_graph_charge_strength');
      return saved ? Number(saved) : -220;
    } catch {
      return -220;
    }
  });

  const [linkDistance, setLinkDistance] = useState(() => {
    try {
      const saved = localStorage.getItem('pkm_graph_link_distance');
      return saved ? Number(saved) : 90;
    } catch {
      return 90;
    }
  });

  const [collisionRadius, setCollisionRadius] = useState(() => {
    try {
      const saved = localStorage.getItem('pkm_graph_collision_radius');
      return saved ? Number(saved) : 26;
    } catch {
      return 26;
    }
  });

  const [linkStrokeWidth, setLinkStrokeWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('pkm_graph_stroke_width');
      if (!saved || saved === '1.5') {
        localStorage.setItem('pkm_graph_stroke_width', '0.1');
        return 0.1;
      }
      return Number(saved);
    } catch {
      return 0.1;
    }
  });

  const [nodeDotSize, setNodeDotSize] = useState(() => {
    try {
      const saved = localStorage.getItem('pkm_graph_dot_size');
      return saved ? Number(saved) : 4;
    } catch {
      return 4;
    }
  });

  // Hovered / inspect node
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Color map by folder
  const folderColors = useMemo(() => {
    const palette = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#64748b', // slate
    ];
    const map = new Map<string, string>();
    folders.forEach((f, idx) => {
      map.set(f.id, palette[idx % palette.length]);
    });
    map.set('root', '#64748b');
    return map;
  }, [folders]);

  // Build graph data
  const { rawNodes, rawLinks } = useMemo(() => {
    const { nodes, links } = buildGraphData(notes, folders, includeTags);
    return { rawNodes: nodes, rawLinks: links };
  }, [notes, folders, includeTags]);

  // Filter nodes & links
  const { filteredNodes, filteredLinks, stats } = useMemo(() => {
    let nodes = [...rawNodes];
    let links = [...rawLinks];

    // Filter by folder
    if (selectedFolderFilter !== 'all') {
      if (selectedFolderFilter === 'root') {
        nodes = nodes.filter((n) => n.type === 'tag' || !n.folderId);
      } else {
        nodes = nodes.filter((n) => n.type === 'tag' || n.folderId === selectedFolderFilter);
      }
      const validNodeIds = new Set(nodes.map((n) => n.id));
      links = links.filter((l) => {
        const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        return validNodeIds.has(src) && validNodeIds.has(tgt);
      });
    }

    // Filter bidirectional only
    if (onlyBidirectional) {
      const bidiLinks = links.filter((l) => l.bidirectional);
      const connectedIds = new Set<string>();
      bidiLinks.forEach((l) => {
        const src = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
        const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
        connectedIds.add(src);
        connectedIds.add(tgt);
      });
      nodes = nodes.filter((n) => connectedIds.has(n.id));
      links = bidiLinks;
    }

    const bidiCount = links.filter((l) => l.bidirectional).length;

    return {
      filteredNodes: nodes,
      filteredLinks: links,
      stats: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        bidirectionalLinks: bidiCount,
      },
    };
  }, [rawNodes, rawLinks, selectedFolderFilter, onlyBidirectional]);

  // D3 simulation & render
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for markers and gradients
    const defs = svg.append('defs');

    // Zoom container
    const g = svg.append('g');
    transformGroupRef.current = g;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Deep clone data for simulation
    const simulationNodes: GraphNode[] = filteredNodes.map((d) => ({ ...d }));
    const simulationLinks: GraphLink[] = filteredLinks.map((d) => ({ ...d }));

    // Neighbor adjacency map for fast hover highlight
    const linkedByIndex = new Map<string, boolean>();
    simulationLinks.forEach((d) => {
      const srcId = typeof d.source === 'object' ? (d.source as GraphNode).id : (d.source as string);
      const tgtId = typeof d.target === 'object' ? (d.target as GraphNode).id : (d.target as string);
      linkedByIndex.set(`${srcId}|${tgtId}`, true);
    });

    const isConnected = (a: string, b: string) =>
      a === b || linkedByIndex.get(`${a}|${b}`) || linkedByIndex.get(`${b}|${a}`);

    const simulation = d3
      .forceSimulation<GraphNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simulationLinks)
          .id((d) => d.id)
          .distance((d) => (d.bidirectional ? linkDistance * 0.8 : linkDistance))
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(collisionRadius + nodeDotSize * 0.5));

    const primaryColor = theme?.primaryColor || '#ec4899';
    const borderColor = theme?.borderColor || '#2e1c52';

    // Links container - No arrow heads, elegant clean lines
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.bidirectional) return primaryColor;
        if (d.type === 'tag') {
          const tgt = typeof d.target === 'object' ? (d.target as GraphNode).title : String(d.target);
          return getTagColor(tgt).dot;
        }
        return borderColor;
      })
      .attr('stroke-width', (d) => (d.bidirectional ? Math.max(linkStrokeWidth * 1.5, 0.15) : linkStrokeWidth))
      .attr('stroke-dasharray', (d) => (d.type === 'tag' ? '2 2' : 'none'))
      .attr('opacity', (d) => (d.bidirectional ? 0.95 : d.type === 'tag' ? 0.5 : 0.65));

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Nodes container
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer select-none')
      .call(drag as any);

    // Active Node Outer Glow / Halo for small dot
    node
      .filter((d) => d.id === activeNoteId)
      .append('circle')
      .attr('r', nodeDotSize * 2)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 0.1)
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0.7)
      .attr('class', 'animate-pulse');

    // Main Node Dot (Tags have unique multi-color dots) with transparency & 0.1px stroke
    node
      .append('circle')
      .attr('r', (d) => {
        if (d.id === activeNoteId) return nodeDotSize * 1.25;
        if (d.type === 'tag') return Math.max(2, nodeDotSize * 0.8);
        return nodeDotSize;
      })
      .attr('fill', (d) => {
        if (d.id === activeNoteId) return '#faf5ff';
        if (d.type === 'tag') return getTagHex(d.title);
        if (d.folderId && folderColors.has(d.folderId)) {
          return folderColors.get(d.folderId)!;
        }
        return '#ec4899';
      })
      .attr('opacity', (d) => (d.id === activeNoteId ? 0.85 : 0.75))
      .attr('fill-opacity', (d) => (d.id === activeNoteId ? 0.85 : 0.75))
      .attr('stroke', '#150d24')
      .attr('stroke-width', 0.1)
      .attr('stroke-opacity', 0.8)
      .attr('class', 'transition-transform duration-150');

    // Text Label below dot
    node
      .append('text')
      .text((d) => {
        const text = d.title;
        return text.length > 20 ? text.slice(0, 18) + '…' : text;
      })
      .attr('x', 0)
      .attr('y', (d) => (d.id === activeNoteId ? nodeDotSize * 1.25 + 9.5 : nodeDotSize + 8.5))
      .attr('text-anchor', 'middle')
      .attr('font-size', '9.5px')
      .attr('font-weight', (d) => (d.id === activeNoteId ? '600' : '400'))
      .attr('fill', (d) => (d.type === 'tag' ? getTagColor(d.title).text : '#faf5ff'))
      .attr('opacity', 0.95)
      .attr('class', 'pointer-events-none font-sans');

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      if (d.type === 'note') {
        onSelectNote(d.id);
      }
    });

    // Hover interactions
    node
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left + 15,
            y: event.clientY - rect.top - 10,
          });
        }

        // Highlight connected nodes & links, dim others
        node.style('opacity', (o) => (isConnected(d.id, o.id) ? 1 : 0.15));
        link.style('opacity', (o) => {
          const srcId = typeof o.source === 'object' ? (o.source as GraphNode).id : o.source;
          const tgtId = typeof o.target === 'object' ? (o.target as GraphNode).id : o.target;
          return srcId === d.id || tgtId === d.id ? 1 : 0.08;
        });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        setTooltipPos(null);
        node.style('opacity', 1);
        link.style('opacity', 0.85);
      });

    // Tick simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Search query highlight
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      node.style('opacity', (d) =>
        d.title.toLowerCase().includes(q) || d.tags?.some((t) => t.toLowerCase().includes(q))
          ? 1
          : 0.15
      );
    }

    return () => {
      simulation.stop();
    };
  }, [
    filteredNodes,
    filteredLinks,
    activeNoteId,
    chargeStrength,
    linkDistance,
    collisionRadius,
    linkStrokeWidth,
    nodeDotSize,
    folderColors,
    searchQuery,
    onSelectNote,
    theme,
  ]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.77);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(400)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#0c0714] overflow-hidden flex flex-col select-none font-['Space_Grotesk',sans-serif] ${
        !isEmbedded ? 'border-t border-[#2e1c52]' : ''
      }`}
    >
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Search & Filter Pills */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#150d24]/95 backdrop-blur-md p-1.5 rounded-[6px] border border-[#2e1c52] shadow-2xl">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-2.5 pointer-events-none" />
            <input
              id="graph-search-input"
              type="text"
              placeholder="Filter graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-[6px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff] placeholder-[#c084fc]/60 focus:outline-none focus:border-[#ec4899] w-36 sm:w-48 font-['Space_Grotesk',sans-serif]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#c084fc] hover:text-[#faf5ff]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-[#2e1c52]" />

          {/* Folder filter */}
          <select
            id="graph-folder-filter"
            value={selectedFolderFilter}
            onChange={(e) => setSelectedFolderFilter(e.target.value)}
            className="text-xs bg-[#150d24] border border-[#2e1c52] rounded-[6px] px-2 py-1 text-[#faf5ff] focus:outline-none focus:border-[#ec4899] cursor-pointer font-['Space_Grotesk',sans-serif]"
          >
            <option value="all">All Folders</option>
            <option value="root">Root only</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#150d24] text-[#faf5ff]">
                {f.name}
              </option>
            ))}
          </select>

          {/* Bidirectional toggle */}
          <button
            id="btn-toggle-bidi"
            type="button"
            onClick={() => setOnlyBidirectional(!onlyBidirectional)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer ${
              onlyBidirectional
                ? 'bg-[#ec4899] text-[#faf5ff] border-[#ec4899] font-semibold shadow-xs'
                : 'bg-[#150d24] border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
            }`}
            style={onlyBidirectional ? { backgroundColor: '#ec4899', color: '#faf5ff', borderColor: '#ec4899' } : undefined}
            title="Highlight only mutual reciprocal connections"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bidirectional</span>
          </button>

          {/* Tag nodes toggle */}
          <button
            id="btn-toggle-tags"
            type="button"
            onClick={() => setIncludeTags(!includeTags)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer ${
              includeTags
                ? 'bg-[#ec4899] text-[#faf5ff] border-[#ec4899] font-semibold shadow-xs'
                : 'bg-[#150d24] border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
            }`}
            style={includeTags ? { backgroundColor: '#ec4899', color: '#faf5ff', borderColor: '#ec4899' } : undefined}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tags</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="btn-physics-settings"
            type="button"
            onClick={() => setShowControls(!showControls)}
            className={`p-2 rounded-[6px] border transition-colors shadow-sm cursor-pointer ${
              showControls
                ? 'bg-[#ec4899] text-[#faf5ff] border-[#ec4899] font-semibold'
                : 'bg-[#150d24]/95 backdrop-blur-md border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
            }`}
            style={showControls ? { backgroundColor: '#ec4899', color: '#faf5ff', borderColor: '#ec4899' } : undefined}
            title="Graph Physics Parameters"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              id="btn-close-graph"
              type="button"
              onClick={onClose}
              className="p-2 rounded-[6px] bg-[#150d24]/95 backdrop-blur-md border border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Physics & Force Slider Drawer */}
      {showControls && (
        <div className="absolute top-18 right-4 z-30 w-76 bg-[#150d24]/95 backdrop-blur-md p-4 rounded-[8px] border border-[#2e1c52] shadow-2xl text-xs space-y-3.5 text-[#faf5ff] animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#2e1c52]">
            <span className="font-semibold text-[#faf5ff] flex items-center gap-1.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Physics & Visual Tuning</span>
            </span>
            <button
              id="btn-reset-physics-settings"
              type="button"
              onClick={() => {
                setChargeStrength(-220);
                setLinkDistance(90);
                setCollisionRadius(26);
                setLinkStrokeWidth(0.1);
                setNodeDotSize(4);
                try {
                  localStorage.setItem('pkm_graph_charge_strength', '-220');
                  localStorage.setItem('pkm_graph_link_distance', '90');
                  localStorage.setItem('pkm_graph_collision_radius', '26');
                  localStorage.setItem('pkm_graph_stroke_width', '0.1');
                  localStorage.setItem('pkm_graph_dot_size', '4');
                } catch {}
              }}
              className="text-[11px] text-[#c084fc] hover:text-[#faf5ff] underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Visual Geometry Controls */}
          <div className="space-y-2.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#ec4899] flex items-center gap-1">
              <CircleDot className="w-3 h-3" />
              <span>Visual Dimensions</span>
            </div>

            {/* Strokes Width Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[#c084fc]">
                <span className="flex items-center gap-1">
                  <Minus className="w-3 h-3 text-[#ec4899]" />
                  <span>Strokes Width</span>
                </span>
                <span className="font-['Space_Mono',monospace] text-[#faf5ff] font-semibold">{linkStrokeWidth}px</span>
              </div>
              <input
                id="slider-link-stroke-width"
                type="range"
                min="0.1"
                max="6.0"
                step="0.1"
                value={linkStrokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLinkStrokeWidth(val);
                  try {
                    localStorage.setItem('pkm_graph_stroke_width', String(val));
                  } catch {}
                }}
                className="w-full accent-[#ec4899] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#c084fc]/60 font-mono">
                <span>0.1px (Hairline)</span>
                <span>3.0px</span>
                <span>6.0px (Bold)</span>
              </div>
            </div>

            {/* Dots Size Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[#c084fc]">
                <span className="flex items-center gap-1">
                  <CircleDot className="w-3 h-3 text-[#ec4899]" />
                  <span>Dots Size</span>
                </span>
                <span className="font-['Space_Mono',monospace] text-[#faf5ff] font-semibold">{nodeDotSize}px</span>
              </div>
              <input
                id="slider-node-dot-size"
                type="range"
                min="2.0"
                max="14.0"
                step="0.5"
                value={nodeDotSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNodeDotSize(val);
                  try {
                    localStorage.setItem('pkm_graph_dot_size', String(val));
                  } catch {}
                }}
                className="w-full accent-[#ec4899] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#c084fc]/60 font-mono">
                <span>2px (Minimal)</span>
                <span>8px</span>
                <span>14px (Prominent)</span>
              </div>
            </div>
          </div>

          {/* Physics Forces Controls */}
          <div className="space-y-2.5 pt-2 border-t border-[#2e1c52]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#c084fc] flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>Physics Forces</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#c084fc]">
                <span>Repulsion (Charge)</span>
                <span className="font-['Space_Mono',monospace] text-[#faf5ff] font-semibold">{chargeStrength}</span>
              </div>
              <input
                id="slider-charge-strength"
                type="range"
                min="-400"
                max="-30"
                step="10"
                value={chargeStrength}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setChargeStrength(val);
                  try {
                    localStorage.setItem('pkm_graph_charge_strength', String(val));
                  } catch {}
                }}
                className="w-full accent-[#ec4899] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#c084fc]">
                <span>Link Distance</span>
                <span className="font-['Space_Mono',monospace] text-[#faf5ff] font-semibold">{linkDistance}px</span>
              </div>
              <input
                id="slider-link-distance"
                type="range"
                min="30"
                max="200"
                step="5"
                value={linkDistance}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLinkDistance(val);
                  try {
                    localStorage.setItem('pkm_graph_link_distance', String(val));
                  } catch {}
                }}
                className="w-full accent-[#ec4899] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[#c084fc]">
                <span>Node Collision Buffer</span>
                <span className="font-['Space_Mono',monospace] text-[#faf5ff] font-semibold">{collisionRadius}px</span>
              </div>
              <input
                id="slider-collision-radius"
                type="range"
                min="8"
                max="40"
                step="2"
                value={collisionRadius}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCollisionRadius(val);
                  try {
                    localStorage.setItem('pkm_graph_collision_radius', String(val));
                  } catch {}
                }}
                className="w-full accent-[#ec4899] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-40 bg-[#150d24] text-[#faf5ff] p-3 rounded-[6px] border border-[#2e1c52] shadow-2xl pointer-events-none max-w-xs text-xs space-y-1.5 font-['Space_Grotesk',sans-serif]"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-1.5 font-bold text-[#faf5ff]">
            {hoveredNode.type === 'tag' ? (
              <Tag
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: getTagHex(hoveredNode.title) }}
              />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
            <span
              className="truncate"
              style={hoveredNode.type === 'tag' ? { color: getTagColor(hoveredNode.title).dot } : undefined}
            >
              {hoveredNode.title}
            </span>
          </div>

          {hoveredNode.type === 'note' && (
            <>
              <div className="flex items-center gap-1 text-[11px] text-[#c084fc] font-['Space_Mono',monospace]">
                <FolderIcon className="w-3 h-3" />
                <span>{hoveredNode.folderName || 'Root'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2e1c52] text-[11px] font-['Space_Mono',monospace]">
                <div className="flex justify-between">
                  <span className="text-[#c084fc]">Backlinks:</span>
                  <span className="font-bold text-[#faf5ff]">
                    {hoveredNode.inDegree}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#c084fc]">Outgoing:</span>
                  <span className="font-bold text-[#faf5ff]">
                    {hoveredNode.outDegree}
                  </span>
                </div>
              </div>

              {hoveredNode.tags && hoveredNode.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 font-['Space_Mono',monospace]">
                  {hoveredNode.tags.map((t, idx) => {
                    const tagColor = getTagColor(t);
                    return (
                      <span
                        key={idx}
                        style={getTagBadgeStyle(t, false)}
                        className="text-[9px] px-1.5 py-0.2 rounded-[4px] border font-semibold inline-flex items-center gap-1"
                      >
                        <span
                          className="w-1 h-1 rounded-full inline-block"
                          style={{ backgroundColor: tagColor.dot }}
                        />
                        #{t}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="text-[10px] text-[#c084fc] italic pt-1 font-['Space_Mono',monospace]">Click node to open note</div>
        </div>
      )}

      {/* Floating Zoom & Navigation Widget */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-[#150d24]/90 backdrop-blur-md p-1.5 rounded-[6px] border border-[#2e1c52] shadow-2xl">
        <button
          id="btn-zoom-in"
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] rounded-[4px] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] rounded-[4px] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-zoom"
          type="button"
          onClick={handleResetZoom}
          className="p-1.5 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] rounded-[4px] transition-colors cursor-pointer"
          title="Center & Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#150d24]/90 backdrop-blur-md px-3 py-2 rounded-[6px] border border-[#2e1c52] shadow-2xl text-[11px] text-[#faf5ff] flex items-center gap-3.5 font-['Space_Mono',monospace]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#faf5ff] inline-block ring-2 ring-[#faf5ff]/30" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-[#ec4899] inline-block rounded" />
          <span className="font-medium text-[#ec4899]">
            Bidi ⇄ ({stats.bidirectionalLinks})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-[#2e1c52] inline-block" />
          <span className="text-[#c084fc]">Directed</span>
        </div>
        {includeTags && (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1 items-center">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e] inline-block ring-1 ring-[#150d24]" />
              <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block ring-1 ring-[#150d24]" />
              <span className="w-2 h-2 rounded-full bg-[#06b6d4] inline-block ring-1 ring-[#150d24]" />
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block ring-1 ring-[#150d24]" />
            </div>
            <span className="text-[#c084fc]">Tags</span>
          </div>
        )}
        <div className="text-[#c084fc] pl-2 border-l border-[#2e1c52]">
          {stats.totalNodes} nodes • {stats.totalLinks} links
        </div>
      </div>
    </div>
  );
};
