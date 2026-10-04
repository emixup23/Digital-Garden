export interface NoteFile {
  id: string;
  name: string; // e.g., 'System Architecture.md'
  folderId: string | null; // null for root
  title: string;
  content: string;
  tags: string[];
  icon?: string; // custom icon name or custom SVG
  iconColor?: string; // hex or CSS color
  bannerColor?: string; // gradient or hex color for top note banner
  bannerHeight?: 'sm' | 'md' | 'lg'; // height for top note banner
  bannerIcon?: string; // custom icon for top note banner
  order?: number; // custom manual sort order
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null for root level
  icon?: string; // custom icon name or custom SVG
  iconColor?: string; // hex or CSS color
  order?: number; // custom manual sort order
  createdAt: number;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  name: string;
  type: 'note' | 'tag';
  folderId?: string | null;
  folderName?: string;
  connectionsCount: number;
  inDegree: number;
  outDegree: number;
  tags?: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  bidirectional: boolean;
  type: 'direct' | 'tag';
}

export interface BacklinkItem {
  sourceNoteId: string;
  sourceNoteTitle: string;
  sourceNoteName: string;
  snippet: string;
}

export interface OutgoingLinkItem {
  targetTitle: string;
  targetNoteId: string | null; // null if uncreated/ghost note
  isExisting: boolean;
  isCanvas?: boolean;
  canvasId?: string | null;
  targetCardId?: string | null;
}

export type ViewLayoutMode = 'workspace' | 'split' | 'graph' | 'agenda' | 'canvas';

export type CanvasNodeType = 'note' | 'text' | 'sticky' | 'group' | 'link';

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content?: string;
  noteId?: string; // id of referenced NoteFile if type === 'note'
  color?: string; // accent color (hex)
  bgColor?: string;
  borderColor?: string;
  groupId?: string | null;
  zIndex?: number;
}

export type CanvasEdgeDirection = 'forward' | 'bidirectional' | 'none';
export type CanvasEdgeStyle = 'bezier' | 'straight' | 'step';

export interface CanvasEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  color?: string;
  style?: CanvasEdgeStyle;
  direction?: CanvasEdgeDirection;
  animated?: boolean;
}

export interface CanvasDrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface CanvasBoard {
  id: string;
  name: string;
  description?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  drawings?: CanvasDrawingStroke[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: number;
  updatedAt: number;
}
export type EditorMode = 'edit' | 'split' | 'preview';

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  isDark: boolean;
  borderlessButtons?: boolean;
  primaryColor: string;
  primaryHoverColor: string;
  primaryLightColor: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceSecondaryColor: string;
  borderColor: string;
  textColor: string;
  textMutedColor: string;
  noteButtonBg: string;
  radiusPx: string;
  fontFamily: string;
  fontFamilyMono: string;
}

export interface VaultGraphSettings {
  chargeStrength?: number;
  linkDistance?: number;
  collisionRadius?: number;
  linkStrokeWidth?: number;
  nodeDotSize?: number;
}

export interface VaultBackupMetadata {
  version: string;
  system: string;
  exportedAt: string;
  title?: string;
  description?: string;
  totalNotes: number;
  totalFolders: number;
  totalTags: number;
}

export interface VaultBackupPackage {
  metadata: VaultBackupMetadata;
  notes: NoteFile[];
  folders: Folder[];
  theme?: ThemeConfig;
  graphSettings?: VaultGraphSettings;
}

export type SnapshotType = 'manual' | 'auto' | 'pre-restore';

export interface LocalSnapshot {
  id: string;
  createdAt: number;
  type: SnapshotType;
  label: string;
  noteCount: number;
  folderCount: number;
  sizeBytes: number;
  data: VaultBackupPackage;
}

export type RestoreMode = 'merge' | 'replace';

export interface RestorePreview {
  isValid: boolean;
  package?: VaultBackupPackage;
  stats: {
    noteCount: number;
    folderCount: number;
    tagCount: number;
    sizeBytes: number;
    exportedAt: string;
    system?: string;
    version?: string;
  };
  errors: string[];
  warnings: string[];
}
