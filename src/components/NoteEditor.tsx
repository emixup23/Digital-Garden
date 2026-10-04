import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Edit3,
  Columns,
  Eye,
  Download,
  Trash2,
  Folder as FolderIcon,
  Tag as TagIcon,
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  Code,
  Quote,
  Link,
  Plus,
  X,
  FileCode,
  Save,
  Sparkles,
  PanelLeftOpen,
  PanelRightOpen,
  PanelRightClose,
  Code2,
  ChevronDown,
  ChevronUp,
  Database,
  Terminal,
  BookOpen,
  Mic,
  MicOff,
  Undo,
  Redo,
  Image as ImageIcon,
  Calendar,
  Palette,
  SlidersHorizontal,
  ListFilter,
  GripVertical,
  Search,
  FoldVertical,
  UnfoldVertical,
  ChevronsUpDown,
  ChevronsDownUp,
  Headphones,
  Baseline,
  Highlighter,
  Table as TableIcon,
  Boxes,
} from 'lucide-react';
import { NoteFile, Folder, EditorMode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { downloadNoteAsMd } from '../utils/storage';
import { parseMfContent, formatMfContent } from '../utils/parser';
import { getTagColor, getTagBadgeStyle } from '../utils/tagColors';
import { CustomIconRenderer } from '../utils/iconLibrary';
import { LANGUAGE_METADATA } from './CodeBlock';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VoiceDictationBar } from './VoiceDictationBar';
import { useVoiceReader } from '../hooks/useVoiceReader';
import { VoiceReaderBar } from './VoiceReaderBar';
import { InsertImageModal } from './InsertImageModal';
import { NoteHeaderBanner } from './ColoredBanner';
import { InsertSelectionModal } from './InsertSelectionModal';
import { InsertDateModal } from './InsertDateModal';
import { InsertBannerModal } from './InsertBannerModal';
import { InsertTableModal } from './InsertTableModal';
import { InsertCanvasModal } from './InsertCanvasModal';
import { TextColorPicker } from './TextColorPicker';
import { AttachedImagesBar } from './AttachedImagesBar';
import { InNoteFindReplace } from './InNoteFindReplace';
import { loadCanvasBoards } from '../utils/canvasStore';
import {
  saveAttachment,
  extractNoteImages,
  migrateNoteImagesToAttachments,
  NoteImageInfo,
} from '../utils/attachmentStore';

