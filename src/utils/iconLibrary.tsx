import React from 'react';
import {
  // Folders & Directory Storage
  Folder,
  FolderOpen,
  FolderArchive,
  FolderGit2,
  FolderTree,
  FolderHeart,
  FolderKanban,
  FolderKey,
  FolderLock,
  FolderRoot,
  FolderSync,
  FolderSearch,
  FolderPlus,
  FolderCode,
  FolderClock,
  FolderCheck,
  Archive,
  Package,
  Box,
  Boxes,
  Layers,
  HardDrive,
  Database,
  Server,
  Inbox,
  Briefcase,
  // Notes, Writing & Documents
  FileText,
  BookOpen,
  Notebook,
  BookMarked,
  Scroll,
  PenTool,
  Feather,
  Newspaper,
  GraduationCap,
  Quote,
  Library,
  Bookmark,
  FileQuestion,
  FileCheck,
  StickyNote,
  FileSpreadsheet,
  FileCode,
  // Tech, Code & Systems
  Terminal,
  Cpu,
  Binary,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Bug,
  Code2,
  Workflow,
  Braces,
  Hash,
  Shield,
  Key,
  Lock,
  Unlock,
  Wifi,
  Cloud,
  Laptop,
  Bot,
  // Science, Mind & Ideas
  Brain,
  Lightbulb,
  Sparkles,
  Atom,
  FlaskConical,
  Telescope,
  Zap,
  Flame,
  Rocket,
  Target,
  Infinity as InfinityIcon,
  Activity,
  Compass,
  Microscope,
  Dna,
  Gauge,
  // Organization & Productivity
  Calendar,
  CheckSquare,
  ListTodo,
  Clock,
  Timer,
  Flag,
  Kanban,
  Pin,
  MapPin,
  Milestone,
  Navigation,
  PieChart,
  BarChart3,
  TrendingUp,
  // Creative, Media & Symbols
  Image,
  Music,
  Video,
  Headphones,
  Mic,
  Film,
  Camera,
  Palette,
  Brush,
  Heart,
  Star,
  Award,
  Crown,
  Sun,
  Moon,
  Coffee,
  Gem,
  ShieldAlert,
  Eye,
  Glasses,
  Smile,
  Globe,
  LucideIcon,
} from 'lucide-react';

export interface IconDefinition {
  name: string;
  label: string;
  category: IconCategory;
  component: LucideIcon;
  keywords: string[];
}

export type IconCategory =
  | 'all'
  | 'folders'
  | 'docs'
  | 'code'
  | 'ideas'
  | 'organize'
  | 'symbols';

export const ICON_CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: 'all', label: 'All Icons' },
  { id: 'folders', label: 'Directories & Folders' },
  { id: 'docs', label: 'Notes & Documents' },
  { id: 'code', label: 'Code & Systems' },
  { id: 'ideas', label: 'Mind & Science' },
  { id: 'organize', label: 'Organization' },
  { id: 'symbols', label: 'Symbols & Media' },
];

