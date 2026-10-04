import { CanvasBoard, CanvasNode, CanvasEdge, NoteFile } from '../types';

const CANVASES_STORAGE_KEY = 'pkm_vault_canvases_v1';
const ACTIVE_CANVAS_ID_KEY = 'pkm_active_canvas_id';

/**
 * Generates an initial default canvas board linking notes and concept cards
 */
export function createDefaultCanvas(notes: NoteFile[] = []): CanvasBoard {
  const now = Date.now();
  const id = `canvas-${now}-${Math.random().toString(36).substring(2, 7)}`;

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  // Group Frame for Core Notes
  nodes.push({
    id: 'group-core-knowledge',
    type: 'group',
    x: 40,
    y: 40,
    width: 720,
    height: 480,
    title: '🧠 Core Vault & Architecture',
    color: '#a855f7',
    bgColor: '#1f1338',
    borderColor: '#7c3aed',
    zIndex: 1,
  });

  // If we have notes in the vault, add the first 2-3 notes as Note Cards!
  if (notes.length > 0) {
    const note1 = notes[0];
    nodes.push({
      id: `card-note-${note1.id}`,
      type: 'note',
      noteId: note1.id,
      title: note1.title || note1.name,
      x: 80,
      y: 110,
      width: 290,
      height: 280,
      color: '#ec4899',
      zIndex: 2,
    });

    if (notes.length > 1) {
      const note2 = notes[1];
      nodes.push({
        id: `card-note-${note2.id}`,
        type: 'note',
        noteId: note2.id,
        title: note2.title || note2.name,
        x: 420,
        y: 110,
        width: 290,
        height: 280,
        color: '#3b82f6',
        zIndex: 2,
      });

      // Connect note1 to note2
      edges.push({
        id: `edge-note-link-1`,
        fromNodeId: `card-note-${note1.id}`,
        toNodeId: `card-note-${note2.id}`,
        fromSide: 'right',
        toSide: 'left',
        label: 'references',
        color: '#ec4899',
        style: 'bezier',
        direction: 'forward',
      });
    }
  } else {
    // Fallback text card
    nodes.push({
      id: 'card-sample-welcome',
      type: 'text',
      title: '🌟 Visual Canvas Workspace',
      content:
        'Welcome to your Infinite Knowledge Canvas!\n\n- Drag & drop notes from your sidebar or add new cards\n- Connect cards with arrows and labels\n- Draw freehand sketches and add sticky notes\n- Pan and zoom seamlessly across your mindmap',
      x: 80,
      y: 110,
      width: 320,
      height: 240,
      color: '#ec4899',
      zIndex: 2,
    });
  }

  // Sticky Note for Quick Ideas / Backlog
  nodes.push({
    id: 'sticky-ideas-1',
    type: 'sticky',
    title: '💡 Quick Thought',
    content:
      'Explore emergent connections between projects, daily notes, and system architecture.\nDouble click or use the pen to sketch!',
    x: 820,
    y: 80,
    width: 240,
    height: 200,
    color: '#fbbf24', // yellow sticky
    bgColor: '#78350f',
    borderColor: '#f59e0b',
    zIndex: 2,
  });

  // Action / Next steps card
  nodes.push({
    id: 'card-next-milestones',
    type: 'text',
    title: '🎯 Key Objectives',
    content:
      '- [x] Map out interconnected ideas\n- [ ] Link sprint goals to daily agenda\n- [ ] Export diagram as high-res PNG / SVG',
    x: 820,
    y: 320,
    width: 260,
    height: 190,
    color: '#10b981',
    zIndex: 2,
  });

  // Connect sticky to objectives
  edges.push({
    id: 'edge-sticky-to-goals',
    fromNodeId: 'sticky-ideas-1',
    toNodeId: 'card-next-milestones',
    fromSide: 'bottom',
    toSide: 'top',
    label: 'inspires',
    color: '#f59e0b',
    style: 'bezier',
    direction: 'forward',
  });

  // Connect note1 (or sample card) to sticky
  const sourceId = notes.length > 0 ? `card-note-${notes[0].id}` : 'card-sample-welcome';
  edges.push({
    id: 'edge-source-to-sticky',
    fromNodeId: sourceId,
    toNodeId: 'sticky-ideas-1',
    fromSide: 'right',
    toSide: 'left',
    label: 'branches to',
    color: '#a855f7',
    style: 'bezier',
    direction: 'forward',
  });

  return {
    id,
    name: 'Main Knowledge Board',
    description: 'Visual map of concepts, notes, and ideas',
    nodes,
    edges,
    drawings: [],
    viewport: { x: 60, y: 40, zoom: 0.95 },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a brand new empty canvas
 */
export function createNewCanvas(name: string = 'Untitled Canvas'): CanvasBoard {
  const now = Date.now();
  const id = `canvas-${now}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    name,
    nodes: [],
    edges: [],
    drawings: [],
    viewport: { x: 100, y: 100, zoom: 1 },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Load all saved canvases from localStorage
 */
export function loadCanvasBoards(notes: NoteFile[] = []): CanvasBoard[] {
  try {
    const raw = localStorage.getItem(CANVASES_STORAGE_KEY);
    if (!raw) {
      const defaultBoard = createDefaultCanvas(notes);
      saveCanvasBoards([defaultBoard]);
      return [defaultBoard];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaultBoard = createDefaultCanvas(notes);
    saveCanvasBoards([defaultBoard]);
    return [defaultBoard];
  } catch (err) {
    console.error('Failed to load canvas boards from storage', err);
    const defaultBoard = createDefaultCanvas(notes);
    return [defaultBoard];
  }
}

/**
 * Save canvas boards array to localStorage
 */
export function saveCanvasBoards(boards: CanvasBoard[]): void {
  try {
    localStorage.setItem(CANVASES_STORAGE_KEY, JSON.stringify(boards));
  } catch (err) {
    console.error('Failed to save canvas boards to storage', err);
  }
}

/**
 * Load active canvas ID
 */
export function loadActiveCanvasId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CANVAS_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Save active canvas ID
 */
export function saveActiveCanvasId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_CANVAS_ID_KEY, id);
  } catch {}
}

/**
 * Export a canvas board as downloadable JSON file
 */
export function exportCanvasAsJson(board: CanvasBoard): void {
  try {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(board, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${board.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_canvas.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to export canvas as JSON', err);
  }
}

/**
 * Import a canvas board from JSON string
 */
export function parseCanvasFromJson(jsonStr: string): CanvasBoard | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.nodes)) return null;
    return {
      id: parsed.id || `canvas-${Date.now()}`,
      name: parsed.name || 'Imported Canvas',
      description: parsed.description,
      nodes: parsed.nodes || [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      drawings: Array.isArray(parsed.drawings) ? parsed.drawings : [],
      viewport: parsed.viewport || { x: 100, y: 100, zoom: 1 },
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Generates standard PKM Canvas wikilink format: [[canvas:Canvas Name]] or [[canvas:Canvas Name#cardId]]
 */
export function generateCanvasWikilink(boardName: string, cardId?: string, alias?: string): string {
  const target = cardId ? `${boardName}#${cardId}` : boardName;
  if (alias && alias !== boardName) {
    return `[[canvas:${target}|${alias}]]`;
  }
  return `[[canvas:${target}]]`;
}

/**
 * Generates standard markdown canvas link format: [Canvas Name](canvas:canvas-id)
 */
export function generateCanvasMarkdownLink(boardName: string, boardId: string, cardId?: string): string {
  const href = cardId ? `canvas:${boardId}#${cardId}` : `canvas:${boardId}`;
  return `[${boardName}](${href})`;
}

/**
 * Parses a target string (e.g. "canvas:Main Board", "canvas:canvas-123#card-1", "Main Board.canvas")
 */
export function parseCanvasLink(raw: string): {
  isCanvas: boolean;
  canvasIdentifier: string;
  cardId?: string;
  isEmbedded?: boolean;
} {
  const trimmed = raw.trim();
  const isEmbedded = trimmed.startsWith('!');
  const clean = isEmbedded ? trimmed.slice(1).trim() : trimmed;

  // Check prefix: canvas:
  if (clean.toLowerCase().startsWith('canvas:')) {
    const payload = clean.slice(7).trim();
    if (payload.includes('#')) {
      const [boardIdent, cardId] = payload.split('#');
      return {
        isCanvas: true,
        canvasIdentifier: boardIdent.trim(),
        cardId: cardId.trim(),
        isEmbedded,
      };
    }
    return {
      isCanvas: true,
      canvasIdentifier: payload,
      isEmbedded,
    };
  }

  // Check suffix: .canvas
  if (clean.toLowerCase().endsWith('.canvas')) {
    const payload = clean.slice(0, -7).trim();
    if (payload.includes('#')) {
      const [boardIdent, cardId] = payload.split('#');
      return {
        isCanvas: true,
        canvasIdentifier: boardIdent.trim(),
        cardId: cardId.trim(),
        isEmbedded,
      };
    }
    return {
      isCanvas: true,
      canvasIdentifier: payload,
      isEmbedded,
    };
  }

  return { isCanvas: false, canvasIdentifier: clean, isEmbedded };
}

/**
 * Finds a canvas board from a list matching an identifier (case-insensitive name or exact ID)
 */
export function findCanvasByIdOrName(boards: CanvasBoard[], identifier: string): CanvasBoard | undefined {
  if (!identifier) return undefined;
  const cleanIdent = identifier.trim().toLowerCase();
  return (
    boards.find((b) => b.id.toLowerCase() === cleanIdent) ||
    boards.find((b) => b.name.toLowerCase() === cleanIdent)
  );
}

/**
 * Helper to copy text to clipboard with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (err) {
    console.warn('Failed to copy to clipboard', err);
    return false;
  }
}
