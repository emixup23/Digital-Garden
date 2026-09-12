import React, { useState, useRef } from 'react';
import {
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  Tag as TagIcon,
  Upload,
  Download,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  FileCode,
  Network,
  HardDrive,
  Sparkles,
  PanelLeftClose,
  GripVertical,
  ArrowUpDown,
  ChevronUp,
  FolderInput,
  Check,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { NoteFile, Folder } from '../types';
import { importMdFile, downloadNoteAsMd, downloadAllNotesAsMd, exportVaultBundle } from '../utils/storage';
import { getTagColor, getTagBadgeStyle } from '../utils/tagColors';
import { CustomIconRenderer } from '../utils/iconLibrary';
import { searchVaultNotes, HighlightedText, SearchResultMatch } from '../utils/searchEngine';

interface SidebarProps {
  notes: NoteFile[];
  folders: Folder[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId?: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onImportNote: (note: NoteFile) => void;
  selectedTagFilter: string | null;
  onSelectTagFilter: (tag: string | null) => void;
  onOpenFullGraph: () => void;
  onOpenBackupCenter?: () => void;
  onCustomizeFolderIcon?: (folder: Folder) => void;
  onCustomizeNoteIcon?: (note: NoteFile) => void;
  onToggleCollapse?: () => void;
  onReorderFolders?: (newFolders: Folder[]) => void;
  onReorderNotes?: (newNotes: NoteFile[]) => void;
  onMoveFolder?: (folderId: string, direction: 'up' | 'down') => void;
  onMoveNote?: (noteId: string, direction: 'up' | 'down') => void;
  onMoveNoteToFolder?: (noteId: string, targetFolderId: string | null, targetIndex?: number) => void;
  onOpenAgenda?: () => void;
  isAgendaActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  folders,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onImportNote,
  selectedTagFilter,
  onSelectTagFilter,
  onOpenFullGraph,
  onOpenBackupCenter,
  onCustomizeFolderIcon,
  onCustomizeNoteIcon,
  onToggleCollapse,
  onReorderFolders,
  onReorderNotes,
  onMoveFolder,
  onMoveNote,
  onMoveNoteToFolder,
  onOpenAgenda,
  isAgendaActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Drag and drop state
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderDropPosition, setFolderDropPosition] = useState<'before' | 'after' | null>(null);

  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [noteDropPosition, setNoteDropPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverFolderAsTargetId, setDragOverFolderAsTargetId] = useState<string | null>(null);
  const [isDragOverRootZone, setIsDragOverRootZone] = useState<boolean>(false);

  // Quick Move Note Target
  const [moveNoteTarget, setMoveNoteTarget] = useState<NoteFile | null>(null);

  // Active note for context and export
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  // Recent notes tracking (last 5-10 edited notes)
  const [recentNotesLimit, setRecentNotesLimit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pkm_sidebar_recent_limit');
      return saved === '10' ? 10 : 5;
    } catch {
      return 5;
    }
  });

  const [isRecentNotesCollapsed, setIsRecentNotesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pkm_sidebar_recent_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleRecentNotesCollapse = () => {
    setIsRecentNotesCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pkm_sidebar_recent_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleSetRecentNotesLimit = (limit: number) => {
    setRecentNotesLimit(limit);
    try {
      localStorage.setItem('pkm_sidebar_recent_limit', String(limit));
    } catch {}
  };

  // Compute the last 5-10 edited notes based on updatedAt (or createdAt)
  const recentNotes = React.useMemo(() => {
    return [...notes]
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, recentNotesLimit);
  }, [notes, recentNotesLimit]);

  // Relative time helper for recent notes
  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Export menu state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuTimeoutRef = useRef<number | null>(null);

  // Sort menu state
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [activeSortPreset, setActiveSortPreset] = useState<
    'custom' | 'name-asc' | 'name-desc' | 'updated-desc' | 'created-desc'
  >('custom');
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const sortCloseTimerRef = useRef<number | null>(null);

  const handleSortMouseEnter = () => {
    if (sortCloseTimerRef.current) {
      clearTimeout(sortCloseTimerRef.current);
      sortCloseTimerRef.current = null;
    }
    setIsSortMenuOpen(true);
  };

  const handleSortMouseLeave = () => {
    if (sortCloseTimerRef.current) {
      clearTimeout(sortCloseTimerRef.current);
    }
    sortCloseTimerRef.current = window.setTimeout(() => {
      setIsSortMenuOpen(false);
      sortCloseTimerRef.current = null;
    }, 180);
  };

  const closeSortImmediately = () => {
    if (sortCloseTimerRef.current) {
      clearTimeout(sortCloseTimerRef.current);
      sortCloseTimerRef.current = null;
    }
    setIsSortMenuOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close sort menu on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        closeSortImmediately();
      }
    };
    if (isSortMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isSortMenuOpen]);

  // Toggle folder open/collapsed
  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Folder drag handlers
  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.setData('text/plain', folderId);
    e.dataTransfer.setData('application/x-vault-folder', folderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDragOver = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // If dragging a note over a folder, mark this folder as drop target container
    if (draggedNoteId) {
      e.dataTransfer.dropEffect = 'move';
      if (dragOverFolderAsTargetId !== targetFolderId) {
        setDragOverFolderAsTargetId(targetFolderId);
      }
      return;
    }

    // If dragging a folder over another folder to reorder
    if (draggedFolderId && draggedFolderId !== targetFolderId) {
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? 'before' : 'after';
      if (dragOverFolderId !== targetFolderId || folderDropPosition !== pos) {
        setDragOverFolderId(targetFolderId);
        setFolderDropPosition(pos);
      }
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent, targetFolderId: string) => {
    e.stopPropagation();
    if (dragOverFolderId === targetFolderId) {
      setDragOverFolderId(null);
      setFolderDropPosition(null);
    }
    if (dragOverFolderAsTargetId === targetFolderId) {
      setDragOverFolderAsTargetId(null);
    }
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Note dropped onto this folder
    if (draggedNoteId) {
      onMoveNoteToFolder?.(draggedNoteId, targetFolderId);
      setDraggedNoteId(null);
      setDragOverFolderAsTargetId(null);
      return;
    }

    // 2. Folder dropped onto another folder to reorder
    if (draggedFolderId && draggedFolderId !== targetFolderId && onReorderFolders) {
      const currentFolders = [...folders];
      const sourceIdx = currentFolders.findIndex((f) => f.id === draggedFolderId);
      const targetIdx = currentFolders.findIndex((f) => f.id === targetFolderId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const [moved] = currentFolders.splice(sourceIdx, 1);
        const newTargetIdx = currentFolders.findIndex((f) => f.id === targetFolderId);
        const insertIdx = folderDropPosition === 'before' ? newTargetIdx : newTargetIdx + 1;
        currentFolders.splice(insertIdx, 0, moved);
        onReorderFolders(currentFolders);
        setActiveSortPreset('custom');
      }
    }

    setDraggedFolderId(null);
    setDragOverFolderId(null);
    setFolderDropPosition(null);
    setDragOverFolderAsTargetId(null);
  };

  // Note drag handlers
  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    e.stopPropagation();
    setDraggedNoteId(noteId);
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.setData('application/x-vault-note', noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNoteDragOver = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedNoteId && draggedNoteId !== targetNoteId) {
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? 'before' : 'after';
      if (dragOverNoteId !== targetNoteId || noteDropPosition !== pos) {
        setDragOverNoteId(targetNoteId);
        setNoteDropPosition(pos);
      }
    }
  };

  const handleNoteDragLeave = (e: React.DragEvent, targetNoteId: string) => {
    e.stopPropagation();
    if (dragOverNoteId === targetNoteId) {
      setDragOverNoteId(null);
      setNoteDropPosition(null);
    }
  };

  const handleNoteDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedNoteId && draggedNoteId !== targetNoteId && onReorderNotes) {
      const sourceNote = notes.find((n) => n.id === draggedNoteId);
      const targetNote = notes.find((n) => n.id === targetNoteId);

      if (sourceNote && targetNote) {
        const nextNotes = [...notes];
        const sourceIdx = nextNotes.findIndex((n) => n.id === draggedNoteId);
        const [moved] = nextNotes.splice(sourceIdx, 1);

        const updatedMoved: NoteFile = {
          ...moved,
          folderId: targetNote.folderId,
          updatedAt: Date.now(),
        };

        const newTargetIdx = nextNotes.findIndex((n) => n.id === targetNoteId);
        const insertIdx = noteDropPosition === 'before' ? newTargetIdx : newTargetIdx + 1;
        nextNotes.splice(insertIdx, 0, updatedMoved);
        onReorderNotes(nextNotes);
        setActiveSortPreset('custom');
      }
    }

    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setNoteDropPosition(null);
  };

  const handleRootZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedNoteId) {
      onMoveNoteToFolder?.(draggedNoteId, null);
      setDraggedNoteId(null);
    }
    setIsDragOverRootZone(false);
  };

  const handleDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
    setFolderDropPosition(null);
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setNoteDropPosition(null);
    setDragOverFolderAsTargetId(null);
    setIsDragOverRootZone(false);
  };

  // Sort presets application
  const handleApplySort = (
    preset: 'name-asc' | 'name-desc' | 'updated-desc' | 'created-desc'
  ) => {
    setActiveSortPreset(preset);
    closeSortImmediately();

    // Sort folders
    const sortedFolders = [...folders].sort((a, b) => {
      if (preset === 'name-asc') return a.name.localeCompare(b.name);
      if (preset === 'name-desc') return b.name.localeCompare(a.name);
      if (preset === 'created-desc') return b.createdAt - a.createdAt;
      return a.name.localeCompare(b.name);
    });
    onReorderFolders?.(sortedFolders);

    // Sort notes
    const sortedNotes = [...notes].sort((a, b) => {
      if (preset === 'name-asc') {
        const titleA = (a.title || a.name).toLowerCase();
        const titleB = (b.title || b.name).toLowerCase();
        return titleA.localeCompare(titleB);
      }
      if (preset === 'name-desc') {
        const titleA = (a.title || a.name).toLowerCase();
        const titleB = (b.title || b.name).toLowerCase();
        return titleB.localeCompare(titleA);
      }
      if (preset === 'updated-desc') {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
      if (preset === 'created-desc') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      return 0;
    });
    onReorderNotes?.(sortedNotes);
  };

  // Collect all unique tags and their count
  const tagCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      n.tags.forEach((t) => {
        const clean = t.toLowerCase();
        map.set(clean, (map.get(clean) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const [searchViewMode, setSearchViewMode] = useState<'results' | 'tree'>('results');

  // Scored search results using advanced engine
  const searchResults = React.useMemo<SearchResultMatch[]>(() => {
    if (!searchQuery.trim()) return [];
    let pool = notes;
    if (selectedTagFilter) {
      pool = pool.filter((n) =>
        n.tags.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase())
      );
    }
    return searchVaultNotes(pool, folders, searchQuery);
  }, [notes, folders, searchQuery, selectedTagFilter]);

  // Filter notes by search query and tag filter
  const filteredNotes = React.useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults.map((r) => r.note);
    }
    if (selectedTagFilter) {
      return notes.filter((n) =>
        n.tags.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase())
      );
    }
    return notes;
  }, [notes, searchQuery, searchResults, selectedTagFilter]);

  // Handle .md or .json file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.name.toLowerCase().endsWith('.json')) {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.notes)) {
            // Bulk import notes from vault bundle or backup package
            for (const n of parsed.notes) {
              const noteContent = n.content || '';
              const fakeFile = new File([noteContent], n.name || `${n.title || 'Note'}.md`, { type: 'text/markdown' });
              const imported = await importMdFile(fakeFile, n.folderId || null);
              onImportNote(imported);
            }
          } else if (parsed.content || parsed.title) {
            const fakeFile = new File([parsed.content || ''], parsed.name || `${parsed.title || 'Note'}.md`, { type: 'text/markdown' });
            const imported = await importMdFile(fakeFile, parsed.folderId || null);
            onImportNote(imported);
          }
        } else {
          const imported = await importMdFile(file, null);
          onImportNote(imported);
        }
      } catch (err) {
        console.error('Failed to import file', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit new folder
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  // Submit folder rename
  const handleRenameFolderSubmit = (folderId: string) => {
    if (editingFolderName.trim()) {
      onRenameFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  return (
    <aside className="w-64 h-full bg-[#150d24] border-r border-[#2e1c52] flex flex-col shrink-0 text-[#faf5ff] select-none font-['Space_Grotesk',sans-serif]">


      {/* Search Bar & Quick Actions */}
      <div className="p-3 border-b border-[#2e1c52] space-y-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-2.5 pointer-events-none" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search notes (or tag:, has:todo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[6px] bg-[#1f1338] border-[#2e1c52] text-[#faf5ff] placeholder-[#c084fc]/60 focus:outline-none focus:border-[#ec4899]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Search Operator Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[10px] font-mono scrollbar-none">
          {(['has:todo', 'has:image', 'is:recent', 'tag:'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => {
                setSearchQuery((prev) => {
                  const trimmed = prev.trim();
                  return trimmed ? `${trimmed} ${op}` : op;
                });
              }}
              className="px-1.5 py-0.5 rounded-[4px] bg-[#1f1338] border border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:border-[#ec4899]/60 shrink-0 transition-colors cursor-pointer"
              title={`Add ${op} operator to search`}
            >
              {op}
            </button>
          ))}
        </div>

        {/* Search Status & View Switcher */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-[#2e1c52]/60">
            <span className="text-[#faf5ff]/80">
              {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
            </span>
            <div className="flex items-center gap-1 bg-[#1f1338] rounded-[4px] p-0.5 border border-[#2e1c52]">
              <button
                type="button"
                onClick={() => setSearchViewMode('results')}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] transition-colors cursor-pointer ${
                  searchViewMode === 'results'
                    ? 'bg-[#ec4899] text-white font-semibold'
                    : 'text-[#c084fc] hover:text-[#faf5ff]'
                }`}
                title="View results with matching excerpts"
              >
                Snippets
              </button>
              <button
                type="button"
                onClick={() => setSearchViewMode('tree')}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] transition-colors cursor-pointer ${
                  searchViewMode === 'tree'
                    ? 'bg-[#ec4899] text-white font-semibold'
                    : 'text-[#c084fc] hover:text-[#faf5ff]'
                }`}
                title="View results in directory tree"
              >
                Tree
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons: New Note, New Folder */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            id="btn-sidebar-new-note"
            type="button"
            onClick={() => onCreateNote(null)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] hover:shadow-[0_0_12px_rgba(236,72,153,0.35)] text-[#faf5ff] font-semibold transition-all duration-150 cursor-pointer shadow-xs active:scale-95 group"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#faf5ff] group-hover:scale-110 transition-transform" />
            <span>New Note</span>
          </button>

          <button
            id="btn-sidebar-new-folder"
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] border-[#2e1c52] hover:border-[#ec4899]/60 text-[#faf5ff] hover:text-white font-medium transition-all duration-150 cursor-pointer active:scale-95 group"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#c084fc] group-hover:text-[#faf5ff] group-hover:scale-110 transition-all" />
            <span>New Dir</span>
          </button>
        </div>

        {/* Top Quick Navigation: Agenda & Recent Notes */}
        <div className="grid grid-cols-2 gap-1.5">
          {onOpenAgenda ? (
            <button
              id="btn-sidebar-open-agenda"
              type="button"
              onClick={onOpenAgenda}
              className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer active:scale-98 border ${
                isAgendaActive
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] border-[#ec4899] shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : 'bg-[#1f1338] hover:bg-[#281745] border-[#2e1c52] text-[#faf5ff] hover:border-[#ec4899]/60'
              }`}
              title="Open Agenda & Daily Schedule"
            >
              <div className="flex items-center gap-1.5 truncate">
                <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${isAgendaActive ? 'text-[#faf5ff]' : 'text-[#ec4899]'}`} />
                <span className="font-semibold truncate">Agenda</span>
              </div>
              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                  isAgendaActive ? 'bg-[#150d24]/50 text-white' : 'bg-[#150d24] text-[#c084fc]'
                }`}
              >
                Daily
              </span>
            </button>
          ) : (
            <div />
          )}

          <button
            id="btn-sidebar-recent-notes-toggle"
            type="button"
            onClick={handleToggleRecentNotesCollapse}
            className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer active:scale-98 border ${
              !isRecentNotesCollapsed
                ? 'bg-[#1f1338] text-[#ec4899] border-[#ec4899]/60 hover:bg-[#281745]'
                : 'bg-[#1f1338] hover:bg-[#281745] border-[#2e1c52] text-[#faf5ff] hover:border-[#ec4899]/60'
            }`}
            title={isRecentNotesCollapsed ? 'Expand Recent Notes section' : 'Collapse Recent Notes section'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
              <span className="font-semibold truncate">Recent</span>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#150d24] text-[#c084fc] font-semibold">
              {recentNotes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Active Tag Filter Pill */}
      {selectedTagFilter && (() => {
        const filterColor = getTagColor(selectedTagFilter);
        return (
          <div
            className="px-3 py-1.5 border-b border-[#2e1c52] flex items-center justify-between text-xs font-semibold shadow-xs"
            style={getTagBadgeStyle(selectedTagFilter, true)}
          >
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <TagIcon className="w-3 h-3" style={{ color: filterColor.activeText }} />
              <span>#{selectedTagFilter}</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectTagFilter(null)}
              className="hover:opacity-75 cursor-pointer p-0.5"
              style={{ color: filterColor.activeText }}
              title="Clear tag filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolderSubmit} className="p-2 border-b border-[#2e1c52] bg-[#1f1338]">
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="Directory name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded-[6px] bg-[#150d24] border-[#2e1c52] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] rounded-[6px] font-semibold cursor-pointer transition-colors"
              style={{ backgroundColor: '#ec4899', color: '#faf5ff', borderRadius: '6px' }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="p-1 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* File Tree or Search Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {searchQuery.trim() && searchViewMode === 'results' ? (
          <div className="space-y-1.5">
            <div className="px-1 pb-1 text-[10px] font-bold text-[#c084fc] uppercase tracking-widest font-['Space_Mono',monospace] flex items-center justify-between">
              <span>Results ({searchResults.length})</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] lowercase text-[#ec4899] hover:underline cursor-pointer tracking-normal"
              >
                clear
              </button>
            </div>

            {searchResults.map((match) => {
              const isActive = match.note.id === activeNoteId;
              return (
                <div
                  key={match.note.id}
                  onClick={() => onSelectNote(match.note.id)}
                  className={`p-2 rounded-[6px] cursor-pointer transition-all border flex flex-col gap-1 ${
                    isActive
                      ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xs'
                      : 'bg-[#1a102e] hover:bg-[#251543] border-[#2e1c52] text-[#faf5ff]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 font-medium">
                      <CustomIconRenderer
                        iconName={match.note.icon}
                        color={isActive ? '#faf5ff' : match.note.iconColor || '#c084fc'}
                        defaultIcon={FileCode}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate font-medium">
                        <HighlightedText
                          text={match.note.title || match.note.name.replace(/\.(md|mf)$/i, '')}
                          query={searchQuery}
                        />
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        isActive ? 'bg-black/20 text-white' : 'bg-[#150d24] text-[#c084fc] border border-[#2e1c52]'
                      }`}
                    >
                      {match.folderName || 'Root'}
                    </span>
                  </div>

                  {match.snippet && (
                    <div
                      className={`text-[11px] font-mono px-2 py-1 rounded leading-relaxed mt-0.5 line-clamp-2 ${
                        isActive
                          ? 'bg-black/20 text-white/90'
                          : 'bg-[#150d24] text-[#faf5ff]/75 border border-[#2e1c52]/60'
                      }`}
                    >
                      <HighlightedText text={match.snippet} query={searchQuery} />
                    </div>
                  )}

                  {match.note.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {match.note.tags.slice(0, 4).map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-mono px-1 rounded ${
                            isActive
                              ? 'bg-black/25 text-white'
                              : 'bg-[#1f1338] text-[#c084fc] border border-[#2e1c52]/60'
                          }`}
                        >
                          #{t}
                        </span>
                      ))}
                      {match.note.tags.length > 4 && (
                        <span className="text-[9px] text-[#c084fc]/60">+{match.note.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {searchResults.length === 0 && (
              <div className="py-12 text-center text-[#c084fc] space-y-2">
                <Search className="w-6 h-6 mx-auto text-[#c084fc]/40" />
                <div className="text-xs font-medium">No notes matched "{searchQuery}"</div>
                <div className="text-[11px] text-[#c084fc]/60 max-w-[200px] mx-auto">
                  Try simpler keywords or operators like <span className="text-[#ec4899] font-mono">tag:</span> or <span className="text-[#ec4899] font-mono">has:todo</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Recent Notes Section with Icon at Top of Sidebar */}
            <div
              id="sidebar-recent-notes-section"
              className="mb-3 pb-2.5 border-b border-[#2e1c52]/80 space-y-1.5"
            >
              <div
                className="flex items-center justify-between px-1 cursor-pointer group select-none"
                onClick={handleToggleRecentNotesCollapse}
                title={isRecentNotesCollapsed ? 'Expand Recent Notes' : 'Collapse Recent Notes'}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#ec4899] shrink-0 group-hover:scale-110 transition-transform" />
                  <h3 className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest font-['Space_Mono',monospace]">
                    Recent Notes
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1f1338] text-[#c084fc] border border-[#2e1c52] font-semibold font-['Space_Mono',monospace]">
                    {recentNotes.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Limit Toggle: 5 vs 10 */}
                  <div
                    className="flex items-center bg-[#1f1338] p-0.5 rounded-[4px] border border-[#2e1c52]"
                    onClick={(e) => e.stopPropagation()}
                    title="Track last 5 or 10 edited notes"
                  >
                    <button
                      id="btn-recent-limit-5"
                      type="button"
                      onClick={() => handleSetRecentNotesLimit(5)}
                      className={`px-1.5 py-0.2 text-[9px] font-mono rounded cursor-pointer transition-colors ${
                        recentNotesLimit === 5
                          ? 'bg-[#ec4899] text-white font-bold'
                          : 'text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      5
                    </button>
                    <button
                      id="btn-recent-limit-10"
                      type="button"
                      onClick={() => handleSetRecentNotesLimit(10)}
                      className={`px-1.5 py-0.2 text-[9px] font-mono rounded cursor-pointer transition-colors ${
                        recentNotesLimit === 10
                          ? 'bg-[#ec4899] text-white font-bold'
                          : 'text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      10
                    </button>
                  </div>

                  <button
                    id="btn-toggle-recent-notes-chevron"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRecentNotesCollapse();
                    }}
                    className="p-0.5 text-[#c084fc] group-hover:text-[#faf5ff] transition-colors"
                  >
                    {isRecentNotesCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Notes List */}
              {!isRecentNotesCollapsed && (
                <div className="space-y-1">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note) => {
                      const isActive = note.id === activeNoteId;
                      const folder = folders.find((f) => f.id === note.folderId);
                      const folderName = folder ? folder.name : 'Root';
                      const relativeTime = formatRelativeTime(note.updatedAt || note.createdAt);

                      return (
                        <div
                          key={`recent-note-${note.id}`}
                          id={`recent-note-${note.id}`}
                          onClick={() => onSelectNote(note.id)}
                          className={`group flex items-center justify-between py-1.5 px-2 rounded-[6px] cursor-pointer transition-all duration-150 border text-xs ${
                            isActive
                              ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xs'
                              : 'bg-[#1a102e]/60 hover:bg-[#251543] border-transparent hover:border-[#2e1c52] text-[#faf5ff]'
                          }`}
                          title={`Open "${note.title || note.name}"\nLast edited: ${new Date(
                            note.updatedAt || note.createdAt
                          ).toLocaleString()}\nFolder: ${folderName}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <CustomIconRenderer
                              iconName={note.icon}
                              color={isActive ? '#faf5ff' : note.iconColor || '#c084fc'}
                              defaultIcon={FileCode}
                              className="w-3.5 h-3.5 shrink-0"
                            />
                            <span className="truncate font-medium">
                              {note.title || note.name.replace(/\.(md|mf)$/i, '')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <span
                              className={`text-[9px] font-mono px-1 py-0.2 rounded truncate max-w-[55px] ${
                                isActive
                                  ? 'bg-black/25 text-white'
                                  : 'bg-[#150d24] text-[#c084fc] border border-[#2e1c52]/80'
                              }`}
                            >
                              {folderName}
                            </span>
                            {relativeTime && (
                              <span
                                className={`text-[9px] font-mono whitespace-nowrap ${
                                  isActive
                                    ? 'text-white/80'
                                    : 'text-[#c084fc]/70 group-hover:text-[#c084fc]'
                                }`}
                              >
                                {relativeTime}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-2.5 px-2 text-center text-[11px] text-[#c084fc]/60 italic bg-[#1a102e]/30 rounded-[6px] border border-[#2e1c52]/40">
                      No edited notes yet
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
          {/* Directories Header with Reorder / Sort Dropdown */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest font-['Space_Mono',monospace] flex items-center gap-1.5">
              <span>Directories</span>
              {activeSortPreset !== 'custom' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ec4899]/15 text-[#ec4899] font-normal lowercase tracking-normal">
                  {activeSortPreset === 'name-asc'
                    ? 'a-z'
                    : activeSortPreset === 'name-desc'
                    ? 'z-a'
                    : activeSortPreset === 'updated-desc'
                    ? 'recent'
                    : 'created'}
                </span>
              )}
            </h3>

            {/* Reorder / Sort Dropdown Trigger */}
            <div
              className="relative"
              ref={sortMenuRef}
              onMouseEnter={handleSortMouseEnter}
              onMouseLeave={handleSortMouseLeave}
            >
              <button
                id="btn-sidebar-sort-order"
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] transition-colors cursor-pointer border-transparent hover:border-[#2e1c52]"
                title="Rearrange or Sort Directories & Files"
              >
                <ArrowUpDown className="w-3 h-3 text-[#c084fc]" />
              </button>

              {isSortMenuOpen && (
                <div
                  id="sidebar-sort-order-dropdown"
                  className="absolute right-0 top-full mt-1 w-52 bg-[#150d24] border-[#3b2366] rounded-[8px] shadow-2xl py-1 z-50 text-xs font-['Space_Grotesk',sans-serif] ring-1 ring-black/50"
                  style={{ zIndex: 100 }}
                  onMouseEnter={handleSortMouseEnter}
                  onMouseLeave={handleSortMouseLeave}
                >
                  <div className="px-2.5 py-1 text-[9px] font-semibold text-[#c084fc]/70 uppercase tracking-wider font-['Space_Mono',monospace] border-b border-[#2e1c52]/60 mb-0.5">
                    Order & Sorting
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSortPreset('custom');
                      closeSortImmediately();
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-[#ec4899]" />
                      <span>Custom / Drag Order</span>
                    </span>
                    {activeSortPreset === 'custom' && (
                      <Check className="w-3 h-3 text-[#ec4899]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySort('name-asc')}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                  >
                    <span>Name (A → Z)</span>
                    {activeSortPreset === 'name-asc' && (
                      <Check className="w-3 h-3 text-[#ec4899]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySort('name-desc')}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                  >
                    <span>Name (Z → A)</span>
                    {activeSortPreset === 'name-desc' && (
                      <Check className="w-3 h-3 text-[#ec4899]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySort('updated-desc')}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                  >
                    <span>Last Modified (Newest)</span>
                    {activeSortPreset === 'updated-desc' && (
                      <Check className="w-3 h-3 text-[#ec4899]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySort('created-desc')}
                    className="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between text-[#faf5ff] hover:bg-[#1f1338] cursor-pointer"
                  >
                    <span>Date Created (Newest)</span>
                    {activeSortPreset === 'created-desc' && (
                      <Check className="w-3 h-3 text-[#ec4899]" />
                    )}
                  </button>
                  <div className="px-2.5 py-1 text-[9px] text-[#c084fc]/50 border-t border-[#2e1c52]/60 mt-1">
                    Tip: Drag handles or use ↑/↓ to arrange
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {/* Folders List */}
            {folders.map((folder, folderIdx) => {
              const folderNotes = filteredNotes.filter((n) => n.folderId === folder.id);
              const isCollapsed = !!collapsedFolders[folder.id];
              const isEditing = editingFolderId === folder.id;
              const isBeingDragged = draggedFolderId === folder.id;
              const isDropTargetFolder =
                draggedFolderId &&
                dragOverFolderId === folder.id &&
                draggedFolderId !== folder.id;
              const isNoteTargetContainer =
                draggedNoteId && dragOverFolderAsTargetId === folder.id;

              return (
                <div
                  key={folder.id}
                  className="space-y-0.5 relative"
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                >
                  {/* Drop Indicator Lines for Folder Reordering */}
                  {isDropTargetFolder && folderDropPosition === 'before' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ec4899] shadow-[0_0_8px_#ec4899] z-20 pointer-events-none rounded-full flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] -ml-0.5" />
                    </div>
                  )}
                  {isDropTargetFolder && folderDropPosition === 'after' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec4899] shadow-[0_0_8px_#ec4899] z-20 pointer-events-none rounded-full flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] -ml-0.5" />
                    </div>
                  )}

                  {/* Folder Header Row */}
                  <div
                    draggable={!isEditing}
                    onDragStart={(e) => handleFolderDragStart(e, folder.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex items-center justify-between px-2 py-1.5 rounded-[6px] transition-all duration-150 select-none cursor-pointer ${
                      isBeingDragged ? 'opacity-30' : ''
                    } ${
                      isNoteTargetContainer
                        ? 'ring-2 ring-[#ec4899] bg-[#ec4899]/20 shadow-[0_0_12px_rgba(236,72,153,0.35)] border-[#ec4899]'
                        : 'hover:bg-[#251543] border-transparent hover:border-[#3b2366]'
                    }`}
                  >
                    <div
                      className="flex items-center gap-1.5 flex-1 min-w-0"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                      )}
                      <span
                        onClick={(e) => {
                          if (onCustomizeFolderIcon) {
                            e.stopPropagation();
                            onCustomizeFolderIcon(folder);
                          }
                        }}
                        className="hover:scale-110 transition-transform cursor-pointer p-0.5 rounded hover:bg-[#2e1c52]"
                        title="Click to customize directory icon & color"
                      >
                        <CustomIconRenderer
                          iconName={folder.icon}
                          color={folder.iconColor || '#ec4899'}
                          defaultIcon={isCollapsed ? FolderIcon : FolderOpen}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onBlur={() => handleRenameFolderSubmit(folder.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolderSubmit(folder.id);
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                          className="px-1 py-0.5 text-xs bg-[#1f1338] border-[#2e1c52] rounded-[4px] flex-1 focus:outline-none focus:border-[#ec4899] text-[#faf5ff]"
                        />
                      ) : (
                        <span className="font-medium text-[#faf5ff] truncate">
                          {folder.name}
                        </span>
                      )}
                      <span className="text-[10px] text-[#c084fc] ml-1 font-['Space_Mono',monospace]">
                        ({folderNotes.length})
                      </span>

                      {isNoteTargetContainer && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ec4899] text-white font-mono shrink-0 ml-1">
                          Drop to move
                        </span>
                      )}
                    </div>

                    {/* Folder Actions Overlay on Hover (floating on top of directory row) */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center gap-0.5 bg-[#150d24]/95 backdrop-blur-xs border-[#3b2366] rounded-[6px] px-1 py-0.5 shadow-lg transition-opacity">
                      {/* Move Up Directory */}
                      <button
                        type="button"
                        disabled={folderIdx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveFolder?.(folder.id, 'up');
                          setActiveSortPreset('custom');
                        }}
                        className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                          folderIdx === 0
                            ? 'text-[#c084fc]/20 cursor-not-allowed'
                            : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52]'
                        }`}
                        title={folderIdx === 0 ? 'Already at top' : 'Move directory up'}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>

                      {/* Move Down Directory */}
                      <button
                        type="button"
                        disabled={folderIdx === folders.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveFolder?.(folder.id, 'down');
                          setActiveSortPreset('custom');
                        }}
                        className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                          folderIdx === folders.length - 1
                            ? 'text-[#c084fc]/20 cursor-not-allowed'
                            : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52]'
                        }`}
                        title={
                          folderIdx === folders.length - 1
                            ? 'Already at bottom'
                            : 'Move directory down'
                        }
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {onCustomizeFolderIcon && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCustomizeFolderIcon(folder);
                          }}
                          className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] rounded-[4px] cursor-pointer"
                          title="Customize directory icon, colors, or upload an .svg"
                        >
                          <Sparkles className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNote(folder.id);
                        }}
                        className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] rounded-[4px] cursor-pointer"
                        title={`Create note in ${folder.name}`}
                      >
                        <FilePlus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] rounded-[4px] cursor-pointer"
                        title="Rename directory"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete folder "${folder.name}"? Notes inside will be moved to root.`
                            )
                          ) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                        className="p-1 text-[#c084fc] hover:text-rose-400 hover:bg-[#2e1c52] rounded-[4px] cursor-pointer"
                        title="Delete directory"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Folder Notes Subtree */}
                  {!isCollapsed && (
                    <div className="pl-3.5 space-y-0.5 border-l border-[#2e1c52] ml-3">
                      {folderNotes.map((note, noteIdx) => {
                        const isActive = note.id === activeNoteId;
                        const isBeingDragged = draggedNoteId === note.id;
                        const isDropTargetNote =
                          draggedNoteId &&
                          dragOverNoteId === note.id &&
                          draggedNoteId !== note.id;

                        return (
                          <div
                            key={note.id}
                            draggable={true}
                            onDragStart={(e) => handleNoteDragStart(e, note.id)}
                            onDragOver={(e) => handleNoteDragOver(e, note.id)}
                            onDragLeave={(e) => handleNoteDragLeave(e, note.id)}
                            onDrop={(e) => handleNoteDrop(e, note.id)}
                            onDragEnd={handleDragEnd}
                            className={`group/note relative flex items-center justify-between rounded-[6px] transition-all select-none ${
                              isBeingDragged ? 'opacity-30' : ''
                            }`}
                          >
                            {/* Drop Indicator Lines for Note Reordering */}
                            {isDropTargetNote && noteDropPosition === 'before' && (
                              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] z-20 pointer-events-none rounded-full flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] -ml-0.5" />
                              </div>
                            )}
                            {isDropTargetNote && noteDropPosition === 'after' && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] z-20 pointer-events-none rounded-full flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] -ml-0.5" />
                              </div>
                            )}

                            {/* Note button taking the full width as before the change */}
                            <button
                              id={`sidebar-note-${note.id}`}
                              type="button"
                              onClick={() => onSelectNote(note.id)}
                              className={`w-full text-left px-2 py-1.5 rounded-[6px] flex items-center justify-between gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                                isActive
                                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] border-[#ec4899]'
                                  : 'text-[#faf5ff]/85 hover:text-[#faf5ff] hover:bg-[#251543] border-transparent hover:border-[#3b2366]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <CustomIconRenderer
                                  iconName={note.icon}
                                  color={
                                    isActive ? '#faf5ff' : note.iconColor || '#c084fc'
                                  }
                                  defaultIcon={FileCode}
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                                <span className="truncate">
                                  <HighlightedText text={note.title || note.name.replace(/\.(md|mf)$/i, '')} query={searchQuery} />
                                </span>
                              </div>
                            </button>

                            {/* Move up, move down, move note to another directory on top of the note name on hover */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/note:opacity-100 pointer-events-none group-hover/note:pointer-events-auto flex items-center gap-0.5 bg-[#150d24]/95 backdrop-blur-xs border-[#3b2366] rounded-[6px] px-1 py-0.5 shadow-lg transition-opacity">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={noteIdx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveNote?.(note.id, 'up');
                                  setActiveSortPreset('custom');
                                }}
                                className={`p-1 rounded-[4px] transition-all cursor-pointer ${
                                  noteIdx === 0
                                    ? 'text-[#c084fc]/20 cursor-not-allowed'
                                    : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95'
                                }`}
                                title={noteIdx === 0 ? 'Top of folder' : 'Move note up'}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={noteIdx === folderNotes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveNote?.(note.id, 'down');
                                  setActiveSortPreset('custom');
                                }}
                                className={`p-1 rounded-[4px] transition-all cursor-pointer ${
                                  noteIdx === folderNotes.length - 1
                                    ? 'text-[#c084fc]/20 cursor-not-allowed'
                                    : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95'
                                }`}
                                title={
                                  noteIdx === folderNotes.length - 1
                                    ? 'Bottom of folder'
                                    : 'Move note down'
                                }
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {/* Move note to another directory */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMoveNoteTarget(note);
                                }}
                                className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95 rounded-[4px] transition-all cursor-pointer"
                                title="Move note to another directory..."
                              >
                                <FolderInput className="w-3 h-3" />
                              </button>

                              {onCustomizeNoteIcon && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCustomizeNoteIcon(note);
                                  }}
                                  className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95 rounded-[4px] transition-all cursor-pointer"
                                  title="Customize note icon, colors, or upload an .svg"
                                >
                                  <Sparkles className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {folderNotes.length === 0 && (
                        <div
                          onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                          onDrop={(e) => handleFolderDrop(e, folder.id)}
                          className={`px-2 py-1.5 text-[10px] rounded border-dashed transition-all ${
                            isNoteTargetContainer
                              ? 'border-[#ec4899] text-[#ec4899] bg-[#ec4899]/15'
                              : 'border-[#2e1c52]/60 text-[#c084fc]/40 italic'
                          }`}
                        >
                          {isNoteTargetContainer
                            ? 'Drop note here to add to directory'
                            : 'Empty directory (drag notes here)'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Root Level Notes */}
        {(() => {
          const rootNotes = filteredNotes.filter((n) => !n.folderId);
          if (rootNotes.length === 0 && folders.length > 0 && !draggedNoteId) return null;

          return (
            <div
              className={`pt-2 transition-all rounded-[6px] ${
                isDragOverRootZone
                  ? 'ring-2 ring-[#38bdf8] bg-[#38bdf8]/15 p-2'
                  : ''
              }`}
              onDragOver={(e) => {
                if (draggedNoteId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setIsDragOverRootZone(true);
                }
              }}
              onDragLeave={() => setIsDragOverRootZone(false)}
              onDrop={handleRootZoneDrop}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest font-['Space_Mono',monospace] flex items-center gap-1.5">
                  <span>Root Notes</span>
                  <span className="text-[10px] text-[#c084fc]/70 font-['Space_Mono',monospace]">
                    ({rootNotes.length})
                  </span>
                </h3>
                {isDragOverRootZone && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8] text-slate-900 font-bold font-mono">
                    Drop to move to root
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {rootNotes.map((note, noteIdx) => {
                  const isActive = note.id === activeNoteId;
                  const isBeingDragged = draggedNoteId === note.id;
                  const isDropTargetNote =
                    draggedNoteId &&
                    dragOverNoteId === note.id &&
                    draggedNoteId !== note.id;

                  return (
                    <div
                      key={note.id}
                      draggable={true}
                      onDragStart={(e) => handleNoteDragStart(e, note.id)}
                      onDragOver={(e) => handleNoteDragOver(e, note.id)}
                      onDragLeave={(e) => handleNoteDragLeave(e, note.id)}
                      onDrop={(e) => handleNoteDrop(e, note.id)}
                      onDragEnd={handleDragEnd}
                      className={`group/note relative flex items-center justify-between rounded-[6px] transition-all select-none ${
                        isBeingDragged ? 'opacity-30' : ''
                      }`}
                    >
                      {/* Drop Indicator Lines for Note Reordering */}
                      {isDropTargetNote && noteDropPosition === 'before' && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] z-20 pointer-events-none rounded-full flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] -ml-0.5" />
                        </div>
                      )}
                      {isDropTargetNote && noteDropPosition === 'after' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] z-20 pointer-events-none rounded-full flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] -ml-0.5" />
                        </div>
                      )}

                      {/* Root Note button taking full width as before the change */}
                      <button
                        id={`sidebar-note-${note.id}`}
                        type="button"
                        onClick={() => onSelectNote(note.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-[6px] flex items-center justify-between gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.99] ${
                          isActive
                            ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] border-[#ec4899]'
                            : 'text-[#faf5ff]/85 hover:text-[#faf5ff] hover:bg-[#251543] border-transparent hover:border-[#3b2366]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CustomIconRenderer
                            iconName={note.icon}
                            color={
                              isActive ? '#faf5ff' : note.iconColor || '#c084fc'
                            }
                            defaultIcon={FileCode}
                            className="w-3.5 h-3.5 shrink-0"
                          />
                          <span className="truncate">
                            <HighlightedText text={note.title || note.name.replace(/\.(md|mf)$/i, '')} query={searchQuery} />
                          </span>
                        </div>
                      </button>

                      {/* Move up, move down, move note to another directory on top of the note name on hover */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/note:opacity-100 pointer-events-none group-hover/note:pointer-events-auto flex items-center gap-0.5 bg-[#150d24]/95 backdrop-blur-xs border-[#3b2366] rounded-[6px] px-1 py-0.5 shadow-lg transition-opacity">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={noteIdx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveNote?.(note.id, 'up');
                            setActiveSortPreset('custom');
                          }}
                          className={`p-1 rounded-[4px] transition-all cursor-pointer ${
                            noteIdx === 0
                              ? 'text-[#c084fc]/20 cursor-not-allowed'
                              : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95'
                          }`}
                          title={noteIdx === 0 ? 'Top of root list' : 'Move up note'}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={noteIdx === rootNotes.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveNote?.(note.id, 'down');
                            setActiveSortPreset('custom');
                          }}
                          className={`p-1 rounded-[4px] transition-all cursor-pointer ${
                            noteIdx === rootNotes.length - 1
                              ? 'text-[#c084fc]/20 cursor-not-allowed'
                              : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95'
                          }`}
                          title={
                            noteIdx === rootNotes.length - 1
                              ? 'Bottom of root list'
                              : 'Move down note'
                          }
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* Move note to another directory */}
                        {folders.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMoveNoteTarget(note);
                            }}
                            className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#341d5a] hover:scale-105 active:scale-95 rounded-[4px] transition-all cursor-pointer"
                            title="Move note into a directory..."
                          >
                            <FolderInput className="w-3 h-3" />
                          </button>
                        )}

                        {onCustomizeNoteIcon && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomizeNoteIcon(note);
                            }}
                            className="p-1 text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] rounded-[4px] cursor-pointer"
                            title="Customize note icon, colors, or upload an .svg"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {rootNotes.length === 0 && (
                  <div className="px-2 py-2 text-[10px] text-[#c084fc]/50 italic text-center border-dashed border-[#2e1c52]/60 rounded">
                    No notes in root directory
                  </div>
                )}
              </div>
            </div>
          );
        })()}

            {filteredNotes.length === 0 && (
              <div className="p-4 text-center text-[#c084fc] text-xs">
                No notes found matching your filter.
              </div>
            )}
          </>
        )}
      </div>

      {/* Tags Index Section */}
      {tagCounts.length > 0 && (
        <div className="p-3 border-t border-[#2e1c52] max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest font-['Space_Mono',monospace]">
              Tags
            </h3>
            {selectedTagFilter && (
              <button
                type="button"
                onClick={() => onSelectTagFilter(null)}
                className="text-[#ec4899] hover:underline cursor-pointer text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tagCounts.map(([tag, count]) => {
              const isSelected = selectedTagFilter === tag;
              const tagColor = getTagColor(tag);
              return (
                <button
                  key={tag}
                  id={`tag-filter-${tag}`}
                  type="button"
                  onClick={() => onSelectTagFilter(isSelected ? null : tag)}
                  style={getTagBadgeStyle(tag, isSelected)}
                  className="text-[10px] px-2 py-0.5 rounded-[6px] transition-all cursor-pointer font-['Space_Mono',monospace] font-medium flex items-center gap-1.5 hover:brightness-110 shadow-2xs border"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: isSelected ? tagColor.activeText : tagColor.dot }}
                  />
                  <span>#{tag}</span>
                  <span
                    className="text-[9px] opacity-75 font-normal"
                    style={{ color: isSelected ? tagColor.activeText : tagColor.text }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Vault Utilities and Node Count */}
      <div className="mt-auto p-3 border-t border-[#2e1c52] bg-[#150d24] flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-[#c084fc] font-['Space_Mono',monospace]">
          <span>{notes.length} Nodes</span>
          <div className="flex items-center gap-2">
            {/* Hidden File Input for note upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.mf,.markdown,.txt,.json"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              id="btn-import-md"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-[#faf5ff] cursor-pointer flex items-center gap-0.5"
              title="Import markdown note (.md) or JSON bundle"
            >
              <Upload className="w-3 h-3" />
              <span>Import</span>
            </button>
            <span>•</span>
            <div
              className="relative"
              onMouseEnter={() => {
                if (exportMenuTimeoutRef.current) clearTimeout(exportMenuTimeoutRef.current);
                setIsExportMenuOpen(true);
              }}
              onMouseLeave={() => {
                exportMenuTimeoutRef.current = window.setTimeout(() => {
                  setIsExportMenuOpen(false);
                }, 250);
              }}
            >
              <button
                id="btn-export-vault"
                type="button"
                onClick={() => {
                  if (activeNote) {
                    downloadNoteAsMd(activeNote);
                  } else if (notes.length > 0) {
                    downloadNoteAsMd(notes[0]);
                  }
                }}
                className="hover:text-[#faf5ff] cursor-pointer flex items-center gap-0.5"
                title={activeNote ? `Export "${activeNote.title || activeNote.name}" in matching .md format` : 'Export markdown note (.md)'}
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
                <ChevronUp className="w-2.5 h-2.5 opacity-60" />
              </button>

              {/* Export Popover Options (opens on hover) */}
              {isExportMenuOpen && (
                <div
                  id="menu-export-options"
                  className="absolute bottom-full right-0 mb-2 w-56 bg-[#1f1338] border border-[#2e1c52] rounded-[8px] shadow-2xl p-1.5 z-50 text-[11px] font-sans flex flex-col gap-1"
                >
                  <div className="px-2 py-1 text-[10px] text-[#c084fc] font-['Space_Mono',monospace] uppercase tracking-wider border-b border-[#2e1c52]/60">
                    Export Format (.md)
                  </div>
                  {activeNote && (
                    <button
                      id="btn-export-active-note"
                      type="button"
                      onClick={() => {
                        downloadNoteAsMd(activeNote);
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-[5px] hover:bg-[#2e1c52] text-[#faf5ff] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <span className="truncate pr-1">
                        Export <strong>"{activeNote.title || activeNote.name.replace(/\.md$/i, '')}"</strong>
                      </span>
                      <span className="text-[9px] font-mono text-[#ec4899] shrink-0 font-semibold">.md</span>
                    </button>
                  )}
                  {notes.length > 1 && (
                    <button
                      id="btn-export-all-notes"
                      type="button"
                      onClick={() => {
                        downloadAllNotesAsMd(notes);
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-[5px] hover:bg-[#2e1c52] text-[#faf5ff] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <span>Export All ({notes.length} Notes)</span>
                      <span className="text-[9px] font-mono text-[#ec4899] shrink-0 font-semibold">.md files</span>
                    </button>
                  )}
                  <div className="border-t border-[#2e1c52]/60 mt-0.5 pt-1">
                    <button
                      id="btn-export-json-bundle"
                      type="button"
                      onClick={() => {
                        exportVaultBundle(notes, folders);
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded-[5px] hover:bg-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] flex items-center justify-between cursor-pointer transition-colors text-[10px]"
                    >
                      <span>Full Vault Archive</span>
                      <span className="text-[9px] font-mono shrink-0">.json</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {onOpenBackupCenter && (
              <>
                <span>•</span>
                <button
                  id="btn-sidebar-backup-center"
                  type="button"
                  onClick={onOpenBackupCenter}
                  className="hover:text-[#ec4899] text-[#faf5ff] font-semibold cursor-pointer flex items-center gap-0.5"
                  title="Open Backup & Restore Center"
                >
                  <HardDrive className="w-3 h-3 text-[#ec4899]" />
                  <span>Backup</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Move Note to Directory Modal */}
      {moveNoteTarget && (
        <div
          id="modal-move-note-directory"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setMoveNoteTarget(null)}
        >
          <div
            className="w-full max-w-sm bg-[#150d24] border-[#3b2366] rounded-xl shadow-2xl p-4 text-[#faf5ff] font-['Space_Grotesk',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2e1c52] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-[#ec4899]" />
                <h3 className="font-semibold text-sm text-[#faf5ff]">
                  Move Note to Directory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveNoteTarget(null)}
                className="p-1 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#c084fc] mb-3">
              Select destination directory for{' '}
              <span className="font-semibold text-[#faf5ff]">
                "{moveNoteTarget.title || moveNoteTarget.name.replace(/\.(md|mf)$/i, '')}"
              </span>
              :
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {/* Root option */}
              <button
                type="button"
                onClick={() => {
                  onMoveNoteToFolder?.(moveNoteTarget.id, null);
                  setMoveNoteTarget(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                  !moveNoteTarget.folderId
                    ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff] font-medium'
                    : 'bg-[#1f1338] border-[#2e1c52] text-[#faf5ff]/80 hover:bg-[#2e1c52] hover:text-[#faf5ff]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[#c084fc]">/</span>
                  <span>Root (Top Level)</span>
                </span>
                {!moveNoteTarget.folderId && (
                  <Check className="w-3.5 h-3.5 text-[#ec4899]" />
                )}
              </button>

              {/* Folders list */}
              {folders.map((f) => {
                const isCurrent = moveNoteTarget.folderId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onMoveNoteToFolder?.(moveNoteTarget.id, f.id);
                      setMoveNoteTarget(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff] font-medium'
                        : 'bg-[#1f1338] border-[#2e1c52] text-[#faf5ff]/80 hover:bg-[#2e1c52] hover:text-[#faf5ff]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <CustomIconRenderer
                        iconName={f.icon}
                        color={f.iconColor || '#ec4899'}
                        defaultIcon={FolderIcon}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate">{f.name}</span>
                    </span>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#ec4899]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