export const ICON_LIBRARY: IconDefinition[] = [
  // Directories & Folders
  { name: 'Folder', label: 'Folder', category: 'folders', component: Folder, keywords: ['dir', 'directory', 'folder', 'storage'] },
  { name: 'FolderOpen', label: 'Folder Open', category: 'folders', component: FolderOpen, keywords: ['open', 'expand', 'directory'] },
  { name: 'FolderArchive', label: 'Folder Archive', category: 'folders', component: FolderArchive, keywords: ['archive', 'backup', 'vault'] },
  { name: 'FolderGit2', label: 'Folder Git', category: 'folders', component: FolderGit2, keywords: ['git', 'repo', 'version'] },
  { name: 'FolderTree', label: 'Folder Tree', category: 'folders', component: FolderTree, keywords: ['tree', 'structure', 'hierarchy'] },
  { name: 'FolderCode', label: 'Folder Code', category: 'folders', component: FolderCode, keywords: ['code', 'source', 'dev'] },
  { name: 'FolderHeart', label: 'Folder Heart', category: 'folders', component: FolderHeart, keywords: ['favorite', 'love', 'starred'] },
  { name: 'FolderKanban', label: 'Folder Kanban', category: 'folders', component: FolderKanban, keywords: ['kanban', 'tasks', 'board'] },
  { name: 'FolderKey', label: 'Folder Key', category: 'folders', component: FolderKey, keywords: ['security', 'key', 'auth'] },
  { name: 'FolderLock', label: 'Folder Lock', category: 'folders', component: FolderLock, keywords: ['locked', 'private', 'secret'] },
  { name: 'FolderRoot', label: 'Folder Root', category: 'folders', component: FolderRoot, keywords: ['root', 'base', 'system'] },
  { name: 'FolderSync', label: 'Folder Sync', category: 'folders', component: FolderSync, keywords: ['sync', 'cloud', 'refresh'] },
  { name: 'FolderSearch', label: 'Folder Search', category: 'folders', component: FolderSearch, keywords: ['find', 'search', 'query'] },
  { name: 'FolderClock', label: 'Folder Clock', category: 'folders', component: FolderClock, keywords: ['history', 'time', 'recent'] },
  { name: 'FolderCheck', label: 'Folder Done', category: 'folders', component: FolderCheck, keywords: ['completed', 'verified', 'approved'] },
  { name: 'Archive', label: 'Archive Box', category: 'folders', component: Archive, keywords: ['archive', 'zip', 'storage'] },
  { name: 'Package', label: 'Package', category: 'folders', component: Package, keywords: ['npm', 'package', 'bundle', 'box'] },
  { name: 'Boxes', label: 'Boxes', category: 'folders', component: Boxes, keywords: ['modules', 'components', 'containers'] },
  { name: 'Layers', label: 'Layers', category: 'folders', component: Layers, keywords: ['architecture', 'stack', 'strata'] },
  { name: 'Database', label: 'Database', category: 'folders', component: Database, keywords: ['sql', 'data', 'storage', 'records'] },
  { name: 'Server', label: 'Server', category: 'folders', component: Server, keywords: ['host', 'backend', 'node'] },
  { name: 'HardDrive', label: 'Hard Drive', category: 'folders', component: HardDrive, keywords: ['disk', 'storage', 'backup'] },
  { name: 'Inbox', label: 'Inbox', category: 'folders', component: Inbox, keywords: ['incoming', 'capture', 'new'] },
  { name: 'Briefcase', label: 'Briefcase', category: 'folders', component: Briefcase, keywords: ['work', 'job', 'business'] },

  // Notes & Documents
  { name: 'FileText', label: 'File Text', category: 'docs', component: FileText, keywords: ['note', 'document', 'text', 'draft'] },
  { name: 'FileCode', label: 'File Code', category: 'docs', component: FileCode, keywords: ['code', 'markup', 'mf', 'dev'] },
  { name: 'BookOpen', label: 'Book Open', category: 'docs', component: BookOpen, keywords: ['reading', 'study', 'manual', 'learn'] },
  { name: 'Notebook', label: 'Notebook', category: 'docs', component: Notebook, keywords: ['journal', 'notes', 'diary'] },
  { name: 'BookMarked', label: 'Bookmarked Book', category: 'docs', component: BookMarked, keywords: ['saved', 'reference', 'handbook'] },
  { name: 'Scroll', label: 'Scroll', category: 'docs', component: Scroll, keywords: ['parchment', 'history', 'manifesto'] },
  { name: 'PenTool', label: 'Pen Tool', category: 'docs', component: PenTool, keywords: ['writing', 'design', 'vector'] },
  { name: 'Feather', label: 'Feather', category: 'docs', component: Feather, keywords: ['writing', 'essay', 'poetry'] },
  { name: 'Newspaper', label: 'Newspaper', category: 'docs', component: Newspaper, keywords: ['news', 'feed', 'articles'] },
  { name: 'GraduationCap', label: 'Academic', category: 'docs', component: GraduationCap, keywords: ['school', 'university', 'research', 'thesis'] },
  { name: 'Quote', label: 'Quote', category: 'docs', component: Quote, keywords: ['citation', 'quote', 'excerpt'] },
  { name: 'Library', label: 'Library', category: 'docs', component: Library, keywords: ['books', 'archive', 'pkm'] },
  { name: 'StickyNote', label: 'Sticky Note', category: 'docs', component: StickyNote, keywords: ['memo', 'scratchpad', 'quick'] },
  { name: 'FileCheck', label: 'File Verified', category: 'docs', component: FileCheck, keywords: ['reviewed', 'passed', 'tested'] },
  { name: 'FileSpreadsheet', label: 'Spreadsheet', category: 'docs', component: FileSpreadsheet, keywords: ['sheets', 'calc', 'matrix'] },
  { name: 'FileQuestion', label: 'Unsolved Note', category: 'docs', component: FileQuestion, keywords: ['question', 'draft', 'inquiry'] },

  // Tech, Code & Systems
  { name: 'Terminal', label: 'Terminal', category: 'code', component: Terminal, keywords: ['cli', 'bash', 'console', 'shell'] },
  { name: 'Cpu', label: 'CPU', category: 'code', component: Cpu, keywords: ['hardware', 'chip', 'processor', 'compute'] },
  { name: 'Binary', label: 'Binary', category: 'code', component: Binary, keywords: ['bits', 'data', 'low-level'] },
  { name: 'GitBranch', label: 'Git Branch', category: 'code', component: GitBranch, keywords: ['branch', 'git', 'feature', 'version'] },
  { name: 'GitCommit', label: 'Git Commit', category: 'code', component: GitCommit, keywords: ['commit', 'log', 'history'] },
  { name: 'GitPullRequest', label: 'Pull Request', category: 'code', component: GitPullRequest, keywords: ['pr', 'review', 'merge'] },
  { name: 'Workflow', label: 'Workflow', category: 'code', component: Workflow, keywords: ['pipeline', 'automation', 'graph', 'process'] },
  { name: 'Braces', label: 'Code Braces', category: 'code', component: Braces, keywords: ['json', 'brackets', 'syntax'] },
  { name: 'Bug', label: 'Bug', category: 'code', component: Bug, keywords: ['issue', 'error', 'debug'] },
  { name: 'Shield', label: 'Shield Security', category: 'code', component: Shield, keywords: ['security', 'firewall', 'protection'] },
  { name: 'Key', label: 'Auth Key', category: 'code', component: Key, keywords: ['api', 'token', 'secret', 'password'] },
  { name: 'Lock', label: 'Lock', category: 'code', component: Lock, keywords: ['crypto', 'private', 'secure'] },
  { name: 'Bot', label: 'AI Bot', category: 'code', component: Bot, keywords: ['robot', 'agent', 'automation', 'gemini'] },
  { name: 'Cloud', label: 'Cloud', category: 'code', component: Cloud, keywords: ['hosting', 'aws', 'gcp', 'network'] },
  { name: 'Wifi', label: 'Network Wifi', category: 'code', component: Wifi, keywords: ['connection', 'p2p', 'online'] },

  // Mind, Science & Ideas
  { name: 'Brain', label: 'Brain / Knowledge', category: 'ideas', component: Brain, keywords: ['mind', 'neuro', 'thinking', 'pkm', 'concept'] },
  { name: 'Lightbulb', label: 'Idea / Lightbulb', category: 'ideas', component: Lightbulb, keywords: ['eureka', 'invention', 'concept'] },
  { name: 'Sparkles', label: 'Sparkles / Insights', category: 'ideas', component: Sparkles, keywords: ['magic', 'ai', 'gemini', 'creativity'] },
  { name: 'Atom', label: 'Atom Physics', category: 'ideas', component: Atom, keywords: ['quantum', 'nuclear', 'science'] },
  { name: 'FlaskConical', label: 'Lab Experiment', category: 'ideas', component: FlaskConical, keywords: ['chemistry', 'hypothesis', 'test'] },
  { name: 'Telescope', label: 'Telescope Vision', category: 'ideas', component: Telescope, keywords: ['astronomy', 'horizon', 'vision', 'future'] },
  { name: 'Zap', label: 'Energy Zap', category: 'ideas', component: Zap, keywords: ['lightning', 'fast', 'power', 'surge'] },
  { name: 'Flame', label: 'Flame', category: 'ideas', component: Flame, keywords: ['hot', 'trend', 'streak', 'fire'] },
  { name: 'Rocket', label: 'Rocket Launch', category: 'ideas', component: Rocket, keywords: ['startup', 'launch', 'release', 'deploy'] },
  { name: 'Target', label: 'Target Objective', category: 'ideas', component: Target, keywords: ['goal', 'okr', 'aim', 'focus'] },
  { name: 'Infinity', label: 'Infinity', category: 'ideas', component: InfinityIcon, keywords: ['loop', 'limitless', 'math'] },
  { name: 'Activity', label: 'Activity Wave', category: 'ideas', component: Activity, keywords: ['health', 'pulse', 'telemetry', 'heartbeat'] },
  { name: 'Microscope', label: 'Microscope', category: 'ideas', component: Microscope, keywords: ['detail', 'biology', 'deep-dive'] },
  { name: 'Dna', label: 'DNA Helix', category: 'ideas', component: Dna, keywords: ['genetics', 'life', 'core'] },

  // Organization & Productivity
  { name: 'Calendar', label: 'Calendar', category: 'organize', component: Calendar, keywords: ['date', 'schedule', 'planner', 'agenda'] },
  { name: 'CheckSquare', label: 'Check Square', category: 'organize', component: CheckSquare, keywords: ['done', 'todo', 'task', 'checklist'] },
  { name: 'ListTodo', label: 'Task List', category: 'organize', component: ListTodo, keywords: ['backlog', 'todo', 'tasks'] },
  { name: 'Clock', label: 'Clock Time', category: 'organize', component: Clock, keywords: ['timestamp', 'duration', 'timer'] },
  { name: 'Timer', label: 'Timer / Stopwatch', category: 'organize', component: Timer, keywords: ['pomodoro', 'sprint', 'stopwatch'] },
  { name: 'Flag', label: 'Flag Milestone', category: 'organize', component: Flag, keywords: ['priority', 'milestone', 'marker'] },
  { name: 'Pin', label: 'Pushpin', category: 'organize', component: Pin, keywords: ['pinned', 'important', 'favorite'] },
  { name: 'MapPin', label: 'Location Pin', category: 'organize', component: MapPin, keywords: ['place', 'geo', 'address'] },
  { name: 'Compass', label: 'Compass Navigation', category: 'organize', component: Compass, keywords: ['direction', 'explore', 'guide'] },
  { name: 'PieChart', label: 'Pie Chart', category: 'organize', component: PieChart, keywords: ['analytics', 'metrics', 'stats'] },
  { name: 'TrendingUp', label: 'Trending Growth', category: 'organize', component: TrendingUp, keywords: ['growth', 'progress', 'finance'] },

  // Creative, Media & Symbols
  { name: 'Image', label: 'Image', category: 'symbols', component: Image, keywords: ['photo', 'graphic', 'art'] },
  { name: 'Music', label: 'Music Note', category: 'symbols', component: Music, keywords: ['audio', 'sound', 'song'] },
  { name: 'Video', label: 'Video Film', category: 'symbols', component: Video, keywords: ['movie', 'media', 'stream'] },
  { name: 'Headphones', label: 'Headphones', category: 'symbols', component: Headphones, keywords: ['listen', 'podcast', 'audio'] },
  { name: 'Camera', label: 'Camera', category: 'symbols', component: Camera, keywords: ['photo', 'snapshot', 'lens'] },
  { name: 'Palette', label: 'Palette Art', category: 'symbols', component: Palette, keywords: ['theme', 'color', 'paint', 'ui'] },
  { name: 'Heart', label: 'Heart', category: 'symbols', component: Heart, keywords: ['love', 'like', 'health'] },
  { name: 'Star', label: 'Star', category: 'symbols', component: Star, keywords: ['favorite', 'rating', 'starred'] },
  { name: 'Award', label: 'Award Ribbon', category: 'symbols', component: Award, keywords: ['badge', 'medal', 'achievement'] },
  { name: 'Crown', label: 'Crown', category: 'symbols', component: Crown, keywords: ['leader', 'top', 'vip'] },
  { name: 'Sun', label: 'Sun', category: 'symbols', component: Sun, keywords: ['day', 'light', 'bright'] },
  { name: 'Moon', label: 'Moon', category: 'symbols', component: Moon, keywords: ['night', 'dark', 'sleep'] },
  { name: 'Coffee', label: 'Coffee Cup', category: 'symbols', component: Coffee, keywords: ['break', 'cafe', 'morning'] },
  { name: 'Gem', label: 'Gem Diamond', category: 'symbols', component: Gem, keywords: ['crystal', 'valuable', 'rare'] },
  { name: 'Eye', label: 'Eye View', category: 'symbols', component: Eye, keywords: ['view', 'vision', 'observe'] },
  { name: 'Globe', label: 'Globe Earth', category: 'symbols', component: Globe, keywords: ['world', 'international', 'web'] },
];

