import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
  Plus,
  FileText,
  Tag,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  PanelRightClose,
  Boxes,
} from 'lucide-react';
import { NoteFile, Folder, ThemeConfig } from '../types';
import { findBacklinksForNote, findOutgoingLinks } from '../utils/parser';
import { getTagColor, getTagBadgeStyle } from '../utils/tagColors';
import { CustomIconRenderer } from '../utils/iconLibrary';

interface BacklinksPanelProps {
  activeNote: NoteFile;
  allNotes: NoteFile[];
  folders: Folder[];
  onNavigateToNote: (title: string) => void;
  onCreateNote: (title: string) => void;
  onNavigateToCanvas?: (canvasIdentifier: string, targetCardId?: string) => void;
  onCreateCanvas?: (canvasName: string) => void;
  onOpenFullGraph: () => void;
  theme?: ThemeConfig;
  onClose?: () => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  activeNote,
  allNotes,
  folders,
  onNavigateToNote,
  onCreateNote,
  onNavigateToCanvas,
  onCreateCanvas,
  onOpenFullGraph,
  theme,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'backlinks' | 'outgoing' | 'localGraph'>('backlinks');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const backlinks = React.useMemo(
    () => findBacklinksForNote(activeNote, allNotes),
    [activeNote, allNotes]
  );

  const outgoing = React.useMemo(
    () => findOutgoingLinks(activeNote, allNotes),
    [activeNote, allNotes]
  );

  // Calculate bidirectional count for this note
  const bidirectionalConnections = React.useMemo(() => {
    const backlinkIds = new Set(backlinks.map((b) => b.sourceNoteId));
    return outgoing.filter((o) => o.targetNoteId && backlinkIds.has(o.targetNoteId));
  }, [backlinks, outgoing]);

  // Render Local D3 Graph for current note neighborhood
  useEffect(() => {
    if (activeTab !== 'localGraph' || !svgRef.current) return;

    const width = svgRef.current.clientWidth || 300;
    const height = 260;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Prepare local nodes & links: activeNote + connected neighbors
    interface LocalNode extends d3.SimulationNodeDatum {
      id: string;
      title: string;
      isCenter: boolean;
      isBacklink: boolean;
      isOutgoing: boolean;
      isBidirectional: boolean;
      x?: number;
      y?: number;
    }

    interface LocalLink extends d3.SimulationLinkDatum<LocalNode> {
      source: string | LocalNode;
      target: string | LocalNode;
      isBidirectional: boolean;
    }

    const localNodesMap = new Map<string, LocalNode>();
    localNodesMap.set(activeNote.id, {
      id: activeNote.id,
      title: activeNote.title,
      isCenter: true,
      isBacklink: false,
      isOutgoing: false,
      isBidirectional: false,
    });

    const localLinks: LocalLink[] = [];
    const backlinkIdSet = new Set(backlinks.map((b) => b.sourceNoteId));
    const outgoingIdSet = new Set(
      outgoing.map((o) => o.targetNoteId).filter(Boolean) as string[]
    );

    // Add backlink nodes
    backlinks.forEach((b) => {
      const isBidi = outgoingIdSet.has(b.sourceNoteId);
      if (!localNodesMap.has(b.sourceNoteId)) {
        localNodesMap.set(b.sourceNoteId, {
          id: b.sourceNoteId,
          title: b.sourceNoteTitle,
          isCenter: false,
          isBacklink: true,
          isOutgoing: isBidi,
          isBidirectional: isBidi,
        });
      }
      localLinks.push({
        source: b.sourceNoteId,
        target: activeNote.id,
        isBidirectional: isBidi,
      });
    });

    // Add outgoing nodes
    outgoing.forEach((o) => {
      if (o.targetNoteId && !localNodesMap.has(o.targetNoteId)) {
        localNodesMap.set(o.targetNoteId, {
          id: o.targetNoteId,
          title: o.targetTitle,
          isCenter: false,
          isBacklink: false,
          isOutgoing: true,
          isBidirectional: false,
        });
        localLinks.push({
          source: activeNote.id,
          target: o.targetNoteId,
          isBidirectional: false,
        });
      }
    });

    const nodesData = Array.from(localNodesMap.values());

    const g = svg.append('g');

    const simulation = d3
      .forceSimulation<LocalNode>(nodesData)
      .force('link', d3.forceLink<LocalNode, LocalLink>(localLinks).id((d) => d.id).distance(65))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(16));

    const primaryColor = theme?.primaryColor || '#ec4899';
    const borderColor = theme?.borderColor || '#2e1c52';
    const textColor = theme?.textColor || '#faf5ff';
    const textMutedColor = theme?.textMutedColor || '#c084fc';
    const surfaceColor = theme?.surfaceColor || '#150d24';

    const savedStrokeWidth = (() => {
      try {
        const s = localStorage.getItem('pkm_graph_stroke_width');
        if (!s || s === '1.5') return 0.1;
        return Number(s);
      } catch {
        return 0.1;
      }
    })();
    const savedDotSize = (() => {
      try {
        const s = localStorage.getItem('pkm_graph_dot_size');
        return s ? Number(s) : 4;
      } catch {
        return 4;
      }
    })();

    // Links (No arrow heads, clean line)
    const link = g
      .append('g')
      .selectAll('line')
      .data(localLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => (d.isBidirectional ? primaryColor : borderColor))
      .attr('stroke-width', (d) => (d.isBidirectional ? Math.max(savedStrokeWidth * 1.5, 0.15) : savedStrokeWidth))
      .attr('stroke-dasharray', (d) => (d.isBidirectional ? 'none' : '2 1'))
      .attr('opacity', 0.85);

    // Nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer select-none')
      .on('click', (_, d) => {
        if (!d.isCenter) onNavigateToNote(d.title);
      });

    // Active center halo
    node
      .filter((d) => d.isCenter)
      .append('circle')
      .attr('r', savedDotSize * 2)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 0.1)
      .attr('stroke-dasharray', '2 2')
      .attr('opacity', 0.7)
      .attr('class', 'animate-pulse');

