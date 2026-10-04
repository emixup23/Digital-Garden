import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  NoteFile,
  Folder,
  ThemeConfig,
  CanvasBoard,
  CanvasNode,
  CanvasEdge,
  CanvasNodeType,
  CanvasDrawingStroke,
  CanvasEdgeStyle,
} from '../types';
import {
  MousePointer,
  Hand,
  PenTool,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Trash2,
  ExternalLink,
  Tag,
  Folder as FolderIcon,
  StickyNote,
  FileText,
  Boxes,
  Grid,
  ChevronDown,
  Download,
  Upload,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  Move,
  X,
  Palette,
  Check,
  Search,
  Copy,
  Edit2,
  Minimize2,
  FolderTree,
  Share2,
} from 'lucide-react';
import {
  loadCanvasBoards,
  saveCanvasBoards,
  loadActiveCanvasId,
  saveActiveCanvasId,
  createNewCanvas,
  exportCanvasAsJson,
  parseCanvasFromJson,
  generateCanvasWikilink,
  generateCanvasMarkdownLink,
  copyTextToClipboard,
  findCanvasByIdOrName,
} from '../utils/canvasStore';
import { CustomIconRenderer } from '../utils/iconLibrary';
import { getTagBadgeStyle } from '../utils/tagColors';
import { getFolderPath } from '../utils/searchEngine';