export const ICON_MAP = new Map<string, IconDefinition>(
  ICON_LIBRARY.map((item) => [item.name.toLowerCase(), item])
);

export const PRESET_ICON_COLORS: { label: string; hex: string }[] = [
  { label: 'Cyber Pink', hex: '#ec4899' },
  { label: 'Purple Glow', hex: '#c084fc' },
  { label: 'Electric Violet', hex: '#8b5cf6' },
  { label: 'Sky Cyan', hex: '#06b6d4' },
  { label: 'Emerald Mint', hex: '#10b981' },
  { label: 'Amber Gold', hex: '#f59e0b' },
  { label: 'Coral Rose', hex: '#f43f5e' },
  { label: 'Neon Lime', hex: '#84cc16' },
  { label: 'Electric Blue', hex: '#3b82f6' },
  { label: 'Clean Slate', hex: '#94a3b8' },
  { label: 'Pure Pearl', hex: '#faf5ff' },
];

export function getIconDefinition(iconName?: string | null): IconDefinition | undefined {
  if (!iconName) return undefined;
  return ICON_MAP.get(iconName.toLowerCase());
}

/**
 * Checks if a string contains SVG markup (even with XML declarations)
 */
export function isSvgMarkup(str?: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (trimmed.startsWith('<svg') || trimmed.includes('<svg')) && trimmed.includes('</svg>');
}

