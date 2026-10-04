import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Folder,
  Tag,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Info,
  ShieldCheck,
  Layers,
  X,
  FileCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { NoteFile, Folder as FolderType, ThemeConfig, LocalSnapshot, RestorePreview, RestoreMode } from '../types';
import {
  createVaultBackup,
  downloadVaultBackupFile,
  validateBackupContent,
  mergeVaultData,
  getLocalSnapshots,
  saveLocalSnapshot,
  deleteLocalSnapshot,
  clearAllLocalSnapshots,
  formatBytes,
  applyGraphSettings,
} from '../utils/backupSystem';
import {
  INITIAL_NOTES,
  INITIAL_FOLDERS,
  DEMO_NOTE_IDS,
  DEMO_FOLDER_IDS,
  isDemoNote,
  isDemoFolder,
  isDemoFolderId,
} from '../utils/seedData';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteFile[];
  folders: FolderType[];
  activeTheme?: ThemeConfig;
  onRestoreVault: (newNotes: NoteFile[], newFolders: FolderType[], newTheme?: ThemeConfig) => void;
}

type TabType = 'backup' | 'restore' | 'snapshots' | 'reset';

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  activeTheme,
  onRestoreVault,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('backup');
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>([]);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Restore file inspection state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [isProcessingRestore, setIsProcessingRestore] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load snapshots whenever modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setSnapshots(getLocalSnapshots());
      setNotification(null);
    }
  }, [isOpen, activeTab]);

  // Handle escape key
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

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Download Backup
  const handleDownloadBackup = () => {
    try {
      const backupPkg = createVaultBackup(notes, folders, activeTheme);
      downloadVaultBackupFile(backupPkg);
      showToast('success', `Vault backup with ${notes.length} notes and ${folders.length} folders downloaded.`);
    } catch (err: any) {
      showToast('error', `Failed to export backup: ${err.message}`);
    }
  };

  // 2. Copy Backup JSON to clipboard
  const handleCopyBackup = async () => {
    try {
      const backupPkg = createVaultBackup(notes, folders, activeTheme);
      await navigator.clipboard.writeText(JSON.stringify(backupPkg, null, 2));
      setIsCopied(true);
      showToast('success', 'Backup JSON copied to clipboard.');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('error', 'Failed to copy to clipboard.');
    }
  };

  // 3. Create Manual Local Snapshot
  const handleCreateSnapshot = () => {
    try {
      const label = newSnapshotLabel.trim() || undefined;
      const snap = saveLocalSnapshot(notes, folders, activeTheme, 'manual', label);
      setSnapshots(getLocalSnapshots());
      setNewSnapshotLabel('');
      showToast('success', `Snapshot created: "${snap.label}" (${snap.noteCount} notes).`);
    } catch (err: any) {
      showToast('error', `Failed to create snapshot: ${err.message}`);
    }
  };

  // 4. File selection for restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSelectedFile = async (file: File) => {
    setUploadedFileName(file.name);
    try {
      const text = await file.text();
      const preview = validateBackupContent(text);
      setRestorePreview(preview);
      if (!preview.isValid) {
        showToast('error', preview.errors[0] || 'Invalid backup format');
      } else {
        showToast('info', `Analyzed backup: ${preview.stats.noteCount} notes detected.`);
      }
    } catch (err: any) {
      setRestorePreview(null);
      showToast('error', `Could not read file: ${err.message}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // 5. Execute Restore from inspected file
  const handleExecuteRestore = () => {
    if (!restorePreview || !restorePreview.package) return;
    setIsProcessingRestore(true);

    try {
      // Step A: Automatically take a safety snapshot of current vault first!
      saveLocalSnapshot(
        notes,
        folders,
        activeTheme,
        'pre-restore',
        `Safety Snapshot before ${restoreMode === 'merge' ? 'Merge' : 'Overwrite'} (${new Date().toLocaleTimeString()})`
      );

      const pkg = restorePreview.package;

      if (restoreMode === 'replace') {
        // Apply settings if present
        if (pkg.graphSettings) applyGraphSettings(pkg.graphSettings);
        onRestoreVault(pkg.notes, pkg.folders, pkg.theme);
        showToast('success', `Vault replaced! Restored ${pkg.notes.length} notes and ${pkg.folders.length} folders.`);
      } else {
        // Smart Merge
        const merged = mergeVaultData(notes, folders, pkg.notes, pkg.folders);
        if (pkg.graphSettings) applyGraphSettings(pkg.graphSettings);
        onRestoreVault(merged.mergedNotes, merged.mergedFolders, pkg.theme || activeTheme);
        showToast(
          'success',
          `Merged: +${merged.addedNotesCount} new notes, ${merged.updatedNotesCount} updated notes, +${merged.addedFoldersCount} folders.`
        );
      }

      setSnapshots(getLocalSnapshots());
      setTimeout(() => {
        setIsProcessingRestore(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsProcessingRestore(false);
      showToast('error', `Failed to complete restore: ${err.message}`);
    }
  };

  // 6. Restore from a saved local snapshot
  const handleRestoreFromSnapshot = (snap: LocalSnapshot) => {
    const confirmMsg = `Restore snapshot "${snap.label}" from ${new Date(snap.createdAt).toLocaleString()}?\n\nA safety snapshot of your current vault will be saved automatically before rolling back.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      // Take safety snapshot first
      saveLocalSnapshot(
        notes,
        folders,
        activeTheme,
        'pre-restore',
        `Safety snapshot before rollback to "${snap.label}"`
      );

      const pkg = snap.data;
      if (pkg.graphSettings) applyGraphSettings(pkg.graphSettings);
      onRestoreVault(pkg.notes, pkg.folders, pkg.theme);
      setSnapshots(getLocalSnapshots());
      showToast('success', `Successfully rolled back to snapshot "${snap.label}".`);
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      showToast('error', `Failed to restore snapshot: ${err.message}`);
    }
  };

  // 7. Delete snapshot
  const handleDeleteSnapshot = (id: string, label: string) => {
    if (window.confirm(`Delete snapshot "${label}"?`)) {
      deleteLocalSnapshot(id);
      setSnapshots(getLocalSnapshots());
      showToast('info', 'Snapshot deleted.');
    }
  };

  // 8. Reset to clean seed vault
  const handleResetToSeed = () => {
    if (
      !window.confirm(
        'Reset vault to initial sample templates?\n\nA safety snapshot of your current notes will be saved automatically so you can undo anytime.'
      )
    ) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pkm_demo_data_removed');
      }
      saveLocalSnapshot(notes, folders, activeTheme, 'pre-restore', 'Safety snapshot before reset to seed templates');
      onRestoreVault(INITIAL_NOTES, INITIAL_FOLDERS);
      setSnapshots(getLocalSnapshots());
      showToast('success', 'Vault reset to default templates.');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      showToast('error', `Failed to reset vault: ${err.message}`);
    }
  };

  // 9. Remove Demo Data (Purge sample seed notes and directories, keeping user notes safe)
  const handleRemoveDemoData = () => {
    const demoNotesInVault = notes.filter((n) => isDemoNote(n));
    const demoFoldersInVault = folders.filter((f) => isDemoFolder(f));

    if (demoNotesInVault.length === 0 && demoFoldersInVault.length === 0) {
      showToast('info', 'No demo notes or folders found in your vault.');
      return;
    }

    const customNotesCount = notes.length - demoNotesInVault.length;
    const customFoldersCount = folders.length - demoFoldersInVault.length;

    const confirmMsg =
      `Remove ${demoNotesInVault.length} demo note${demoNotesInVault.length === 1 ? '' : 's'} and ${demoFoldersInVault.length} sample folder${demoFoldersInVault.length === 1 ? '' : 's'}?\n\n` +
      (customNotesCount > 0
        ? `Your ${customNotesCount} custom note${customNotesCount === 1 ? '' : 's'} and ${customFoldersCount} folder${customFoldersCount === 1 ? '' : 's'} will be safely preserved.\n\n`
        : `Your vault will be completely cleared of sample notes so you can start fresh.\n\n`) +
      `A safety snapshot will be saved automatically before removing, allowing one-click rollback if needed.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // Step A: Save automatic safety snapshot
      saveLocalSnapshot(
        notes,
        folders,
        activeTheme,
        'pre-restore',
        `Safety snapshot before removing ${demoNotesInVault.length} demo notes`
      );

      // Step B: Mark demo data as removed in browser storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pkm_demo_data_removed', 'true');
      }

      // Step C: Filter out demo notes, reparenting any custom notes placed inside demo folders to root (null)
      const nonDemoNotes = notes.filter((n) => !isDemoNote(n));
      const cleanedNotes = nonDemoNotes.map((n) => {
        if (n.folderId && isDemoFolderId(n.folderId)) {
          return { ...n, folderId: null, updatedAt: Date.now() };
        }
        return n;
      });

      // Step D: Filter out demo folders, reparenting any subfolders inside demo folders to root (null)
      const cleanedFolders = folders
        .filter((f) => !isDemoFolder(f))
        .map((f) => {
          if (f.parentId && isDemoFolderId(f.parentId)) {
            return { ...f, parentId: null };
          }
          return f;
        });

      onRestoreVault(cleanedNotes, cleanedFolders);
      setSnapshots(getLocalSnapshots());
      showToast(
        'success',
        `Removed ${demoNotesInVault.length} demo notes and ${demoFoldersInVault.length} sample folders. Safety checkpoint created.`
      );
    } catch (err: any) {
      showToast('error', `Failed to remove demo data: ${err.message}`);
    }
  };

  // Compute demo data counts
  const demoNotesCount = notes.filter((n) => isDemoNote(n)).length;
  const demoFoldersCount = folders.filter((f) => isDemoFolder(f)).length;
  const userNotesCount = notes.length - demoNotesCount;
  const userFoldersCount = folders.length - demoFoldersCount;

  // Compute total tags
  const totalTags = new Set(notes.flatMap((n) => n.tags || [])).size;
  const vaultSizeBytes = new Blob([JSON.stringify({ notes, folders })]).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#150d24] border border-[#2e1c52] rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#faf5ff] font-['Space_Grotesk',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#1f1338] border-b border-[#2e1c52] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[6px] bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#faf5ff] flex items-center gap-2">
                <span>Vault Backup & Restore Center</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30">
                  v2.1
                </span>
              </h2>
              <p className="text-[11px] text-[#c084fc]">
                Full JSON exports, versioned local snapshots, and safe rollback protection.
              </p>
            </div>
          </div>
          <button
            id="btn-close-backup-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] bg-[#1f1338] hover:bg-rose-950/60 text-[#c084fc] hover:text-rose-200 border border-[#2e1c52] hover:border-rose-500/50 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2e1c52] bg-[#150d24] px-4 py-2.5 gap-2 text-xs shrink-0 flex-wrap sm:flex-nowrap">
          <button
            id="tab-backup"
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer font-semibold ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-[#1f1338] text-blue-200/70 hover:text-white hover:bg-[#281745] border border-[#2e1c52]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Create Backup</span>
          </button>

          <button
            id="tab-restore"
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer font-semibold ${
              activeTab === 'restore'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-[#1f1338] text-cyan-200/70 hover:text-white hover:bg-[#281745] border border-[#2e1c52]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Restore from File</span>
            {restorePreview && restorePreview.isValid && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            id="tab-snapshots"
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer font-semibold ${
              activeTab === 'snapshots'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-[#1f1338] text-purple-200/70 hover:text-white hover:bg-[#281745] border border-[#2e1c52]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-white" />
            <span>Local Snapshots</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                activeTab === 'snapshots'
                  ? 'bg-purple-800 text-white border-purple-400'
                  : 'bg-[#150d24] text-[#c084fc] border-[#2e1c52]'
              }`}
            >
              {snapshots.length}
            </span>
          </button>

          <button
            id="tab-reset"
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer font-semibold sm:ml-auto ${
              activeTab === 'reset'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#1f1338] text-amber-300/80 hover:text-amber-100 hover:bg-[#281745] border border-amber-500/30'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Reset & Demo Data</span>
            {demoNotesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" title={`${demoNotesCount} demo notes present`} />
            )}
          </button>
        </div>

        {/* Notifications Bar */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b shrink-0 ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800'
                : notification.type === 'error'
                ? 'bg-rose-950/60 text-rose-200 border-rose-800'
                : 'bg-indigo-950/60 text-indigo-200 border-indigo-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
            {notification.type === 'info' && <Info className="w-3.5 h-3.5 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CREATE BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Vault Stats Overview Card */}
              <div className="bg-[#1f1338] border border-[#2e1c52] rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 rounded-full bg-[#ec4899]/15 text-[#ec4899]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#faf5ff]">Current Knowledge Vault</h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#c084fc] font-['Space_Mono',monospace] mt-1">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#ec4899]" />
                        {notes.length} notes
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3 text-[#ec4899]" />
                        {folders.length} folders
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#ec4899]" />
                        {totalTags} tags
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto text-[11px] text-[#c084fc]">
                  <div>Estimated Vault Size</div>
                  <div className="font-mono text-sm font-bold text-[#faf5ff]">{formatBytes(vaultSizeBytes)}</div>
                </div>
              </div>

              {/* Quick Remove Demo Data Banner (Prominently accessible right on overview) */}
              {(demoNotesCount > 0 || demoFoldersCount > 0) && (
                <div className="bg-[#1f1338] border border-rose-500/40 rounded-[8px] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-950/40 via-[#1f1338] to-[#1f1338]">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-[6px] bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0 mt-0.5 sm:mt-0">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#faf5ff] flex items-center gap-2">
                        <span>Sample Demo Data Detected</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                          {demoNotesCount} notes • {demoFoldersCount} folders
                        </span>
                      </div>
                      <p className="text-[11px] text-[#c084fc] mt-0.5">
                        {userNotesCount > 0
                          ? `You have ${userNotesCount} custom note${userNotesCount === 1 ? '' : 's'} which will be safely kept. Remove sample demo notes anytime.`
                          : 'Clear out the default sample notes & folders to begin with a clean slate.'}
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-quick-remove-demo-data"
                    type="button"
                    onClick={handleRemoveDemoData}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm border border-rose-400/40"
                    title="Remove sample demo notes and folders"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Remove Demo Data Only</span>
                  </button>
                </div>
              )}

              {/* Action 1: Export Complete JSON File */}
              <div className="bg-[#150d24] border border-[#2e1c52] rounded-[8px] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Download Full Vault Backup Archive</span>
                    </h4>
                    <p className="text-[11px] text-[#c084fc] mt-0.5">
                      Exports complete notes, frontmatter headers, folder hierarchy, theme configuration, and graph visual parameters into a standalone JSON file.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                  <button
                    id="btn-download-vault-backup"
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm border border-blue-400/40"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download Vault Backup Archive (.json)</span>
                  </button>

                  <button
                    id="btn-copy-backup-json"
                    type="button"
                    onClick={handleCopyBackup}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm border border-purple-400/40"
                    title="Copy full backup JSON to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Archive to Clipboard'}</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Save Versioned Local Snapshot */}
              <div className="bg-[#150d24] border border-[#2e1c52] rounded-[8px] p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Create Local Browser Snapshot</span>
                  </h4>
                  <p className="text-[11px] text-[#c084fc] mt-0.5">
                    Instantly freezes the current state of your vault in local browser storage so you can roll back at any time.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    id="input-snapshot-label"
                    type="text"
                    value={newSnapshotLabel}
                    onChange={(e) => setNewSnapshotLabel(e.target.value)}
                    placeholder="Optional memo (e.g. 'Before major refactoring')..."
                    className="w-full sm:flex-1 py-1.5 px-3 text-xs bg-[#1f1338] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] placeholder:text-[#c084fc]/50 focus:outline-none focus:border-emerald-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSnapshot();
                    }}
                  />
                  <button
                    id="btn-create-local-snapshot"
                    type="button"
                    onClick={handleCreateSnapshot}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm border border-emerald-400/40"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Save Snapshot Checkpoint</span>
                  </button>
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3 rounded-[6px] bg-[#1f1338]/60 border border-[#2e1c52] flex items-start gap-2 text-[11px] text-[#c084fc]">
                <Info className="w-4 h-4 text-[#ec4899] shrink-0 mt-0.5" />
                <span>
                  <strong>Safety First:</strong> Backups contain raw frontmatter formatting and are fully portable across Obsidian, Logseq, and text editors. When you restore any backup or snapshot, the system will automatically create an emergency safety snapshot of your current notes first.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE FROM FILE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[8px] p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#ec4899] bg-[#ec4899]/10'
                    : 'border-[#2e1c52] bg-[#1f1338]/40 hover:border-[#ec4899]/60 hover:bg-[#1f1338]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pkmbackup"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-[#150d24] text-[#ec4899] border border-[#2e1c52]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#faf5ff]">
                      {uploadedFileName ? uploadedFileName : 'Click to select or drag & drop backup file'}
                    </span>
                    <p className="text-[11px] text-[#c084fc] mt-0.5">
                      Supports .json backup files and legacy vault exports
                    </p>
                  </div>
                </div>
              </div>

              {/* Inspection Preview Card */}
              {restorePreview && (
                <div className="bg-[#1f1338] border border-[#2e1c52] rounded-[8px] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2e1c52]">
                    <span className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#ec4899]" />
                      <span>Archive Inspection Preview</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                        restorePreview.isValid
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border-rose-700'
                      }`}
                    >
                      {restorePreview.isValid ? 'Valid PKM Archive' : 'Invalid Archive'}
                    </span>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                      <div className="text-[10px] text-[#c084fc] font-sans">Notes</div>
                      <div className="font-bold text-[#faf5ff] mt-0.5">{restorePreview.stats.noteCount}</div>
                    </div>
                    <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                      <div className="text-[10px] text-[#c084fc] font-sans">Folders</div>
                      <div className="font-bold text-[#faf5ff] mt-0.5">{restorePreview.stats.folderCount}</div>
                    </div>
                    <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                      <div className="text-[10px] text-[#c084fc] font-sans">Unique Tags</div>
                      <div className="font-bold text-[#faf5ff] mt-0.5">{restorePreview.stats.tagCount}</div>
                    </div>
                    <div className="p-2 rounded bg-[#150d24] border border-[#2e1c52]">
                      <div className="text-[10px] text-[#c084fc] font-sans">File Size</div>
                      <div className="font-bold text-[#faf5ff] mt-0.5">{formatBytes(restorePreview.stats.sizeBytes)}</div>
                    </div>
                  </div>

                  {/* Warnings or Notes Preview */}
                  {restorePreview.warnings.length > 0 && (
                    <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200 space-y-1">
                      {restorePreview.warnings.map((w, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {restorePreview.package?.notes && restorePreview.package.notes.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#c084fc]">Sample Notes in Archive:</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                        {restorePreview.package.notes.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-[#150d24] border border-[#2e1c52]/60"
                          >
                            <span className="font-medium text-[#faf5ff] truncate">{n.title}</span>
                            <span className="text-[10px] text-[#c084fc] font-mono shrink-0 ml-2">
                              {n.tags.length} tags
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restore Mode Options */}
                  {restorePreview.isValid && (
                    <div className="pt-2 border-t border-[#2e1c52] space-y-2">
                      <span className="text-[11px] font-bold text-[#faf5ff]">Choose Restore Strategy:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`p-2.5 rounded-[6px] border text-xs cursor-pointer flex flex-col justify-between transition-colors ${
                            restoreMode === 'merge'
                              ? 'bg-[#ec4899]/15 border-[#ec4899] text-[#faf5ff]'
                              : 'bg-[#150d24] border-[#2e1c52] text-[#c084fc] hover:border-[#ec4899]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="merge"
                              checked={restoreMode === 'merge'}
                              onChange={() => setRestoreMode('merge')}
                              className="accent-[#ec4899]"
                            />
                            <span className="font-semibold text-[#faf5ff]">Smart Merge</span>
                          </div>
                          <p className="text-[10px] text-[#c084fc] mt-1 pl-5">
                            Appends new notes and folders without deleting existing ones. Updates matching notes if newer.
                          </p>
                        </label>

                        <label
                          className={`p-2.5 rounded-[6px] border text-xs cursor-pointer flex flex-col justify-between transition-colors ${
                            restoreMode === 'replace'
                              ? 'bg-[#ec4899]/15 border-[#ec4899] text-[#faf5ff]'
                              : 'bg-[#150d24] border-[#2e1c52] text-[#c084fc] hover:border-[#ec4899]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="replace"
                              checked={restoreMode === 'replace'}
                              onChange={() => setRestoreMode('replace')}
                              className="accent-[#ec4899]"
                            />
                            <span className="font-semibold text-[#faf5ff]">Complete Overwrite</span>
                          </div>
                          <p className="text-[10px] text-[#c084fc] mt-1 pl-5">
                            Replaces the entire vault with this backup. Auto-saves a safety snapshot first.
                          </p>
                        </label>
                      </div>

                      {/* Execute Restore Button */}
                      <button
                        id="btn-confirm-restore"
                        type="button"
                        disabled={isProcessingRestore}
                        onClick={handleExecuteRestore}
                        className={`w-full mt-2 py-2.5 px-4 rounded-[6px] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 border ${
                          restoreMode === 'merge'
                            ? 'bg-sky-600 hover:bg-sky-500 border-sky-400/40'
                            : 'bg-orange-600 hover:bg-orange-500 border-orange-400/40'
                        }`}
                      >
                        {isProcessingRestore ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>
                          {isProcessingRestore
                            ? 'Restoring Vault...'
                            : restoreMode === 'merge'
                            ? `Merge ${restorePreview.stats.noteCount} Notes into Vault`
                            : `Replace Vault with ${restorePreview.stats.noteCount} Notes`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOCAL SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#faf5ff]">Local Vault Version Timeline</h3>
                  <p className="text-[11px] text-[#c084fc]">
                    Snapshots stored in browser storage. One-click rollback with safety checkpoints.
                  </p>
                </div>
                {snapshots.length > 0 && (
                  <button
                    id="btn-clear-all-snapshots"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete all saved local snapshots?')) {
                        clearAllLocalSnapshots();
                        setSnapshots([]);
                        showToast('info', 'All snapshots cleared.');
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-[5px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 cursor-pointer transition-colors shadow-2xs"
                  >
                    Clear All Snapshots
                  </button>
                )}
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[#2e1c52] rounded-[8px] bg-[#1f1338]/30 space-y-2">
                  <Clock className="w-8 h-8 text-[#c084fc]/40 mx-auto" />
                  <p className="text-xs text-[#faf5ff]">No local snapshots saved yet</p>
                  <p className="text-[11px] text-[#c084fc]">
                    Create your first snapshot or perform a backup to establish automatic rollback points.
                  </p>
                  <button
                    id="btn-create-first-snapshot"
                    type="button"
                    onClick={() => {
                      saveLocalSnapshot(notes, folders, activeTheme, 'manual', 'Initial Manual Snapshot');
                      setSnapshots(getLocalSnapshots());
                      showToast('success', 'First snapshot created.');
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm border border-emerald-400/40"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Create Snapshot Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {snapshots.map((snap) => {
                    const isPreRestore = snap.type === 'pre-restore';
                    const isAuto = snap.type === 'auto';
                    const dateFormatted = new Date(snap.createdAt).toLocaleString();

                    return (
                      <div
                        key={snap.id}
                        className="bg-[#1f1338] border border-[#2e1c52] hover:border-purple-500/50 rounded-[8px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] border ${
                                isPreRestore
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                  : isAuto
                                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                                  : 'bg-purple-950/80 text-purple-300 border-purple-700'
                              }`}
                            >
                              {isPreRestore ? 'Safety' : isAuto ? 'Auto' : 'Manual'}
                            </span>
                            <span className="text-xs font-bold text-[#faf5ff]">{snap.label}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-[#c084fc] font-mono">
                            <span>{dateFormatted}</span>
                            <span>•</span>
                            <span>{snap.noteCount} notes</span>
                            <span>•</span>
                            <span>{snap.folderCount} dirs</span>
                            <span>•</span>
                            <span>{formatBytes(snap.sizeBytes)}</span>
                          </div>
                        </div>

                        {/* Snapshot Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            id={`btn-restore-snap-${snap.id}`}
                            type="button"
                            onClick={() => handleRestoreFromSnapshot(snap)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[5px] bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-2xs border border-purple-400/40"
                            title="Restore this snapshot"
                          >
                            <RotateCcw className="w-3 h-3 text-white" />
                            <span>Rollback</span>
                          </button>

                          <button
                            id={`btn-download-snap-${snap.id}`}
                            type="button"
                            onClick={() => downloadVaultBackupFile(snap.data, `snapshot-${snap.label.toLowerCase().replace(/\s+/g, '-')}.json`)}
                            className="p-1.5 rounded-[5px] bg-slate-700 hover:bg-slate-600 text-slate-100 hover:text-white transition-colors cursor-pointer border border-slate-500 shadow-2xs"
                            title="Download snapshot JSON"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-100" />
                          </button>

                          <button
                            id={`btn-delete-snap-${snap.id}`}
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.id, snap.label)}
                            className="p-1.5 rounded-[5px] bg-rose-900/80 hover:bg-rose-700 text-rose-200 hover:text-white transition-colors cursor-pointer border border-rose-700 shadow-2xs"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESET & DEMO DATA MANAGEMENT */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              {/* Card 1: Remove Demo Data */}
              <div className="bg-[#1f1338] border border-rose-900/50 rounded-[8px] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-[#faf5ff]">Remove Demo Data</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border self-start sm:self-auto ${
                          demoNotesCount > 0 || demoFoldersCount > 0
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {demoNotesCount > 0 || demoFoldersCount > 0
                          ? `${demoNotesCount} demo note${demoNotesCount === 1 ? '' : 's'} • ${demoFoldersCount} folder${demoFoldersCount === 1 ? '' : 's'}`
                          : 'No demo data present'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#c084fc] mt-1">
                      Purges the built-in sample notes and demo folders (<em>01 - Systems</em>, <em>02 - Concepts</em>, <em>03 - Projects</em>, <em>04 - Cloud & Linux Infra</em>). Your custom notes and folders remain completely untouched.
                    </p>
                  </div>
                </div>

                {/* Vault Data Breakdown */}
                <div className="p-3 rounded-[6px] bg-[#150d24] border border-[#2e1c52] text-xs text-[#c084fc] space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-[#2e1c52]/60 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>Demo Notes in Vault:</span>
                    </span>
                    <span className="font-mono font-bold text-[#faf5ff]">{demoNotesCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-b border-[#2e1c52]/60 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-rose-400" />
                      <span>Demo Folders in Vault:</span>
                    </span>
                    <span className="font-mono font-bold text-[#faf5ff]">{demoFoldersCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Custom User Notes (Preserved):</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-300">{userNotesCount}</span>
                  </div>
                  <div className="text-[11px] text-[#c084fc] pt-1 border-t border-[#2e1c52]/60">
                    <span className="font-semibold text-[#faf5ff]">Automatic Safety Protection:</span> A pre-restore safety snapshot will be automatically saved in your <em>Local Snapshots</em> before removal, allowing 1-click undo.
                  </div>
                </div>

                {/* Remove Demo Data Button */}
                <button
                  id="btn-remove-demo-data"
                  type="button"
                  disabled={demoNotesCount === 0 && demoFoldersCount === 0}
                  onClick={handleRemoveDemoData}
                  className={`w-full py-2.5 px-4 rounded-[6px] font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md border ${
                    demoNotesCount > 0 || demoFoldersCount > 0
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer border-rose-400/50'
                      : 'bg-emerald-950/60 text-emerald-300 cursor-not-allowed border-emerald-700/60'
                  }`}
                >
                  {demoNotesCount > 0 || demoFoldersCount > 0 ? (
                    <Trash2 className="w-4 h-4 text-white" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {demoNotesCount > 0 || demoFoldersCount > 0
                      ? `Delete Sample Demo Data (${demoNotesCount} Notes, ${demoFoldersCount} Folders)`
                      : 'All Demo Data Removed (Clean Vault)'}
                  </span>
                </button>
              </div>

              {/* Card 2: Factory Reset to Seed Knowledge Vault */}
              <div className="bg-[#1f1338] border border-amber-900/50 rounded-[8px] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#faf5ff]">Factory Reset to Seed Knowledge Vault</h3>
                    <p className="text-[11px] text-[#c084fc] mt-1">
                      Replaces or restores all initial system templates and sample folders (Architecture, Systems, Projects, and Infra).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-[#150d24] border border-[#2e1c52] text-xs text-[#c084fc] space-y-1">
                  <div className="font-semibold text-[#faf5ff]">Automatic Safety Protection:</div>
                  <p className="text-[11px]">
                    Before performing the reset, an emergency safety snapshot titled <em>"Safety snapshot before reset to seed templates"</em> will be saved in your Local Snapshots history, so you can restore your current work at any time.
                  </p>
                </div>

                <button
                  id="btn-confirm-reset-seed"
                  type="button"
                  onClick={handleResetToSeed}
                  className="w-full py-2.5 px-4 rounded-[6px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md border border-amber-300/60"
                >
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>Factory Reset Vault to Default Templates</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1f1338] border-t border-[#2e1c52] flex items-center justify-between text-[11px] text-[#c084fc] shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted local storage with automatic rollback points</span>
          </span>
          <button
            id="btn-footer-close"
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[5px] bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors cursor-pointer border border-slate-500 shadow-xs text-xs"
          >
            Close Backup Center
          </button>
        </div>
      </div>
    </div>
  );
};