interface CanvasViewProps {
  notes: NoteFile[];
  folders: Folder[];
  onSelectNote: (noteId: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  onClose?: () => void;
  theme?: ThemeConfig;
  targetCanvasId?: string | null;
  targetNodeId?: string | null;
}

type ToolMode = 'select' | 'pan' | 'connect' | 'pen' | 'eraser';

const COLOR_PALETTE = [
  { name: 'Pink', hex: '#ec4899', bg: '#431429', border: '#ec4899' },
  { name: 'Purple', hex: '#a855f7', bg: '#2e1065', border: '#a855f7' },
  { name: 'Cyan', hex: '#06b6d4', bg: '#083344', border: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981', bg: '#064e3b', border: '#10b981' },
  { name: 'Amber', hex: '#f59e0b', bg: '#451a03', border: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e', bg: '#4c0519', border: '#f43f5e' },
  { name: 'Blue', hex: '#3b82f6', bg: '#172554', border: '#3b82f6' },
  { name: 'Slate', hex: '#94a3b8', bg: '#1e293b', border: '#64748b' },
];

const STICKY_PALETTE = [
  { name: 'Yellow', hex: '#fbbf24', bg: '#713f12', border: '#f59e0b', text: '#fef08a' },
  { name: 'Neon Pink', hex: '#f472b6', bg: '#701a75', border: '#ec4899', text: '#fdf2f8' },
  { name: 'Purple', hex: '#c084fc', bg: '#3b0764', border: '#a855f7', text: '#faf5ff' },
  { name: 'Cyan', hex: '#38bdf8', bg: '#0c4a6e', border: '#0284c7', text: '#f0f9ff' },
  { name: 'Mint', hex: '#4ade80', bg: '#14532d', border: '#16a34a', text: '#f0fdf4' },
  { name: 'Orange', hex: '#fb923c', bg: '#7c2d12', border: '#ea580c', text: '#fff7ed' },
];

export const CanvasView: React.FC<CanvasViewProps> = ({
  notes,
  folders,
  onSelectNote,
  onNavigateToNote,
  onClose,
  theme,
  targetCanvasId,
  targetNodeId,
}) => {
  // Boards state
  const [boards, setBoards] = useState<CanvasBoard[]>(() => loadCanvasBoards(notes));
  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    const savedId = loadActiveCanvasId();
    const existing = loadCanvasBoards(notes);
    if (savedId && existing.some((b) => b.id === savedId)) return savedId;
    return existing.length > 0 ? existing[0].id : '';
  });

  const activeBoard = useMemo(() => {
    return boards.find((b) => b.id === activeBoardId) || boards[0] || null;
  }, [boards, activeBoardId]);

  // Current board state for live manipulation
  const [nodes, setNodes] = useState<CanvasNode[]>(() => activeBoard?.nodes || []);
  const [edges, setEdges] = useState<CanvasEdge[]>(() => activeBoard?.edges || []);
  const [drawings, setDrawings] = useState<CanvasDrawingStroke[]>(() => activeBoard?.drawings || []);
  const [viewport, setViewport] = useState(() => activeBoard?.viewport || { x: 100, y: 100, zoom: 1 });

  // Update local state when switching active board
  useEffect(() => {
    if (activeBoard) {
      setNodes(activeBoard.nodes || []);
      setEdges(activeBoard.edges || []);
      setDrawings(activeBoard.drawings || []);
      setViewport(activeBoard.viewport || { x: 100, y: 100, zoom: 1 });
      saveActiveCanvasId(activeBoard.id);
    }
  }, [activeBoardId]);

  // Toast feedback state for copied links
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Deep link navigation: switch to target canvas if requested by external link
  useEffect(() => {
    if (targetCanvasId) {
      const match = findCanvasByIdOrName(boards, targetCanvasId);
      if (match && match.id !== activeBoardId) {
        setActiveBoardId(match.id);
      }
    }
  }, [targetCanvasId, boards, activeBoardId]);

  // Deep link navigation: center viewport and pulse highlight on target node
  useEffect(() => {
    if (targetNodeId && nodes.length > 0) {
      const targetNode = nodes.find((n) => n.id === targetNodeId);
      if (targetNode && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const newVp = {
          zoom: 1.1,
          x: centerX - (targetNode.x + targetNode.width / 2) * 1.1,
          y: centerY - (targetNode.y + targetNode.height / 2) * 1.1,
        };
        setViewport(newVp);
        setSelectedNodeIds([targetNode.id]);
        setHighlightedNodeId(targetNode.id);
        const timer = setTimeout(() => setHighlightedNodeId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [targetNodeId, nodes]);

  // Link copy actions
  const handleCopyCanvasLink = useCallback(
    async (format: 'wikilink' | 'markdown' | 'embed' = 'wikilink') => {
      if (!activeBoard) return;
      let textToCopy = '';
      if (format === 'wikilink') {
        textToCopy = generateCanvasWikilink(activeBoard.name);
      } else if (format === 'markdown') {
        textToCopy = generateCanvasMarkdownLink(activeBoard.name, activeBoard.id);
      } else if (format === 'embed') {
        textToCopy = `![[canvas:${activeBoard.name}]]`;
      }
      const success = await copyTextToClipboard(textToCopy);
      if (success) {
        showToast(`Copied canvas reference: ${textToCopy} — paste into any note!`);
      }
      setIsCopyMenuOpen(false);
    },
    [activeBoard, showToast]
  );

  const handleCopySpecificCanvasLink = useCallback(
    async (board: CanvasBoard) => {
      const link = generateCanvasWikilink(board.name);
      const success = await copyTextToClipboard(link);
      if (success) {
        showToast(`Copied link for "${board.name}": ${link}`);
      }
    },
    [showToast]
  );

  const handleCopyCardLink = useCallback(
    async (node: CanvasNode) => {
      if (!activeBoard) return;
      const link = generateCanvasWikilink(activeBoard.name, node.id);
      const success = await copyTextToClipboard(link);
      if (success) {
        showToast(`Copied card link: ${link}`);
      }
    },
    [activeBoard, showToast]
  );

  // Auto-save changes back to boards array and localStorage (debounced)
  const saveTimerRef = useRef<number | null>(null);
  const persistBoardChanges = useCallback(
    (newNodes: CanvasNode[], newEdges: CanvasEdge[], newDrawings: CanvasDrawingStroke[], newVp = viewport) => {
      if (!activeBoard) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        setBoards((prevBoards) => {
          const updated = prevBoards.map((b) =>
            b.id === activeBoard.id
              ? {
                  ...b,
                  nodes: newNodes,
                  edges: newEdges,
                  drawings: newDrawings,
                  viewport: newVp,
                  updatedAt: Date.now(),
                }
              : b
          );
          saveCanvasBoards(updated);
          return updated;
        });
      }, 300);
    },
    [activeBoard, viewport]
  );

  // Undo / Redo history
  const historyRef = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[]; drawings: CanvasDrawingStroke[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = useCallback(
    (n: CanvasNode[], e: CanvasEdge[], d: CanvasDrawingStroke[]) => {
      const state = {
        nodes: JSON.parse(JSON.stringify(n)),
        edges: JSON.parse(JSON.stringify(e)),
        drawings: JSON.parse(JSON.stringify(d)),
      };
      const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
      trimmed.push(state);
      if (trimmed.length > 30) trimmed.shift();
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
    },
    []
  );

  // Tool mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#ec4899');
  const [penWidth, setPenWidth] = useState<number>(3);

  // Selection
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Modals & Popovers
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState<boolean>(false);
  const [isEditingBoardName, setIsEditingBoardName] = useState<boolean>(false);
  const [boardNameInput, setBoardNameInput] = useState<string>('');
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>('');
  const [activeEdgeLabelEditor, setActiveEdgeLabelEditor] = useState<string | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState<string>('');

  // Connecting state
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);
  const [connectSourceSide, setConnectSourceSide] = useState<'top' | 'right' | 'bottom' | 'left'>('right');
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);

  // Dragging & Panning refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging refs
  const isDraggingNodeRef = useRef<boolean>(false);
  const dragNodeStartPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragMouseStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Resizing refs
  const isResizingRef = useRef<boolean>(false);
  const resizeNodeIdRef = useRef<string | null>(null);
  const resizeStartDimRef = useRef<{ width: number; height: number; x: number; y: number }>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  // Pen Drawing refs
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // Coordinate conversion helpers
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = screenX - rect.left;
      const relativeY = screenY - rect.top;
      return {
        x: (relativeX - viewport.x) / viewport.zoom,
        y: (relativeY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Zoom controls
  const handleZoom = useCallback(
    (delta: number, clientCenterX?: number, clientCenterY?: number) => {
      setViewport((prev) => {
        const nextZoom = Math.min(Math.max(prev.zoom * delta, 0.2), 3);
        if (!containerRef.current || clientCenterX === undefined || clientCenterY === undefined) {
          const nextVp = { ...prev, zoom: nextZoom };
          persistBoardChanges(nodes, edges, drawings, nextVp);
          return nextVp;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = clientCenterX - rect.left;
        const mouseY = clientCenterY - rect.top;

        const nextX = mouseX - (mouseX - prev.x) * (nextZoom / prev.zoom);
        const nextY = mouseY - (mouseY - prev.y) * (nextZoom / prev.zoom);

        const nextVp = { x: nextX, y: nextY, zoom: nextZoom };
        persistBoardChanges(nodes, edges, drawings, nextVp);
        return nextVp;
      });
    },
    [nodes, edges, drawings, persistBoardChanges]
  );

  const handleResetZoom = useCallback(() => {
    setViewport({ x: 100, y: 100, zoom: 1 });
    persistBoardChanges(nodes, edges, drawings, { x: 100, y: 100, zoom: 1 });
  }, [nodes, edges, drawings, persistBoardChanges]);

  // Fit all nodes
  const handleFitView = useCallback(() => {
    if (nodes.length === 0 || !containerRef.current) {
      handleResetZoom();
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const padding = 80;
    const contentWidth = Math.max(maxX - minX + padding * 2, 200);
    const contentHeight = Math.max(maxY - minY + padding * 2, 200);

    const zoomX = rect.width / contentWidth;
    const zoomY = rect.height / contentHeight;
    const fitZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.25), 1.5);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = rect.width / 2 - centerX * fitZoom;
    const newY = rect.height / 2 - centerY * fitZoom;

    const nextVp = { x: newX, y: newY, zoom: fitZoom };
    setViewport(nextVp);
    persistBoardChanges(nodes, edges, drawings, nextVp);
  }, [nodes, edges, drawings, handleResetZoom, persistBoardChanges]);

  // Mouse wheel zoom / pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        handleZoom(factor, e.clientX, e.clientY);
      } else {
        // Pan
        setViewport((prev) => {
          const nextVp = {
            ...prev,
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY,
          };
          persistBoardChanges(nodes, edges, drawings, nextVp);
          return nextVp;
        });
      }
    },
    [handleZoom, nodes, edges, drawings, persistBoardChanges]
  );

  // Background Pointer Down
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // If clicking on background
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-surface')) {
      return;
    }

    if (toolMode === 'pen') {
      isDrawingRef.current = true;
      const pt = screenToCanvas(e.clientX, e.clientY);
      currentStrokeRef.current = [pt];
      return;
    }