    // Small dot with transparency and 0.1px stroke
    node
      .append('circle')
      .attr('r', (d) => (d.isCenter ? savedDotSize * 1.1 : savedDotSize * 0.8))
      .attr('fill', (d) => (d.isCenter ? textColor : d.isBidirectional ? primaryColor : textMutedColor))
      .attr('opacity', (d) => (d.isCenter ? 0.85 : 0.75))
      .attr('fill-opacity', (d) => (d.isCenter ? 0.85 : 0.75))
      .attr('stroke', surfaceColor)
      .attr('stroke-width', 0.1)
      .attr('stroke-opacity', 0.8);

    // Labels
    node
      .append('text')
      .text((d) => (d.title.length > 14 ? d.title.slice(0, 12) + '…' : d.title))
      .attr('x', 0)
      .attr('y', (d) => (d.isCenter ? savedDotSize * 1.1 + 8 : savedDotSize * 0.8 + 7))
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', (d) => (d.isCenter ? '600' : '400'))
      .attr('fill', '#faf5ff')
      .attr('opacity', 0.9)
      .attr('class', 'pointer-events-none select-none font-sans');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as LocalNode).x || 0)
        .attr('y1', (d) => (d.source as LocalNode).y || 0)
        .attr('x2', (d) => (d.target as LocalNode).x || 0)
        .attr('y2', (d) => (d.target as LocalNode).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [activeTab, activeNote, backlinks, outgoing, onNavigateToNote, theme]);

  return (
    <div className="flex flex-col h-full bg-[#150d24] border-l border-[#2e1c52] text-[#faf5ff] w-72 shrink-0 font-['Space_Grotesk',sans-serif]">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#2e1c52] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#ec4899]" />
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#faf5ff]">
            Graph & Links
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {bidirectionalConnections.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#faf5ff] bg-[#150D24] px-2 py-0.5 rounded-[6px] shadow-sm"
              title={`${bidirectionalConnections.length} mutual reciprocal links`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#faf5ff]" />
              <span>{bidirectionalConnections.length} bidi</span>
            </span>
          )}
          {onClose && (
            <button
              id="btn-close-backlinks-panel"
              type="button"
              onClick={onClose}
              className="p-1 rounded-[4px] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] transition-all duration-150 cursor-pointer ml-1 border border-transparent hover:border-[#2e1c52] active:scale-95"
              title="Hide Right Panel / Links (Cmd+Shift+\)"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2e1c52] text-xs font-medium">
        <button
          id="tab-backlinks"
          type="button"
          onClick={() => setActiveTab('backlinks')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'backlinks'
              ? 'border-[#ec4899] text-[#faf5ff] font-semibold bg-[#1a1030]/50'
              : 'border-transparent text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1a1030]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Backlinks</span>
          <span className="text-[10px] bg-[#1f1338] text-[#c084fc] border border-[#2e1c52] px-1.5 py-0.2 rounded-[4px] font-mono font-semibold">
            {backlinks.length}
          </span>
        </button>

        <button
          id="tab-outgoing"
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'outgoing'
              ? 'border-[#ec4899] text-[#faf5ff] font-semibold bg-[#1a1030]/50'
              : 'border-transparent text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1a1030]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Outgoing</span>
          <span className="text-[10px] bg-[#1f1338] text-[#c084fc] border border-[#2e1c52] px-1.5 py-0.2 rounded-[4px] font-mono font-semibold">
            {outgoing.length}
          </span>
        </button>

        <button
          id="tab-localgraph"
          type="button"
          onClick={() => setActiveTab('localGraph')}
          className={`flex-1 py-2 px-2 text-center border-b-2 transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'localGraph'
              ? 'border-[#ec4899] text-[#faf5ff] font-semibold bg-[#1a1030]/50'
              : 'border-transparent text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1a1030]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Mini Graph</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* Backlinks Tab */}
        {activeTab === 'backlinks' && (
          <div className="space-y-3">
            <p className="text-[#c084fc] text-[11px] leading-snug">
              Notes referencing <strong className="text-[#faf5ff]">{activeNote.title}</strong>:
            </p>

            {backlinks.length === 0 ? (
              <div className="py-8 text-center text-[#c084fc]/60 space-y-1">
                <ArrowDownLeft className="w-8 h-8 mx-auto stroke-1 opacity-40 text-[#c084fc]" />
                <p className="text-xs">No backlinks yet.</p>
                <p className="text-[11px] text-[#c084fc]/40 font-mono">
                  [[{activeNote.title}]]
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {backlinks.map((item, idx) => {
                  const isReciprocal = outgoing.some((o) => o.targetNoteId === item.sourceNoteId);
                  const sourceNote = allNotes.find((n) => n.id === item.sourceNoteId);
                  return (
                    <div
                      key={idx}
                      id={`backlink-item-${idx}`}
                      onClick={() => onNavigateToNote(item.sourceNoteTitle)}
                      className="group p-2.5 rounded-[6px] border-[#2e1c52] bg-[#1f1338] hover:border-[#ec4899] hover:bg-[#251543] hover:shadow-[0_2px_10px_rgba(236,72,153,0.18)] active:scale-[0.99] transition-all duration-150 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-medium text-[#faf5ff] group-hover:text-white truncate">
                          <CustomIconRenderer
                            iconName={sourceNote?.icon}
                            color={sourceNote?.iconColor || '#ec4899'}
                            defaultIcon={FileText}
                            className="w-3.5 h-3.5 shrink-0"
                          />
                          <span className="truncate">{item.sourceNoteTitle}</span>
                        </div>
                        {isReciprocal && (
                          <span
                            className="text-[9px] font-mono text-[#faf5ff] bg-[#ec4899] px-1.5 py-0.2 rounded-[4px] font-semibold shrink-0 ml-2"
                            title="Bidirectional link: You both link to each other!"
                          >
                            mutual ⇄
                          </span>
                        )}
                      </div>
                      <p className="text-[#faf5ff]/80 group-hover:text-[#faf5ff] text-[11px] line-clamp-2 italic bg-[#150d24] group-hover:bg-[#1a0f30] p-1.5 rounded-[4px] border border-[#2e1c52] group-hover:border-[#3b2366] font-['Space_Mono',monospace] transition-colors">
                        "{item.snippet}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Outgoing Links Tab */}
        {activeTab === 'outgoing' && (
          <div className="space-y-3">
            <p className="text-[#c084fc] text-[11px] leading-snug">
              Notes linked inside this document:
            </p>

            {outgoing.length === 0 ? (
              <div className="py-8 text-center text-[#c084fc]/60 space-y-1">
                <ArrowUpRight className="w-8 h-8 mx-auto stroke-1 opacity-40 text-[#c084fc]" />
                <p className="text-xs">No outgoing links found.</p>
                <p className="text-[11px] text-[#c084fc]/40 font-mono">
                  [[Note Title]]
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {outgoing.map((link, idx) => {
                  const isReciprocal = backlinks.some((b) => b.sourceNoteId === link.targetNoteId);
                  const targetNote = allNotes.find((n) => n.id === link.targetNoteId);
                  const isCanvas = !!link.isCanvas;
                  return (
                    <div
                      key={idx}
                      id={`outgoing-link-${idx}`}
                      className="flex items-center justify-between p-2 rounded-[6px] border border-[#2e1c52] bg-[#1f1338] hover:border-[#ec4899]/70 hover:bg-[#251543] transition-all duration-150"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isCanvas ? (
                          <Boxes className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
                        ) : (
                          <CustomIconRenderer
                            iconName={targetNote?.icon}
                            color={targetNote?.iconColor || (link.isExisting ? '#ec4899' : '#fcd34d')}
                            defaultIcon={FileText}
                            className="w-3.5 h-3.5 shrink-0"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isCanvas) {
                              if (link.isExisting) {
                                onNavigateToCanvas?.(link.canvasId || link.targetTitle, link.targetCardId || undefined);
                              } else {
                                onCreateCanvas?.(link.targetTitle);
                              }
                            } else {
                              if (link.isExisting) onNavigateToNote(link.targetTitle);
                              else onCreateNote(link.targetTitle);
                            }
                          }}
                          className="font-medium text-[#faf5ff] hover:text-[#ec4899] hover:underline underline-offset-2 truncate text-left cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <span className="truncate">{link.targetTitle}</span>
                          {isCanvas && (
                            <span className="text-[9px] font-mono text-[#ec4899] bg-[#ec4899]/20 border border-[#ec4899]/40 px-1 rounded-[3px] shrink-0">
                              Canvas
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isReciprocal && (
                          <span className="text-[9px] font-mono text-[#faf5ff] bg-[#ec4899] px-1.5 py-0.2 rounded-[4px] font-semibold">
                            mutual ⇄
                          </span>
                        )}
                        {!link.isExisting && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isCanvas) {
                                onCreateCanvas?.(link.targetTitle);
                              } else {
                                onCreateNote(link.targetTitle);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#faf5ff] bg-[#ec4899] hover:bg-[#db2777] hover:shadow-[0_0_8px_rgba(236,72,153,0.4)] active:scale-95 px-2 py-0.5 rounded-[6px] shadow transition-all duration-150 cursor-pointer"
                            title={isCanvas ? 'Create this canvas whiteboard' : 'Create this note now'}
                          >
                            <Plus className="w-2.5 h-2.5 text-[#faf5ff]" />
                            <span>{isCanvas ? 'Create Canvas' : 'Create Note'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Local Mini-Graph Tab */}
        {activeTab === 'localGraph' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#c084fc]">1-Hop Neighborhood</span>
              <button
                type="button"
                id="btn-expand-full-graph"
                onClick={onOpenFullGraph}
                className="inline-flex items-center gap-1 text-[11px] text-[#ec4899] hover:text-[#f472b6] font-medium hover:underline underline-offset-2 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full Graph</span>
              </button>
            </div>

            <div className="relative w-full h-64 rounded-[6px] bg-[#0c0714] border border-[#2e1c52] overflow-hidden">
              <svg ref={svgRef} className="w-full h-full" />
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#c084fc] font-['Space_Mono',monospace]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#faf5ff] inline-block ring-1 ring-[#faf5ff]/30" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ec4899] inline-block" />
                <span>Bidi</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#c084fc] inline-block" />
                <span>Linked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note Metadata Footer */}
      <div className="p-3 border-t border-[#2e1c52] text-[11px] text-[#c084fc] space-y-1 bg-[#150d24]">
        <div className="flex justify-between font-['Space_Mono',monospace]">
          <span>Note:</span>
          <span className="text-[#faf5ff] truncate max-w-[170px] font-medium">
            {activeNote.title || activeNote.name.replace(/\.(md|mf)$/i, '')}
          </span>
        </div>
        <div className="flex justify-between font-['Space_Mono',monospace] text-[10px]">
          <span>Updated:</span>
          <span>{new Date(activeNote.updatedAt).toLocaleDateString()}</span>
        </div>
        {activeNote.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1 font-['Space_Mono',monospace]">
            {activeNote.tags.map((t, idx) => {
              const tagColor = getTagColor(t);
              return (
                <span
                  key={idx}
                  style={getTagBadgeStyle(t, false)}
                  className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-[4px] border shadow-2xs"
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
      </div>
    </div>
  );
};
