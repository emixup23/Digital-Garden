import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Tag,
  Folder,
  FolderPlus,
  Plus,
  Network,
  X,
  Palette,
  HardDrive,
  Sparkles,
  PanelLeft,
  PanelRight,
  Lock,
  CalendarDays,
  BookOpen,
  Mic,
  Headphones,
  Image as ImageIcon,
  SlidersHorizontal,
  Calendar,
  Clock,
  Filter,
  Layers,
  CheckSquare,
  FoldVertical,
  UnfoldVertical,
  Code2,
  Table as TableIcon,
  Boxes,
} from 'lucide-react';
import { NoteFile, Folder as FolderType } from '../types';
import { getTagColor, getTagBadgeStyle, getTagHex } from '../utils/tagColors';
import { CustomIconRenderer } from '../utils/iconLibrary';
import {
  searchVaultNotes,
  saveRecentSearch,
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
  HighlightedText,
  getFolderPath,
} from '../utils/searchEngine';
import { loadCanvasBoards } from '../utils/canvasStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteFile[];
  folders: FolderType[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (folderId?: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => void;
  onOpenGraph: () => void;
  onOpenThemeEditor?: () => void;
  onOpenBackupCenter?: () => void;
  onCustomizeNoteIcon?: () => void;
  onSelectTag: (tag: string) => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  onLockVault?: () => void;
  onOpenAgenda?: () => void;
  onOpenCanvas?: () => void;
  onNavigateToCanvas?: (canvasIdentifier: string, targetCardId?: string) => void;
  isSimplifiedPreview?: boolean;
  onToggleSimplifiedPreview?: () => void;
  onToggleVoiceDictation?: () => void;
  isVoiceListening?: boolean;
  onToggleVoiceReader?: () => void;
  isVoiceReading?: boolean;
  onTriggerInsertImage?: () => void;
  onTriggerInsertSelection?: () => void;
  onTriggerInsertDate?: () => void;
  onTriggerInsertBanner?: () => void;
  onTriggerInsertTable?: () => void;
  onTriggerTextColor?: () => void;
  onTriggerFoldAllCode?: () => void;
  onTriggerExpandAllCode?: () => void;
}

export interface PaletteItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  icon?: string;
  iconColor?: string;
  snippet?: string | null;
  matchedFields?: ('title' | 'tag' | 'content' | 'folder')[];
  score?: number;
  handler: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onOpenGraph,
  onOpenThemeEditor,
  onOpenBackupCenter,
  onCustomizeNoteIcon,
  onSelectTag,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onLockVault,
  onOpenAgenda,
  onOpenCanvas,
  onNavigateToCanvas,
  isSimplifiedPreview = false,
  onToggleSimplifiedPreview,
  onToggleVoiceDictation,
  isVoiceListening = false,
  onToggleVoiceReader,
  isVoiceReading = false,
  onTriggerInsertImage,
  onTriggerInsertSelection,
  onTriggerInsertDate,
  onTriggerInsertBanner,
  onTriggerInsertTable,
  onTriggerTextColor,
  onTriggerFoldAllCode,
  onTriggerExpandAllCode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchCategory, setSearchCategory] = useState<'all' | 'notes' | 'content' | 'tags' | 'actions'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus on open and refresh recent searches
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSearchCategory('all');
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelectRecentSearch = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  const handleRemoveRecentSearch = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(text);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleInsertOperator = (op: string) => {
    setQuery((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${op}` : op;
    });
    inputRef.current?.focus();
  };

  // Global keydown for Escape or Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Collect matching items
  const results: PaletteItem[] = React.useMemo(() => {
    if (!query.trim()) {
      // Recent / top notes
      return [
        {
          id: 'action-new',
          type: 'action',
          title: 'Create new note',
          subtitle: 'Create a new markdown note at root',
          handler: () => {
            onCreateNote();
            onClose();
          },
        },
        ...(onCreateFolder
          ? [
              {
                id: 'action-new-folder',
                type: 'action-folder',
                title: 'Create new directory / subdirectory',
                subtitle: 'Add a new directory or nested subdirectory in your vault',
                handler: () => {
                  const name = window.prompt('Enter new directory name:');
                  if (name && name.trim()) {
                    onCreateFolder(name.trim(), null);
                  }
                  onClose();
                },
              },
            ]
          : []),
        ...(onOpenAgenda
          ? [
              {
                id: 'action-agenda',
                type: 'action-agenda',
                title: 'Open Agenda & Schedule',
                subtitle: 'Daily planning, meetings, tasks, and calendar agenda',
                handler: () => {
                  onOpenAgenda();
                  onClose();
                },
              },
            ]
          : []),
        ...(onOpenCanvas
          ? [
              {
                id: 'action-canvas',
                type: 'action-canvas',
                title: 'Open Infinite Canvas & Whiteboard',
                subtitle: 'Visual mindmap, card connections, sticky notes, and freehand sketches',
                handler: () => {
                  onOpenCanvas();
                  onClose();
                },
              },
            ]
          : []),
        {
          id: 'action-theme',
          type: 'action-theme',
          title: 'Open Theme Studio & Palette Editor',
          subtitle: 'Customize colors, surfaces, radius, fonts & presets',
          handler: () => {
            onOpenThemeEditor?.();
            onClose();
          },
        },
        {
          id: 'action-backup',
          type: 'action-backup',
          title: 'Vault Backup & Restore Center',
          subtitle: 'Export full JSON archives, restore snapshots, or rollback',
          handler: () => {
            onOpenBackupCenter?.();
            onClose();
          },
        },
        ...(onCustomizeNoteIcon
          ? [
              {
                id: 'action-customize-icon',
                type: 'action-icon',
                title: 'Customize Note / Folder Icon (SVG Library)',
                subtitle: 'Choose custom SVG icons and colors for notes & directories',
                handler: () => {
                  onCustomizeNoteIcon();
                  onClose();
                },
              },
            ]
          : []),
        ...(onLockVault
          ? [
              {
                id: 'action-lock-vault',
                type: 'action-lock',
                title: 'Lock Vault / Sign Out',
                subtitle: 'Secure and lock access to your personal knowledge base',
                handler: () => {
                  onLockVault();
                  onClose();
                },
              },
            ]
          : []),
        ...(onToggleLeftSidebar
          ? [
              {
                id: 'action-toggle-left-sidebar',
                type: 'action-sidebar-left',
                title: 'Toggle Left Sidebar (Files & Explorer)',
                subtitle: 'Hide or show the left file navigation panel (Shortcut: ⌘\\ or ⌘B)',
                handler: () => {
                  onToggleLeftSidebar();
                  onClose();
                },
              },
            ]
          : []),
        ...(onToggleRightSidebar
          ? [
              {
                id: 'action-toggle-right-sidebar',
                type: 'action-sidebar-right',
                title: 'Toggle Right Sidebar (Links & Graph)',
                subtitle: 'Hide or show the right backlinks and local graph panel (Shortcut: ⌘⇧\\)',
                handler: () => {
                  onToggleRightSidebar();
                  onClose();
                },
              },
            ]
          : []),
        ...(onToggleSimplifiedPreview
          ? [
              {
                id: 'action-toggle-simplified-preview',
                type: 'action-preview',
                title: isSimplifiedPreview ? 'Exit Simplified Preview' : 'Open Simplified Preview (Reading View)',
                subtitle: 'Hide sidebars and all editing options for distraction-free reading (Shortcut: ⌘⇧P or Esc)',
                handler: () => {
                  onToggleSimplifiedPreview();
                  onClose();
                },
              },
            ]
          : []),
        ...(onToggleVoiceDictation
          ? [
              {
                id: 'action-voice-dictate',
                type: 'action-voice',
                title: isVoiceListening ? 'Stop Voice-to-Text Dictation' : 'Start Voice-to-Text Dictation',
                subtitle: 'Transcribe spoken words in real-time at cursor (Shortcut: ⌘⇧V)',
                handler: () => {
                  onToggleVoiceDictation();
                  onClose();
                },
              },
            ]
          : []),
        ...(onToggleVoiceReader
          ? [
              {
                id: 'action-voice-reader',
                type: 'action-voice-reader',
                title: isVoiceReading ? 'Stop Voice Reader (Text-to-Speech)' : 'Start Voice Reader (Text-to-Speech)',
                subtitle: 'Read aloud note text or active selection with speech player (Shortcut: ⌘⇧R)',
                handler: () => {
                  onToggleVoiceReader();
                  onClose();
                },
              },
            ]
          : []),
        ...(onTriggerInsertImage
          ? [
              {
                id: 'action-insert-image',
                type: 'action-image',
                title: 'Insert Image into Note',
                subtitle: 'Upload file, link web image URL, or pick from presets',
                handler: () => {
                  onTriggerInsertImage();
                  onClose();
                },
              },
            ]
          : []),
        ...(onTriggerInsertTable
          ? [
              {
                id: 'action-insert-table',
                type: 'action-table',
                title: 'Insert Markdown Table',
                subtitle: 'Create customizable grid with columns, rows, alignments, and presets (Shortcut: Alt+T)',
                handler: () => {
                  onTriggerInsertTable();
                  onClose();
                },
              },
            ]
          : []),
        ...(onTriggerTextColor
          ? [
              {
                id: 'action-text-color',
                type: 'action-text-color',
                title: 'Change Text Color & Highlight',
                subtitle: 'Apply cyber neon colors or text highlights to selection (Shortcut: Alt+C)',
                handler: () => {
                  onTriggerTextColor();
                  onClose();
                },
              },
            ]
          : []),
        ...(onTriggerFoldAllCode
          ? [
              {
                id: 'action-fold-all-code',
                type: 'action-fold-code',
                title: 'Fold All Code Blocks (Markdown)',
                subtitle: 'Collapse all code blocks in active note for quick document scanning (Shortcut: Alt+[)',
                handler: () => {
                  onTriggerFoldAllCode();
                  onClose();
                },
              },
            ]
          : []),
        ...(onTriggerExpandAllCode
          ? [
              {
                id: 'action-expand-all-code',
                type: 'action-expand-code',
                title: 'Expand All Code Blocks (Markdown)',
                subtitle: 'Expand all code blocks in active note (Shortcut: Alt+])',
                handler: () => {
                  onTriggerExpandAllCode();
                  onClose();
                },
              },
            ]
          : []),
        {
          id: 'action-graph',
          type: 'action',
          title: 'Open Knowledge Graph visualizer',
          handler: () => {
            onOpenGraph();
            onClose();
          },
        },
        ...(onOpenCanvas
          ? [
              {
                id: 'action-canvas-default',
                type: 'action-canvas',
                title: 'Open Canvas Whiteboards',
                subtitle: 'Visual spatial whiteboard for notes, stickies, and diagrams',
                handler: () => {
                  onOpenCanvas();
                  onClose();
                },
              },
            ]
          : []),
        ...notes.slice(0, 8).map((n) => ({
          id: n.id,
          type: 'note',
          title: n.title,
          subtitle: getFolderPath(n.folderId, folders),
          tags: n.tags,
          icon: n.icon,
          iconColor: n.iconColor,
          handler: () => {
            onSelectNote(n.id);
            onClose();
          },
        })),
      ];
    }

    const q = query.toLowerCase();
    const items: PaletteItem[] = [];

    // Code folding commands search match
    if (
      'fold'.includes(q) ||
      'collapse'.includes(q) ||
      'fold all code'.includes(q) ||
      'collapse code'.includes(q) ||
      'code folding'.includes(q)
    ) {
      if (onTriggerFoldAllCode) {
        items.push({
          id: 'action-fold-all-code-search',
          type: 'action-fold-code',
          title: 'Fold All Code Blocks (Markdown)',
          subtitle: 'Collapse all code blocks in active note for quick document scanning (Shortcut: Alt+[)',
          handler: () => {
            onTriggerFoldAllCode();
            onClose();
          },
        });
      }
    }

    if (
      'expand'.includes(q) ||
      'unfold'.includes(q) ||
      'expand all code'.includes(q) ||
      'unfold code'.includes(q) ||
      'open code'.includes(q)
    ) {
      if (onTriggerExpandAllCode) {
        items.push({
          id: 'action-expand-all-code-search',
          type: 'action-expand-code',
          title: 'Expand All Code Blocks (Markdown)',
          subtitle: 'Expand all code blocks in active note (Shortcut: Alt+])',
          handler: () => {
            onTriggerExpandAllCode();
            onClose();
          },
        });
      }
    }

    // Insert Image action search match
    if (
      'image'.includes(q) ||
      'insert image'.includes(q) ||
      'upload image'.includes(q) ||
      'photo'.includes(q) ||
      'picture'.includes(q)
    ) {
      if (onTriggerInsertImage) {
        items.push({
          id: 'action-image-search',
          type: 'action-image',
          title: 'Insert Image into Note',
          subtitle: 'Upload file, link web image URL, or pick from presets',
          handler: () => {
            onTriggerInsertImage();
            onClose();
          },
        });
      }
    }

    // Insert Multi/Single Selection match
    if (
      'selection'.includes(q) ||
      'multi select'.includes(q) ||
      'single select'.includes(q) ||
      'select'.includes(q) ||
      'choice'.includes(q) ||
      'checkboxes'.includes(q) ||
      'radio'.includes(q)
    ) {
      if (onTriggerInsertSelection) {
        items.push({
          id: 'action-selection-search',
          type: 'action-selection',
          title: 'Insert Multi / Single Selection',
          subtitle: 'Insert interactive checkboxes or radio buttons into note',
          handler: () => {
            onTriggerInsertSelection();
            onClose();
          },
        });
      }
    }

    // Insert Date match
    if (
      'date'.includes(q) ||
      'calendar'.includes(q) ||
      'today'.includes(q) ||
      'tomorrow'.includes(q) ||
      'time'.includes(q) ||
      'insert date'.includes(q)
    ) {
      if (onTriggerInsertDate) {
        items.push({
          id: 'action-date-search',
          type: 'action-date',
          title: 'Insert Date / Timestamp',
          subtitle: 'Insert date badge with quick presets (Today, Tomorrow, Pick date)',
          handler: () => {
            onTriggerInsertDate();
            onClose();
          },
        });
      }
    }

    // Insert Colored Banner match
    if (
      'banner'.includes(q) ||
      'colored banner'.includes(q) ||
      'callout'.includes(q) ||
      'alert'.includes(q) ||
      'notice'.includes(q)
    ) {
      if (onTriggerInsertBanner) {
        items.push({
          id: 'action-banner-search',
          type: 'action-banner',
          title: 'Insert Colored Banner / Callout',
          subtitle: 'Choose color accent, icon, and apply as in-note callout or note top banner',
          handler: () => {
            onTriggerInsertBanner();
            onClose();
          },
        });
      }
    }

    // Insert Table match
    if (
      'table'.includes(q) ||
      'insert table'.includes(q) ||
      'grid'.includes(q) ||
      'matrix'.includes(q) ||
      'csv'.includes(q) ||
      'spreadsheet'.includes(q)
    ) {
      if (onTriggerInsertTable) {
        items.push({
          id: 'action-table-search',
          type: 'action-table',
          title: 'Insert Markdown Table',
          subtitle: 'Configure rows, columns, alignments, and DevOps/cloud presets (Shortcut: Alt+T)',
          handler: () => {
            onTriggerInsertTable();
            onClose();
          },
        });
      }
    }

    // Icon customization search match
    if (
      'icon'.includes(q) ||
      'svg'.includes(q) ||
      'symbol'.includes(q) ||
      'customize'.includes(q) ||
      'folder icon'.includes(q)
    ) {
      if (onCustomizeNoteIcon) {
        items.push({
          id: 'action-icon-search',
          type: 'action-icon',
          title: 'Customize Icon & Color from SVG Library',
          subtitle: 'Assign custom vector icon and accent color to note or directory',
          handler: () => {
            onCustomizeNoteIcon();
            onClose();
          },
        });
      }
    }

    // Create Directory search match
    if (
      onCreateFolder &&
      ('folder'.includes(q) ||
        'dir'.includes(q) ||
        'directory'.includes(q) ||
        'mkdir'.includes(q) ||
        'new folder'.includes(q) ||
        'new dir'.includes(q) ||
        'create folder'.includes(q) ||
        'subdirectory'.includes(q))
    ) {
      items.push({
        id: 'action-create-folder-search',
        type: 'action-folder',
        title: 'Create new directory / subdirectory',
        subtitle: 'Add a new directory at root or nested in an existing folder',
        handler: () => {
          const name = window.prompt('Enter new directory name:');
          if (name && name.trim()) {
            onCreateFolder(name.trim(), null);
          }
          onClose();
        },
      });
    }

    // Theme match
    if (
      'theme'.includes(q) ||
      'palette'.includes(q) ||
      'color'.includes(q) ||
      'dark'.includes(q) ||
      'light'.includes(q) ||
      'style'.includes(q)
    ) {
      items.push({
        id: 'action-theme-search',
        type: 'action-theme',
        title: 'Open Theme Studio & Palette Editor',
        subtitle: 'Customize colors, surfaces, radius, fonts & presets',
        handler: () => {
          onOpenThemeEditor?.();
          onClose();
        },
      });
    }

    // Backup & Restore match
    if (
      'backup'.includes(q) ||
      'restore'.includes(q) ||
      'snapshot'.includes(q) ||
      'export'.includes(q) ||
      'import'.includes(q) ||
      'rollback'.includes(q) ||
      'archive'.includes(q)
    ) {
      items.push({
        id: 'action-backup-search',
        type: 'action-backup',
        title: 'Vault Backup & Restore Center',
        subtitle: 'Export full JSON archives, restore snapshots, or rollback',
        handler: () => {
          onOpenBackupCenter?.();
          onClose();
        },
      });
    }

    // Sidebar toggles match
    if (
      onToggleLeftSidebar &&
      ('sidebar'.includes(q) ||
        'left'.includes(q) ||
        'explorer'.includes(q) ||
        'files'.includes(q) ||
        'hide'.includes(q) ||
        'show'.includes(q) ||
        'toggle'.includes(q) ||
        'collapse'.includes(q))
    ) {
      items.push({
        id: 'action-toggle-left-search',
        type: 'action-sidebar-left',
        title: 'Toggle Left Sidebar (Files & Explorer)',
        subtitle: 'Hide or show the left navigation panel (Shortcut: ⌘\\ or ⌘B)',
        handler: () => {
          onToggleLeftSidebar();
          onClose();
        },
      });
    }

    if (
      onToggleRightSidebar &&
      ('sidebar'.includes(q) ||
        'right'.includes(q) ||
        'links'.includes(q) ||
        'backlinks'.includes(q) ||
        'graph'.includes(q) ||
        'hide'.includes(q) ||
        'show'.includes(q) ||
        'toggle'.includes(q) ||
        'collapse'.includes(q))
    ) {
      items.push({
        id: 'action-toggle-right-search',
        type: 'action-sidebar-right',
        title: 'Toggle Right Sidebar (Links & Graph)',
        subtitle: 'Hide or show the right backlinks panel (Shortcut: ⌘⇧\\)',
        handler: () => {
          onToggleRightSidebar();
          onClose();
        },
      });
    }

    if (
      onToggleSimplifiedPreview &&
      ('preview'.includes(q) ||
        'simplify'.includes(q) ||
        'reading'.includes(q) ||
        'focus'.includes(q) ||
        'distraction'.includes(q) ||
        'hide'.includes(q) ||
        'view'.includes(q))
    ) {
      items.push({
        id: 'action-simplified-preview-search',
        type: 'action-preview',
        title: isSimplifiedPreview ? 'Exit Simplified Preview' : 'Toggle Simplified Preview (Reading View)',
        subtitle: 'Hide sidebars and all editing options for distraction-free reading (Shortcut: ⌘⇧P or Esc)',
        handler: () => {
          onToggleSimplifiedPreview();
          onClose();
        },
      });
    }

    if (
      onOpenAgenda &&
      ('agenda'.includes(q) ||
        'schedule'.includes(q) ||
        'calendar'.includes(q) ||
        'daily'.includes(q) ||
        'tasks'.includes(q) ||
        'todo'.includes(q) ||
        'meeting'.includes(q) ||
        'today'.includes(q))
    ) {
      items.push({
        id: 'action-agenda-search',
        type: 'action-agenda',
        title: 'Open Agenda & Schedule',
        subtitle: 'Daily planning, meetings, tasks, and calendar agenda',
        handler: () => {
          onOpenAgenda();
          onClose();
        },
      });
    }

    if (
      onLockVault &&
      ('lock'.includes(q) ||
        'vault'.includes(q) ||
        'logout'.includes(q) ||
        'signout'.includes(q) ||
        'sign out'.includes(q) ||
        'auth'.includes(q) ||
        'security'.includes(q) ||
        'password'.includes(q))
    ) {
      items.push({
        id: 'action-lock-vault-search',
        type: 'action-lock',
        title: 'Lock Vault / Sign Out',
        subtitle: 'Secure and lock access to your personal knowledge base',
        handler: () => {
          onLockVault();
          onClose();
        },
      });
    }

    if (
      onToggleVoiceDictation &&
      (q.includes('voice') ||
        q.includes('speech') ||
        q.includes('dictat') ||
        q.includes('mic') ||
        q.includes('audio') ||
        q.includes('speak') ||
        q.includes('transcrib'))
    ) {
      items.push({
        id: 'action-voice-dictate-search',
        type: 'action-voice',
        title: isVoiceListening ? 'Stop Voice-to-Text Dictation' : 'Start Voice-to-Text Dictation',
        subtitle: 'Transcribe spoken words into active note in real-time (Shortcut: ⌘⇧V)',
        handler: () => {
          onToggleVoiceDictation();
          onClose();
        },
      });
    }

    // Matching notes via advanced search engine
    if (searchCategory !== 'actions') {
      const searchMatches = searchVaultNotes(notes, folders, query);

      for (const match of searchMatches) {
        if (searchCategory === 'notes' && !match.matchedFields.includes('title')) {
          continue;
        }
        if (searchCategory === 'content' && !match.matchedFields.includes('content')) {
          continue;
        }
        if (searchCategory === 'tags' && !match.matchedFields.includes('tag')) {
          continue;
        }

        items.push({
          id: match.note.id,
          type: 'note',
          title: match.note.title,
          subtitle: match.folderName,
          tags: match.note.tags,
          icon: match.note.icon,
          iconColor: match.note.iconColor,
          snippet: match.snippet,
          matchedFields: match.matchedFields,
          score: match.score,
          handler: () => {
            saveRecentSearch(query);
            onSelectNote(match.note.id);
            onClose();
          },
        });
      }
    }

    // Unique matching tags
    if (searchCategory === 'all' || searchCategory === 'tags') {
      const allTags = new Set<string>();
      notes.forEach((n) => n.tags.forEach((t) => allTags.add(t.toLowerCase())));
      allTags.forEach((t) => {
        if (t.includes(q.replace(/^#/, ''))) {
          items.push({
            id: `tag-${t}`,
            type: 'tag',
            title: `#${t}`,
            subtitle: 'Filter knowledge base by this tag',
            matchedFields: ['tag'],
            handler: () => {
              saveRecentSearch(query);
              onSelectTag(t);
              onClose();
            },
          });
        }
      });
    }

    // Matching directories
    if (searchCategory === 'all') {
      folders.forEach((f) => {
        const fullPath = getFolderPath(f.id, folders);
        if (
          f.name.toLowerCase().includes(q) ||
          fullPath.toLowerCase().includes(q)
        ) {
          items.push({
            id: `folder-${f.id}`,
            type: 'folder',
            title: f.name,
            subtitle: `Directory: ${fullPath} • Click to create note in this directory`,
            icon: f.icon,
            iconColor: f.iconColor,
            matchedFields: ['folder'],
            handler: () => {
              saveRecentSearch(query);
              onCreateNote(f.id);
              onClose();
            },
          });
        }
      });
    }

    // Matching canvas boards
    if (searchCategory === 'all') {
      const canvasBoards = loadCanvasBoards(notes);
      canvasBoards.forEach((b) => {
        if (
          b.name.toLowerCase().includes(q) ||
          q.includes('canvas') ||
          q.includes('board') ||
          q.includes('whiteboard')
        ) {
          items.push({
            id: `canvas-${b.id}`,
            type: 'canvas',
            title: b.name,
            subtitle: `Canvas Whiteboard • ${b.nodes?.length || 0} cards • ${b.edges?.length || 0} connections`,
            handler: () => {
              saveRecentSearch(query);
              if (onNavigateToCanvas) {
                onNavigateToCanvas(b.id);
              } else if (onOpenCanvas) {
                onOpenCanvas();
              }
              onClose();
            },
          });
        }
      });
    }

    return items;
  }, [
    query,
    notes,
    folders,
    searchCategory,
    onCreateNote,
    onCreateFolder,
    onOpenGraph,
    onOpenCanvas,
    onNavigateToCanvas,
    onOpenThemeEditor,
    onOpenBackupCenter,
    onCustomizeNoteIcon,
    onSelectNote,
    onSelectTag,
    onToggleLeftSidebar,
    onToggleRightSidebar,
    onLockVault,
    onTriggerInsertImage,
    onTriggerInsertSelection,
    onTriggerInsertDate,
    onTriggerInsertBanner,
    onTriggerInsertTable,
    onTriggerTextColor,
    onTriggerFoldAllCode,
    onTriggerExpandAllCode,
    onOpenAgenda,
    isSimplifiedPreview,
    onToggleSimplifiedPreview,
    onToggleVoiceDictation,
    isVoiceListening,
    onClose,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].handler();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 font-['Space_Grotesk',sans-serif]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#150d24] rounded-[6px] border border-[#2e1c52] shadow-2xl overflow-hidden flex flex-col text-[#faf5ff]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#2e1c52] flex items-center gap-2.5 bg-[#150d24]">
          <Search className="w-4 h-4 text-[#c084fc] shrink-0 ml-1" />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            placeholder="Search notes, tags, commands... (or tag:, folder:, title:, content:, has:todo)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[#faf5ff] focus:outline-none placeholder-[#c084fc]/50 font-['Space_Grotesk',sans-serif]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-[#c084fc] hover:text-[#faf5ff] cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[10px] font-['Space_Mono',monospace] bg-[#1f1338] text-[#c084fc] rounded-[4px] border border-[#2e1c52]">
            ESC
          </kbd>
        </div>

        {/* Category Tabs & Quick Operators */}
        <div className="px-3 py-1.5 border-b border-[#2e1c52] bg-[#1a102e] flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-['Space_Mono',monospace]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'notes', label: 'Notes' },
                { id: 'content', label: 'In Content' },
                { id: 'tags', label: 'Tags' },
                { id: 'actions', label: 'Commands' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSearchCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer ${
                  searchCategory === cat.id
                    ? 'bg-[#ec4899] text-white font-medium'
                    : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Operators helper pills */}
          <div className="flex items-center gap-1 shrink-0 ml-auto pl-2 border-l border-[#2e1c52]/60">
            <span className="text-[10px] text-[#c084fc]/60">Insert:</span>
            {(['tag:', 'folder:', 'content:', 'has:todo', 'has:image'] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => handleInsertOperator(op)}
                className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[#1f1338] border border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:border-[#ec4899]/60 cursor-pointer transition-colors"
                title={`Insert operator "${op}" into query`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches Bar (when query is empty and recent searches exist) */}
        {!query && recentSearches.length > 0 && (
          <div className="px-3 py-1.5 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <Clock className="w-3 h-3 text-[#c084fc] shrink-0" />
              <span className="text-[10px] font-mono text-[#c084fc]/70 shrink-0">Recent:</span>
              {recentSearches.slice(0, 4).map((rec, idx) => (
                <span
                  key={idx}
                  onClick={() => handleSelectRecentSearch(rec)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1f1338] border border-[#2e1c52] text-[11px] text-[#faf5ff]/80 hover:text-[#faf5ff] hover:border-[#ec4899] cursor-pointer group shrink-0 transition-colors font-mono"
                >
                  <span>{rec}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveRecentSearch(rec, e)}
                    className="text-[#c084fc] group-hover:text-rose-400 hover:scale-110 ml-0.5 cursor-pointer"
                    title="Remove this search"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearAllRecent}
              className="text-[10px] text-[#c084fc]/60 hover:text-rose-400 shrink-0 cursor-pointer font-mono"
            >
              Clear
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-[#150d24]">
          {results.map((item, idx) => (
            <div
              key={item.id}
              id={`cmd-result-${idx}`}
              onClick={item.handler}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`p-2.5 rounded-[6px] flex flex-col gap-1 cursor-pointer transition-colors border ${
                idx === selectedIndex
                  ? 'bg-[#ec4899] text-[#faf5ff] border-[#ec4899] font-medium shadow-xs'
                  : 'text-[#faf5ff]/90 hover:bg-[#1f1338] border-transparent'
              }`}
              style={idx === selectedIndex ? { backgroundColor: '#ec4899', color: '#faf5ff', borderColor: '#ec4899' } : undefined}
            >
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                  {item.type === 'note' && (
                    <CustomIconRenderer
                      iconName={item.icon}
                      color={idx === selectedIndex ? '#faf5ff' : item.iconColor || '#c084fc'}
                      defaultIcon={FileText}
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  {item.type === 'tag' && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          idx === selectedIndex
                            ? '#faf5ff'
                            : getTagHex(item.title.replace(/^#/, '')),
                      }}
                    />
                  )}
                  {item.type === 'action' && (
                    <Plus className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-icon' && (
                    <Sparkles className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-agenda' && (
                    <CalendarDays className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {(item.type === 'action-canvas' || item.type === 'canvas') && (
                    <Boxes className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-theme' && (
                    <Palette className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'folder' && (
                    <CustomIconRenderer
                      iconName={item.icon}
                      color={idx === selectedIndex ? '#faf5ff' : item.iconColor || '#ec4899'}
                      defaultIcon={Folder}
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  {item.type === 'action-folder' && (
                    <FolderPlus className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-backup' && (
                    <HardDrive className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-sidebar-left' && (
                    <PanelLeft className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-sidebar-right' && (
                    <PanelRight className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-preview' && (
                    <BookOpen className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-voice' && (
                    <Mic className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-voice-reader' && (
                    <Headphones className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-lock' && (
                    <Lock className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-rose-400'}`} />
                  )}
                  {item.type === 'action-image' && (
                    <ImageIcon className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-selection' && (
                    <SlidersHorizontal className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-date' && (
                    <Calendar className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-banner' && (
                    <Palette className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-table' && (
                    <TableIcon className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-text-color' && (
                    <Palette className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-fold-code' && (
                    <FoldVertical className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                  )}
                  {item.type === 'action-expand-code' && (
                    <UnfoldVertical className={`w-4 h-4 shrink-0 ${idx === selectedIndex ? 'text-[#faf5ff]' : 'text-[#38bdf8]'}`} />
                  )}

                  <div className="truncate flex-1 min-w-0">
                    <div className="text-xs truncate">
                      <HighlightedText text={item.title} query={query} />
                    </div>
                    {item.subtitle && (
                      <div className={`text-[11px] font-['Space_Mono',monospace] truncate ${idx === selectedIndex ? 'text-[#faf5ff]/80' : 'text-[#c084fc]'}`}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Match indicator pill */}
                {item.matchedFields && item.matchedFields.length > 0 && query && (
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded-[3px] border uppercase shrink-0 ${
                    idx === selectedIndex
                      ? 'border-white/40 text-white'
                      : 'border-[#2e1c52] text-[#c084fc] bg-[#1f1338]'
                  }`}>
                    {item.matchedFields.includes('content') ? 'content' : item.matchedFields[0]}
                  </span>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0 font-['Space_Mono',monospace]">
                    {item.tags.slice(0, 2).map((t, tIdx) => {
                      const tagColor = getTagColor(t);
                      return (
                        <span
                          key={tIdx}
                          style={getTagBadgeStyle(t, idx === selectedIndex)}
                          className="text-[9px] px-1.5 py-0.2 rounded-[4px] border font-medium inline-flex items-center gap-1"
                        >
                          <span
                            className="w-1 h-1 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                idx === selectedIndex ? tagColor.activeText : tagColor.dot,
                            }}
                          />
                          #{t}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Content snippet preview when search matches in content */}
              {item.snippet && (
                <div
                  className={`text-[11px] font-['Space_Mono',monospace] px-2 py-1 rounded-[4px] line-clamp-2 mt-1 leading-relaxed border ${
                    idx === selectedIndex
                      ? 'bg-black/20 text-[#faf5ff] border-white/20'
                      : 'bg-[#1a102e] text-[#faf5ff]/70 border-[#2e1c52]/60'
                  }`}
                >
                  <HighlightedText text={item.snippet} query={query} />
                </div>
              )}
            </div>
          ))}

          {results.length === 0 && (
            <div className="py-8 text-center text-xs text-[#c084fc]">
              No matching notes, tags, or commands found for "{query}".
              <div className="mt-2 text-[11px] text-[#c084fc]/60">
                Try searching with operators like <code className="text-[#ec4899]">tag:ideas</code> or <code className="text-[#ec4899]">has:todo</code>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2e1c52] bg-[#150d24] text-[11px] text-[#c084fc] flex items-center justify-between font-['Space_Mono',monospace]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span className="hidden sm:inline">Esc Close</span>
          </div>
          <span className="hidden sm:inline text-[10px] text-[#c084fc]/70">
            Operators: tag: folder: title: content: has:todo has:image
          </span>
        </div>
      </div>
    </div>
  );
};
