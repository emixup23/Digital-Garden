import { NoteFile, Folder } from '../types';
import { INITIAL_NOTES, INITIAL_FOLDERS } from './seedData';
import { parseMfContent, formatMfContent } from './parser';

const STORAGE_KEY_NOTES = 'pkm_mf_notes_v2';
const STORAGE_KEY_FOLDERS = 'pkm_mf_folders_v2';

// IndexedDB database name and version for offline redundancy
const IDB_NAME = 'pkm_offline_vault_db';
const IDB_VERSION = 1;

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Asynchronously mirrors current vault notes to IndexedDB for offline protection
 */
async function mirrorToIndexedDB(notes: NoteFile[], folders: Folder[]): Promise<void> {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(['notes', 'folders', 'metadata'], 'readwrite');
    const notesStore = tx.objectStore('notes');
    const foldersStore = tx.objectStore('folders');
    const metaStore = tx.objectStore('metadata');

    notesStore.clear();
    for (const note of notes) {
      notesStore.put(note);
    }

    foldersStore.clear();
    for (const folder of folders) {
      foldersStore.put(folder);
    }

    metaStore.put(Date.now(), 'last_synced_at');
  } catch (err) {
    // Non-blocking background sync
    console.debug('IndexedDB mirror background note sync:', err);
  }
}

export function loadNotesFromStorage(): NoteFile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasChanges = false;
        // Migrate any pre-existing .mf note names to .md
        const migrated: NoteFile[] = parsed.map((n: NoteFile) => {
          if (n.name && n.name.endsWith('.mf')) {
            hasChanges = true;
            return {
              ...n,
              name: n.name.replace(/\.mf$/i, '.md'),
            };
          }
          if (!n.name) {
            hasChanges = true;
            return {
              ...n,
              name: `${n.title || 'Untitled'}.md`,
            };
          }
          return n;
        });

        const hasCodeNote = migrated.some((n: NoteFile) => n.id === 'note-coding-highlights');
        if (!hasCodeNote) {
          const codeNote = INITIAL_NOTES.find((n) => n.id === 'note-coding-highlights');
          if (codeNote) {
            migrated.push(codeNote);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          try {
            localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(migrated));
          } catch {
            // Ignore localstorage quota errors
          }
        }

        return migrated;
      }
    }
  } catch (err) {
    console.error('Failed to load notes from localStorage', err);
  }
  return INITIAL_NOTES;
}

export function saveNotesToStorage(notes: NoteFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    // Asynchronously mirror to IndexedDB for offline durability
    openOfflineDB().then((db) => {
      const tx = db.transaction(['notes'], 'readwrite');
      const store = tx.objectStore('notes');
      store.clear();
      for (const n of notes) {
        store.put(n);
      }
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save notes to localStorage', err);
  }
}

export function loadFoldersFromStorage(): Folder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load folders from localStorage', err);
  }
  return INITIAL_FOLDERS;
}

export function saveFoldersToStorage(folders: Folder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    // Asynchronously mirror to IndexedDB for offline durability
    openOfflineDB().then((db) => {
      const tx = db.transaction(['folders'], 'readwrite');
      const store = tx.objectStore('folders');
      store.clear();
      for (const f of folders) {
        store.put(f);
      }
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save folders to localStorage', err);
  }
}

/**
 * Attempts to restore notes from IndexedDB if localStorage was wiped
 */
export async function restoreFromIndexedDB(): Promise<{ notes: NoteFile[]; folders: Folder[] } | null> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['notes', 'folders'], 'readonly');
      const notesReq = tx.objectStore('notes').getAll();
      const foldersReq = tx.objectStore('folders').getAll();

      tx.oncomplete = () => {
        const notes = notesReq.result as NoteFile[];
        const folders = foldersReq.result as Folder[];
        if (notes && notes.length > 0) {
          resolve({ notes, folders: folders || [] });
        } else {
          resolve(null);
        }
      };
      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Formats a note for export ensuring identical frontmatter and content
 * structure matching what importMdFile expects.
 */