/**
 * Sanitizes and normalizes an uploaded or pasted SVG string for safe rendering
 */
export function sanitizeSvgString(svg: string): string {
  if (!svg) return '';

  // 1. Remove XML declarations, DOCTYPEs, and comments
  let cleaned = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .trim();

  // 2. Extract <svg ... </svg> root element
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    cleaned = svgMatch[0];
  }

  // 3. Strip harmful script tags and event handlers
  cleaned = cleaned
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:\s*text\/html/gi, '');

  // 4. Ensure viewBox is present; synthesize from width/height if missing
  const hasViewBox = /viewBox\s*=/i.test(cleaned);
  if (!hasViewBox) {
    const widthMatch = cleaned.match(/\bwidth\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
    const heightMatch = cleaned.match(/\bheight\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i);
    if (widthMatch && heightMatch) {
      const w = widthMatch[1];
      const h = heightMatch[1];
      cleaned = cleaned.replace(/<svg\b/i, `<svg viewBox="0 0 ${w} ${h}" `);
    }
  }

  // 5. Replace fixed width/height on the root <svg> tag so it scales fluidly in UI
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    const newAttrs = attrs
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '');
    return `<svg ${newAttrs} width="100%" height="100%">`;
  });

  return cleaned;
}

interface CustomIconProps {
  iconName?: string | null;
  className?: string;
  color?: string | null;
  defaultIcon?: LucideIcon;
  fallbackIcon?: LucideIcon;
  style?: React.CSSProperties;
}

/**
 * Renders either a registered Lucide SVG icon, raw custom SVG markup, or a fallback icon
 */
export const CustomIconRenderer: React.FC<CustomIconProps> = ({
  iconName,
  className = 'w-4 h-4',
  color,
  defaultIcon: DefaultIcon = Folder,
  fallbackIcon,
  style = {},
}) => {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(color ? { color } : {}),
  };

  // Case 1: Custom inline SVG snippet (starts with <svg or contains <svg>...</svg>)
  if (iconName && isSvgMarkup(iconName)) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={mergedStyle}
        dangerouslySetInnerHTML={{
          __html: sanitizeSvgString(iconName),
        }}
      />
    );
  }

  // Case 2: Named Icon from library
  if (iconName) {
    const def = getIconDefinition(iconName);
    if (def) {
      const Component = def.component;
      return <Component className={`shrink-0 ${className}`} style={mergedStyle} />;
    }
  }

  // Case 3: Fallback / Default
  const Fallback = fallbackIcon || DefaultIcon;
  return <Fallback className={`shrink-0 ${className}`} style={mergedStyle} />;
};