interface NoteEditorProps {
  note: NoteFile;
  folders: Folder[];
  allNotes: NoteFile[];
  onUpdateNote: (updated: NoteFile) => void;
  onDeleteNote: (noteId: string) => void;
  onNavigateToNote: (title: string) => void;
  onCreateNoteFromLink: (title: string) => void;
  onNavigateToCanvas?: (canvasIdentifier: string, targetCardId?: string) => void;
  onCreateCanvasFromLink?: (canvasName: string) => void;
  onCustomizeIcon?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  isSimplifiedPreview?: boolean;
  onToggleSimplifiedPreview?: (enabled: boolean) => void;
  dictateTriggerCount?: number;
  onVoiceListeningChange?: (isListening: boolean) => void;
  voiceReaderTriggerCount?: number;
  onVoiceReadingChange?: (isReading: boolean) => void;
  insertImageTriggerCount?: number;
  insertSelectionTriggerCount?: number;
  insertDateTriggerCount?: number;
  insertBannerTriggerCount?: number;
  insertTableTriggerCount?: number;
  textColorTriggerCount?: number;
  foldAllTriggerCount?: number;
  expandAllTriggerCount?: number;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  allNotes,
  onUpdateNote,
  onDeleteNote,
  onNavigateToNote,
  onCreateNoteFromLink,
  onNavigateToCanvas,
  onCreateCanvasFromLink,
  onCustomizeIcon,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  isSimplifiedPreview = false,
  onToggleSimplifiedPreview,
  dictateTriggerCount,
  onVoiceListeningChange,
  voiceReaderTriggerCount,
  onVoiceReadingChange,
  insertImageTriggerCount,
  insertSelectionTriggerCount,
  insertDateTriggerCount,
  insertBannerTriggerCount,
  insertTableTriggerCount,
  textColorTriggerCount,
  foldAllTriggerCount,
  expandAllTriggerCount,
}) => {
  const [editorMode, setEditorMode] = useState<EditorMode>('split');
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectionModalType, setSelectionModalType] = useState<'multi' | 'single'>('multi');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerModalInitialTab, setBannerModalInitialTab] = useState<'in-note' | 'header'>('in-note');
  const [bannerModalInitialContent, setBannerModalInitialContent] = useState<string>('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  // Text Color & Highlight State
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState(false);
  const [activeTextColor, setActiveTextColor] = useState<string>(() => {
    return localStorage.getItem('mf_last_text_color') || '#ec4899';
  });
  const [selectedTextForColor, setSelectedTextForColor] = useState<string>('');
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const saveCurrentSelection = useCallback(() => {
    if (textareaRef.current) {
      savedSelectionRef.current = {
        start: textareaRef.current.selectionStart ?? 0,
        end: textareaRef.current.selectionEnd ?? 0,
      };
    }
  }, []);

  const [showTags, setShowTags] = useState<boolean>(() => {
    const saved = localStorage.getItem('pkm_show_tags');
    return saved !== null ? saved === 'true' : true;
  });

  // Resizable split view ratio (percentage of editor width, e.g. 50% for 50/50)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    const saved = localStorage.getItem('pkm_editor_preview_split_ratio');
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val >= 15 && val <= 85) return val;
    }
    return 50;
  });
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const [isHoveringSplitter, setIsHoveringSplitter] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  // Split view dragging pointer handlers
  const handleSplitterPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSplitterPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitter || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(85, Math.max(15, Math.round(newRatio * 10) / 10));
    setSplitRatio(clamped);
  };

  const handleSplitterPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSplitter) {
      setIsDraggingSplitter(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      localStorage.setItem('pkm_editor_preview_split_ratio', String(splitRatio));
    }
  };

  const handleResetSplitRatio = () => {
    setSplitRatio(50);
    localStorage.setItem('pkm_editor_preview_split_ratio', '50');
  };

  const handleSetPresetSplitRatio = (preset: number) => {
    setSplitRatio(preset);
    localStorage.setItem('pkm_editor_preview_split_ratio', String(preset));
  };

  const handleSplitterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSplitRatio((prev) => {
        const next = Math.max(15, Math.round(prev - 2));
        localStorage.setItem('pkm_editor_preview_split_ratio', String(next));
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSplitRatio((prev) => {
        const next = Math.min(85, Math.round(prev + 2));
        localStorage.setItem('pkm_editor_preview_split_ratio', String(next));
        return next;
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleSetPresetSplitRatio(20);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleSetPresetSplitRatio(80);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleResetSplitRatio();
    }
  };

  const [isCodeMenuOpen, setIsCodeMenuOpen] = useState(false);
  const codeMenuRef = useRef<HTMLDivElement | null>(null);
  const codeCloseTimerRef = useRef<number | null>(null);

  const handleCodeMenuMouseEnter = () => {
    if (codeCloseTimerRef.current) {
      clearTimeout(codeCloseTimerRef.current);
      codeCloseTimerRef.current = null;
    }
    setIsCodeMenuOpen(true);
  };

  const handleCodeMenuMouseLeave = () => {
    if (codeCloseTimerRef.current) {
      clearTimeout(codeCloseTimerRef.current);
    }
    codeCloseTimerRef.current = window.setTimeout(() => {
      setIsCodeMenuOpen(false);
      codeCloseTimerRef.current = null;
    }, 180);
  };

  const closeCodeMenuImmediately = () => {
    if (codeCloseTimerRef.current) {
      clearTimeout(codeCloseTimerRef.current);
      codeCloseTimerRef.current = null;
    }
    setIsCodeMenuOpen(false);
  };

  // Close code menu on outside click or Escape
  useEffect(() => {
    if (!isCodeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (codeMenuRef.current && !codeMenuRef.current.contains(e.target as Node)) {
        closeCodeMenuImmediately();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCodeMenuImmediately();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCodeMenuOpen]);

  // Autocomplete state
  const [autoCompleteType, setAutoCompleteType] = useState<'wikilink' | 'tag' | null>(null);
  const [autoCompleteQuery, setAutoCompleteQuery] = useState('');
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState<{ top: number; left: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Code folding & document outline state
  const [globalFoldAction, setGlobalFoldAction] = useState<'fold-all' | 'expand-all' | null>(null);
  const [globalFoldVersion, setGlobalFoldVersion] = useState<number>(0);
  const [isCodeOutlineOpen, setIsCodeOutlineOpen] = useState(false);
  const codeOutlineMenuRef = useRef<HTMLDivElement | null>(null);

  // Sync external fold triggers from CommandPalette or Parent
  const prevFoldAllRef = useRef(foldAllTriggerCount || 0);
  useEffect(() => {
    if (foldAllTriggerCount && foldAllTriggerCount !== prevFoldAllRef.current) {
      prevFoldAllRef.current = foldAllTriggerCount;
      setGlobalFoldAction('fold-all');
      setGlobalFoldVersion((v) => v + 1);
    }
  }, [foldAllTriggerCount]);

  const prevExpandAllRef = useRef(expandAllTriggerCount || 0);
  useEffect(() => {
    if (expandAllTriggerCount && expandAllTriggerCount !== prevExpandAllRef.current) {
      prevExpandAllRef.current = expandAllTriggerCount;
      setGlobalFoldAction('expand-all');
      setGlobalFoldVersion((v) => v + 1);
    }
  }, [expandAllTriggerCount]);

  // Close code outline menu on outside click or Escape
  useEffect(() => {
    if (!isCodeOutlineOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (codeOutlineMenuRef.current && !codeOutlineMenuRef.current.contains(e.target as Node)) {
        setIsCodeOutlineOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCodeOutlineOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCodeOutlineOpen]);

  // Parse all code blocks in current note for outline & navigation
  const noteCodeBlocks = useMemo(() => {
    const rawLines = content.split('\n');
    const list: Array<{
      id: string;
      language: string;
      startLine: number;
      lineCount: number;
      preview: string;
    }> = [];
    let inBlock = false;
    let blockStart = 0;
    let blockLang = '';
    let blockLines: string[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      if (!inBlock && trimmed.startsWith('```')) {
        inBlock = true;
        blockStart = i + 1;
        blockLang = trimmed.slice(3).trim() || 'code';
        blockLines = [];
      } else if (inBlock && trimmed.startsWith('```')) {
        inBlock = false;
        let preview = '';
        for (const bl of blockLines) {
          const bt = bl.trim();
          if (bt) {
            preview = bt;
            break;
          }
        }
        list.push({
          id: `code-${blockStart - 1}`,
          language: blockLang.replace(/\b(fold|folded|collapse|collapsed)\b/gi, '').trim() || 'code',
          startLine: blockStart,
          lineCount: blockLines.length,
          preview: preview || blockLang,
        });
      } else if (inBlock) {
        blockLines.push(line);
      }
    }
    return list;
  }, [content]);

  const handleFoldAllCode = useCallback(() => {
    setGlobalFoldAction('fold-all');
    setGlobalFoldVersion((v) => v + 1);
  }, []);

  const handleExpandAllCode = useCallback(() => {
    setGlobalFoldAction('expand-all');
    setGlobalFoldVersion((v) => v + 1);
  }, []);

  const handleJumpToCodeBlock = useCallback(
    (item: { id: string; startLine: number }) => {
      setIsCodeOutlineOpen(false);

      // In source editor, position cursor and scroll to line
      if (textareaRef.current && (editorMode === 'edit' || editorMode === 'split')) {
        const lines = content.split('\n');
        let charPos = 0;
        for (let i = 0; i < item.startLine - 1 && i < lines.length; i++) {
          charPos += lines[i].length + 1;
        }
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charPos, charPos);
        const approxLineHeight = 22;
        textareaRef.current.scrollTop = Math.max(0, (item.startLine - 4) * approxLineHeight);
      }

      // In preview, smoothly scroll to the rendered code block and highlight it
      setTimeout(() => {
        const el = document.getElementById(item.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('code-jump-highlight');
          setTimeout(() => {
            el.classList.remove('code-jump-highlight');
          }, 1800);
        }
      }, 60);
    },
    [content, editorMode]
  );

  // Global keyboard shortcuts: Alt+[ to fold all, Alt+] to expand all
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === '[' || e.code === 'BracketLeft')) {
        e.preventDefault();
        handleFoldAllCode();
      } else if (e.altKey && (e.key === ']' || e.code === 'BracketRight')) {
        e.preventDefault();
        handleExpandAllCode();
      } else if (e.altKey && (e.key.toLowerCase() === 't' || e.code === 'KeyT')) {
        e.preventDefault();
        saveCurrentSelection();
        setIsTableModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleFoldAllCode, handleExpandAllCode, saveCurrentSelection]);

  // Undo & Redo History management
  const historyRef = useRef<string[]>([note.content]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  const updateUndoRedoAvailability = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Sync internal state and reset history when active note changes
  useEffect(() => {
    setContent(note.content);
    setTitle(note.title);
    historyRef.current = [note.content];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [note.id]);

  // Push new state into history stack
  const recordHistorySnapshot = useCallback(
    (newText: string, immediate: boolean = false) => {
      const currentRecorded = historyRef.current[historyIndexRef.current];
      if (newText === currentRecorded) return;

      const performPush = () => {
        // Truncate forward redo history
        const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
        if (truncated.length >= 80) {
          truncated.shift();
        }
        truncated.push(newText);
        historyRef.current = truncated;
        historyIndexRef.current = truncated.length - 1;
        updateUndoRedoAvailability();
      };

      if (immediate) {
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        performPush();
      } else {
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = window.setTimeout(() => {
          performPush();
          typingTimerRef.current = null;
        }, 400);
      }
    },
    [updateUndoRedoAvailability]
  );

  // Autocomplete trigger check
  const checkAutoCompleteTrigger = (text: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);

    // Check for `[[`
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');
    if (lastDoubleBracket !== -1 && lastDoubleBracket > textBeforeCursor.lastIndexOf(']]')) {
      const query = textBeforeCursor.slice(lastDoubleBracket + 2);
      if (!query.includes('\n')) {
        setAutoCompleteType('wikilink');
        setAutoCompleteQuery(query);
        setAutoCompleteIndex(0);
        return;
      }
    }

    // Check for `#`
    const lastHash = textBeforeCursor.lastIndexOf('#');
    if (
      lastHash !== -1 &&
      (lastHash === 0 || /\s/.test(textBeforeCursor[lastHash - 1]))
    ) {
      const query = textBeforeCursor.slice(lastHash + 1);
      if (!query.includes('\n') && !query.includes(' ')) {
        setAutoCompleteType('tag');
        setAutoCompleteQuery(query);
        setAutoCompleteIndex(0);
        return;
      }
    }

    setAutoCompleteType(null);
  };

  // Handle content typing
  const handleContentChange = useCallback(
    (newText: string, recordHistory: boolean = true, immediateHistory: boolean = false) => {
      setContent(newText);
      const parsed = parseMfContent(newText);
      onUpdateNote({
        ...note,
        content: newText,
        tags: parsed.tags.length > 0 ? parsed.tags : note.tags,
        icon: parsed.icon !== undefined ? parsed.icon : note.icon,
        iconColor: parsed.iconColor !== undefined ? parsed.iconColor : note.iconColor,
        bannerColor: parsed.bannerColor !== undefined ? parsed.bannerColor : note.bannerColor,
        bannerHeight: parsed.bannerHeight !== undefined ? parsed.bannerHeight : note.bannerHeight,
        bannerIcon: parsed.bannerIcon !== undefined ? parsed.bannerIcon : note.bannerIcon,
        updatedAt: Date.now(),
      });

      if (recordHistory) {
        recordHistorySnapshot(newText, immediateHistory);
      }

      // Check for autocomplete triggers [[ or #
      checkAutoCompleteTrigger(newText);
    },
    [note, onUpdateNote, recordHistorySnapshot]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    // Commit any pending debounce typing first
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      const currentRecorded = historyRef.current[historyIndexRef.current];
      if (content !== currentRecorded) {
        const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
        truncated.push(content);
        historyRef.current = truncated;
        historyIndexRef.current = truncated.length - 1;
      }
    }

    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetContent = historyRef.current[historyIndexRef.current];
      setContent(targetContent);

      const parsed = parseMfContent(targetContent);
      onUpdateNote({
        ...note,
        content: targetContent,
        tags: parsed.tags.length > 0 ? parsed.tags : note.tags,
        icon: parsed.icon !== undefined ? parsed.icon : note.icon,
        iconColor: parsed.iconColor !== undefined ? parsed.iconColor : note.iconColor,
        updatedAt: Date.now(),
      });

      updateUndoRedoAvailability();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [content, note, onUpdateNote, updateUndoRedoAvailability]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetContent = historyRef.current[historyIndexRef.current];
      setContent(targetContent);

      const parsed = parseMfContent(targetContent);
      onUpdateNote({
        ...note,
        content: targetContent,
        tags: parsed.tags.length > 0 ? parsed.tags : note.tags,
        icon: parsed.icon !== undefined ? parsed.icon : note.icon,
        iconColor: parsed.iconColor !== undefined ? parsed.iconColor : note.iconColor,
        updatedAt: Date.now(),
      });

      updateUndoRedoAvailability();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [note, onUpdateNote, updateUndoRedoAvailability]);

  // Global Undo / Redo keyboard listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.getAttribute('contenteditable') === 'true')) {
        return;
      }
      if (target !== textareaRef.current) {
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (
          ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
          ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'y')
        ) {
          e.preventDefault();
          handleRedo();
        }
      }

      // In-note Find & Replace shortcut Cmd+F / Ctrl+F
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  // Keep all tags across the vault for auto-completion
  const allVaultTags = React.useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach((n) => n.tags.forEach((t) => tags.add(t.toLowerCase())));
    return Array.from(tags);
  }, [allNotes]);

  // Handle title edit
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const cleanFileName = `${newTitle.trim() || 'Untitled'}.md`;
    const updated = {
      ...note,
      title: newTitle,
      name: cleanFileName,
      content: formatMfContent(newTitle, note.tags, parseMfContent(content).content, note.icon, note.iconColor),
      updatedAt: Date.now(),
    };
    setContent(updated.content);
    onUpdateNote(updated);
  };

  // Handle folder change
  const handleFolderChange = (folderId: string) => {
    const targetFolderId = folderId === 'root' ? null : folderId;
    onUpdateNote({
      ...note,
      folderId: targetFolderId,
      updatedAt: Date.now(),
    });
  };


  // Insert transcribed speech text into active note content at cursor position
  const handleInsertSpeech = useCallback((speechText: string) => {
    if (!speechText) return;
    const textarea = textareaRef.current;

    setContent((prevContent) => {
      let newContent = prevContent;
      let newCursorPos = prevContent.length;

      if (textarea && document.activeElement === textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const needsLeadingSpace =
          start > 0 &&
          !/\s/.test(prevContent[start - 1]) &&
          !/^[.,!?:;)\]\n]/.test(speechText);

        const textToInsert = (needsLeadingSpace ? ' ' : '') + speechText;
        newContent = prevContent.slice(0, start) + textToInsert + prevContent.slice(end);
        newCursorPos = start + textToInsert.length;

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
          }
        }, 0);
      } else {
        const needsLeadingSpace =
          prevContent.length > 0 &&
          !/\s$/.test(prevContent) &&
          !/^[.,!?:;)\]\n]/.test(speechText);
        const textToInsert = (needsLeadingSpace ? ' ' : '') + speechText;
        newContent = prevContent + textToInsert;
        newCursorPos = newContent.length;

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
          }
        }, 0);
      }

      handleContentChange(newContent, true, true);
      return newContent;
    });
  }, [note, content, handleContentChange]);

  // Voice speech-to-text recognition
  const speech = useSpeechRecognition({
    onFinalResult: (finalText) => {
      handleInsertSpeech(finalText);
    },
  });

  // Notify parent component of speech listening status
  useEffect(() => {
    onVoiceListeningChange?.(speech.isListening);
  }, [speech.isListening, onVoiceListeningChange]);

  // Voice Text-to-Speech Reader
  const [isVoiceReaderBarOpen, setIsVoiceReaderBarOpen] = useState(false);
  const voiceReader = useVoiceReader({
    onFinish: () => {
      // Completed reading all sentences
    },
  });

  // Notify parent component of voice reading status
  useEffect(() => {
    onVoiceReadingChange?.(voiceReader.isPlaying && !voiceReader.isPaused);
  }, [voiceReader.isPlaying, voiceReader.isPaused, onVoiceReadingChange]);

  // Stop voice reader and close bar when note changes
  useEffect(() => {
    voiceReader.stop();
    setIsVoiceReaderBarOpen(false);
  }, [note.id]);

  // Toggle voice reader playback
  const handleToggleVoiceReader = useCallback(
    (onlySelection: boolean = false) => {
      if (voiceReader.isPlaying) {
        if (voiceReader.isPaused) {
          voiceReader.resume();
        } else {
          voiceReader.pause();
        }
        return;
      }

      setIsVoiceReaderBarOpen(true);

      let textToRead = content;
      let isSelection = false;

      if (textareaRef.current) {
        const selStart = textareaRef.current.selectionStart;
        const selEnd = textareaRef.current.selectionEnd;
        if (selEnd > selStart) {
          const selected = content.slice(selStart, selEnd).trim();
          if (selected.length > 0) {
            textToRead = selected;
            isSelection = true;
          }
        }
      }

      if (!isSelection && onlySelection && typeof window !== 'undefined') {
        const winSel = window.getSelection()?.toString().trim();
        if (winSel) {
          textToRead = winSel;
          isSelection = true;
        }
      }

      voiceReader.play({
        text: textToRead,
        title: note.title,
        isSelection,
      });
    },
    [content, note.title, voiceReader]
  );

  // Respond to voice reader trigger from parent
  const prevVoiceReaderTriggerRef = useRef(voiceReaderTriggerCount || 0);
  useEffect(() => {
    if (voiceReaderTriggerCount && voiceReaderTriggerCount !== prevVoiceReaderTriggerRef.current) {
      prevVoiceReaderTriggerRef.current = voiceReaderTriggerCount;
      handleToggleVoiceReader(false);
    }
  }, [voiceReaderTriggerCount, handleToggleVoiceReader]);

  // Respond to dictate trigger from parent (CommandPalette / TopNav / Global shortcut)
  const prevTriggerRef = useRef(dictateTriggerCount || 0);
  useEffect(() => {
    if (dictateTriggerCount && dictateTriggerCount !== prevTriggerRef.current) {
      prevTriggerRef.current = dictateTriggerCount;
      speech.toggleListening();
    }
  }, [dictateTriggerCount, speech]);

  // Respond to image insertion trigger from parent (CommandPalette / Global shortcut)
  const prevImageTriggerRef = useRef(insertImageTriggerCount || 0);
  useEffect(() => {
    if (insertImageTriggerCount && insertImageTriggerCount !== prevImageTriggerRef.current) {
      prevImageTriggerRef.current = insertImageTriggerCount;
      setIsImageModalOpen(true);
    }
  }, [insertImageTriggerCount]);

  // Insert image markdown at cursor or append
  const handleInsertImageSyntax = useCallback((syntax: string) => {
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;

    let start = content.length;
    let end = content.length;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart ?? content.length;
      end = textareaRef.current.selectionEnd ?? content.length;
    }

    if (start < bodyStartIndex) {
      start = bodyStartIndex;
      end = bodyStartIndex;
    }

    const needsNewline = start > 0 && content[start - 1] !== '\n';
    const toInsert = (needsNewline ? '\n' : '') + syntax + '\n';
    const newContent = content.slice(0, start) + toInsert + content.slice(end);
    const newCursorPos = start + toInsert.length;

    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Insert multi or single selection syntax at cursor
  const handleInsertSelectionSyntax = useCallback((syntax: string) => {
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;

    let start = content.length;
    let end = content.length;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart ?? content.length;
      end = textareaRef.current.selectionEnd ?? content.length;
    }

    if (start < bodyStartIndex) {
      start = bodyStartIndex;
      end = bodyStartIndex;
    }

    const needsNewline = start > 0 && content[start - 1] !== '\n';
    const toInsert = (needsNewline ? '\n\n' : '\n') + syntax + '\n\n';
    const newContent = content.slice(0, start) + toInsert + content.slice(end);
    const newCursorPos = start + toInsert.length;

    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Insert date syntax at cursor
  const handleInsertDateSyntax = useCallback((syntax: string) => {
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;

    let start = content.length;
    let end = content.length;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart ?? content.length;
      end = textareaRef.current.selectionEnd ?? content.length;
    }

    if (start < bodyStartIndex) {
      start = bodyStartIndex;
      end = bodyStartIndex;
    }

    const toInsert = ` ${syntax} `;
    const newContent = content.slice(0, start) + toInsert + content.slice(end);
    const newCursorPos = start + toInsert.length;

    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Insert in-note banner syntax at cursor
  const handleInsertBannerSyntax = useCallback((syntax: string) => {
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;

    let start = content.length;
    let end = content.length;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart ?? content.length;
      end = textareaRef.current.selectionEnd ?? content.length;
    }

    // Never insert before or within the YAML frontmatter
    if (start < bodyStartIndex) {
      start = bodyStartIndex;
      end = bodyStartIndex;
    }

    // Ensure clean line breaks around the banner block
    const needsLeadingNewline = start > 0 && content[start - 1] !== '\n';
    const needsTrailingNewline = end < content.length && content[end] !== '\n';
    const toInsert = (needsLeadingNewline ? '\n\n' : '\n') + syntax + (needsTrailingNewline ? '\n\n' : '\n');

    const newContent = content.slice(0, start) + toInsert + content.slice(end);
    const newCursorPos = start + toInsert.length;

    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Insert markdown table syntax at cursor
  const handleInsertTableSyntax = useCallback((syntax: string) => {
    const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;

    let start = content.length;
    let end = content.length;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart ?? content.length;
      end = textareaRef.current.selectionEnd ?? content.length;
    }

    if (start < bodyStartIndex) {
      start = bodyStartIndex;
      end = bodyStartIndex;
    }

    const needsLeadingNewline = start > 0 && content[start - 1] !== '\n';
    const needsTrailingNewline = end < content.length && content[end] !== '\n';
    const toInsert = (needsLeadingNewline ? '\n\n' : '\n') + syntax + (needsTrailingNewline ? '\n\n' : '\n');

    const newContent = content.slice(0, start) + toInsert + content.slice(end);
    const newCursorPos = start + toInsert.length;

    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Set note top hero banner
  const handleSetNoteBanner = useCallback((color: string, icon: string, height: 'sm' | 'md' | 'lg' = 'md') => {
    const parsed = parseMfContent(content);
    const updatedContent = formatMfContent(
      note.title,
      note.tags,
      parsed.content,
      note.icon,
      note.iconColor,
      color,
      height,
      icon
    );
    setContent(updatedContent);
    onUpdateNote({
      ...note,
      bannerColor: color,
      bannerIcon: icon,
      bannerHeight: height,
      content: updatedContent,
      updatedAt: Date.now(),
    });
  }, [content, note, onUpdateNote]);

  // Remove note top banner
  const handleRemoveNoteBanner = useCallback(() => {
    const parsed = parseMfContent(content);
    const updatedContent = formatMfContent(
      note.title,
      note.tags,
      parsed.content,
      note.icon,
      note.iconColor
    );
    setContent(updatedContent);
    onUpdateNote({
      ...note,
      bannerColor: undefined,
      bannerIcon: undefined,
      bannerHeight: undefined,
      content: updatedContent,
      updatedAt: Date.now(),
    });
  }, [content, note, onUpdateNote]);

  // Toggle banner height (sm -> md -> lg -> sm)
  const handleToggleBannerHeight = useCallback(() => {
    const current = note.bannerHeight || 'md';
    const next: 'sm' | 'md' | 'lg' = current === 'sm' ? 'md' : current === 'md' ? 'lg' : 'sm';
    handleSetNoteBanner(note.bannerColor || 'violet', note.bannerIcon || 'sparkles', next);
  }, [note.bannerColor, note.bannerIcon, note.bannerHeight, handleSetNoteBanner]);

  // Trigger effect for external palettes / shortcuts
  useEffect(() => {
    if (insertSelectionTriggerCount && insertSelectionTriggerCount > 0) {
      setSelectionModalType('multi');
      setIsSelectionModalOpen(true);
    }
  }, [insertSelectionTriggerCount]);

  useEffect(() => {
    if (insertDateTriggerCount && insertDateTriggerCount > 0) {
      setIsDateModalOpen(true);
    }
  }, [insertDateTriggerCount]);

  useEffect(() => {
    if (insertBannerTriggerCount && insertBannerTriggerCount > 0) {
      setBannerModalInitialTab('in-note');
      setBannerModalInitialContent('');
      setIsBannerModalOpen(true);
    }
  }, [insertBannerTriggerCount]);

  useEffect(() => {
    if (insertTableTriggerCount && insertTableTriggerCount > 0) {
      saveCurrentSelection();
      setIsTableModalOpen(true);
    }
  }, [insertTableTriggerCount, saveCurrentSelection]);

  // Extract all images in note for the AttachedImagesBar and user-friendly previews
  const noteImages = React.useMemo(() => {
    return extractNoteImages(content);
  }, [content]);

  const [isCleaningImages, setIsCleaningImages] = useState(false);

  // Convert raw base64 data URLs in note to clean attachment: references
  const handleCleanDataUrls = useCallback(async () => {
    setIsCleaningImages(true);
    try {
      const { updatedContent, convertedCount } = await migrateNoteImagesToAttachments(content);
      if (convertedCount > 0) {
        setContent(updatedContent);
        handleContentChange(updatedContent, true, true);
      }
    } catch (err) {
      console.error('Failed to clean up note images:', err);
    } finally {
      setIsCleaningImages(false);
    }
  }, [content, handleContentChange]);

  // Jump to and highlight image syntax in the editor
  const handleSelectImageInEditor = useCallback((img: NoteImageInfo) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.focus();
    const idx = content.indexOf(img.fullMatch);
    if (idx !== -1) {
      textarea.setSelectionRange(idx, idx + img.fullMatch.length);
      const linesBefore = content.slice(0, idx).split('\n').length;
      textarea.scrollTop = Math.max(0, (linesBefore - 3) * 20);
    }
  }, [content]);

  // Cleanly remove an image markdown statement from editor
  const handleRemoveImageFromEditor = useCallback((img: NoteImageInfo) => {
    const idx = content.indexOf(img.fullMatch);
    if (idx !== -1) {
      const newContent = content.slice(0, idx) + content.slice(idx + img.fullMatch.length);
      setContent(newContent);
      handleContentChange(newContent, true, true);
    }
  }, [content, handleContentChange]);

  // Text Color Handlers
  const handleOpenTextColorPicker = useCallback(() => {
    saveCurrentSelection();
    let selected = '';
    if (textareaRef.current) {
      const s = textareaRef.current.selectionStart ?? 0;
      const e = textareaRef.current.selectionEnd ?? 0;
      if (e > s) {
        selected = content.slice(s, e);
      }
    }
    setSelectedTextForColor(selected);
    setIsTextColorPickerOpen((prev) => !prev);
  }, [saveCurrentSelection, content]);

  const handleApplyTextColor = useCallback(
    (color: string, mode: 'color' | 'highlight') => {
      setActiveTextColor(color);
      localStorage.setItem('mf_last_text_color', color);

      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      let start = textarea.selectionStart;
      let end = textarea.selectionEnd;

      if (savedSelectionRef.current) {
        start = savedSelectionRef.current.start;
        end = savedSelectionRef.current.end;
        savedSelectionRef.current = null;
      }

      const selected = content.slice(start, end) || 'colored text';

      let replacement = '';
      // Check if selected is already wrapped in a color span: e.g. <span style="...">text</span> or ## <span style="...">text</span>
      const existingSpanMatch = selected.match(/^(\s*#{0,6}\s*)<span\s+style=["'][^"']*["']>([\s\S]*?)<\/span>\s*$/i);
      // Check if selected has a span wrapping a heading: e.g. <span style="...">## text</span>
      const wrappedHeadingSpanMatch = selected.match(/^(\s*)<span\s+style=["'][^"']*["']\s*>\s*(#{1,6}\s+)([\s\S]*?)<\/span>\s*$/i);

      if (wrappedHeadingSpanMatch) {
        const hashes = wrappedHeadingSpanMatch[2];
        const innerText = wrappedHeadingSpanMatch[3];
        if (mode === 'color') {
          replacement = `${hashes}<span style="color: ${color}">${innerText}</span>`;
        } else {
          replacement = `${hashes}<span style="background-color: ${color}33; color: ${color}; border: 1px solid ${color}55; border-radius: 4px; padding: 1px 6px;">${innerText}</span>`;
        }
      } else if (existingSpanMatch) {
        const prefix = existingSpanMatch[1];
        const inner = existingSpanMatch[2];
        if (mode === 'color') {
          replacement = `${prefix}<span style="color: ${color}">${inner}</span>`;
        } else {
          replacement = `${prefix}<span style="background-color: ${color}33; color: ${color}; border: 1px solid ${color}55; border-radius: 4px; padding: 1px 6px;">${inner}</span>`;
        }
      } else {
        // Check if selected starts with heading syntax: e.g. "## Heading" or "# Title"
        const headingMatch = selected.match(/^(\s*#{1,6}\s+)([\s\S]*?)(\r?\n)?$/);
        if (headingMatch) {
          const hashes = headingMatch[1];
          const headingText = headingMatch[2];
          const trailingNewline = headingMatch[3] || '';
          if (mode === 'color') {
            replacement = `${hashes}<span style="color: ${color}">${headingText}</span>${trailingNewline}`;
          } else {
            replacement = `${hashes}<span style="background-color: ${color}33; color: ${color}; border: 1px solid ${color}55; border-radius: 4px; padding: 1px 6px;">${headingText}</span>${trailingNewline}`;
          }
        } else if (mode === 'color') {
          replacement = `<span style="color: ${color}">${selected}</span>`;
        } else {
          replacement = `<span style="background-color: ${color}33; color: ${color}; border: 1px solid ${color}55; border-radius: 4px; padding: 1px 6px;">${selected}</span>`;
        }
      }

      const newContent = content.slice(0, start) + replacement + content.slice(end);
      setContent(newContent);
      handleContentChange(newContent, true, true);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start + replacement.length);
        }
      }, 10);
    },
    [content, handleContentChange]
  );

  const handleClearTextColor = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;

    if (savedSelectionRef.current) {
      start = savedSelectionRef.current.start;
      end = savedSelectionRef.current.end;
      savedSelectionRef.current = null;
    }

    if (start === end) return;
    const selected = content.slice(start, end);
    const stripped = selected
      .replace(/<span\s+style=["'][^"']*["']>([\s\S]*?)<\/span>/gi, '$1')
      .replace(/<font\s+color=["'][^"']*["']>([\s\S]*?)<\/font>/gi, '$1')
      .replace(/<mark(?:\s+style=["'][^"']*["'])?>([\s\S]*?)<\/mark>/gi, '$1')
      .replace(/\[color:[^:]+:([^\]]+)\]/g, '$1')
      .replace(/==([^=]+)==/g, '$1')
      .replace(/\s*\{:?\s*(?:style=["'])?color:[^}]+\}/gi, '')
      .replace(/\s*\[color:[a-zA-Z0-9#\(\),.\s%_-]+\]/gi, '');

    const newContent = content.slice(0, start) + stripped + content.slice(end);
    setContent(newContent);
    handleContentChange(newContent, true, true);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + stripped.length);
      }
    }, 10);
  }, [content, handleContentChange]);

  // Respond to text color trigger from parent (CommandPalette / Shortcuts)
  const prevTextColorTriggerRef = useRef(textColorTriggerCount || 0);
  useEffect(() => {
    if (textColorTriggerCount && textColorTriggerCount !== prevTextColorTriggerRef.current) {
      prevTextColorTriggerRef.current = textColorTriggerCount;
      handleOpenTextColorPicker();
    }
  }, [textColorTriggerCount, handleOpenTextColorPicker]);

  // Handle direct clipboard paste of image files (saves to vault attachments instead of huge base64 text)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const timestamp = new Date()
              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              .replace(/:/g, '-');
            const caption = `Pasted image ${timestamp}`;
            try {
              const { uri } = await saveAttachment(file, caption);
              handleInsertImageSyntax(`\n![${caption}](${uri})\n`);
            } catch (err) {
              console.error('Failed to save pasted image attachment:', err);
            }
            return;
          }
        }
      }
    }
  };

  // Handle drag-and-drop of image files onto editor (saves to vault attachments instead of huge base64 text)
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          try {
            const { uri } = await saveAttachment(file, cleanName);
            handleInsertImageSyntax(`\n![${cleanName}](${uri})\n`);
          } catch (err) {
            console.error('Failed to save dropped image attachment:', err);
          }
          return;
        }
      }
    }
  };

  // Canvas boards for linking & autocomplete
  const canvasBoards = React.useMemo(() => {
    return loadCanvasBoards(allNotes);
  }, [allNotes]);

  interface WikiSuggestionItem {
    id: string;
    title: string;
    insertValue: string;
    isCanvas: boolean;
    subtitle?: string;
  }

  // Autocomplete options
  const matchingWikiItems = React.useMemo((): WikiSuggestionItem[] => {
    if (autoCompleteType !== 'wikilink') return [];
    let q = autoCompleteQuery.toLowerCase();
    const isExplicitCanvas = q.startsWith('canvas:');
    if (isExplicitCanvas) {
      q = q.slice(7).trim();
    }

    const matchedCanvases: WikiSuggestionItem[] = canvasBoards
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({
        id: `canvas-${b.id}`,
        title: b.name,
        insertValue: `canvas:${b.name}`,
        isCanvas: true,
        subtitle: `${b.nodes.length} cards`,
      }));

    if (isExplicitCanvas) {
      return matchedCanvases;
    }

    const matchedNotes: WikiSuggestionItem[] = allNotes
      .filter((n) => n.id !== note.id && n.title.toLowerCase().includes(q))
      .slice(0, 7)
      .map((n) => ({
        id: n.id,
        title: n.title,
        insertValue: n.title,
        isCanvas: false,
        subtitle: n.tags.length > 0 ? `#${n.tags[0]}` : undefined,
      }));

    return [...matchedCanvases, ...matchedNotes].slice(0, 8);
  }, [autoCompleteType, autoCompleteQuery, allNotes, canvasBoards, note.id]);

  const matchingTags = React.useMemo(() => {
    if (autoCompleteType !== 'tag') return [];
    const q = autoCompleteQuery.toLowerCase();
    return allVaultTags.filter((t) => t.includes(q)).slice(0, 7);
  }, [autoCompleteType, autoCompleteQuery, allVaultTags]);

  const insertCompletion = (textToInsert: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const text = content;

    if (autoCompleteType === 'wikilink') {
      const textBeforeCursor = text.slice(0, cursor);
      const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');
      const replacement = `[[${textToInsert}]]`;
      const newContent =
        text.slice(0, lastDoubleBracket) + replacement + text.slice(cursor);
      setContent(newContent);
      handleContentChange(newContent, true, true);
    } else if (autoCompleteType === 'tag') {
      const textBeforeCursor = text.slice(0, cursor);
      const lastHash = textBeforeCursor.lastIndexOf('#');
      const replacement = `#${textToInsert} `;
      const newContent = text.slice(0, lastHash) + replacement + text.slice(cursor);
      setContent(newContent);
      handleContentChange(newContent, true, true);
    }

    setAutoCompleteType(null);
    textareaRef.current.focus();
  };

  // Insert canvas syntax at cursor
  const handleInsertCanvasSyntax = useCallback(
    (syntax: string) => {
      if (!syntax) return;
      let start = content.length;
      let end = content.length;

      if (savedSelectionRef.current) {
        start = savedSelectionRef.current.start;
        end = savedSelectionRef.current.end;
        savedSelectionRef.current = null;
      } else if (textareaRef.current) {
        start = textareaRef.current.selectionStart ?? content.length;
        end = textareaRef.current.selectionEnd ?? content.length;
      }

      const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
      const bodyStartIndex = frontmatterMatch ? frontmatterMatch[0].length : 0;
      if (start < bodyStartIndex) {
        start = bodyStartIndex;
        end = bodyStartIndex;
      }

      const needsLeadingSpace = start > 0 && !/\s/.test(content[start - 1]);
      const needsTrailingSpace = end < content.length && !/\s/.test(content[end]);
      const toInsert = (needsLeadingSpace ? ' ' : '') + syntax + (needsTrailingSpace ? ' ' : '');

      const newContent = content.slice(0, start) + toInsert + content.slice(end);
      const newCursorPos = start + toInsert.length;

      setContent(newContent);
      handleContentChange(newContent, true, true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    },
    [content, handleContentChange]
  );

  // Keyboard navigation for autocomplete & smart Tab indentation & Voice Dictation & Undo/Redo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Undo shortcut (Cmd+Z or Ctrl+Z)
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Redo shortcut (Cmd+Shift+Z or Ctrl+Shift+Z or Cmd+Y / Ctrl+Y)
    if (
      ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
      ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Insert Canvas Link shortcut (Alt+K)
    if (e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      saveCurrentSelection();
      setIsCanvasModalOpen(true);
      return;
    }

    // Voice dictation shortcut Cmd+Shift+V
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      speech.toggleListening();
      return;
    }

    // In-note Find & Replace shortcut Cmd+F / Ctrl+F
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setIsFindReplaceOpen(true);
      return;
    }

    // Text Color & Highlight shortcut (Alt+C or Cmd+Shift+H)
    if (
      (e.altKey && e.key.toLowerCase() === 'c') ||
      ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'h')
    ) {
      e.preventDefault();
      handleOpenTextColorPicker();
      return;
    }

    // Code folding shortcuts: Alt+[ or Alt+]
    if (e.altKey && (e.key === '[' || e.code === 'BracketLeft')) {
      e.preventDefault();
      handleFoldAllCode();
      return;
    }
    if (e.altKey && (e.key === ']' || e.code === 'BracketRight')) {
      e.preventDefault();
      handleExpandAllCode();
      return;
    }

    // Escape stops voice dictation if active
    if (e.key === 'Escape' && speech.isListening) {
      e.preventDefault();
      speech.stopListening();
      return;
    }

    if (!autoCompleteType) {
      // Smart Tab indentation for code editing
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = textareaRef.current;
        if (!target) return;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const val = content;

        if (!e.shiftKey) {
          const newText = val.substring(0, start) + '  ' + val.substring(end);
          setContent(newText);
          handleContentChange(newText);
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            }
          }, 0);
        } else {
          const before = val.substring(0, start);
          if (before.endsWith('  ')) {
            const newText = val.substring(0, start - 2) + val.substring(start);
            setContent(newText);
            handleContentChange(newText);
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = Math.max(0, start - 2);
              }
            }, 0);
          }
        }
      }
      return;
    }

    const listLength =
      autoCompleteType === 'wikilink' ? matchingWikiItems.length : matchingTags.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutoCompleteIndex((prev) => (prev + 1) % Math.max(1, listLength));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutoCompleteIndex((prev) => (prev - 1 + listLength) % Math.max(1, listLength));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (listLength > 0) {
        e.preventDefault();
        if (autoCompleteType === 'wikilink') {
          insertCompletion(matchingWikiItems[autoCompleteIndex].insertValue);
        } else {
          insertCompletion(matchingTags[autoCompleteIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setAutoCompleteType(null);
    }
  };

  // Detect code block languages currently present in this note
  const detectedLanguages = React.useMemo(() => {
    const regex = /```([a-zA-Z0-9_\-#+]+)/g;
    const langs = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) {
        langs.add(match[1].toLowerCase());
      }
    }
    return Array.from(langs);
  }, [content]);

  // Insert code block with starter snippet or wrapping selection
  const insertCodeBlock = (lang: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    let defaultSnippet = '';
    if (!selected) {
      switch (lang) {
        case 'html':
          defaultSnippet = '<div class="container">\n  <h1>Hello World</h1>\n</div>';
          break;
        case 'xml':
          defaultSnippet = '<?xml version="1.0" encoding="UTF-8"?>\n<note>\n  <to>User</to>\n  <message>Hello</message>\n</note>';
          break;
        case 'php':
          defaultSnippet = '<?php\nfunction greet($name) {\n    return "Hello, " . $name;\n}\necho greet("Developer");\n?>';
          break;
        case 'javascript':
        case 'js':
          defaultSnippet = 'function greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("World");';
          break;
        case 'python':
        case 'py':
          defaultSnippet = 'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))';
          break;
        case 'sql':
          defaultSnippet = 'SELECT id, username, email, created_at\nFROM users\nWHERE status = \'active\'\nORDER BY created_at DESC;';
          break;
        case 'typescript':
        case 'ts':
          defaultSnippet = 'interface User {\n  id: string;\n  name: string;\n}\n\nconst user: User = { id: "1", name: "Alice" };';
          break;
        case 'json':
          defaultSnippet = '{\n  "name": "project",\n  "version": "1.0.0",\n  "active": true\n}';
          break;
        case 'css':
          defaultSnippet = '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}';
          break;
        case 'bash':
        case 'sh':
          defaultSnippet = '#!/usr/bin/env bash\necho "Running script..."';
          break;
        default:
          defaultSnippet = '// Code snippet';
      }
    }

    const codeToWrap = selected || defaultSnippet;
    const prefix = `\n\`\`\`${lang}\n`;
    const suffix = '\n```\n';
    const replacement = `${prefix}${codeToWrap}${suffix}`;

    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);
    handleContentChange(newContent, true, true);
    closeCodeMenuImmediately();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + codeToWrap.length
      );
    }, 0);
  };

  // Tag management
  const handleAddTag = (tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase();
    if (!clean || note.tags.includes(clean)) return;
    const updatedTags = [...note.tags, clean];
    const parsed = parseMfContent(content);
    const updatedContent = formatMfContent(note.title, updatedTags, parsed.content, note.icon, note.iconColor);
    setContent(updatedContent);
    onUpdateNote({
      ...note,
      tags: updatedTags,
      content: updatedContent,
      updatedAt: Date.now(),
    });
    setNewTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter((t) => t !== tagToRemove);
    const parsed = parseMfContent(content);
    const updatedContent = formatMfContent(note.title, updatedTags, parsed.content, note.icon, note.iconColor);
    setContent(updatedContent);
    onUpdateNote({
      ...note,
      tags: updatedTags,
      content: updatedContent,
      updatedAt: Date.now(),
    });
  };

  const handleToggleTags = () => {
    setShowTags((prev) => {
      const next = !prev;
      localStorage.setItem('pkm_show_tags', String(next));
      if (next && note.tags.length === 0) {
        setShowTagInput(true);
      }
      return next;
    });
  };

  // Toggle markdown checklist item from preview
  const handleToggleCheckbox = (lineIndex: number, newChecked: boolean) => {
    const lines = content.split('\n');
    if (lines[lineIndex] !== undefined) {
      lines[lineIndex] = lines[lineIndex].replace(
        /^(\s*-\s*\[)[ xX](\])/,
        `$1${newChecked ? 'x' : ' '}$2`
      );
      const newText = lines.join('\n');
      setContent(newText);
      handleContentChange(newText, true, true);
    }
  };

  // Quick formatting toolbar insertion helper
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.slice(0, start) + replacement + content.slice(end);
    setContent(newContent);
    handleContentChange(newContent, true, true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Toggle or cycle heading on current line or selection (# -> ## -> ### -> normal)
  const handleToggleHeading = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the line start and line end
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const nextLineEnd = content.indexOf('\n', end);
    const lineEnd = nextLineEnd === -1 ? content.length : nextLineEnd;
    const lineText = content.slice(lineStart, lineEnd);

    // If line is wrapped in a colored span: <span style="...">## Heading</span>
    const wrappedHeadingMatch = lineText.match(/^(\s*)<span\s+style=["'](.*?)["']\s*>\s*(#{1,6})\s+([\s\S]*?)<\/span>\s*$/i);
    let newLineText = '';

    if (wrappedHeadingMatch) {
      const indent = wrappedHeadingMatch[1];
      const styleAttr = wrappedHeadingMatch[2];
      const hashes = wrappedHeadingMatch[3];
      const text = wrappedHeadingMatch[4];
      if (hashes === '###') {
        newLineText = `${indent}<span style="${styleAttr}">${text}</span>`;
      } else if (hashes === '##') {
        newLineText = `${indent}### <span style="${styleAttr}">${text}</span>`;
      } else if (hashes === '#') {
        newLineText = `${indent}## <span style="${styleAttr}">${text}</span>`;
      } else {
        newLineText = `${indent}## <span style="${styleAttr}">${text}</span>`;
      }
    } else if (lineText.startsWith('### ')) {
      newLineText = lineText.slice(4);
    } else if (lineText.startsWith('## ')) {
      newLineText = '### ' + lineText.slice(3);
    } else if (lineText.startsWith('# ')) {
      newLineText = '## ' + lineText.slice(2);
    } else {
      newLineText = '## ' + lineText;
    }

    const newContent = content.slice(0, lineStart) + newLineText + content.slice(lineEnd);
    setContent(newContent);
    handleContentChange(newContent, true, true);
    setTimeout(() => {
      textarea.focus();
      const diff = newLineText.length - lineText.length;
      textarea.setSelectionRange(Math.max(lineStart, start + diff), Math.max(lineStart, end + diff));
    }, 10);
  };

  // Compute current folder path segments for breadcrumb
  const currentFolderPath = React.useMemo(() => {
    if (!note.folderId) return ['Root'];
    const path: string[] = [];
    let curr = folders.find((item) => item.id === note.folderId);
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      path.unshift(curr.name);
      curr = curr.parentId ? folders.find((f) => f.id === curr.parentId) : undefined;
    }
    return path.length > 0 ? path : ['Root'];
  }, [note.folderId, folders]);

  const currentFolderName = currentFolderPath.join(' / ');

  // Compute reading statistics
  const readingStats = React.useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  // Simplified Preview Mode: Clean, distraction-free reading with zero sidebars and zero editing options
  if (isSimplifiedPreview) {
    return (
      <div className="flex flex-col h-full bg-[#0c0714] overflow-hidden relative font-['Space_Grotesk',sans-serif] text-[#faf5ff]">
        {/* Minimal reading header */}
        <header className="px-6 sm:px-10 py-3 border-b border-[#2e1c52]/60 flex items-center justify-between bg-[#150d24]/90 backdrop-blur-md shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-[#c084fc] min-w-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#ec4899]/15 border-[#ec4899]/40 text-[#faf5ff] text-[11px] font-semibold shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Reading View</span>
            </div>
            <span className="text-[#2e1c52] shrink-0">•</span>
            <span className="font-['Space_Mono',monospace] text-[11px] text-[#c084fc]/70 truncate shrink-0">
              {currentFolderName}
            </span>
            <span className="text-[#2e1c52] hidden sm:inline shrink-0">•</span>
            <span className="text-[11px] text-[#c084fc]/70 hidden sm:inline shrink-0 font-['Space_Mono',monospace]">
              {readingStats.words} words · {readingStats.minutes} min read
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {noteCodeBlocks.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  id="btn-simplified-fold-all-code"
                  type="button"
                  onClick={handleFoldAllCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] text-xs font-mono cursor-pointer transition-all active:scale-95"
                  title="Fold All Code Blocks in Document (Alt+[)"
                >
                  <FoldVertical className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Fold Code ({noteCodeBlocks.length})</span>
                </button>
                <button
                  id="btn-simplified-expand-all-code"
                  type="button"
                  onClick={handleExpandAllCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] text-xs font-mono cursor-pointer transition-all active:scale-95"
                  title="Expand All Code Blocks in Document (Alt+])"
                >
                  <UnfoldVertical className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Expand Code</span>
                </button>
              </div>
            )}
            <button
              id="btn-exit-simplified-preview"
              type="button"
              onClick={() => onToggleSimplifiedPreview?.(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#ec4899] hover:text-[#f472b6] border border-[#ec4899]/60 hover:border-[#ec4899] text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-xs"
              title="Exit Simplified Preview (Esc)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Exit Preview</span>
              <kbd className="text-[10px] font-mono text-[#faf5ff]/70 bg-[#150d24] px-1.5 py-0.5 rounded border-[#2e1c52]">Esc</kbd>
            </button>
          </div>
        </header>

        {/* Optional Top Note Hero Banner in Reading View */}
        {note.bannerColor && (
          <NoteHeaderBanner
            bannerColor={note.bannerColor}
            bannerHeight={note.bannerHeight}
            bannerIcon={note.bannerIcon}
            readOnly={true}
          />
        )}

        {/* Simplified Content Canvas - Zero editing tools or inputs */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 bg-[#0c0714]">
          <div className="max-w-3xl mx-auto w-full">
            {/* Note Title Header (Read-only Display Typography) */}
            <div className="mb-8 pb-5 border-b border-[#2e1c52]/60">
              <div className="flex items-center gap-3.5 mb-2">
                {note.icon && (
                  <div className="p-2 rounded-xl bg-[#1f1338] border-[#2e1c52] shadow-xs shrink-0">
                    <CustomIconRenderer
                      iconName={note.icon}
                      color={note.iconColor || '#c084fc'}
                      defaultIcon={FileCode}
                      className="w-7 h-7"
                    />
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#faf5ff] tracking-tight">
                  {note.title || note.name.replace(/\.(md|mf)$/i, '')}
                </h1>
              </div>

              {/* Read-only tags row */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {note.tags.map((t, idx) => {
                    const tagColor = getTagColor(t);
                    return (
                      <span
                        key={idx}
                        style={getTagBadgeStyle(t, false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11px] font-medium"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: tagColor.dot }}
                        />
                        <span>#{t}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rendered Markdown with interactive checkboxes, links, code blocks, selections, dates */}
            <MarkdownRenderer
              content={content}
              allNotes={allNotes}
              onNavigateToNote={onNavigateToNote}
              onCreateNoteFromLink={onCreateNoteFromLink}
              onToggleCheckbox={handleToggleCheckbox}
              onUpdateContent={(newContent) => {
                setContent(newContent);
                handleContentChange(newContent, true, true);
              }}
              globalFoldAction={globalFoldAction}
              globalFoldVersion={globalFoldVersion}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0c0714] overflow-hidden relative font-['Space_Grotesk',sans-serif] text-[#faf5ff]">
      {/* Top Note Header */}
      <div className="px-6 py-3.5 border-b border-[#2e1c52] flex flex-wrap items-center justify-between gap-3 bg-[#150d24] shrink-0">
        <div className="flex-1 min-w-[280px]">
          {/* Path Breadcrumb */}
          <div className="text-[10px] font-['Space_Mono',monospace] text-[#c084fc] mb-1 tracking-tight flex items-center gap-1.5">
            {!isLeftSidebarOpen && onToggleLeftSidebar && (
              <button
                id="btn-note-expand-left-sidebar"
                type="button"
                onClick={onToggleLeftSidebar}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mr-1 text-[10px] rounded-[4px] bg-[#1f1338] hover:bg-[#2e1c52] text-[#ec4899] border-[#2e1c52] hover:border-[#ec4899]/60 transition-colors cursor-pointer"
                title="Show Left Sidebar / Files (Cmd+\ or Cmd+B)"
              >
                <PanelLeftOpen className="w-3 h-3 text-[#ec4899]" />
                <span className="font-semibold">Files</span>
              </button>
            )}
            {currentFolderPath.map((segment, idx) => (
              <React.Fragment key={idx}>
                <span className={idx === currentFolderPath.length - 1 ? 'text-[#c084fc]' : 'text-[#c084fc]/70'}>
                  {segment}
                </span>
                <span className="text-[#c084fc]/40">/</span>
              </React.Fragment>
            ))}
            <span className="text-[#faf5ff] font-medium">{note.title || note.name.replace(/\.(md|mf)$/i, '')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Note Icon Badge / Quick Customizer */}
            <button
              id="btn-note-custom-icon"
              type="button"
              onClick={() => onCustomizeIcon?.()}
              className="h-8 w-8 rounded-[6px] bg-[#1f1338] hover:bg-[#2e1c52] border border-[#2e1c52] hover:border-[#ec4899] transition-all cursor-pointer group shrink-0 flex items-center justify-center shadow-xs"
              title="Customize note icon, change colors, or upload an .svg file"
            >
              <CustomIconRenderer
                iconName={note.icon}
                color={note.iconColor || '#c084fc'}
                defaultIcon={FileCode}
                className="w-4.5 h-4.5 transition-transform group-hover:scale-110"
              />
            </button>

            {/* Note Title Input */}
            <input
              id="note-title-input"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note Title..."
              className="text-2xl font-bold text-[#faf5ff] bg-transparent border-b border-transparent hover:border-[#2e1c52] focus:border-[#ec4899] focus:outline-none transition-colors flex-1 min-w-[120px]"
            />

          </div>

          {/* Tag List under Note Name (shown when showTags is toggled on) */}
          {showTags && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {note.tags.map((t, idx) => {
                const tagColor = getTagColor(t);
                return (
                  <span
                    key={idx}
                    style={getTagBadgeStyle(t, false)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] border text-[10px] font-medium transition-all shadow-2xs"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: tagColor.dot }}
                    />
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="opacity-60 hover:opacity-100 cursor-pointer ml-0.5 transition-opacity"
                      title={`Remove #${t}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}

              {showTagInput ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="new tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onBlur={() => {
                      if (newTagInput) handleAddTag(newTagInput);
                      setShowTagInput(false);
                    }}
                    className="px-2 py-0.5 text-xs bg-[#1f1338] border border-[#2e1c52] rounded-[6px] focus:outline-none focus:border-[#ec4899] w-24 text-[#faf5ff]"
                  />
                </form>
              ) : (
                <button
                  id="btn-add-tag-under-note"
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-0.5 text-[11px] text-[#c084fc] hover:text-[#faf5ff] px-1.5 py-0.5 rounded-[6px] hover:bg-[#1f1338] cursor-pointer"
                  title="Add a new tag to this note"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Tag</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* View mode switcher & actions */}
        <div className="flex items-center gap-2">
          {/* Button Toggle Tag in the same line of note name */}
          <button
            id="btn-toggle-tags"
            type="button"
            onClick={handleToggleTags}
            className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-[6px] text-xs font-['Space_Mono',monospace] transition-all duration-150 cursor-pointer border shrink-0 active:scale-95 ${
              showTags
                ? 'bg-[#1f1338] text-[#ec4899] border-[#ec4899]/60 hover:bg-[#281745] hover:border-[#ec4899]'
                : 'bg-[#150d24] text-[#c084fc] border-[#2e1c52] hover:text-[#faf5ff] hover:bg-[#251543] hover:border-[#3b2366]'
            }`}
            title={showTags ? 'Hide tags under note name' : 'Show tags under note name'}
          >
            <TagIcon className="w-3 h-3 text-[#ec4899]" />
            <span className="font-medium text-[11px]">{showTags ? 'Hide Tags' : 'Tags'}</span>
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-[#2e1c52] text-[#faf5ff] font-semibold">
              {note.tags.length}
            </span>
            {showTags ? (
              <ChevronUp className="w-3 h-3 text-[#c084fc]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#c084fc]" />
            )}
          </button>

          {/* Customize Icon Action Button */}
          {onCustomizeIcon && (
            <button
              id="btn-note-action-icon"
              type="button"
              onClick={() => onCustomizeIcon()}
              className="h-8 w-8 flex items-center justify-center text-xs text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] hover:border-[#ec4899]/50 rounded-[6px] transition-all duration-150 border border-[#2e1c52] cursor-pointer active:scale-95 bg-[#1f1338]"
              title="Customize Note SVG Icon & Color"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
            </button>
          )}

          {/* Mode Switcher */}
          <div className="h-8 flex items-center bg-[#1f1338] p-0.5 rounded-[6px] border border-[#2e1c52] text-xs">
            <button
              id="btn-mode-edit"
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`h-full flex items-center justify-center px-2.5 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
                editorMode === 'edit'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
              title="Edit Markdown source"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline"></span>
            </button>
            <button
              id="btn-mode-split"
              type="button"
              onClick={() => setEditorMode('split')}
              className={`h-full flex items-center justify-center px-2.5 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
                editorMode === 'split'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
              title="Split View (Side-by-side)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline"></span>
            </button>
            <button
              id="btn-mode-preview"
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`h-full flex items-center justify-center px-2.5 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
                editorMode === 'preview'
                  ? 'bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold shadow-xs hover:shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
              }`}
              title="Rendered Preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline"></span>
            </button>
          </div>

          {/* Quick Split Ratio Presets (Visible in split mode) */}
          {editorMode === 'split' && (
            <div
              id="split-view-ratio-controls"
              className="hidden sm:flex items-center gap-1 bg-[#150d24] px-2 py-1 rounded-[6px] border border-[#2e1c52] text-[11px] font-mono text-[#c084fc]"
              title="Split View Editor & Preview Ratio (Click preset or drag divider)"
            >
              <span className="text-[#faf5ff] font-semibold">{Math.round(splitRatio)}%</span>
              <span className="text-[#c084fc]/40">/</span>
              <span className="text-[#faf5ff] font-semibold">{Math.round(100 - splitRatio)}%</span>
              <div className="h-3 w-px bg-[#2e1c52] mx-1" />
              <button
                type="button"
                onClick={() => handleSetPresetSplitRatio(35)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  Math.round(splitRatio) === 35
                    ? 'bg-[#ec4899] text-white font-bold shadow-xs'
                    : 'hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff]'
                }`}
                title="Editor 35% : Preview 65%"
              >
                35%
              </button>
              <button
                type="button"
                onClick={() => handleResetSplitRatio()}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  Math.round(splitRatio) === 50
                    ? 'bg-[#ec4899] text-white font-bold shadow-xs'
                    : 'hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff]'
                }`}
                title="Reset to 50% : 50% (Double-click divider)"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleSetPresetSplitRatio(65)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  Math.round(splitRatio) === 65
                    ? 'bg-[#ec4899] text-white font-bold shadow-xs'
                    : 'hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff]'
                }`}
                title="Editor 65% : Preview 35%"
              >
                65%
              </button>
            </div>
          )}

          {/* Simplified Preview button (Hides sidebars & all editing options) */}
          {onToggleSimplifiedPreview && (
            <button
              id="btn-mode-simplified-preview"
              type="button"
              onClick={() => onToggleSimplifiedPreview(true)}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs rounded-[6px] transition-all duration-150 cursor-pointer active:scale-95 bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52] hover:border-[#ec4899]/60 shadow-2xs"
              title="Simplified Preview (Cmd+Shift+P) - Hide sidebars & editing tools"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="hidden lg:inline font-medium text-[11px]">Simplify</span>
            </button>
          )}

          {/* Toggle Right Panel (Graph & Backlinks) */}
          {onToggleRightSidebar && (
            <button
              id="btn-note-action-toggle-links"
              type="button"
              onClick={onToggleRightSidebar}
              className={`h-8 w-8 flex items-center justify-center rounded-[6px] transition-all duration-150 cursor-pointer active:scale-95 border ${
                isRightSidebarOpen
                  ? 'bg-[#251543] text-[#ec4899] border-[#ec4899]/60'
                  : 'bg-[#1f1338] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] border-[#2e1c52]'
              }`}
              title={isRightSidebarOpen ? 'Hide Right Panel / Links (Cmd+Shift+\\)' : 'Show Right Panel / Links (Cmd+Shift+\\)'}
            >
              {isRightSidebarOpen ? (
                <PanelRightClose className="w-3.5 h-3.5 text-[#ec4899]" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5 text-[#c084fc]" />
              )}
            </button>
          )}

          {/* Voice to Text Dictate Quick Action */}
          <button
            id="btn-note-action-voice-dictate"
            type="button"
            onClick={speech.toggleListening}
            className={`h-8 w-8 flex items-center justify-center rounded-[6px] transition-all duration-150 cursor-pointer active:scale-95 border ${
              speech.isListening
                ? 'bg-rose-600 text-white border-rose-400 shadow-md animate-pulse'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] hover:border-[#ec4899]/50 border-[#2e1c52] bg-[#1f1338]'
            }`}
            title={
              speech.isListening
                ? 'Stop Voice Dictation (Esc or Cmd+Shift+V)'
                : 'Voice to Text Dictation (Cmd+Shift+V)'
            }
          >
            {speech.isListening ? (
              <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
          </button>

          {/* Voice Reader / Text to Speech Audio Player */}
          <button
            id="btn-note-action-voice-reader"
            type="button"
            onClick={() => {
              if (!isVoiceReaderBarOpen) {
                handleToggleVoiceReader(false);
              } else if (voiceReader.isPlaying && !voiceReader.isPaused) {
                voiceReader.pause();
              } else {
                voiceReader.resume();
              }
            }}
            className={`h-8 w-8 flex items-center justify-center rounded-[6px] transition-all duration-150 cursor-pointer active:scale-95 border ${
              voiceReader.isPlaying && !voiceReader.isPaused
                ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-md animate-pulse'
                : isVoiceReaderBarOpen
                ? 'bg-[#251543] text-[#ec4899] border-[#ec4899]/60'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] hover:border-[#ec4899]/50 border-[#2e1c52] bg-[#1f1338]'
            }`}
            title={
              voiceReader.isPlaying && !voiceReader.isPaused
                ? 'Pause Voice Reader (Cmd+Shift+R)'
                : isVoiceReaderBarOpen
                ? 'Resume Voice Reader (Cmd+Shift+R)'
                : 'Voice Reader: Listen to Note Aloud (Cmd+Shift+R)'
            }
          >
            {voiceReader.isPlaying && !voiceReader.isPaused ? (
              <Headphones className="w-3.5 h-3.5 text-white animate-bounce" />
            ) : (
              <Headphones className="w-3.5 h-3.5 text-[#ec4899]" />
            )}
          </button>

          {/* Download note file */}
          <button
            id="btn-download-md"
            type="button"
            onClick={() => downloadNoteAsMd(note)}
            className="h-8 w-8 flex items-center justify-center text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] hover:border-[#ec4899]/50 rounded-[6px] transition-all duration-150 border border-[#2e1c52] cursor-pointer active:scale-95 bg-[#1f1338]"
            title="Download markdown note (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete note */}
          <button
            id="btn-delete-note"
            type="button"
            onClick={() => {
              if (window.confirm(`Delete note "${note.title}"?`)) {
                onDeleteNote(note.id);
              }
            }}
            className="h-8 w-8 flex items-center justify-center text-[#c084fc] hover:text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/60 rounded-[6px] transition-all duration-150 border border-[#2e1c52] cursor-pointer active:scale-95 bg-[#1f1338]"
            title="Delete this note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Top Note Hero Banner */}
      {note.bannerColor && (
        <NoteHeaderBanner
          bannerColor={note.bannerColor}
          bannerHeight={note.bannerHeight}
          bannerIcon={note.bannerIcon}
          onChangeBanner={() => {
            setBannerModalInitialTab('header');
            setIsBannerModalOpen(true);
          }}
          onToggleHeight={handleToggleBannerHeight}
          onRemoveBanner={handleRemoveNoteBanner}
          readOnly={editorMode === 'preview'}
        />
      )}

      {/* Editor Formatting Toolbar (Shown in Edit & Split modes) */}
      {editorMode !== 'preview' && (
        <div className="relative z-30 px-6 py-1 border-b border-[#2e1c52] flex items-center gap-1 bg-[#150d24] shrink-0 text-[#c084fc] text-xs overflow-visible">
          {/* Undo and Redo */}
          <button
            id="btn-toolbar-undo"
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-[4px] transition-all duration-150 active:scale-95 ${
              canUndo
                ? 'hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] cursor-pointer'
                : 'text-[#503577] opacity-40 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-toolbar-redo"
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-[4px] transition-all duration-150 active:scale-95 ${
              canRedo
                ? 'hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] cursor-pointer'
                : 'text-[#503577] opacity-40 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#2e1c52] mx-0.5" />

          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-toolbar-heading-toggle"
            type="button"
            onClick={handleToggleHeading}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Heading (Click to cycle ## H2 -> ### H3 -> # H1)"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>

          {/* Text Color & Highlight Picker */}
          <div className="relative z-40 shrink-0">
            <div className="inline-flex items-center rounded-[6px] bg-[#1a1030] hover:bg-[#281745] border border-[#2e1c52] hover:border-[#ec4899]/60 transition-all shadow-2xs">
              <button
                id="btn-toolbar-text-color-quick"
                type="button"
                onClick={() => {
                  if (textareaRef.current && textareaRef.current.selectionEnd > textareaRef.current.selectionStart) {
                    handleApplyTextColor(activeTextColor, 'color');
                  } else {
                    handleOpenTextColorPicker();
                  }
                }}
                className="h-7 px-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 group"
                title={`Text Color: Click to apply ${activeTextColor} (Shortcut: Alt+C)`}
              >
                <Baseline className="w-3.5 h-3.5 text-[#faf5ff] group-hover:text-[#ec4899] transition-colors" />
                <span
                  className="w-3.5 h-0.5 rounded-full transition-colors"
                  style={{ backgroundColor: activeTextColor }}
                />
              </button>
              <button
                id="btn-toolbar-text-color-dropdown"
                type="button"
                onClick={handleOpenTextColorPicker}
                className="h-7 px-1.5 flex items-center justify-center border-l border-[#2e1c52] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] cursor-pointer transition-colors"
                title="Open Text Color Palette & Highlight Options"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isTextColorPickerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <TextColorPicker
              isOpen={isTextColorPickerOpen}
              onClose={() => setIsTextColorPickerOpen(false)}
              activeColor={activeTextColor}
              selectedText={selectedTextForColor}
              onApplyColor={handleApplyTextColor}
              onClearColor={handleClearTextColor}
            />
          </div>

          <div className="h-3.5 w-px bg-[#2e1c52] mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('[[', ']]', 'Note Title')}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] font-mono text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Wiki Link [[Note]]"
          >
            <Link className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>[[Wiki Link]]</span>
          </button>

          <button
            id="btn-toolbar-insert-canvas"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setIsCanvasModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] font-mono text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#a855f7]/80 active:scale-95 shadow-2xs shrink-0"
            title="Insert Link to Canvas (Alt+K) - Reference visual whiteboard in note"
          >
            <Boxes className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>[[Canvas]]</span>
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('#', '', 'tag')}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] font-mono text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert #tag"
          >
            <TagIcon className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>#tag</span>
          </button>

          <button
            id="btn-toolbar-insert-image"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setIsImageModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Image (Upload file, Web URL, or Sample presets)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Image</span>
          </button>

          <div className="h-3.5 w-px bg-[#2e1c52] mx-0.5" />

          {/* Multi Selection */}
          <button
            id="btn-toolbar-insert-multiselect"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setSelectionModalType('multi');
              setIsSelectionModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Multi-Selection (Checkboxes block or inline)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Multi-Select</span>
          </button>

          {/* Single Selection */}
          <button
            id="btn-toolbar-insert-singleselect"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setSelectionModalType('single');
              setIsSelectionModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#c084fc]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Single-Selection (Radio buttons block or inline)"
          >
            <ListFilter className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Single-Select</span>
          </button>

          {/* Date */}
          <button
            id="btn-toolbar-insert-date"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setIsDateModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Date (@date / [date: YYYY-MM-DD])"
          >
            <Calendar className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Date</span>
          </button>

          {/* Banner */}
          <button
            id="btn-toolbar-insert-banner"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              let selectedText = '';
              if (textareaRef.current) {
                const s = textareaRef.current.selectionStart ?? 0;
                const e = textareaRef.current.selectionEnd ?? 0;
                if (e > s) {
                  selectedText = content.slice(s, e).trim();
                }
              }
              setBannerModalInitialContent(selectedText);
              setBannerModalInitialTab('in-note');
              setIsBannerModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Colored Callout Banner or Set Note Top Banner"
          >
            <Palette className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Banner</span>
          </button>

          {/* Table */}
          <button
            id="btn-toolbar-insert-table"
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setIsTableModalOpen(true);
            }}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs shrink-0"
            title="Insert Markdown Table (Alt+T) - Customize columns, rows, alignments & presets"
          >
            <TableIcon className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Table</span>
          </button>

          <div className="h-3.5 w-px bg-[#2e1c52] mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ', '', 'Task')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Task item (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'List item')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Bullet list (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ', '', 'Quote')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Blockquote (>)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 hover:bg-[#251543] hover:text-[#faf5ff] text-[#c084fc] rounded-[4px] transition-all duration-150 cursor-pointer active:scale-95"
            title="Inline Code (`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          {/* Code Block Language Menu */}
          <div
            className="relative z-40 shrink-0"
            ref={codeMenuRef}
            onMouseEnter={handleCodeMenuMouseEnter}
            onMouseLeave={handleCodeMenuMouseLeave}
          >
            <button
              id="btn-toolbar-insert-code-block"
              type="button"
              onClick={() => setIsCodeMenuOpen(!isCodeMenuOpen)}
              className="h-7 px-2.5 flex items-center gap-1.5 text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#38bdf8]/60 active:scale-95 shadow-2xs shrink-0"
              title="Insert Code Block (HTML, XML, PHP, JavaScript, Python, SQL, etc.)"
            >
              <Code2 className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="font-['Space_Mono',monospace] text-xs">Code Block</span>
              <ChevronDown className={`w-3 h-3 text-[#c084fc] transition-transform ${isCodeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCodeMenuOpen && (
              <div
                id="toolbar-code-language-menu"
                className="absolute left-0 top-full mt-1.5 w-56 bg-[#150d24] border-[#3b2366] rounded-[8px] shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto ring-1 ring-black/50"
                style={{ zIndex: 100 }}
                onMouseEnter={handleCodeMenuMouseEnter}
                onMouseLeave={handleCodeMenuMouseLeave}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#c084fc]/70 uppercase tracking-wider font-['Space_Mono',monospace] border-b border-[#2e1c52]/60 mb-1">
                  Insert Language Block
                </div>
                {[
                  { id: 'bash', label: 'Bash / Shell', color: '#4ade80' },
                  { id: 'html', label: 'HTML', color: '#f97316' },
                  { id: 'xml', label: 'XML', color: '#fb923c' },
                  { id: 'php', label: 'PHP', color: '#818cf8' },
                  { id: 'javascript', label: 'JavaScript', color: '#facc15' },
                  { id: 'python', label: 'Python', color: '#38bdf8' },
                  { id: 'sql', label: 'SQL', color: '#c084fc' },
                  { id: 'typescript', label: 'TypeScript', color: '#60a5fa' },
                  { id: 'json', label: 'JSON', color: '#34d399' },
                  { id: 'css', label: 'CSS', color: '#38bdf8' },

                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertCodeBlock(item.id)}
                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-[#1f1338] text-xs transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#faf5ff] font-medium group-hover:text-white">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-['Space_Mono',monospace] text-[10px] text-[#c084fc]/60 group-hover:text-[#c084fc]">
                      ```{item.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code Folding & Navigation Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Fold All Code Blocks */}
            <button
              id="btn-toolbar-fold-all-code"
              type="button"
              onClick={handleFoldAllCode}
              className="h-7 px-2 flex items-center gap-1 text-[#c084fc] hover:text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]/60 active:scale-95 shadow-2xs"
              title="Fold All Code Blocks (Alt+[)"
            >
              <FoldVertical className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="hidden xl:inline text-[11px] font-mono">Fold All</span>
            </button>

            {/* Expand All Code Blocks */}
            <button
              id="btn-toolbar-expand-all-code"
              type="button"
              onClick={handleExpandAllCode}
              className="h-7 px-2 flex items-center gap-1 text-[#c084fc] hover:text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer border border-[#2e1c52] hover:border-[#38bdf8]/60 active:scale-95 shadow-2xs"
              title="Expand All Code Blocks (Alt+])"
            >
              <UnfoldVertical className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="hidden xl:inline text-[11px] font-mono">Expand All</span>
            </button>

            {/* Code Outline Navigator (shows when code blocks exist in note) */}
            {noteCodeBlocks.length > 0 && (
              <div className="relative z-40" ref={codeOutlineMenuRef}>
                <button
                  id="btn-toolbar-code-outline"
                  type="button"
                  onClick={() => setIsCodeOutlineOpen(!isCodeOutlineOpen)}
                  className={`h-7 px-2.5 flex items-center gap-1.5 text-xs leading-none rounded-[6px] transition-all duration-150 cursor-pointer border active:scale-95 shadow-2xs ${
                    isCodeOutlineOpen
                      ? 'bg-[#251543] text-[#faf5ff] border-[#ec4899]'
                      : 'bg-[#1a1030] hover:bg-[#281745] text-[#faf5ff] border-[#2e1c52] hover:border-[#ec4899]/60'
                  }`}
                  title={`Navigate & Fold ${noteCodeBlocks.length} code block${noteCodeBlocks.length === 1 ? '' : 's'} in this document`}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span className="font-['Space_Mono',monospace] text-[11px]">
                    {noteCodeBlocks.length} {noteCodeBlocks.length === 1 ? 'Block' : 'Blocks'}
                  </span>
                </button>

                {isCodeOutlineOpen && (
                  <div
                    id="toolbar-code-outline-menu"
                    className="absolute left-0 top-full mt-1.5 w-72 bg-[#150d24] border border-[#3b2366] rounded-[8px] shadow-2xl py-2 z-50 max-h-80 overflow-y-auto ring-1 ring-black/50"
                  >
                    <div className="px-3 py-1.5 border-b border-[#2e1c52] flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#c084fc]/70 uppercase tracking-wider font-['Space_Mono',monospace]">
                        Code Blocks ({noteCodeBlocks.length})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleFoldAllCode}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#1f1338] hover:bg-[#281745] text-[#ec4899] border border-[#2e1c52] cursor-pointer"
                          title="Fold All (Alt+[)"
                        >
                          Fold All
                        </button>
                        <button
                          type="button"
                          onClick={handleExpandAllCode}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#1f1338] hover:bg-[#281745] text-[#38bdf8] border border-[#2e1c52] cursor-pointer"
                          title="Expand All (Alt+])"
                        >
                          Expand All
                        </button>
                      </div>
                    </div>

                    <div className="py-1">
                      {noteCodeBlocks.map((block, idx) => (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => handleJumpToCodeBlock(block)}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#1f1338] transition-colors cursor-pointer group flex flex-col gap-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#faf5ff] group-hover:text-[#ec4899] uppercase tracking-wide font-mono text-[10px]">
                              #{idx + 1} {block.language}
                            </span>
                            <span className="text-[10px] text-[#c084fc]/60 font-mono">
                              Line {block.startLine} · {block.lineCount} lines
                            </span>
                          </div>
                          <p className="text-[11px] text-[#c084fc]/70 truncate font-mono group-hover:text-[#faf5ff]">
                            {block.preview}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-[#2e1c52] mx-1" />

          {/* Voice to Text Dictate button in toolbar */}
          <button
            id="btn-toolbar-voice-dictate"
            type="button"
            onClick={speech.toggleListening}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer active:scale-95 border shrink-0 ${
              speech.isListening
                ? 'bg-rose-600/90 text-white border-rose-400 shadow-sm animate-pulse'
                : 'text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] border-[#2e1c52] hover:border-[#ec4899]/60 shadow-2xs'
            }`}
            title={
              speech.isListening
                ? 'Stop Voice Dictation (Esc or Cmd+Shift+V)'
                : 'Start Voice Dictation (Cmd+Shift+V) - Speak to transcribe text'
            }
          >
            {speech.isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
                <span className="font-['Space_Mono',monospace] text-xs font-semibold">Recording...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#ec4899]" />
                <span className="font-['Space_Mono',monospace] text-xs">Dictate</span>
              </>
            )}
          </button>

          {/* Voice Reader Button in toolbar */}
          <button
            id="btn-toolbar-voice-reader"
            type="button"
            onClick={() => {
              if (!isVoiceReaderBarOpen) {
                handleToggleVoiceReader(false);
              } else if (voiceReader.isPlaying && !voiceReader.isPaused) {
                voiceReader.pause();
              } else {
                voiceReader.resume();
              }
            }}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer active:scale-95 border shrink-0 ${
              voiceReader.isPlaying && !voiceReader.isPaused
                ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xs animate-pulse'
                : isVoiceReaderBarOpen
                ? 'bg-[#251543] text-[#ec4899] border-[#ec4899]/60'
                : 'text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] border-[#2e1c52] hover:border-[#ec4899]/60 shadow-2xs'
            }`}
            title="Voice Reader - Listen to note aloud (⌘⇧R)"
          >
            <Headphones className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="font-['Space_Mono',monospace] text-xs">
              {voiceReader.isPlaying && !voiceReader.isPaused ? 'Reading...' : 'Voice Reader'}
            </span>
          </button>
          <div className="h-3.5 w-px bg-[#2e1c52] mx-1" />

          {/* In-Note Find & Replace Button */}
          <button
            id="btn-toolbar-find-replace"
            type="button"
            onClick={() => setIsFindReplaceOpen((prev) => !prev)}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] text-xs leading-none transition-all duration-150 cursor-pointer active:scale-95 border shrink-0 ${
              isFindReplaceOpen
                ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-xs'
                : 'text-[#faf5ff] bg-[#1a1030] hover:bg-[#281745] border-[#2e1c52] hover:border-[#ec4899]/60 shadow-2xs'
            }`}
            title="Find & Replace in active note (⌘F / Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="font-['Space_Mono',monospace] text-xs">Find</span>
          </button>
        </div>
      )}

      {/* Attached Images Preview & Cleanup Strip */}
      <AttachedImagesBar
        images={noteImages}
        onInsertNewImage={() => setIsImageModalOpen(true)}
        onCleanDataUrls={handleCleanDataUrls}
        isCleaning={isCleaningImages}
        onSelectImageInEditor={handleSelectImageInEditor}
        onRemoveImageFromEditor={handleRemoveImageFromEditor}
      />

      {/* In-Note Find & Replace floating panel */}
      <InNoteFindReplace
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        content={content}
        onContentChange={(newText) => handleContentChange(newText, true, true)}
        textareaRef={textareaRef}
      />

      {/* Editor Body Area */}
      <div
        ref={splitContainerRef}
        className={`flex-1 overflow-hidden relative flex ${
          isDraggingSplitter ? 'select-none cursor-col-resize' : ''
        }`}
      >
        {/* Source Markdown Editor */}
        {(editorMode === 'edit' || editorMode === 'split') && (
          <div
            className="h-full flex flex-col min-w-0"
            style={{
              width: editorMode === 'split' ? `${splitRatio}%` : '100%',
              transition: isDraggingSplitter ? 'none' : 'width 0.15s ease-out',
            }}
          >
            <textarea
              ref={textareaRef}
              id="note-editor-textarea"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              placeholder="Type markdown, [[Wiki Links]], or #tags... (Paste or drop images directly)"
              className="w-full h-full p-6 bg-[#0c0714] text-[#faf5ff] font-['Space_Mono',monospace] text-sm leading-relaxed resize-none focus:outline-none placeholder:text-[#c084fc]/50"
              spellCheck={false}
            />
          </div>
        )}

        {/* Resizable Divider (Split View Mode Only) */}
        {editorMode === 'split' && (
          <div
            id="split-view-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor and preview spaces"
            aria-valuenow={Math.round(splitRatio)}
            aria-valuemin={15}
            aria-valuemax={85}
            tabIndex={0}
            onPointerDown={handleSplitterPointerDown}
            onPointerMove={handleSplitterPointerMove}
            onPointerUp={handleSplitterPointerUp}
            onMouseEnter={() => setIsHoveringSplitter(true)}
            onMouseLeave={() => setIsHoveringSplitter(false)}
            onDoubleClick={handleResetSplitRatio}
            onKeyDown={handleSplitterKeyDown}
            className={`relative z-20 w-3 -mx-1.5 shrink-0 flex items-center justify-center cursor-col-resize select-none touch-none group outline-none ${
              isDraggingSplitter ? 'cursor-col-resize' : ''
            }`}
            title="Drag to resize editor & preview spaces • Double-click to reset (50/50)"
          >
            {/* Visual separator line */}
            <div
              className={`h-full w-[2px] transition-colors ${
                isDraggingSplitter
                  ? 'bg-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.7)]'
                  : isHoveringSplitter
                  ? 'bg-[#ec4899]/70'
                  : 'bg-[#2e1c52]'
              }`}
            />

            {/* Central drag handle pill */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-8 rounded-[4px] border transition-all pointer-events-none shadow-md ${
                isDraggingSplitter
                  ? 'bg-[#ec4899] border-[#faf5ff] text-white scale-110 shadow-[0_0_12px_rgba(236,72,153,0.8)]'
                  : isHoveringSplitter
                  ? 'bg-[#251543] border-[#ec4899] text-[#faf5ff]'
                  : 'bg-[#1a0f2e] border-[#3b2366] text-[#c084fc]/70 opacity-60 group-hover:opacity-100'
              }`}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Floating Live Percentage Tooltip while dragging or hovering */}
            {(isDraggingSplitter || isHoveringSplitter) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-[6px] bg-[#150d24]/95 border border-[#ec4899] shadow-xl text-[11px] font-mono font-medium text-[#faf5ff] whitespace-nowrap z-50 pointer-events-none flex items-center gap-1.5 backdrop-blur-xs">
                <span>Editor {Math.round(splitRatio)}%</span>
                <span className="text-[#ec4899]">•</span>
                <span>Preview {Math.round(100 - splitRatio)}%</span>
                {Math.round(splitRatio) !== 50 && (
                  <span className="text-[10px] text-[#c084fc]/80 font-sans ml-1">(Double-click 50%)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rendered Preview */}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div
            className="h-full overflow-y-auto p-6 bg-[#0c0714] min-w-0"
            style={{
              width: editorMode === 'split' ? `${100 - splitRatio}%` : '100%',
              transition: isDraggingSplitter ? 'none' : 'width 0.15s ease-out',
            }}
          >
            <div className="max-w-3xl mx-auto w-full">
              {editorMode === 'preview' && onToggleSimplifiedPreview && (
                <div className="flex justify-end mb-4">
                  <button
                    id="btn-preview-switch-to-simplified"
                    type="button"
                    onClick={() => onToggleSimplifiedPreview(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border-[#2e1c52] hover:border-[#ec4899]/50 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="Hide sidebars and editing options for distraction-free reading"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span>Simplify Preview (Hide Sidebars & Tools)</span>
                  </button>
                </div>
              )}
              <MarkdownRenderer
                content={content}
                allNotes={allNotes}
                onNavigateToNote={onNavigateToNote}
                onCreateNoteFromLink={onCreateNoteFromLink}
                onNavigateToCanvas={onNavigateToCanvas}
                onCreateCanvasFromLink={onCreateCanvasFromLink}
                onToggleCheckbox={handleToggleCheckbox}
                onUpdateContent={(newContent) => {
                  setContent(newContent);
                  handleContentChange(newContent, true, true);
                }}
                globalFoldAction={globalFoldAction}
                globalFoldVersion={globalFoldVersion}
              />
            </div>
          </div>
        )}

        {/* Autocomplete Popup */}
        {autoCompleteType && (matchingWikiItems.length > 0 || matchingTags.length > 0) && (
          <div className="absolute left-10 top-20 z-50 bg-[#150d24] border-[#2e1c52] rounded-[6px] shadow-2xl p-1.5 w-64 max-h-56 overflow-y-auto text-xs text-[#faf5ff]">
            <div className="px-2 py-1 text-[10px] font-semibold text-[#c084fc] uppercase tracking-wider font-['Space_Mono',monospace]">
              {autoCompleteType === 'wikilink' ? 'Link to Note or Canvas' : 'Insert Tag'}
            </div>
            {autoCompleteType === 'wikilink' &&
              matchingWikiItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => insertCompletion(item.insertValue)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[4px] flex items-center justify-between cursor-pointer ${
                    idx === autoCompleteIndex
                      ? 'bg-[#ec4899] text-[#faf5ff] font-semibold'
                      : 'text-[#faf5ff]/80 hover:bg-[#1f1338] hover:text-[#faf5ff]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.isCanvas ? (
                      <Boxes className={`w-3.5 h-3.5 shrink-0 ${idx === autoCompleteIndex ? 'text-white' : 'text-[#c084fc]'}`} />
                    ) : (
                      <Link className={`w-3 h-3 shrink-0 ${idx === autoCompleteIndex ? 'text-white' : 'text-[#ec4899]'}`} />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.isCanvas && (
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 ml-1.5 ${
                      idx === autoCompleteIndex ? 'bg-white/20 text-white' : 'bg-[#a855f7]/25 text-[#c084fc]'
                    }`}>
                      Canvas
                    </span>
                  )}
                </button>
              ))}
            {autoCompleteType === 'tag' &&
              matchingTags.map((t, idx) => {
                const isSelected = idx === autoCompleteIndex;
                const tagColor = getTagColor(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertCompletion(t)}
                    style={isSelected ? getTagBadgeStyle(t, true) : undefined}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[4px] flex items-center gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'font-semibold shadow-2xs'
                        : 'text-[#faf5ff]/80 hover:bg-[#1f1338] hover:text-[#faf5ff]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? tagColor.activeText : tagColor.dot }}
                    />
                    <span className="truncate">#{t}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Floating Voice Dictation Live Overlay Bar */}
      <VoiceDictationBar
        isListening={speech.isListening}
        interimTranscript={speech.interimTranscript}
        duration={speech.audioDuration}
        selectedLanguage={speech.selectedLanguage}
        onChangeLanguage={speech.setSelectedLanguage}
        smartPunctuation={speech.smartPunctuation}
        onToggleSmartPunctuation={speech.setSmartPunctuation}
        onStop={speech.stopListening}
        error={speech.error}
        onClearError={speech.clearError}
        isSupported={speech.isSupported}
      />

      {/* Floating Voice Reader Audio Player Bar */}
      <VoiceReaderBar
        isOpen={isVoiceReaderBarOpen}
        isPlaying={voiceReader.isPlaying}
        isPaused={voiceReader.isPaused}
        currentSentence={voiceReader.currentSentence}
        currentSentenceIndex={voiceReader.currentSentenceIndex}
        totalSentences={voiceReader.totalSentences}
        progress={voiceReader.progress}
        rate={voiceReader.rate}
        pitch={voiceReader.pitch}
        selectedVoiceURI={voiceReader.selectedVoiceURI}
        voices={voiceReader.voices}
        readSourceType={voiceReader.readSourceType}
        error={voiceReader.error}
        noteTitle={note.title}
        onPlay={() => {
          let textToRead = content;
          let isSelection = false;
          if (textareaRef.current) {
            const selStart = textareaRef.current.selectionStart;
            const selEnd = textareaRef.current.selectionEnd;
            if (selEnd > selStart) {
              const selected = content.slice(selStart, selEnd).trim();
              if (selected.length > 0) {
                textToRead = selected;
                isSelection = true;
              }
            }
          }
          voiceReader.play({ text: textToRead, title: note.title, isSelection });
        }}
        onPause={voiceReader.pause}
        onResume={voiceReader.resume}
        onStop={voiceReader.stop}
        onSkipForward={voiceReader.skipForward}
        onSkipBackward={voiceReader.skipBackward}
        onSeek={voiceReader.seekSentence}
        onChangeRate={voiceReader.setRate}
        onChangePitch={voiceReader.setPitch}
        onChangeVoice={voiceReader.setVoice}
        onClearError={voiceReader.clearError}
        onClose={() => {
          voiceReader.stop();
          setIsVoiceReaderBarOpen(false);
        }}
        isSupported={voiceReader.isSupported}
      />

      {/* Insert Image Dialog Modal */}
      <InsertImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImageSyntax}
      />

      {/* Insert Multi/Single Selection Modal */}
      <InsertSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onInsert={handleInsertSelectionSyntax}
        initialType={selectionModalType}
      />

      {/* Insert Date Modal */}
      <InsertDateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onInsert={handleInsertDateSyntax}
      />

      {/* Insert Banner Modal */}
      <InsertBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        defaultTab={bannerModalInitialTab}
        initialContent={bannerModalInitialContent}
        onInsertInNote={handleInsertBannerSyntax}
        onInsertInNoteBanner={handleInsertBannerSyntax}
        onSetNoteBanner={handleSetNoteBanner}
        onSetNoteHeaderBanner={handleSetNoteBanner}
        currentBannerColor={note.bannerColor}
        currentHeaderBannerColor={note.bannerColor}
        currentBannerIcon={note.bannerIcon}
        currentHeaderBannerIcon={note.bannerIcon}
        currentBannerHeight={note.bannerHeight}
        currentHeaderBannerHeight={note.bannerHeight}
      />

      {/* Insert Table Dialog Modal */}
      <InsertTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={handleInsertTableSyntax}
      />

      {/* Insert Canvas Dialog Modal */}
      <InsertCanvasModal
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        onInsert={handleInsertCanvasSyntax}
      />
    </div>
  );
};
