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
import { INITIAL_NOTES, INITIAL_FOLDERS } from '../utils/seedData';

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
      saveLocalSnapshot(notes, folders, activeTheme, 'pre-restore', 'Safety snapshot before reset to seed templates');
      onRestoreVault(INITIAL_NOTES, INITIAL_FOLDERS);
      setSnapshots(getLocalSnapshots());
      showToast('success', 'Vault reset to default templates.');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      showToast('error', `Failed to reset vault: ${err.message}`);
    }
  };

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
            className="p-1.5 rounded-[6px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#150d24] transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2e1c52] bg-[#150d24] px-4 pt-2 gap-1 text-xs shrink-0">
          <button
            id="tab-backup"
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium cursor-pointer transition-colors ${
              activeTab === 'backup'
                ? 'border-[#ec4899] text-[#faf5ff] font-semibold'
                : 'border-transparent text-[#c084fc] hover:text-[#faf5ff]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Create Backup</span>
          </button>

          <button
            id="tab-restore"
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium cursor-pointer transition-colors ${
              activeTab === 'restore'
                ? 'border-[#ec4899] text-[#faf5ff] font-semibold'
                : 'border-transparent text-[#c084fc] hover:text-[#faf5ff]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Restore from File</span>
            {restorePreview && restorePreview.isValid && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            id="tab-snapshots"
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium cursor-pointer transition-colors ${
              activeTab === 'snapshots'
                ? 'border-[#ec4899] text-[#faf5ff] font-semibold'
                : 'border-transparent text-[#c084fc] hover:text-[#faf5ff]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Local Snapshots</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1f1338] text-[#c084fc] border border-[#2e1c52]">
              {snapshots.length}
            </span>
          </button>

          <button
            id="tab-reset"
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium cursor-pointer transition-colors ml-auto ${
              activeTab === 'reset'
                ? 'border-amber-400 text-[#faf5ff] font-semibold'
                : 'border-transparent text-[#c084fc]/70 hover:text-amber-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Vault</span>
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

              {/* Action 1: Export Complete JSON File */}
              <div className="bg-[#150d24] border border-[#2e1c52] rounded-[8px] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-[#ec4899]" />
                      <span>Download Full Vault Backup Archive</span>
                    </h4>
                    <p className="text-[11px] text-[#c084fc] mt-0.5">
                      Exports complete notes, frontmatter headers, folder hierarchy, theme configuration, and graph visual parameters into a standalone JSON file.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="btn-download-vault-backup"
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup (.json)</span>
                  </button>

                  <button
                    id="btn-copy-backup-json"
                    type="button"
                    onClick={handleCopyBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#1f1338] hover:bg-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] text-xs font-medium transition-colors cursor-pointer border border-[#2e1c52]"
                    title="Copy full backup JSON to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Save Versioned Local Snapshot */}
              <div className="bg-[#150d24] border border-[#2e1c52] rounded-[8px] p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#ec4899]" />
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
                    className="w-full sm:flex-1 py-1.5 px-3 text-xs bg-[#1f1338] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] placeholder:text-[#c084fc]/50 focus:outline-none focus:border-[#ec4899]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSnapshot();
                    }}
                  />
                  <button
                    id="btn-create-local-snapshot"
                    type="button"
                    onClick={handleCreateSnapshot}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#2e1c52] text-[#faf5ff] text-xs font-semibold transition-colors cursor-pointer border border-[#2e1c52] hover:border-[#ec4899]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span>Save Snapshot</span>
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
                        className="w-full mt-2 py-2 px-4 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {isProcessingRestore ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
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
                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Clear All
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
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
                        className="bg-[#1f1338] border border-[#2e1c52] hover:border-[#ec4899]/50 rounded-[8px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] border ${
                                isPreRestore
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                  : isAuto
                                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                                  : 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40'
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
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[5px] bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] transition-colors cursor-pointer"
                            title="Restore this snapshot"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>

                          <button
                            id={`btn-download-snap-${snap.id}`}
                            type="button"
                            onClick={() => downloadVaultBackupFile(snap.data, `snapshot-${snap.label.toLowerCase().replace(/\s+/g, '-')}.json`)}
                            className="p-1.5 rounded-[5px] bg-[#150d24] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] transition-colors cursor-pointer border border-[#2e1c52]"
                            title="Download snapshot JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-delete-snap-${snap.id}`}
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.id, snap.label)}
                            className="p-1.5 rounded-[5px] bg-[#150d24] text-[#c084fc] hover:text-rose-400 hover:bg-[#2e1c52] transition-colors cursor-pointer border border-[#2e1c52]"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESET VAULT */}
          {activeTab === 'reset' && (
            <div className="bg-[#1f1338] border border-amber-900/50 rounded-[8px] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#faf5ff]">Factory Reset to Seed Knowledge Vault</h3>
                  <p className="text-[11px] text-[#c084fc] mt-1">
                    Replaces all current notes and folders with the original clean system templates (Architecture, Network Topology, Security Protocols, and Data Pipelines).
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
                className="w-full py-2.5 px-4 rounded-[6px] bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Clean Seed Vault</span>
              </button>
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
            className="px-3 py-1 rounded-[5px] bg-[#150d24] hover:bg-[#2e1c52] text-[#faf5ff] transition-colors cursor-pointer border border-[#2e1c52]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
