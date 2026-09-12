import React, { useState, useRef, useEffect } from 'react';
import {
  Network,
  Layout,
  Columns,
  Search,
  Plus,
  Share2,
  CalendarDays,
  FolderTree,
  FileCode,
  Moon,
  Sun,
  CheckCircle2,
  Palette,
  HardDrive,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  ChevronDown,
  Lock,
  LogOut,
  BookOpen,
  Mic,
  MicOff,
} from 'lucide-react';
import { ViewLayoutMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  layoutMode: ViewLayoutMode;
  onChangeLayoutMode: (mode: ViewLayoutMode) => void;
  onOpenCommandPalette: () => void;
  onCreateNewNote: () => void;
  onOpenThemeEditor: () => void;
  onOpenBackupCenter?: () => void;
  activeThemeName?: string;
  totalNotes: number;
  totalFolders: number;
  bidirectionalCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  currentUserEmail?: string;
  onLockVault?: () => void;
  isSimplifiedPreview?: boolean;
  onToggleSimplifiedPreview?: (enabled?: boolean) => void;
  onToggleVoiceDictation?: () => void;
  isVoiceListening?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  layoutMode,
  onChangeLayoutMode,
  onOpenCommandPalette,
  onCreateNewNote,
  onOpenThemeEditor,
  onOpenBackupCenter,
  activeThemeName,
  totalNotes,
  totalFolders,
  bidirectionalCount,
  isDarkMode,
  onToggleDarkMode,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  currentUserEmail,
  onLockVault,
  isSimplifiedPreview = false,
  onToggleSimplifiedPreview,
  onToggleVoiceDictation,
  isVoiceListening = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownCloseTimerRef = useRef<number | null>(null);

  const handleDropdownMouseEnter = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
    }
    dropdownCloseTimerRef.current = window.setTimeout(() => {
      setIsDropdownOpen(false);
      dropdownCloseTimerRef.current = null;
    }, 180);
  };

  const closeDropdownImmediately = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    setIsDropdownOpen(false);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdownImmediately();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdownImmediately();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header className="relative z-40 h-12 px-4 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between shrink-0 select-none text-[#faf5ff] font-['Space_Grotesk',sans-serif]">
      {/* Window Controls & Vault Title */}
      <div className="flex items-center gap-2.5">
        {/* macOS Style Window Dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57] transition-opacity hover:opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] transition-opacity hover:opacity-80" />
          <div className="w-3 h-3 rounded-full bg-[#28C840] transition-opacity hover:opacity-80" />
        </div>

        <div className="h-4 w-[1px] bg-[#2e1c52] mx-0.5" />

        {/* Toggle Left Sidebar Button (hidden in simplified preview) */}
        {!isSimplifiedPreview && (
          <button
            id="btn-toggle-left-sidebar"
            type="button"
            onClick={onToggleLeftSidebar}
            className={`flex items-center gap-1 p-1.5 rounded-[6px] transition-all duration-150 cursor-pointer active:scale-95 ${
              isLeftSidebarOpen
                ? 'bg-[#1f1338] text-[#faf5ff] border-[#2e1c52] hover:bg-[#281745] hover:border-[#ec4899]/60 hover:shadow-xs'
                : 'bg-transparent text-[#c084fc] border-transparent hover:bg-[#1f1338] hover:text-[#faf5ff] hover:border-[#2e1c52]'
            }`}
            title={isLeftSidebarOpen ? 'Hide Left Sidebar / Files (Cmd+\\ or Cmd+B)' : 'Show Left Sidebar / Files (Cmd+\\ or Cmd+B)'}
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-[#ec4899] transition-transform hover:scale-105" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-[#c084fc] transition-transform hover:scale-105" />
            )}
          </button>
        )}
      </div>

      {/* Center Search / Jump to node */}
      <div className="flex-1 max-w-sm mx-4">
        <div className="relative group" onClick={onOpenCommandPalette}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-[#c084fc] group-hover:text-[#ec4899] transition-colors" />
          </div>
          <input
            type="text"
            readOnly
            className="block w-full py-1.5 pl-9 pr-12 text-xs bg-[#1f1338] hover:bg-[#251543] border-[#2e1c52] hover:border-[#ec4899]/60 rounded-[6px] focus:outline-none focus:border-[#ec4899] text-[#faf5ff] placeholder:text-[#c084fc]/60 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
            placeholder="Jump to node... (Cmd+K)"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <kbd className="text-[10px] font-mono text-[#c084fc] group-hover:text-[#faf5ff] bg-[#150d24] group-hover:bg-[#281745] px-1.5 py-0.5 rounded-[4px] border-[#2e1c52] group-hover:border-[#ec4899]/40 transition-all">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls: Layout Switcher & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Layout Switcher */}
        <div className="flex items-center bg-[#1f1338] p-0.5 rounded-[6px] border-[#2e1c52] text-xs font-medium">
          <button
            id="btn-layout-workspace"
            type="button"
            onClick={() => onChangeLayoutMode('workspace')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
              layoutMode === 'workspace'
                ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            style={layoutMode === 'workspace' ? { backgroundColor: '#ec4899', color: '#faf5ff' } : undefined}
            title="Editor view"
          >
            <Layout className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-layout-split"
            type="button"
            onClick={() => onChangeLayoutMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
              layoutMode === 'split'
                ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            style={layoutMode === 'split' ? { backgroundColor: '#ec4899', color: '#faf5ff' } : undefined}
            title="Split: Editor + Graph"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-layout-graph"
            type="button"
            onClick={() => onChangeLayoutMode('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
              layoutMode === 'graph'
                ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            style={layoutMode === 'graph' ? { backgroundColor: '#ec4899', color: '#faf5ff' } : undefined}
            title="Full Knowledge Graph"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-layout-agenda"
            type="button"
            onClick={() => onChangeLayoutMode('agenda')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
              layoutMode === 'agenda'
                ? 'bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] font-semibold shadow-xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#281745]'
            }`}
            style={layoutMode === 'agenda' ? { backgroundColor: '#ec4899', color: '#faf5ff' } : undefined}
            title="Agenda & Schedule (Tasks, Events, Daily Notes)"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Agenda</span>
          </button>
        </div>

        {/* Simplified Preview Indicator & Exit (when reading mode is active) */}
        {isSimplifiedPreview && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#ec4899]/15 border-[#ec4899]/50 text-xs text-[#faf5ff] font-medium">
              <BookOpen className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="hidden sm:inline font-['Space_Mono',monospace] text-[11px]">Reading View</span>
            </div>
            {onToggleSimplifiedPreview && (
              <button
                id="btn-topnav-exit-simplified"
                type="button"
                onClick={() => onToggleSimplifiedPreview(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] text-[#ec4899] hover:text-[#faf5ff] border-[#ec4899]/50 hover:border-[#ec4899] text-xs font-semibold cursor-pointer transition-all active:scale-95"
                title="Exit Simplified Preview (Esc)"
              >
                <span>Exit</span>
                <kbd className="text-[9px] font-mono opacity-70 bg-[#150d24] px-1 py-0.2 rounded border-[#2e1c52]">Esc</kbd>
              </button>
            )}
          </div>
        )}

        {/* Toggle Right Sidebar Button (in Workspace Mode and when not in simplified preview) */}
        {layoutMode === 'workspace' && !isSimplifiedPreview && (
          <button
            id="btn-toggle-right-sidebar"
            type="button"
            onClick={onToggleRightSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer active:scale-95 ${
              isRightSidebarOpen
                ? 'bg-[#1f1338] text-[#faf5ff] border-[#2e1c52] hover:bg-[#281745] hover:border-[#ec4899]/60'
                : 'bg-transparent text-[#c084fc] border-transparent hover:bg-[#1f1338] hover:text-[#faf5ff] hover:border-[#2e1c52]'
            }`}
            title={isRightSidebarOpen ? 'Hide Right Panel / Links (Cmd+Shift+\\)' : 'Show Right Panel / Links (Cmd+Shift+\\)'}
          >
            {isRightSidebarOpen ? (
              <PanelRightClose className="w-4 h-4 text-[#ec4899]" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-[#c084fc]" />
            )}
            <span className="hidden md:inline font-medium">Links</span>
          </button>
        )}

        {/* In-App PWA Install Prompt */}
        <PWAInstallButton variant="compact" />

        {/* Voice Dictation Quick Button */}
        {onToggleVoiceDictation && (
          <button
            id="btn-topnav-voice-dictate"
            type="button"
            onClick={onToggleVoiceDictation}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
              isVoiceListening
                ? 'bg-rose-600 text-white border-rose-400 shadow-md animate-pulse'
                : 'bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border-[#2e1c52] hover:border-[#ec4899]/60'
            }`}
            title={
              isVoiceListening
                ? 'Stop Voice Dictation (Cmd+Shift+V or Esc)'
                : 'Voice to Text Dictation (Cmd+Shift+V)'
            }
          >
            {isVoiceListening ? (
              <>
                <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
                <span className="hidden sm:inline font-['Space_Mono',monospace] text-[11px]">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#ec4899]" />
                <span className="hidden sm:inline">Voice</span>
              </>
            )}
          </button>
        )}

        {/* Actions Dropdown Menu */}
        <div
          className="relative z-50"
          ref={dropdownRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <button
            id="btn-top-menu-dropdown"
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
              isDropdownOpen
                ? 'bg-[#281745] text-[#faf5ff] border-[#ec4899]/70 shadow-xs'
                : 'bg-[#1f1338] hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] border-[#2e1c52] hover:border-[#ec4899]/60'
            }`}
            title="Menu (New Note, Backup, Theme, Dark/Light mode)"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <Menu className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="hidden sm:inline">Menu</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${
                isDropdownOpen ? 'rotate-180 text-[#ec4899]' : 'text-[#c084fc]'
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              id="top-nav-dropdown-menu"
              className="absolute right-0 mt-1.5 w-60 py-1 rounded-[8px] bg-[#150d24] border-[#3b2366] shadow-2xl z-50 divide-y divide-[#2e1c52]/60 font-['Space_Grotesk',sans-serif]"
              style={{ zIndex: 100 }}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              {/* 1. New Note & Voice Dictation */}
              <div className="py-1">
                <button
                  id="btn-dropdown-new-note"
                  type="button"
                  onClick={() => {
                    closeDropdownImmediately();
                    onCreateNewNote();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-[#ec4899] shrink-0 group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
                    <span className="font-semibold group-hover:translate-x-0.5 transition-transform">New Note</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#c084fc]/70 group-hover:text-[#faf5ff]">.md</span>
                </button>

                {onToggleVoiceDictation && (
                  <button
                    id="btn-dropdown-voice-dictate"
                    type="button"
                    onClick={() => {
                      closeDropdownImmediately();
                      onToggleVoiceDictation();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mic className={`w-4 h-4 ${isVoiceListening ? 'text-rose-400 animate-pulse' : 'text-[#ec4899]'} shrink-0 group-hover:scale-115 transition-all`} />
                      <span className="font-semibold group-hover:translate-x-0.5 transition-transform">
                        {isVoiceListening ? 'Stop Voice Dictation' : 'Voice-to-Text Dictate'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#c084fc]/70 group-hover:text-[#faf5ff]">⌘⇧V</span>
                  </button>
                )}
              </div>

              {/* 2. Backup, Theme & Agenda */}
              <div className="py-1">
                <button
                  id="btn-dropdown-agenda"
                  type="button"
                  onClick={() => {
                    closeDropdownImmediately();
                    onChangeLayoutMode('agenda');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-[#ec4899] shrink-0 group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">Agenda & Tasks</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#c084fc]/70 group-hover:text-[#faf5ff]">Daily</span>
                </button>

                <button
                  id="btn-dropdown-backup"
                  type="button"
                  onClick={() => {
                    closeDropdownImmediately();
                    onOpenBackupCenter?.();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-[#ec4899] shrink-0 group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">Backup & Restore</span>
                  </div>
                </button>

                <button
                  id="btn-dropdown-theme"
                  type="button"
                  onClick={() => {
                    closeDropdownImmediately();
                    onOpenThemeEditor();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-[#ec4899] shrink-0 group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">Theme</span>
                  </div>
                  {activeThemeName && (
                    <span className="text-[10px] font-mono text-[#c084fc]/80 group-hover:text-[#faf5ff] px-1.5 py-0.5 rounded-[4px] bg-[#1f1338] group-hover:bg-[#281745] border-[#2e1c52] group-hover:border-[#ec4899]/50 truncate max-w-[90px] transition-all">
                      {activeThemeName.split(' ')[0]}
                    </span>
                  )}
                </button>
              </div>

              {/* 4. Dark / Light Mode Toggle */}
              <div className="py-1">
                <button
                  id="btn-dropdown-toggle-dark-mode"
                  type="button"
                  onClick={() => {
                    closeDropdownImmediately();
                    onToggleDarkMode();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-[#faf5ff] hover:bg-[#281748] hover:text-white rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-amber-300 shrink-0 group-hover:scale-115 transition-transform" />
                    ) : (
                      <Moon className="w-4 h-4 text-blue-300 shrink-0 group-hover:scale-115 transition-transform" />
                    )}
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#c084fc] group-hover:text-[#faf5ff] px-1.5 py-0.5 rounded-[4px] bg-[#1f1338] group-hover:bg-[#281745] border-[#2e1c52] group-hover:border-[#ec4899]/50 transition-all">
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                </button>
              </div>

              {/* 5. Authentication & Vault Security */}
              {onLockVault && (
                <div className="py-1">
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-['Space_Mono',monospace] text-[#c084fc]/70">
                    <span>SECURITY</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Unlocked
                    </span>
                  </div>
                  <div className="px-3 pb-1 text-[11px] font-mono text-[#faf5ff] truncate" title={currentUserEmail || 'emixup23@gmail.com'}>
                    {currentUserEmail || 'emixup23@gmail.com'}
                  </div>
                  <button
                    id="btn-dropdown-lock-vault"
                    type="button"
                    onClick={() => {
                      closeDropdownImmediately();
                      onLockVault();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center justify-between text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 rounded-[4px] transition-all duration-150 cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0 group-hover:scale-115 transition-transform" />
                      <span className="font-medium group-hover:translate-x-0.5 transition-transform">Lock Vault / Sign Out</span>
                    </div>
                    <LogOut className="w-3.5 h-3.5 text-rose-400/60 group-hover:text-rose-200 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Lock Vault Button */}
        {onLockVault && (
          <button
            id="btn-quick-lock-vault"
            type="button"
            onClick={onLockVault}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer bg-[#1f1338] hover:bg-[#150d24] text-[#c084fc] hover:text-[#faf5ff] border-[#2e1c52] hover:border-rose-500/50"
            title={`Vault unlocked for ${currentUserEmail || 'emixup23@gmail.com'}. Click to Lock Vault.`}
          >
            <Lock className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="text-[11px] font-mono text-[#faf5ff]/80 truncate max-w-[130px]">
              Lock
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
