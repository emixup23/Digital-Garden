import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NoteFile, Folder, ViewLayoutMode, ThemeConfig } from './types';
import {
  loadNotesFromStorage,
  saveNotesToStorage,
  loadFoldersFromStorage,
  saveFoldersToStorage,
  createNewNote,
} from './utils/storage';
import { buildGraphData } from './utils/parser';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  applyThemeToDOM,
  loadActiveTheme,
  saveActiveTheme,
} from './utils/themePresets';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { BacklinksPanel } from './components/BacklinksPanel';
import { GraphView } from './components/GraphView';
import { AgendaView } from './components/AgendaView';
import { CommandPalette } from './components/CommandPalette';
import { ThemeEditor } from './components/ThemeEditor';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { IconPickerModal, IconPickerTarget } from './components/IconPickerModal';
import { parseMfContent, formatMfContent } from './utils/parser';
import { FileQuestion, Plus } from 'lucide-react';
import { isAuthenticated, getAuthUser, logout, AuthUser } from './utils/auth';
import { LoginScreen } from './components/LoginScreen';
import { preloadAttachments } from './utils/attachmentStore';

export default function App() {
  const [isAuth, setIsAuth] = useState<boolean>(() => isAuthenticated());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getAuthUser());
  const [notes, setNotes] = useState<NoteFile[]>(() => loadNotesFromStorage());
  const [folders, setFolders] = useState<Folder[]>(() => loadFoldersFromStorage());
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const initial = loadNotesFromStorage();
    return initial.length > 0 ? initial[0].id : null;
  });

  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('workspace');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<IconPickerTarget | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(() => loadActiveTheme());

  // Left and Right Sidebar Visibility states (persisted in localStorage)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('mf_left_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('mf_right_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Simplified Preview Mode (Distraction-free reading view with hidden sidebars and editing options)
  const [isSimplifiedPreview, setIsSimplifiedPreview] = useState<boolean>(false);
  const prevSidebarsRef = useRef({ left: true, right: true });

  // Compute active note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || (notes.length > 0 ? notes[0] : null);
  }, [notes, activeNoteId]);

  // Compute bidirectional connections count across the vault
  const bidirectionalCount = useMemo(() => {
    const { links } = buildGraphData(notes, folders, false);
    return links.filter((l) => l.bidirectional).length;
  }, [notes, folders]);

  // Voice to Text Dictation state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [dictateTriggerCount, setDictateTriggerCount] = useState(0);

  // Insert image trigger
  const [insertImageTriggerCount, setInsertImageTriggerCount] = useState(0);
  const [insertSelectionTriggerCount, setInsertSelectionTriggerCount] = useState(0);
  const [insertDateTriggerCount, setInsertDateTriggerCount] = useState(0);
  const [insertBannerTriggerCount, setInsertBannerTriggerCount] = useState(0);

  const handleTriggerInsertImage = () => {
    if (!activeNote) {
      const defaultName = `Note ${notes.length + 1}`;
      const newNote = createNewNote(defaultName, null);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setLayoutMode('workspace');
    } else if (layoutMode !== 'workspace' && layoutMode !== 'split') {
      setLayoutMode('workspace');
    }
    setInsertImageTriggerCount((prev) => prev + 1);
  };

  const handleTriggerInsertSelection = () => {
    if (!activeNote) {
      const defaultName = `Note ${notes.length + 1}`;
      const newNote = createNewNote(defaultName, null);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setLayoutMode('workspace');
    } else if (layoutMode !== 'workspace' && layoutMode !== 'split') {
      setLayoutMode('workspace');
    }
    setInsertSelectionTriggerCount((prev) => prev + 1);
  };

  const handleTriggerInsertDate = () => {
    if (!activeNote) {
      const defaultName = `Note ${notes.length + 1}`;
      const newNote = createNewNote(defaultName, null);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setLayoutMode('workspace');
    } else if (layoutMode !== 'workspace' && layoutMode !== 'split') {
      setLayoutMode('workspace');
    }
    setInsertDateTriggerCount((prev) => prev + 1);
  };

  const handleTriggerInsertBanner = () => {
    if (!activeNote) {
      const defaultName = `Note ${notes.length + 1}`;
      const newNote = createNewNote(defaultName, null);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setLayoutMode('workspace');
    } else if (layoutMode !== 'workspace' && layoutMode !== 'split') {
      setLayoutMode('workspace');
    }
    setInsertBannerTriggerCount((prev) => prev + 1);
  };

  const handleToggleVoiceDictation = () => {
    if (!activeNote) {
      const defaultName = `Voice Note ${notes.length + 1}`;
      const newNote = createNewNote(defaultName, null);
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setLayoutMode('workspace');
    } else if (layoutMode !== 'workspace' && layoutMode !== 'split') {
      setLayoutMode('workspace');
    }
    setDictateTriggerCount((prev) => prev + 1);
  };

  const handleToggleSimplifiedPreview = (enable?: boolean) => {
    setIsSimplifiedPreview((prev) => {
      const next = enable !== undefined ? enable : !prev;
      if (next) {
        // Save current open states so we can restore them when exiting
        prevSidebarsRef.current = { left: isLeftSidebarOpen, right: isRightSidebarOpen };
      }
      return next;
    });
  };

  // Save sidebar preferences
  useEffect(() => {
    localStorage.setItem('mf_left_sidebar_open', String(isLeftSidebarOpen));
  }, [isLeftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('mf_right_sidebar_open', String(isRightSidebarOpen));
  }, [isRightSidebarOpen]);

  const handleToggleLeftSidebar = () => setIsLeftSidebarOpen((prev) => !prev);
  const handleToggleRightSidebar = () => setIsRightSidebarOpen((prev) => !prev);

  // Save notes whenever they change
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Save folders whenever they change
  useEffect(() => {
    saveFoldersToStorage(folders);
  }, [folders]);

  // Apply active theme to document head/root and persist to localStorage
  useEffect(() => {
    applyThemeToDOM(activeTheme);
    saveActiveTheme(activeTheme);
  }, [activeTheme]);

  // Preload any vault image attachments into in-memory cache for instant rendering
  useEffect(() => {
    preloadAttachments();
  }, []);

  // Keyboard shortcut listeners: Cmd/Ctrl+K (Palette), Cmd/Ctrl+Shift+T (Theme), Cmd/Ctrl+Shift+B (Backup), Cmd/Ctrl+\ or Cmd/Ctrl+B (Toggle Left Sidebar), Cmd/Ctrl+Shift+\ (Toggle Right Sidebar), Cmd/Ctrl+Shift+V (Voice Dictation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsThemeEditorOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsBackupModalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setLayoutMode((prev) => (prev === 'agenda' ? 'workspace' : 'agenda'));
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleToggleSimplifiedPreview();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handleToggleVoiceDictation();
      } else if (e.key === 'Escape' && isSimplifiedPreview) {
        e.preventDefault();
        handleToggleSimplifiedPreview(false);
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === '\\' || e.key.toLowerCase() === 'b')) {
        // If not focused on an input/textarea for 'b' key, toggle left sidebar
        const isInput = ['INPUT', 'TEXTAREA'].includes((document.activeElement?.tagName || ''));
        if (e.key === '\\' || !isInput) {
          e.preventDefault();
          setIsLeftSidebarOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '\\') {
        e.preventDefault();
        setIsRightSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, notes.length, layoutMode, isSimplifiedPreview]);

  // Quick Dark / Light toggle handler
  const handleToggleDarkMode = () => {
    if (activeTheme.isDark) {
      // Find a matching or clean light preset
      const lightTheme = activeTheme.borderlessButtons
        ? THEME_PRESETS.find((p) => !p.isDark && p.borderlessButtons) || THEME_PRESETS.find((p) => !p.isDark) || THEME_PRESETS[8]
        : THEME_PRESETS.find((p) => !p.isDark && !p.borderlessButtons) || THEME_PRESETS.find((p) => !p.isDark) || THEME_PRESETS[8];
      setActiveTheme(lightTheme);
    } else {
      // Switch to dark preset preserving borderless preference
      const darkTheme = activeTheme.borderlessButtons
        ? THEME_PRESETS.find((p) => p.isDark && p.borderlessButtons) || DEFAULT_THEME
        : DEFAULT_THEME;
      setActiveTheme(darkTheme);
    }
  };

  // Handlers
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    if (layoutMode === 'graph' || layoutMode === 'agenda') {
      setLayoutMode('workspace');
    }
  };

  const handleNavigateToNote = (targetTitle: string) => {
    const clean = targetTitle.replace(/\.(md|mf)$/i, '').trim().toLowerCase();
    const found = notes.find(
      (n) =>
        n.title.toLowerCase() === clean ||
        n.name.replace(/\.(md|mf)$/i, '').toLowerCase() === clean
    );
    if (found) {
      setActiveNoteId(found.id);
      if (layoutMode === 'graph' || layoutMode === 'agenda') {
        setLayoutMode('workspace');
      }
    } else {
      // Auto create note if not found
      handleCreateNoteFromLink(targetTitle);
    }
  };

  const handleCreateNoteFromLink = (title: string) => {
    const newNote = createNewNote(title, activeNote?.folderId || null);
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    if (layoutMode === 'graph' || layoutMode === 'agenda') {
      setLayoutMode('workspace');
    }
  };

  const handleCreateNewNote = (folderId: string | null = null) => {
    const defaultName = `Note ${notes.length + 1}`;
    const newNote = createNewNote(defaultName, folderId);
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    if (layoutMode === 'graph' || layoutMode === 'agenda') {
      setLayoutMode('workspace');
    }
  };

  const handleUpdateNote = (updated: NoteFile) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== noteId);
      if (activeNoteId === noteId) {
        setActiveNoteId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleCreateFolder = (name: string, parentId: string | null = null) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId: string) => {
    // Reassign notes in folder to root
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
    );
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  const handleReorderFolders = (newFolders: Folder[]) => {
    setFolders(newFolders);
  };

  const handleReorderNotes = (newNotes: NoteFile[]) => {
    setNotes(newNotes);
  };

  const handleMoveFolder = (folderId: string, direction: 'up' | 'down') => {
    setFolders((prev) => {
      const idx = prev.findIndex((f) => f.id === folderId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const handleMoveNote = (noteId: string, direction: 'up' | 'down') => {
    setNotes((prev) => {
      const note = prev.find((n) => n.id === noteId);
      if (!note) return prev;
      const siblings = prev.filter((n) => n.folderId === note.folderId);
      const siblingIdx = siblings.findIndex((n) => n.id === noteId);
      const targetSiblingIdx = direction === 'up' ? siblingIdx - 1 : siblingIdx + 1;
      if (targetSiblingIdx < 0 || targetSiblingIdx >= siblings.length) return prev;

      const targetSibling = siblings[targetSiblingIdx];
      const originalIdx = prev.findIndex((n) => n.id === noteId);
      const next = [...prev];
      const [moved] = next.splice(originalIdx, 1);
      const newTargetIdx = next.findIndex((n) => n.id === targetSibling.id);
      if (direction === 'up') {
        next.splice(newTargetIdx, 0, moved);
      } else {
        next.splice(newTargetIdx + 1, 0, moved);
      }
      return next;
    });
  };

  const handleMoveNoteToFolder = (
    noteId: string,
    targetFolderId: string | null,
    targetIndex?: number
  ) => {
    setNotes((prev) => {
      const note = prev.find((n) => n.id === noteId);
      if (!note) return prev;

      const filtered = prev.filter((n) => n.id !== noteId);
      const updatedNote: NoteFile = {
        ...note,
        folderId: targetFolderId,
        updatedAt: Date.now(),
      };

      if (typeof targetIndex === 'number') {
        const targetSiblings = filtered.filter((n) => n.folderId === targetFolderId);
        if (targetIndex <= 0 && targetSiblings.length > 0) {
          const firstIdx = filtered.findIndex((n) => n.id === targetSiblings[0].id);
          filtered.splice(firstIdx, 0, updatedNote);
          return filtered;
        } else if (targetIndex >= targetSiblings.length && targetSiblings.length > 0) {
          const lastIdx = filtered.findIndex(
            (n) => n.id === targetSiblings[targetSiblings.length - 1].id
          );
          filtered.splice(lastIdx + 1, 0, updatedNote);
          return filtered;
        } else if (targetSiblings.length > 0) {
          const refSibling = targetSiblings[targetIndex];
          const refIdx = filtered.findIndex((n) => n.id === refSibling.id);
          filtered.splice(refIdx, 0, updatedNote);
          return filtered;
        }
      }

      const firstFolderSiblingIdx = filtered.findIndex((n) => n.folderId === targetFolderId);
      if (firstFolderSiblingIdx !== -1) {
        filtered.splice(firstFolderSiblingIdx, 0, updatedNote);
        return filtered;
      }

      return [updatedNote, ...filtered];
    });
  };

  const handleImportNote = (imported: NoteFile) => {
    setNotes((prev) => [imported, ...prev]);
    setActiveNoteId(imported.id);
  };

  const handleOpenFolderIconPicker = (folder: Folder) => {
    setIconPickerTarget({
      type: 'folder',
      id: folder.id,
      name: folder.name,
      currentIcon: folder.icon,
      currentIconColor: folder.iconColor,
    });
    setIsIconPickerOpen(true);
  };

  const handleOpenNoteIconPicker = (note: NoteFile) => {
    setIconPickerTarget({
      type: 'note',
      id: note.id,
      name: note.title || note.name.replace(/\.(md|mf)$/i, ''),
      currentIcon: note.icon,
      currentIconColor: note.iconColor,
    });
    setIsIconPickerOpen(true);
  };

  const handleSaveIcon = (
    targetId: string,
    type: 'folder' | 'note',
    iconName: string | undefined,
    iconColor: string | undefined
  ) => {
    if (type === 'folder') {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === targetId ? { ...f, icon: iconName, iconColor: iconColor } : f
        )
      );
    } else {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === targetId) {
            const parsed = parseMfContent(n.content);
            const updatedContent = formatMfContent(
              n.title,
              n.tags,
              parsed.content,
              iconName,
              iconColor
            );
            return {
              ...n,
              icon: iconName,
              iconColor: iconColor,
              content: updatedContent,
              updatedAt: Date.now(),
            };
          }
          return n;
        })
      );
    }
  };

  const handleRestoreVault = (
    newNotes: NoteFile[],
    newFolders: Folder[],
    newTheme?: ThemeConfig
  ) => {
    setNotes(newNotes);
    setFolders(newFolders);
    if (newTheme) {
      setActiveTheme(newTheme);
    }
    setActiveNoteId((prevId) => {
      if (prevId && newNotes.some((n) => n.id === prevId)) return prevId;
      return newNotes.length > 0 ? newNotes[0].id : null;
    });
  };

  const handleLockVault = () => {
    logout();
    setIsAuth(false);
    setCurrentUser(null);
  };

  if (!isAuth) {
    return (
      <LoginScreen
        onSuccess={(user) => {
          setIsAuth(true);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0714] font-sans antialiased text-[#faf5ff]">
      {/* Top Navigation */}
      <TopNav
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onCreateNewNote={() => handleCreateNewNote(null)}
        onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
        onOpenBackupCenter={() => setIsBackupModalOpen(true)}
        activeThemeName={activeTheme.name}
        totalNotes={notes.length}
        totalFolders={folders.length}
        bidirectionalCount={bidirectionalCount}
        isDarkMode={activeTheme.isDark}
        onToggleDarkMode={handleToggleDarkMode}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={handleToggleLeftSidebar}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={handleToggleRightSidebar}
        currentUserEmail={currentUser?.email}
        onLockVault={handleLockVault}
        isSimplifiedPreview={isSimplifiedPreview}
        onToggleSimplifiedPreview={handleToggleSimplifiedPreview}
        onToggleVoiceDictation={handleToggleVoiceDictation}
        isVoiceListening={isVoiceListening}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Full Graph Mode */}
        {layoutMode === 'graph' ? (
          <div className="w-full h-full">
            <GraphView
              notes={notes}
              folders={folders}
              activeNoteId={activeNoteId}
              onSelectNote={handleSelectNote}
              onClose={() => setLayoutMode('workspace')}
              theme={activeTheme}
            />
          </div>
        ) : layoutMode === 'agenda' ? (
          <div className="w-full h-full flex overflow-hidden">
            {/* Sidebar Explorer in Agenda Mode */}
            {isLeftSidebarOpen && (
              <Sidebar
                notes={notes}
                folders={folders}
                activeNoteId={activeNoteId}
                onSelectNote={handleSelectNote}
                onCreateNote={handleCreateNewNote}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameFolder={handleRenameFolder}
                onImportNote={handleImportNote}
                onCustomizeFolderIcon={handleOpenFolderIconPicker}
                onCustomizeNoteIcon={handleOpenNoteIconPicker}
                onReorderFolders={handleReorderFolders}
                onReorderNotes={handleReorderNotes}
                onMoveFolder={handleMoveFolder}
                onMoveNote={handleMoveNote}
                onMoveNoteToFolder={handleMoveNoteToFolder}
                selectedTagFilter={selectedTagFilter}
                onSelectTagFilter={(tag) => {
                  setSelectedTagFilter(tag);
                  setLayoutMode('workspace');
                }}
                onOpenFullGraph={() => setLayoutMode('graph')}
                onOpenBackupCenter={() => setIsBackupModalOpen(true)}
                onToggleCollapse={handleToggleLeftSidebar}
                onOpenAgenda={() => setLayoutMode('agenda')}
                isAgendaActive={true}
              />
            )}
            <AgendaView
              notes={notes}
              folders={folders}
              onUpdateNote={handleUpdateNote}
              onNavigateToNote={handleNavigateToNote}
              onCreateNote={handleCreateNewNote}
              onSelectNote={handleSelectNote}
              theme={activeTheme}
            />
          </div>
        ) : (
          <>
            {/* Sidebar Explorer */}
            {isLeftSidebarOpen && !isSimplifiedPreview && (
              <Sidebar
                notes={notes}
                folders={folders}
                activeNoteId={activeNoteId}
                onSelectNote={handleSelectNote}
                onCreateNote={handleCreateNewNote}
                onCreateFolder={handleCreateFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameFolder={handleRenameFolder}
                onImportNote={handleImportNote}
                onCustomizeFolderIcon={handleOpenFolderIconPicker}
                onCustomizeNoteIcon={handleOpenNoteIconPicker}
                onReorderFolders={handleReorderFolders}
                onReorderNotes={handleReorderNotes}
                onMoveFolder={handleMoveFolder}
                onMoveNote={handleMoveNote}
                onMoveNoteToFolder={handleMoveNoteToFolder}
                selectedTagFilter={selectedTagFilter}
                onSelectTagFilter={setSelectedTagFilter}
                onOpenFullGraph={() => setLayoutMode('graph')}
                onOpenBackupCenter={() => setIsBackupModalOpen(true)}
                onToggleCollapse={handleToggleLeftSidebar}
                onOpenAgenda={() => setLayoutMode('agenda')}
                isAgendaActive={false}
              />
            )}

            {/* Note Editor Area */}
            <main
              className={`flex-1 flex overflow-hidden ${
                layoutMode === 'split' && !isSimplifiedPreview ? 'w-1/2' : ''
              }`}
            >
              {activeNote ? (
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 h-full overflow-hidden">
                    <NoteEditor
                      note={activeNote}
                      folders={folders}
                      allNotes={notes}
                      onUpdateNote={handleUpdateNote}
                      onDeleteNote={handleDeleteNote}
                      onNavigateToNote={handleNavigateToNote}
                      onCreateNoteFromLink={handleCreateNoteFromLink}
                      onCustomizeIcon={() => activeNote && handleOpenNoteIconPicker(activeNote)}
                      isLeftSidebarOpen={isLeftSidebarOpen}
                      onToggleLeftSidebar={handleToggleLeftSidebar}
                      isRightSidebarOpen={isRightSidebarOpen}
                      onToggleRightSidebar={handleToggleRightSidebar}
                      isSimplifiedPreview={isSimplifiedPreview}
                      onToggleSimplifiedPreview={handleToggleSimplifiedPreview}
                      dictateTriggerCount={dictateTriggerCount}
                      onVoiceListeningChange={setIsVoiceListening}
                      insertImageTriggerCount={insertImageTriggerCount}
                      insertSelectionTriggerCount={insertSelectionTriggerCount}
                      insertDateTriggerCount={insertDateTriggerCount}
                      insertBannerTriggerCount={insertBannerTriggerCount}
                    />
                  </div>

                  {/* Backlinks & Mini-Graph Inspector Panel (In Standard Workspace Mode) */}
                  {layoutMode === 'workspace' && isRightSidebarOpen && !isSimplifiedPreview && (
                    <BacklinksPanel
                      activeNote={activeNote}
                      allNotes={notes}
                      folders={folders}
                      onNavigateToNote={handleNavigateToNote}
                      onCreateNote={handleCreateNoteFromLink}
                      onOpenFullGraph={() => setLayoutMode('graph')}
                      theme={activeTheme}
                      onClose={handleToggleRightSidebar}
                    />
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#c084fc] space-y-3 bg-[#0c0714]">
                  <FileQuestion className="w-12 h-12 stroke-1 opacity-40 text-[#c084fc]" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#faf5ff]">
                      No Note Selected
                    </h3>
                    <p className="text-xs max-w-sm text-[#c084fc]">
                      Select an existing note from the sidebar or create a new one to begin building your knowledge graph.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateNewNote(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#ec4899] text-[#faf5ff] text-xs font-semibold hover:bg-[#db2777] cursor-pointer shadow-sm transition-colors"
                    style={{ backgroundColor: '#ec4899', color: '#faf5ff', borderRadius: '6px' }}
                  >
                    <Plus className="w-4 h-4 text-[#faf5ff]" />
                    <span>Create Note</span>
                  </button>
                </div>
              )}
            </main>

            {/* Split Mode: Live Bidirectional Graph alongside Editor */}
            {layoutMode === 'split' && !isSimplifiedPreview && (
              <div className="w-1/2 h-full border-l border-[#2e1c52]">
                <GraphView
                  notes={notes}
                  folders={folders}
                  activeNoteId={activeNoteId}
                  onSelectNote={handleSelectNote}
                  isEmbedded={true}
                  theme={activeTheme}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Command Palette / Quick Switcher */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        folders={folders}
        onSelectNote={handleSelectNote}
        onCreateNote={() => handleCreateNewNote(null)}
        onOpenGraph={() => setLayoutMode('graph')}
        onOpenThemeEditor={() => setIsThemeEditorOpen(true)}
        onOpenBackupCenter={() => setIsBackupModalOpen(true)}
        onCustomizeNoteIcon={() => activeNote && handleOpenNoteIconPicker(activeNote)}
        onSelectTag={(tag) => {
          setSelectedTagFilter(tag);
          setLayoutMode('workspace');
        }}
        onToggleLeftSidebar={handleToggleLeftSidebar}
        onToggleRightSidebar={handleToggleRightSidebar}
        onLockVault={handleLockVault}
        onOpenAgenda={() => setLayoutMode('agenda')}
        isSimplifiedPreview={isSimplifiedPreview}
        onToggleSimplifiedPreview={handleToggleSimplifiedPreview}
        onToggleVoiceDictation={handleToggleVoiceDictation}
        isVoiceListening={isVoiceListening}
        onTriggerInsertImage={handleTriggerInsertImage}
        onTriggerInsertSelection={handleTriggerInsertSelection}
        onTriggerInsertDate={handleTriggerInsertDate}
        onTriggerInsertBanner={handleTriggerInsertBanner}
      />

      {/* Directory & Note Custom SVG Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => {
          setIsIconPickerOpen(false);
          setIconPickerTarget(null);
        }}
        target={iconPickerTarget}
        onSave={handleSaveIcon}
      />

      {/* Theme Studio & Palette Customizer */}
      <ThemeEditor
        isOpen={isThemeEditorOpen}
        onClose={() => setIsThemeEditorOpen(false)}
        activeTheme={activeTheme}
        currentTheme={activeTheme}
        onThemeChange={(newTheme) => setActiveTheme(newTheme)}
        onApplyTheme={(newTheme) => setActiveTheme(newTheme)}
        onResetDefault={() => setActiveTheme(DEFAULT_THEME)}
      />

      {/* Vault Backup & Restore Center */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        notes={notes}
        folders={folders}
        activeTheme={activeTheme}
        onRestoreVault={handleRestoreVault}
      />

      {/* Offline Status & Local Vault Indicator */}
      <OfflineIndicator
        notes={notes}
        folders={folders}
        onOpenBackupCenter={() => setIsBackupModalOpen(true)}
      />
    </div>
  );
}
