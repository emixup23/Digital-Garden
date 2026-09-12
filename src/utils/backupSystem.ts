import {
  NoteFile,
  Folder,
  ThemeConfig,
  VaultBackupPackage,
  VaultBackupMetadata,
  VaultGraphSettings,
  LocalSnapshot,
  SnapshotType,
  RestorePreview,
  RestoreMode,
} from '../types';
import { parseMfContent } from './parser';

const SNAPSHOTS_STORAGE_KEY = 'pkm_vault_snapshots_v1';
const MAX_SNAPSHOTS = 15;

/**
 * Extracts current graph visual and physics preferences from localStorage
 */
export function getSavedGraphSettings(): VaultGraphSettings {
  try {
    const charge = localStorage.getItem('pkm_graph_charge_strength');
    const linkDist = localStorage.getItem('pkm_graph_link_distance');
    const collision = localStorage.getItem('pkm_graph_collision_radius');
    const strokeWidth = localStorage.getItem('pkm_graph_stroke_width');
    const dotSize = localStorage.getItem('pkm_graph_dot_size');

    return {
      chargeStrength: charge ? Number(charge) : -220,
      linkDistance: linkDist ? Number(linkDist) : 90,
      collisionRadius: collision ? Number(collision) : 26,
      linkStrokeWidth: strokeWidth ? Number(strokeWidth) : 0.1,
      nodeDotSize: dotSize ? Number(dotSize) : 4,
    };
  } catch {
    return {
      chargeStrength: -220,
      linkDistance: 90,
      collisionRadius: 26,
      linkStrokeWidth: 0.1,
      nodeDotSize: 4,
    };
  }
}

/**
 * Applies graph visual and physics settings to localStorage
 */
export function applyGraphSettings(settings?: VaultGraphSettings): void {
  if (!settings) return;
  try {
    if (settings.chargeStrength !== undefined) {
      localStorage.setItem('pkm_graph_charge_strength', String(settings.chargeStrength));
    }
    if (settings.linkDistance !== undefined) {
      localStorage.setItem('pkm_graph_link_distance', String(settings.linkDistance));
    }
    if (settings.collisionRadius !== undefined) {
      localStorage.setItem('pkm_graph_collision_radius', String(settings.collisionRadius));
    }
    if (settings.linkStrokeWidth !== undefined) {
      localStorage.setItem('pkm_graph_stroke_width', String(settings.linkStrokeWidth));
    }
    if (settings.nodeDotSize !== undefined) {
      localStorage.setItem('pkm_graph_dot_size', String(settings.nodeDotSize));
    }
  } catch (err) {
    console.warn('Failed to save graph settings to localStorage', err);
  }
}

/**
 * Assembles a comprehensive, verified Vault Backup Package
 */
export function createVaultBackup(
  notes: NoteFile[],
  folders: Folder[],
  theme?: ThemeConfig,
  customTitle?: string,
  description?: string
): VaultBackupPackage {
  // Collect unique tags
  const tagsSet = new Set<string>();
  notes.forEach((n) => n.tags?.forEach((t) => tagsSet.add(t.toLowerCase())));

  const metadata: VaultBackupMetadata = {
    version: '2.1.0',
    system: 'PKM-Vault',
    exportedAt: new Date().toISOString(),
    title: customTitle || 'Knowledge Vault Backup',
    description: description || 'Full snapshot of notes, folders, linkages, themes, and graph parameters.',
    totalNotes: notes.length,
    totalFolders: folders.length,
    totalTags: tagsSet.size,
  };

  return {
    metadata,
    notes: notes.map((n) => {
      const baseName = n.name ? n.name.replace(/\.(md|mf)$/i, '') : n.title || 'Untitled';
      return {
        id: n.id,
        name: `${baseName}.md`,
        folderId: n.folderId,
        title: n.title,
        content: n.content,
        tags: n.tags || [],
        icon: n.icon,
        iconColor: n.iconColor,
        createdAt: n.createdAt || Date.now(),
        updatedAt: n.updatedAt || Date.now(),
      };
    }),
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId || null,
      icon: f.icon,
      iconColor: f.iconColor,
      createdAt: f.createdAt || Date.now(),
    })),
    theme,
    graphSettings: getSavedGraphSettings(),
  };
}

/**
 * Triggers a file download of the vault backup in the browser
 */