export function formatNoteForExport(note: NoteFile): string {
  const parsed = parseMfContent(note.content || '');
  const title = note.title || parsed.title || (note.name ? note.name.replace(/\.(md|mf|markdown|txt)$/i, '') : 'Untitled Note');
  const tags = Array.from(
    new Set([
      ...(Array.isArray(note.tags) ? note.tags : []),
      ...(Array.isArray(parsed.tags) ? parsed.tags : []),
    ].map((t) => t.replace(/^#/, '').trim()))
  ).filter(Boolean);
  const icon = note.icon || parsed.icon;
  const iconColor = note.iconColor || parsed.iconColor;
  const body = (parsed.content || '').trimStart();

  return formatMfContent(
    title,
    tags,
    body ? (body.startsWith('#') ? body : `# ${title}\n\n${body}`) : `# ${title}\n\n`,
    icon,
    iconColor
  );
}

/**
 * Downloads a note as an individual .md (Markdown) file in standard import/export format
 */
export function downloadNoteAsMd(note: NoteFile): void {
  const fileContent = formatNoteForExport(note);
  const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
  const baseName = note.name ? note.name.replace(/\.(md|mf|markdown|txt)$/i, '') : note.title || 'Untitled';
  const filename = `${baseName || 'Untitled'}.md`;
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
 * Downloads multiple notes as individual .md files with identical import format
 */
export function downloadAllNotesAsMd(notes: NoteFile[]): void {
  if (!notes || notes.length === 0) return;
  notes.forEach((note, index) => {
    setTimeout(() => {
      downloadNoteAsMd(note);
    }, index * 150);
  });
}

// Retain backward-compatible alias for any legacy callers
export const downloadNoteAsMf = downloadNoteAsMd;

/**
 * Exports all notes as a single structured JSON bundle with raw .md contents
 */
export function exportVaultBundle(notes: NoteFile[], folders: Folder[]): void {
  const bundle = {
    exportedAt: new Date().toISOString(),
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      icon: f.icon,
      iconColor: f.iconColor,
      createdAt: f.createdAt,
    })),
    notes: notes.map((n) => {
      const baseName = n.name ? n.name.replace(/\.(md|mf|markdown|txt)$/i, '') : n.title || 'Untitled';
      const cleanName = `${baseName || 'Untitled'}.md`;
      return {
        name: cleanName,
        title: n.title,
        folderId: n.folderId,
        content: formatNoteForExport(n),
        tags: n.tags,
        icon: n.icon,
        iconColor: n.iconColor,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    }),
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `knowledge-vault-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a .md or .mf file from File object
 */
export async function importMdFile(file: File, folderId: string | null = null): Promise<NoteFile> {
  const text = await file.text();
  const rawFileName = file.name;
  const cleanBase = rawFileName.replace(/\.(md|mf|markdown|txt)$/i, '');
  const fileName = `${cleanBase || 'Imported Note'}.md`;
  const defaultTitle = cleanBase;

  const parsed = parseMfContent(text);
  const title = parsed.title || defaultTitle;

  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    folderId,
    title,
    content: text,
    tags: parsed.tags,
    icon: parsed.icon,
    iconColor: parsed.iconColor,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Retain backward-compatible alias for any legacy callers
export const importMfFile = importMdFile;

/**
 * Factory helper for creating a brand new .md note
 */
export function createNewNote(
  title: string,
  folderId: string | null = null,
  tags: string[] = []
): NoteFile {
  const cleanTitle = title.trim() || 'Untitled Note';
  const fileName = `${cleanTitle}.md`;
  const initialContent = formatMfContent(cleanTitle, tags, `# ${cleanTitle}\n\nStart writing here...\n`);

  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    folderId,
    title: cleanTitle,
    content: initialContent,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