    // Pan with middle mouse, spacebar, or pan tool
    if (toolMode === 'pan' || e.button === 1 || e.button === 0) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      viewportStartRef.current = { x: viewport.x, y: viewport.y };
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
    }
  };

  // Node Pointer Down for drag
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();

    if (toolMode === 'connect') {
      setConnectSourceNodeId(node.id);
      setConnectSourceSide('right');
      const pt = screenToCanvas(e.clientX, e.clientY);
      setConnectMousePos(pt);
      return;
    }

    if (toolMode === 'pen' || toolMode === 'eraser') return;

    if (!selectedNodeIds.includes(node.id)) {
      if (e.shiftKey) {
        setSelectedNodeIds((prev) => [...prev, node.id]);
      } else {
        setSelectedNodeIds([node.id]);
      }
    }

    isDraggingNodeRef.current = true;
    dragMouseStartRef.current = { x: e.clientX, y: e.clientY };

    // Record initial positions of all selected nodes
    const map = new Map<string, { x: number; y: number }>();
    const idsToDrag = selectedNodeIds.includes(node.id) ? selectedNodeIds : [node.id];
    idsToDrag.forEach((id) => {
      const target = nodes.find((n) => n.id === id);
      if (target) map.set(id, { x: target.x, y: target.y });
    });

    // If dragging a group, also drag its contained nodes
    if (node.type === 'group') {
      nodes.forEach((n) => {
        if (
          n.id !== node.id &&
          n.x >= node.x &&
          n.x + n.width <= node.x + node.width &&
          n.y >= node.y &&
          n.y + n.height <= node.y + node.height
        ) {
          map.set(n.id, { x: n.x, y: n.y });
        }
      });
    }

    dragNodeStartPosRef.current = map;
  };

  // Start resize
  const handleResizeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    isResizingRef.current = true;
    resizeNodeIdRef.current = node.id;
    resizeStartDimRef.current = {
      width: node.width,
      height: node.height,
      x: e.clientX,
      y: e.clientY,
    };
  };

  // Global mouse move
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Panning
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setViewport({
          ...viewport,
          x: viewportStartRef.current.x + dx,
          y: viewportStartRef.current.y + dy,
        });
        return;
      }

      // Connecting arrow
      if (connectSourceNodeId) {
        const pt = screenToCanvas(e.clientX, e.clientY);
        setConnectMousePos(pt);
        return;
      }

      // Drawing stroke
      if (isDrawingRef.current) {
        const pt = screenToCanvas(e.clientX, e.clientY);
        currentStrokeRef.current.push(pt);
        // Force re-render of active drawing
        setDrawings((prev) => [...prev]);
        return;
      }

      // Resizing
      if (isResizingRef.current && resizeNodeIdRef.current) {
        const dx = (e.clientX - resizeStartDimRef.current.x) / viewport.zoom;
        const dy = (e.clientY - resizeStartDimRef.current.y) / viewport.zoom;
        let newWidth = Math.max(resizeStartDimRef.current.width + dx, 160);
        let newHeight = Math.max(resizeStartDimRef.current.height + dy, 120);

        if (snapToGrid) {
          newWidth = Math.round(newWidth / 20) * 20;
          newHeight = Math.round(newHeight / 20) * 20;
        }

        setNodes((prev) =>
          prev.map((n) =>
            n.id === resizeNodeIdRef.current ? { ...n, width: newWidth, height: newHeight } : n
          )
        );
        return;
      }

      // Dragging nodes
      if (isDraggingNodeRef.current) {
        const dx = (e.clientX - dragMouseStartRef.current.x) / viewport.zoom;
        const dy = (e.clientY - dragMouseStartRef.current.y) / viewport.zoom;

        setNodes((prev) =>
          prev.map((n) => {
            const start = dragNodeStartPosRef.current.get(n.id);
            if (!start) return n;
            let nx = start.x + dx;
            let ny = start.y + dy;
            if (snapToGrid) {
              nx = Math.round(nx / 20) * 20;
              ny = Math.round(ny / 20) * 20;
            }
            return { ...n, x: nx, y: ny };
          })
        );
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        persistBoardChanges(nodes, edges, drawings);
      }

      if (isDraggingNodeRef.current) {
        isDraggingNodeRef.current = false;
        pushHistory(nodes, edges, drawings);
        persistBoardChanges(nodes, edges, drawings);
      }

      if (isResizingRef.current) {
        isResizingRef.current = false;
        resizeNodeIdRef.current = null;
        pushHistory(nodes, edges, drawings);
        persistBoardChanges(nodes, edges, drawings);
      }

      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        if (currentStrokeRef.current.length > 1) {
          const newStroke: CanvasDrawingStroke = {
            id: `stroke-${Date.now()}`,
            points: [...currentStrokeRef.current],
            color: penColor,
            width: penWidth,
          };
          const next = [...drawings, newStroke];
          setDrawings(next);
          pushHistory(nodes, edges, next);
          persistBoardChanges(nodes, edges, next);
        }
        currentStrokeRef.current = [];
      }

      if (connectSourceNodeId) {
        // If dropped outside a valid target, cancel connection
        setConnectSourceNodeId(null);
        setConnectMousePos(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    viewport,
    connectSourceNodeId,
    screenToCanvas,
    snapToGrid,
    nodes,
    edges,
    drawings,
    penColor,
    penWidth,
    persistBoardChanges,
    pushHistory,
  ]);

  // Finish connecting edge when releasing on a node
  const handleNodeMouseUp = (e: React.MouseEvent, targetNode: CanvasNode) => {
    if (connectSourceNodeId && connectSourceNodeId !== targetNode.id) {
      e.stopPropagation();
      const newEdge: CanvasEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fromNodeId: connectSourceNodeId,
        toNodeId: targetNode.id,
        fromSide: connectSourceSide,
        toSide: 'left',
        label: '',
        color: '#ec4899',
        style: 'bezier',
        direction: 'forward',
      };
      const nextEdges = [...edges, newEdge];
      setEdges(nextEdges);
      pushHistory(nodes, nextEdges, drawings);
      persistBoardChanges(nodes, nextEdges, drawings);
      setConnectSourceNodeId(null);
      setConnectMousePos(null);
    }
  };

  // Add Note Card from Vault
  const handleAddNoteCard = (note: NoteFile) => {
    // Avoid duplicate cards if desired, or place near center
    const rect = containerRef.current?.getBoundingClientRect();
    const center = screenToCanvas(
      rect ? rect.left + rect.width / 2 : 400,
      rect ? rect.top + rect.height / 2 : 300
    );

    const newNode: CanvasNode = {
      id: `card-note-${note.id}-${Date.now()}`,
      type: 'note',
      noteId: note.id,
      title: note.title || note.name,
      x: center.x - 140 + Math.random() * 40,
      y: center.y - 120 + Math.random() * 40,
      width: 290,
      height: 280,
      color: note.iconColor || '#ec4899',
      zIndex: nodes.length + 1,
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeIds([newNode.id]);
    pushHistory(nextNodes, edges, drawings);
    persistBoardChanges(nextNodes, edges, drawings);
    setIsAddNoteModalOpen(false);
  };

  // Add Sticky Note
  const handleAddStickyNote = (colorPreset = STICKY_PALETTE[0]) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const center = screenToCanvas(
      rect ? rect.left + rect.width / 2 : 400,
      rect ? rect.top + rect.height / 2 : 300
    );

    const newNode: CanvasNode = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      title: 'Sticky Note',
      content: 'Write your thought here...',
      x: center.x - 110 + Math.random() * 40,
      y: center.y - 90 + Math.random() * 40,
      width: 240,
      height: 190,
      color: colorPreset.hex,
      bgColor: colorPreset.bg,
      borderColor: colorPreset.border,
      zIndex: nodes.length + 1,
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeIds([newNode.id]);
    pushHistory(nextNodes, edges, drawings);
    persistBoardChanges(nextNodes, edges, drawings);
  };

  // Add Custom Markdown Card
  const handleAddTextCard = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const center = screenToCanvas(
      rect ? rect.left + rect.width / 2 : 400,
      rect ? rect.top + rect.height / 2 : 300
    );

    const newNode: CanvasNode = {
      id: `card-text-${Date.now()}`,
      type: 'text',
      title: 'Idea Card',
      content: '## Concept\n- Key principle\n- Supporting evidence',
      x: center.x - 130 + Math.random() * 40,
      y: center.y - 100 + Math.random() * 40,
      width: 280,
      height: 220,
      color: '#3b82f6',
      zIndex: nodes.length + 1,
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeIds([newNode.id]);
    pushHistory(nextNodes, edges, drawings);
    persistBoardChanges(nextNodes, edges, drawings);
  };

  // Add Group Box
  const handleAddGroup = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const center = screenToCanvas(
      rect ? rect.left + rect.width / 2 : 400,
      rect ? rect.top + rect.height / 2 : 300
    );

    const newNode: CanvasNode = {
      id: `group-${Date.now()}`,
      type: 'group',
      title: '📁 Concept Group',
      x: center.x - 250,
      y: center.y - 200,
      width: 520,
      height: 400,
      color: '#a855f7',
      bgColor: '#1f1338',
      borderColor: '#7c3aed',
      zIndex: 0,
    };

    const nextNodes = [newNode, ...nodes];
    setNodes(nextNodes);
    setSelectedNodeIds([newNode.id]);
    pushHistory(nextNodes, edges, drawings);
    persistBoardChanges(nextNodes, edges, drawings);
  };

  // Delete selected nodes or edges
  const handleDeleteSelected = () => {
    if (selectedNodeIds.length === 0 && !selectedEdgeId) return;

    let nextNodes = nodes;
    let nextEdges = edges;

    if (selectedNodeIds.length > 0) {
      nextNodes = nodes.filter((n) => !selectedNodeIds.includes(n.id));
      nextEdges = edges.filter(
        (e) => !selectedNodeIds.includes(e.fromNodeId) && !selectedNodeIds.includes(e.toNodeId)
      );
      setSelectedNodeIds([]);
    }

    if (selectedEdgeId) {
      nextEdges = nextEdges.filter((e) => e.id !== selectedEdgeId);
      setSelectedEdgeId(null);
    }

    setNodes(nextNodes);
    setEdges(nextEdges);
    pushHistory(nextNodes, nextEdges, drawings);
    persistBoardChanges(nextNodes, nextEdges, drawings);
  };

  // Auto-arrange nodes in a clean layout
  const handleAutoArrange = () => {
    if (nodes.length === 0) return;

    const padding = 40;
    const cols = Math.ceil(Math.sqrt(nodes.length));
    let startX = 60;
    let startY = 80;

    const arranged = nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...node,
        x: startX + col * (320 + padding),
        y: startY + row * (290 + padding),
      };
    });

    setNodes(arranged);
    pushHistory(arranged, edges, drawings);
    persistBoardChanges(arranged, edges, drawings);
  };

  // Keyboard shortcuts (Delete, Escape, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        setConnectSourceNodeId(null);
        setConnectMousePos(null);
      } else if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSelectedNodeIds(nodes.map((n) => n.id));
      } else if (e.key === 'f') {
        handleFitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, selectedNodeIds, selectedEdgeId, handleDeleteSelected, handleFitView]);

  // Handle Drag & Drop of Note onto Canvas from Sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    if (!noteId) return;

    const matchedNote = notes.find((n) => n.id === noteId);
    if (matchedNote) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const newNode: CanvasNode = {
        id: `card-note-${matchedNote.id}-${Date.now()}`,
        type: 'note',
        noteId: matchedNote.id,
        title: matchedNote.title || matchedNote.name,
        x: pt.x - 140,
        y: pt.y - 40,
        width: 290,
        height: 280,
        color: matchedNote.iconColor || '#ec4899',
        zIndex: nodes.length + 1,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeIds([newNode.id]);
      pushHistory(nextNodes, edges, drawings);
      persistBoardChanges(nextNodes, edges, drawings);
    }
  };

  // Compute node center and anchor positions for edges
  const getNodePort = useCallback(
    (nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' = 'right') => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      switch (side) {
        case 'top':
          return { x: node.x + node.width / 2, y: node.y };
        case 'right':
          return { x: node.x + node.width, y: node.y + node.height / 2 };
        case 'bottom':
          return { x: node.x + node.width / 2, y: node.y + node.height };
        case 'left':
          return { x: node.x, y: node.y + node.height / 2 };
      }
    },
    [nodes]
  );

  // Bezier path generator
  const getEdgePath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    style: CanvasEdgeStyle = 'bezier'
  ) => {
    if (style === 'straight') {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    const dx = Math.abs(to.x - from.x) * 0.5;
    const dy = Math.abs(to.y - from.y) * 0.5;
    const cp1x = from.x + (to.x > from.x ? dx : -dx);
    const cp1y = from.y;
    const cp2x = to.x - (to.x > from.x ? dx : -dx);
    const cp2y = to.y;
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#0c0714] text-[#faf5ff] font-['Space_Grotesk',sans-serif]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Board Selector & Breadcrumbs */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#150d24]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#2e1c52] shadow-xl">
          <div className="flex items-center gap-1.5 text-xs">
            <Boxes className="w-4 h-4 text-[#ec4899]" />
            <span className="text-[#c084fc] font-medium hidden sm:inline">Canvas:</span>

            {/* Board Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBoardMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] text-[#faf5ff] font-semibold text-xs cursor-pointer"
              >
                <span className="max-w-[140px] truncate">{activeBoard?.name || 'Untitled Canvas'}</span>
                <ChevronDown className="w-3 h-3 text-[#c084fc]" />
              </button>

              {isBoardMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#150d24] border border-[#3b2366] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                  <div className="text-[10px] uppercase font-mono text-[#c084fc] px-2 py-1 border-b border-[#2e1c52]">
                    Vault Canvases ({boards.length})
                  </div>
                  <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
                    {boards.map((b) => (
                      <div
                        key={b.id}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-left group ${
                          b.id === activeBoardId
                            ? 'bg-[#ec4899]/20 text-[#faf5ff] font-semibold border border-[#ec4899]'
                            : 'hover:bg-[#1f1338] text-[#c084fc]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBoardId(b.id);
                            setIsBoardMenuOpen(false);
                          }}
                          className="flex-1 truncate text-left cursor-pointer flex items-center justify-between mr-1"
                        >
                          <span className="truncate">{b.name}</span>
                          <span className="text-[10px] font-mono text-[#c084fc]/70 ml-1">
                            {b.nodes.length} cards
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySpecificCanvasLink(b);
                          }}
                          className="p-1 text-[#c084fc] hover:text-[#ec4899] hover:bg-[#281745] rounded cursor-pointer shrink-0 transition-colors"
                          title={`Copy Link to "${b.name}" for notes`}
                        >
                          <LinkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#2e1c52] pt-1 mt-1 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newBoard = createNewCanvas(`Canvas ${boards.length + 1}`);
                        const next = [...boards, newBoard];
                        setBoards(next);
                        saveCanvasBoards(next);
                        setActiveBoardId(newBoard.id);
                        setIsBoardMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#ec4899] hover:bg-[#db2777] text-white font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Canvas Board</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (activeBoard) {
                          exportCanvasAsJson(activeBoard);
                          setIsBoardMenuOpen(false);
                        }
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Canvas (.json)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Rename */}
            {isEditingBoardName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (boardNameInput.trim() && activeBoard) {
                    const next = boards.map((b) =>
                      b.id === activeBoard.id ? { ...b, name: boardNameInput.trim() } : b
                    );
                    setBoards(next);
                    saveCanvasBoards(next);
                  }
                  setIsEditingBoardName(false);
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={boardNameInput}
                  onChange={(e) => setBoardNameInput(e.target.value)}
                  autoFocus
                  onBlur={() => setIsEditingBoardName(false)}
                  className="px-1.5 py-0.5 text-xs rounded bg-[#1f1338] border border-[#ec4899] text-white focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBoardNameInput(activeBoard?.name || '');
                  setIsEditingBoardName(true);
                }}
                className="p-1 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
                title="Rename Canvas"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}

            <div className="w-[1px] h-4 bg-[#2e1c52] mx-0.5" />

            {/* Copy Link to Canvas Button & Dropdown */}
            <div className="relative">
              <div className="flex items-center rounded bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#ec4899]/60 transition-colors shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleCopyCanvasLink('wikilink')}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#faf5ff] hover:text-[#ec4899] cursor-pointer"
                  title="Copy reference link to this canvas for notes: [[canvas:Name]]"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCopyMenuOpen((prev) => !prev)}
                  className="px-1 py-1 border-l border-[#2e1c52] text-[#c084fc] hover:text-white cursor-pointer"
                  title="Link format options"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {isCopyMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#150d24] border border-[#3b2366] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                  <div className="text-[10px] uppercase font-mono text-[#c084fc] px-2 py-1 border-b border-[#2e1c52]">
                    Copy Canvas Reference for Notes
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCanvasLink('wikilink')}
                    className="flex flex-col items-start px-2 py-1.5 rounded-lg hover:bg-[#1f1338] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-[#ec4899]" />
                      Wiki-Link (Obsidian / PKM format)
                    </span>
                    <span className="text-[11px] font-mono text-[#c084fc]/80 truncate max-w-[220px]">
                      [[canvas:{activeBoard?.name}]]
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCanvasLink('markdown')}
                    className="flex flex-col items-start px-2 py-1.5 rounded-lg hover:bg-[#1f1338] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Share2 className="w-3 h-3 text-[#3b82f6]" />
                      Standard Markdown Link
                    </span>
                    <span className="text-[11px] font-mono text-[#c084fc]/80 truncate max-w-[220px]">
                      [{activeBoard?.name}](canvas:{activeBoard?.id})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCanvasLink('embed')}
                    className="flex flex-col items-start px-2 py-1.5 rounded-lg hover:bg-[#1f1338] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Boxes className="w-3 h-3 text-[#a855f7]" />
                      Embedded Canvas Card
                    </span>
                    <span className="text-[11px] font-mono text-[#c084fc]/80 truncate max-w-[220px]">
                      ![[canvas:{activeBoard?.name}]]
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Tools & Elements Bar */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#150d24]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#2e1c52] shadow-xl">
          {/* Select Tool */}
          <button
            type="button"
            onClick={() => setToolMode('select')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              toolMode === 'select'
                ? 'bg-[#ec4899] text-white shadow-xs'
                : 'text-[#c084fc] hover:text-white hover:bg-[#1f1338]'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Pan Tool */}
          <button
            type="button"
            onClick={() => setToolMode('pan')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              toolMode === 'pan'
                ? 'bg-[#ec4899] text-white shadow-xs'
                : 'text-[#c084fc] hover:text-white hover:bg-[#1f1338]'
            }`}
            title="Hand / Pan Canvas (H)"
          >
            <Hand className="w-4 h-4" />
          </button>

          {/* Connect Arrow Tool */}
          <button
            type="button"
            onClick={() => setToolMode('connect')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              toolMode === 'connect'
                ? 'bg-[#ec4899] text-white shadow-xs'
                : 'text-[#c084fc] hover:text-white hover:bg-[#1f1338]'
            }`}
            title="Connect Cards with Arrows"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Pen Sketch Tool */}
          <button
            type="button"
            onClick={() => setToolMode('pen')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              toolMode === 'pen'
                ? 'bg-[#ec4899] text-white shadow-xs'
                : 'text-[#c084fc] hover:text-white hover:bg-[#1f1338]'
            }`}
            title="Pen / Sketch on Canvas (P)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-[#2e1c52] mx-1" />

          {/* Add Vault Note */}
          <button
            type="button"
            onClick={() => setIsAddNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#ec4899]/60 text-xs font-medium text-[#faf5ff] cursor-pointer"
            title="Place Note from Vault on Canvas"
          >
            <FileText className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>+ Note</span>
          </button>

          {/* Add Sticky Note */}
          <button
            type="button"
            onClick={() => handleAddStickyNote()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#fbbf24]/60 text-xs font-medium text-[#faf5ff] cursor-pointer"
            title="Create Sticky Post-it Note"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>+ Sticky</span>
          </button>

          {/* Add Text Card */}
          <button
            type="button"
            onClick={handleAddTextCard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#3b82f6]/60 text-xs font-medium text-[#faf5ff] cursor-pointer"
            title="Create Markdown Concept Card"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>+ Card</span>
          </button>

          {/* Add Section Group */}
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#a855f7]/60 text-xs font-medium text-[#faf5ff] cursor-pointer"
            title="Create Section / Group Box"
          >
            <Layers className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>+ Group</span>
          </button>
        </div>

        {/* Right: Layout, Auto-Arrange, Close */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#150d24]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#2e1c52] shadow-xl">
          {/* Snap to Grid */}
          <button
            type="button"
            onClick={() => setSnapToGrid((prev) => !prev)}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              snapToGrid
                ? 'bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]'
                : 'text-[#c084fc] hover:text-white hover:bg-[#1f1338]'
            }`}
            title={snapToGrid ? 'Grid Snapping ON (20px)' : 'Grid Snapping OFF'}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Auto Arrange */}
          <button
            type="button"
            onClick={handleAutoArrange}
            className="p-1.5 rounded-md text-[#c084fc] hover:text-white hover:bg-[#1f1338] cursor-pointer"
            title="Auto-arrange cards neatly"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Fit View */}
          <button
            type="button"
            onClick={handleFitView}
            className="p-1.5 rounded-md text-[#c084fc] hover:text-white hover:bg-[#1f1338] cursor-pointer"
            title="Fit All Cards to Screen (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Delete Selection */}
          {(selectedNodeIds.length > 0 || selectedEdgeId) && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-md bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer border border-rose-500/40"
              title="Delete Selected (Backspace/Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#c084fc] hover:text-white hover:bg-[#1f1338] cursor-pointer"
              title="Close Canvas"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-[#1a0b2e]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#ec4899] text-[#faf5ff] text-xs font-medium shadow-[0_0_25px_rgba(236,72,153,0.4)] flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Main Interactive Canvas Surface */}
      <div
        ref={containerRef}
        className="canvas-surface w-full h-full relative cursor-default overflow-hidden"
        onMouseDown={handleBackgroundMouseDown}
        onWheel={handleWheel}
        style={{
          cursor: toolMode === 'pan' ? 'grab' : toolMode === 'pen' ? 'crosshair' : 'default',
        }}
      >
        {/* Dynamic Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#2e1c52 1.5px, transparent 1.5px)`,
            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            opacity: 0.8,
          }}
        />

        {/* Transformed Canvas Container (Nodes, Edges, Drawings) */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          }}
        >
          {/* SVG Overlay Layer for Edges & Freehand Drawings */}
          <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <marker
                id="canvas-arrow-pink"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
              </marker>
              <marker
                id="canvas-arrow-cyan"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
              </marker>
              <marker
                id="canvas-arrow-purple"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
              </marker>
              <marker
                id="canvas-arrow-amber"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Connecting Edges */}
            {edges.map((edge) => {
              const fromPort = getNodePort(edge.fromNodeId, edge.fromSide || 'right');
              const toPort = getNodePort(edge.toNodeId, edge.toSide || 'left');
              const isSelected = selectedEdgeId === edge.id;
              const pathD = getEdgePath(fromPort, toPort, edge.style || 'bezier');
              const midX = (fromPort.x + toPort.x) / 2;
              const midY = (fromPort.y + toPort.y) / 2;

              return (
                <g key={edge.id} className="pointer-events-auto">
                  {/* Invisible thicker stroke for easy clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />
                  {/* Visible Edge Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#faf5ff' : edge.color || '#ec4899'}
                    strokeWidth={isSelected ? 3.5 : 2.2}
                    strokeDasharray={edge.animated ? '6,4' : undefined}
                    markerEnd={
                      edge.direction !== 'none'
                        ? edge.color === '#06b6d4'
                          ? 'url(#canvas-arrow-cyan)'
                          : edge.color === '#f59e0b'
                          ? 'url(#canvas-arrow-amber)'
                          : 'url(#canvas-arrow-pink)'
                        : undefined
                    }
                    className="transition-all"
                  />

                  {/* Edge Label (if any, or clickable badge) */}
                  {(edge.label || isSelected) && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEdgeLabelEditor(edge.id);
                        setEdgeLabelInput(edge.label || '');
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="-45"
                        y="-12"
                        width="90"
                        height="24"
                        rx="6"
                        fill="#150d24"
                        stroke={isSelected ? '#faf5ff' : '#3b2366'}
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={isSelected ? '#faf5ff' : '#c084fc'}
                        fontSize="10"
                        fontFamily="Space Grotesk, sans-serif"
                        fontWeight="600"
                      >
                        {edge.label || '+ label'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Currently Dragging Connection Line */}
            {connectSourceNodeId && connectMousePos && (
              <path
                d={getEdgePath(
                  getNodePort(connectSourceNodeId, connectSourceSide),
                  connectMousePos,
                  'bezier'
                )}
                fill="none"
                stroke="#ec4899"
                strokeWidth={2.5}
                strokeDasharray="4,4"
              />
            )}

            {/* Freehand Drawings */}
            {drawings.map((stroke) => {
              if (stroke.points.length < 2) return null;
              const d = stroke.points.reduce(
                (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                ''
              );
              return (
                <path
                  key={stroke.id}
                  d={d}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* In-progress drawing stroke */}
            {isDrawingRef.current && currentStrokeRef.current.length > 1 && (
              <path
                d={currentStrokeRef.current.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                  ''
                )}
                fill="none"
                stroke={penColor}
                strokeWidth={penWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Canvas Nodes Layer */}
          {nodes.map((node) => {
            const isSelected = selectedNodeIds.includes(node.id);

            // RENDER: Group Node
            if (node.type === 'group') {
              const isHighlighted = node.id === highlightedNodeId;
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  className={`absolute rounded-2xl border-2 transition-all ${
                    isHighlighted
                      ? 'ring-4 ring-[#a855f7] shadow-[0_0_35px_rgba(168,85,247,0.85)] scale-[1.02] z-40'
                      : isSelected
                      ? 'ring-2 ring-[#ec4899] shadow-2xl'
                      : 'shadow-lg'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    backgroundColor: `${node.bgColor || '#1f1338'}40`,
                    borderColor: node.borderColor || '#7c3aed',
                    zIndex: isHighlighted ? 50 : node.zIndex || 0,
                  }}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#2e1c52]/60 bg-[#150d24]/80 rounded-t-2xl">
                    <span className="font-semibold text-xs text-[#faf5ff] truncate">
                      {node.title || 'Section Group'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCardLink(node);
                        }}
                        className="p-1 text-[#c084fc] hover:text-[#ec4899] cursor-pointer rounded hover:bg-[#1f1338] transition-colors"
                        title="Copy Link to this Section for Notes"
                      >
                        <LinkIcon className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeIds([node.id]);
                          handleDeleteSelected();
                        }}
                        className="p-1 text-[#c084fc] hover:text-rose-400 cursor-pointer rounded hover:bg-[#1f1338] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, node)}
                    className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-[#c084fc] hover:text-white"
                  >
                    <Move className="w-3 h-3 rotate-45" />
                  </div>
                </div>
              );
            }

            // RENDER: Sticky Note
            if (node.type === 'sticky') {
              const isHighlighted = node.id === highlightedNodeId;
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onMouseUp={(e) => handleNodeMouseUp(e, node)}
                  className={`absolute rounded-xl shadow-xl p-3 flex flex-col transition-all cursor-move ${
                    isHighlighted
                      ? 'ring-4 ring-white shadow-[0_0_35px_rgba(255,255,255,0.9)] scale-[1.04] z-50 animate-pulse'
                      : isSelected
                      ? 'ring-2 ring-white scale-[1.01]'
                      : 'hover:shadow-2xl'
                  }`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    backgroundColor: node.bgColor || '#713f12',
                    border: `1.5px solid ${node.borderColor || '#f59e0b'}`,
                    zIndex: isHighlighted ? 60 : isSelected ? 50 : node.zIndex || 10,
                  }}
                >
                  {/* Sticky Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                    <input
                      type="text"
                      value={node.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) => (n.id === node.id ? { ...n, title: val } : n))
                        );
                        persistBoardChanges(nodes, edges, drawings);
                      }}
                      className="bg-transparent font-bold text-xs text-[#fef08a] w-full focus:outline-none placeholder-white/40"
                      placeholder="Note Title"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCardLink(node);
                        }}
                        className="p-1 text-white/60 hover:text-[#fef08a] cursor-pointer rounded hover:bg-black/20 transition-colors"
                        title="Copy Sticky Link for Notes"
                      >
                        <LinkIcon className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeIds([node.id]);
                          handleDeleteSelected();
                        }}
                        className="p-1 text-white/60 hover:text-white cursor-pointer rounded hover:bg-black/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Sticky Body */}
                  <textarea
                    value={node.content || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) => (n.id === node.id ? { ...n, content: val } : n))
                      );
                      persistBoardChanges(nodes, edges, drawings);
                    }}
                    placeholder="Sticky note content..."
                    className="w-full flex-1 bg-transparent text-xs text-white/90 resize-none focus:outline-none font-sans leading-relaxed"
                  />

                  {/* Connect port anchor right */}
                  <button
                    type="button"
                    title="Drag to connect"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setConnectSourceNodeId(node.id);
                      setConnectSourceSide('right');
                      setConnectMousePos(screenToCanvas(e.clientX, e.clientY));
                    }}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ec4899] border-2 border-white cursor-crosshair opacity-0 hover:opacity-100 transition-opacity"
                  />

                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, node)}
                    className="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-se-resize flex items-center justify-center text-white/40 hover:text-white"
                  >
                    <Move className="w-2.5 h-2.5 rotate-45" />
                  </div>
                </div>
              );
            }

            // RENDER: Vault Note Card
            const linkedNote = node.noteId ? notes.find((n) => n.id === node.noteId) : null;
            const cardTitle = linkedNote ? linkedNote.title || linkedNote.name : node.title || 'Untitled Note';
            const cardFolder = linkedNote?.folderId
              ? folders.find((f) => f.id === linkedNote.folderId)
              : null;
            const cardExcerpt = linkedNote
              ? linkedNote.content.replace(/^#+\s.*$/gm, '').trim().slice(0, 180)
              : node.content || '';

            const isHighlighted = node.id === highlightedNodeId;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseUp={(e) => handleNodeMouseUp(e, node)}
                className={`absolute rounded-xl bg-[#150d24] border flex flex-col overflow-hidden shadow-xl transition-all cursor-move ${
                  isHighlighted
                    ? 'border-[#ec4899] ring-4 ring-[#ec4899] shadow-[0_0_35px_rgba(236,72,153,0.85)] scale-[1.03] animate-pulse z-50'
                    : isSelected
                    ? 'border-[#ec4899] ring-2 ring-[#ec4899]/60 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                    : 'border-[#2e1c52] hover:border-[#ec4899]/50 hover:shadow-2xl'
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                  zIndex: isHighlighted ? 60 : isSelected ? 50 : node.zIndex || 10,
                }}
              >
                {/* Note Top Bar */}
                <div
                  className="px-3 py-2 border-b border-[#2e1c52] flex items-center justify-between shrink-0 bg-[#1f1338]/80"
                  style={{
                    borderTop: `3px solid ${node.color || '#ec4899'}`,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CustomIconRenderer
                      iconName={linkedNote?.icon}
                      color={node.color || '#ec4899'}
                      defaultIcon={FileText}
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span className="font-semibold text-xs text-[#faf5ff] truncate max-w-[170px]">
                      {cardTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Copy Link to this card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCardLink(node);
                      }}
                      className="p-1 rounded text-[#c084fc] hover:text-[#ec4899] hover:bg-[#281745] cursor-pointer transition-colors"
                      title="Copy Card Link for Notes: [[canvas:Name#cardId]]"
                    >
                      <LinkIcon className="w-3 h-3" />
                    </button>

                    {/* Open in Editor */}
                    {linkedNote && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNote(linkedNote.id);
                          onNavigateToNote?.(linkedNote.id);
                        }}
                        className="p-1 rounded text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745] cursor-pointer"
                        title="Open note in full editor"
                      >
                        <ExternalLink className="w-3 h-3 text-[#ec4899]" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeIds([node.id]);
                        handleDeleteSelected();
                      }}
                      className="p-1 rounded text-[#c084fc] hover:text-rose-400 cursor-pointer"
                      title="Remove card from canvas"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subheader: Folder & Tags */}
                <div className="px-3 py-1.5 bg-[#120a1f] border-b border-[#2e1c52]/60 flex items-center justify-between text-[10px] text-[#c084fc]">
                  <span className="truncate flex items-center gap-1">
                    <FolderIcon className="w-2.5 h-2.5 text-[#a855f7]" />
                    <span>{cardFolder ? cardFolder.name : 'Vault Root'}</span>
                  </span>

                  {linkedNote && linkedNote.tags.length > 0 && (
                    <span className="font-mono text-[#ec4899] font-medium">
                      #{linkedNote.tags[0]}
                    </span>
                  )}
                </div>

                {/* Note Content / Excerpt */}
                <div className="p-3 flex-1 overflow-y-auto text-xs text-[#c084fc] leading-relaxed font-sans">
                  {cardExcerpt ? (
                    <p className="line-clamp-6 text-[11px] whitespace-pre-wrap">
                      {cardExcerpt}
                    </p>
                  ) : (
                    <span className="italic text-[#c084fc]/50 text-[11px]">
                      Empty note content
                    </span>
                  )}
                </div>

                {/* Card Connection Ports (Hover to connect) */}
                <button
                  type="button"
                  title="Connect from Right"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setConnectSourceNodeId(node.id);
                    setConnectSourceSide('right');
                    setConnectMousePos(screenToCanvas(e.clientX, e.clientY));
                  }}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ec4899] border-2 border-[#150d24] cursor-crosshair opacity-0 hover:opacity-100 transition-opacity z-20 shadow-md"
                />

                <button
                  type="button"
                  title="Connect from Left"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setConnectSourceNodeId(node.id);
                    setConnectSourceSide('left');
                    setConnectMousePos(screenToCanvas(e.clientX, e.clientY));
                  }}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ec4899] border-2 border-[#150d24] cursor-crosshair opacity-0 hover:opacity-100 transition-opacity z-20 shadow-md"
                />

                {/* Resize Handle */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, node)}
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-se-resize flex items-center justify-center text-[#c084fc] hover:text-[#faf5ff]"
                >
                  <Move className="w-2.5 h-2.5 rotate-45" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom-Right Viewport Navigation & Minimap */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-[#150d24]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#2e1c52] shadow-xl text-xs font-mono">
            <button
              type="button"
              onClick={() => handleZoom(1.15)}
              className="p-1 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-[#faf5ff] text-[11px] font-semibold">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.85)}
              className="p-1 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded hover:bg-[#1f1338] text-[#c084fc] hover:text-white cursor-pointer text-[10px]"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Minimap Box */}
          <div className="w-44 h-28 bg-[#150d24]/90 backdrop-blur-md rounded-lg border border-[#2e1c52] shadow-xl overflow-hidden relative p-1">
            <div className="text-[9px] font-mono text-[#c084fc]/70 uppercase px-1 pb-1">
              Overview ({nodes.length} nodes)
            </div>
            <div className="w-full h-20 bg-[#0c0714] rounded relative overflow-hidden">
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="absolute rounded-[1px]"
                  style={{
                    left: `${Math.max(Math.min((n.x / 1600) * 100, 90), 5)}%`,
                    top: `${Math.max(Math.min((n.y / 1200) * 100, 90), 5)}%`,
                    width: `${Math.max((n.width / 1600) * 100, 6)}%`,
                    height: `${Math.max((n.height / 1200) * 100, 6)}%`,
                    backgroundColor: n.color || '#ec4899',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Card Picker Modal */}
      {isAddNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setIsAddNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#150d24] border border-[#3b2366] rounded-xl shadow-2xl p-4 text-[#faf5ff]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e1c52] mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ec4899]" />
                <h3 className="font-semibold text-sm">Place Note on Canvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="p-1 text-[#c084fc] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note search input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes in vault..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#1f1338] border border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
            </div>

            {/* Notes List */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {notes
                .filter((n) => {
                  if (!noteSearchQuery.trim()) return true;
                  const q = noteSearchQuery.toLowerCase();
                  return (
                    (n.title || n.name).toLowerCase().includes(q) ||
                    n.tags.some((t) => t.toLowerCase().includes(q))
                  );
                })
                .map((n) => {
                  const folder = n.folderId ? folders.find((f) => f.id === n.folderId) : null;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleAddNoteCard(n)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#ec4899]/60 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CustomIconRenderer
                          iconName={n.icon}
                          color={n.iconColor || '#ec4899'}
                          defaultIcon={FileText}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-[#faf5ff] truncate group-hover:text-[#ec4899]">
                            {n.title || n.name}
                          </div>
                          <div className="text-[10px] text-[#c084fc] flex items-center gap-1">
                            <span>{folder ? folder.name : 'Vault Root'}</span>
                            {n.tags.length > 0 && <span>• #{n.tags[0]}</span>}
                          </div>
                        </div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Edge Label Editor Modal */}
      {activeEdgeLabelEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setActiveEdgeLabelEditor(null)}
        >
          <div
            className="w-full max-w-sm bg-[#150d24] border border-[#3b2366] rounded-xl shadow-2xl p-4 text-[#faf5ff]"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-semibold text-xs text-[#faf5ff] mb-2 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Edit Relationship Label</span>
            </h4>
            <input
              type="text"
              value={edgeLabelInput}
              onChange={(e) => setEdgeLabelInput(e.target.value)}
              placeholder="e.g. references, depends on, causes..."
              autoFocus
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#1f1338] border border-[#ec4899] text-white focus:outline-none mb-3"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveEdgeLabelEditor(null)}
                className="px-2.5 py-1 text-xs rounded bg-[#1f1338] text-[#c084fc] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextEdges = edges.map((e) =>
                    e.id === activeEdgeLabelEditor ? { ...e, label: edgeLabelInput.trim() } : e
                  );
                  setEdges(nextEdges);
                  pushHistory(nodes, nextEdges, drawings);
                  persistBoardChanges(nodes, nextEdges, drawings);
                  setActiveEdgeLabelEditor(null);
                }}
                className="px-3 py-1 text-xs rounded bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold cursor-pointer"
              >
                Save Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