export function downloadVaultBackupFile(backup: VaultBackupPackage, customFilename?: string): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = customFilename || `pkm-vault-backup-${dateStr}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and inspects an uploaded backup file string
 */
export function validateBackupContent(rawText: string): RestorePreview {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      isValid: false,
      stats: { noteCount: 0, folderCount: 0, tagCount: 0, sizeBytes: 0, exportedAt: 'Unknown' },
      errors: ['The selected file is completely empty.'],
      warnings: [],
    };
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (err: any) {
    return {
      isValid: false,
      stats: { noteCount: 0, folderCount: 0, tagCount: 0, sizeBytes: rawText.length, exportedAt: 'Unknown' },
      errors: [`Invalid JSON formatting: ${err.message || 'Syntax error'}`],
      warnings: [],
    };
  }

  // Handle standard backup format or legacy format
  let rawNotes: any[] = [];
  let rawFolders: any[] = [];
  let theme: ThemeConfig | undefined = undefined;
  let graphSettings: VaultGraphSettings | undefined = undefined;
  let exportedAt = new Date().toISOString();
  let system = 'PKM-Vault';
  let version = '2.1.0';

  if (parsed && typeof parsed === 'object') {
    if (parsed.metadata && Array.isArray(parsed.notes)) {
      // Standard v2.1.0 backup package
      rawNotes = parsed.notes;
      rawFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
      theme = parsed.theme;
      graphSettings = parsed.graphSettings;
      exportedAt = parsed.metadata.exportedAt || exportedAt;
      system = parsed.metadata.system || system;
      version = parsed.metadata.version || version;
    } else if (Array.isArray(parsed.notes)) {
      // Legacy export bundle format
      rawNotes = parsed.notes;
      rawFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
      exportedAt = parsed.exportedAt || exportedAt;
      warnings.push('Legacy backup bundle detected. Note schemas will be automatically migrated to v2.1.');
    } else if (Array.isArray(parsed)) {
      // Raw array of notes
      rawNotes = parsed;
      warnings.push('Raw notes array detected. Root folder structure will be generated.');
    } else {
      errors.push('Unrecognized backup format: Root JSON does not contain notes collection.');
      return {
        isValid: false,
        stats: { noteCount: 0, folderCount: 0, tagCount: 0, sizeBytes: rawText.length, exportedAt: 'Unknown' },
        errors,
        warnings,
      };
    }
  }

  // Sanitize notes
  const validatedNotes: NoteFile[] = [];
  const tagsSet = new Set<string>();

  rawNotes.forEach((n, idx) => {
    if (!n || typeof n !== 'object') {
      warnings.push(`Skipped malformed note entry at index ${idx}`);
      return;
    }

    const title = String(n.title || n.name || `Restored Note ${idx + 1}`).replace(/\.(md|mf)$/i, '');
    const cleanBase = String(n.name || title).replace(/\.(md|mf)$/i, '');
    const name = `${cleanBase}.md`;
    const content = typeof n.content === 'string' ? n.content : `# ${title}\n\n`;

    // Extract or parse tags
    let tags: string[] = [];
    if (Array.isArray(n.tags)) {
      tags = n.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else {
      const parsedMf = parseMfContent(content);
      tags = parsedMf.tags;
    }
    tags.forEach((t) => tagsSet.add(t.toLowerCase()));

    const noteIcon = typeof n.icon === 'string' ? n.icon : undefined;
    const noteIconColor = typeof n.iconColor === 'string' ? n.iconColor : undefined;

    validatedNotes.push({
      id: String(n.id || `restored-note-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`),
      name,
      folderId: n.folderId ? String(n.folderId) : null,
      title,
      content,
      tags,
      icon: noteIcon,
      iconColor: noteIconColor,
      createdAt: Number(n.createdAt) || Date.now(),
      updatedAt: Number(n.updatedAt) || Date.now(),
    });
  });

  // Sanitize folders
  const validatedFolders: Folder[] = [];
  rawFolders.forEach((f, idx) => {
    if (!f || typeof f !== 'object') return;
    const name = String(f.name || `Folder ${idx + 1}`);
    const folderIcon = typeof f.icon === 'string' ? f.icon : undefined;
    const folderIconColor = typeof f.iconColor === 'string' ? f.iconColor : undefined;

    validatedFolders.push({
      id: String(f.id || `restored-folder-${Date.now()}-${idx}`),
      name,
      parentId: f.parentId ? String(f.parentId) : null,
      icon: folderIcon,
      iconColor: folderIconColor,
      createdAt: Number(f.createdAt) || Date.now(),
    });
  });

  if (validatedNotes.length === 0) {
    errors.push('No valid notes could be extracted from this backup file.');
  }

  const pkg: VaultBackupPackage = {
    metadata: {
      version,
      system,
      exportedAt,
      totalNotes: validatedNotes.length,
      totalFolders: validatedFolders.length,
      totalTags: tagsSet.size,
    },
    notes: validatedNotes,
    folders: validatedFolders,
    theme,
    graphSettings,
  };

  return {
    isValid: errors.length === 0,
    package: pkg,
    stats: {
      noteCount: validatedNotes.length,
      folderCount: validatedFolders.length,
      tagCount: tagsSet.size,
      sizeBytes: new Blob([rawText]).size,
      exportedAt,
      system,
      version,
    },
    errors,
    warnings,
  };
}

/**
 * Merges imported notes and folders into existing vault non-destructively
 */
export function mergeVaultData(
  currentNotes: NoteFile[],
  currentFolders: Folder[],
  importedNotes: NoteFile[],
  importedFolders: Folder[]
): {
  mergedNotes: NoteFile[];
  mergedFolders: Folder[];
  addedNotesCount: number;
  updatedNotesCount: number;
  addedFoldersCount: number;
} {
  let addedNotesCount = 0;
  let updatedNotesCount = 0;
  let addedFoldersCount = 0;

  // 1. Folders merge
  const folderMap = new Map<string, Folder>();
  const folderNameMap = new Map<string, Folder>();

  currentFolders.forEach((f) => {
    folderMap.set(f.id, f);
    folderNameMap.set(f.name.toLowerCase(), f);
  });

  importedFolders.forEach((f) => {
    if (!folderMap.has(f.id) && !folderNameMap.has(f.name.toLowerCase())) {
      folderMap.set(f.id, f);
      folderNameMap.set(f.name.toLowerCase(), f);
      addedFoldersCount++;
    }
  });

  const mergedFolders = Array.from(folderMap.values());

  // 2. Notes merge
  const noteIdMap = new Map<string, NoteFile>();
  const noteTitleMap = new Map<string, NoteFile>();

  currentNotes.forEach((n) => {
    noteIdMap.set(n.id, n);
    noteTitleMap.set(n.title.toLowerCase().trim(), n);
  });

  importedNotes.forEach((imp) => {
    const existingById = noteIdMap.get(imp.id);
    const existingByTitle = noteTitleMap.get(imp.title.toLowerCase().trim());

    if (existingById) {
      // If imported note has a newer timestamp, update content; otherwise keep current
      if (imp.updatedAt > existingById.updatedAt) {
        // Union tags
        const unionTags = Array.from(new Set([...existingById.tags, ...imp.tags]));
        noteIdMap.set(imp.id, {
          ...existingById,
          content: imp.content,
          tags: unionTags,
          updatedAt: imp.updatedAt,
        });
        updatedNotesCount++;
      }
    } else if (existingByTitle) {
      // Same title but different ID: merge tags, update content if imported is newer
      if (imp.updatedAt > existingByTitle.updatedAt) {
        const unionTags = Array.from(new Set([...existingByTitle.tags, ...imp.tags]));
        noteIdMap.set(existingByTitle.id, {
          ...existingByTitle,
          content: imp.content,
          tags: unionTags,
          updatedAt: imp.updatedAt,
        });
        updatedNotesCount++;
      }
    } else {
      // Brand new note
      noteIdMap.set(imp.id, imp);
      noteTitleMap.set(imp.title.toLowerCase().trim(), imp);
      addedNotesCount++;
    }
  });

  return {
    mergedNotes: Array.from(noteIdMap.values()),
    mergedFolders,
    addedNotesCount,
    updatedNotesCount,
    addedFoldersCount,
  };
}

/**
 * Loads all local snapshots stored in the browser
 */
export function getLocalSnapshots(): LocalSnapshot[] {
  try {
    const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch (err) {
    console.error('Failed to load local snapshots from storage', err);
  }
  return [];
}

/**
 * Saves a local snapshot to browser storage
 */
export function saveLocalSnapshot(
  notes: NoteFile[],
  folders: Folder[],
  theme?: ThemeConfig,
  type: SnapshotType = 'manual',
  label?: string
): LocalSnapshot {
  const existing = getLocalSnapshots();
  const backupPkg = createVaultBackup(notes, folders, theme);
  const pkgStr = JSON.stringify(backupPkg);

  const snapshot: LocalSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
    type,
    label:
      label ||
      (type === 'pre-restore'
        ? 'Pre-Restore Safety Snapshot'
        : type === 'auto'
        ? 'Automatic Vault Snapshot'
        : 'Manual Vault Snapshot'),
    noteCount: notes.length,
    folderCount: folders.length,
    sizeBytes: new Blob([pkgStr]).size,
    data: backupPkg,
  };

  // Prepend new snapshot and enforce MAX_SNAPSHOTS limit (preserving manual snapshots where possible)
  const updated = [snapshot, ...existing];
  if (updated.length > MAX_SNAPSHOTS) {
    // Drop oldest auto or pre-restore snapshots first
    const pruned: LocalSnapshot[] = [];
    let removedCount = 0;
    const targetToRemove = updated.length - MAX_SNAPSHOTS;

    for (let i = updated.length - 1; i >= 0; i--) {
      const s = updated[i];
      if (removedCount < targetToRemove && s.type !== 'manual') {
        removedCount++;
      } else {
        pruned.unshift(s);
      }
    }
    // If still over limit, truncate from bottom
    while (pruned.length > MAX_SNAPSHOTS) {
      pruned.pop();
    }
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(pruned));
    } catch (e) {
      console.warn('LocalStorage quota reached when saving snapshot', e);
    }
  } else {
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage quota reached when saving snapshot', e);
    }
  }

  return snapshot;
}

/**
 * Deletes a single snapshot by ID
 */
export function deleteLocalSnapshot(snapshotId: string): void {
  const existing = getLocalSnapshots();
  const filtered = existing.filter((s) => s.id !== snapshotId);
  try {
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to update snapshots after delete', err);
  }
}

/**
 * Clears all local snapshots
 */
export function clearAllLocalSnapshots(): void {
  try {
    localStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear snapshots', err);
  }
}

/**
 * Formats bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
