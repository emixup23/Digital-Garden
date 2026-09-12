/**
 * Vault Image & Attachment Storage
 *
 * Persists image attachments into IndexedDB so note markdown files remain clean,
 * standard, and readable (e.g. `![Architecture](attachment:architecture-diagram.png)`)
 * instead of littering the editor with hundreds of thousands of raw base64 characters.
 */

export interface AttachmentRecord {
  id: string; // e.g., "attachment:photo-20260911-120000.png"
  name: string; // "photo.png"
  dataUrl: string; // base64 or blob URL
  size: number; // approximate size in bytes
  mimeType: string;
  createdAt: number;
}

export interface NoteImageInfo {
  alt: string;
  src: string;
  isAttachment: boolean;
  isDataUrl: boolean;
  isWebUrl: boolean;
  fullMatch: string;
  index: number;
}

const IDB_NAME = 'pkm_vault_attachments_db';
const IDB_VERSION = 1;
const STORE_NAME = 'attachments';
const LOCAL_STORAGE_PREFIX = 'pkm_att_fallback_';

// Synchronous in-memory cache to prevent rendering flicker
const attachmentCache = new Map<string, AttachmentRecord>();

// Open or initialize the IndexedDB attachment database
function openAttachmentDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Optimizes large images (scales down images over maxDimension to prevent memory lag)
 */
export async function optimizeImageDataUrl(
  dataUrl: string,
  maxDimension = 1920,
  quality = 0.88
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  // Do not recompress SVGs
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Skip recompressing if already reasonable size
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 1_200_000) {
        return resolve(dataUrl);
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0, width, height);
        const isPng = dataUrl.startsWith('data:image/png');
        const targetType = isPng ? 'image/png' : 'image/jpeg';
        const optimized = canvas.toDataURL(targetType, quality);
        resolve(optimized.length < dataUrl.length ? optimized : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Generate clean filename for markdown references
 */
export function generateAttachmentFilename(rawName: string): string {
  const cleanExt = rawName.includes('.') ? rawName.split('.').pop()?.toLowerCase() || 'png' : 'png';
  const rawBase = rawName.replace(/\.[^/.]+$/, '').trim();
  const cleanBase = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'image';

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14);

  return `${cleanBase}-${timestamp}.${cleanExt}`;
}

/**
 * Save image data to attachment store and return a clean markdown uri (e.g. `attachment:photo.png`)
 */
export async function saveAttachment(
  dataUrlOrFile: string | File,
  filenameHint?: string
): Promise<{ uri: string; record: AttachmentRecord }> {
  let rawDataUrl: string;
  let rawName = filenameHint || 'uploaded-image.png';
  let mimeType = 'image/png';

  if (typeof dataUrlOrFile === 'string') {
    rawDataUrl = dataUrlOrFile;
    const match = rawDataUrl.match(/^data:([^;]+);/);
    if (match) {
      mimeType = match[1];
    }
  } else {
    rawName = dataUrlOrFile.name || filenameHint || 'uploaded-image.png';
    mimeType = dataUrlOrFile.type || 'image/png';
    rawDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(dataUrlOrFile);
    });
  }

  // Optimize large images
  const finalDataUrl = await optimizeImageDataUrl(rawDataUrl);
  const cleanFilename = generateAttachmentFilename(rawName);
  const uri = `attachment:${cleanFilename}`;

  const record: AttachmentRecord = {
    id: uri,
    name: cleanFilename,
    dataUrl: finalDataUrl,
    size: Math.round((finalDataUrl.length * 3) / 4),
    mimeType,
    createdAt: Date.now(),
  };

  // Cache in-memory
  attachmentCache.set(uri, record);

  // Persist to IndexedDB
  try {
    const db = await openAttachmentDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
  } catch (err) {
    console.warn('Failed to save attachment to IndexedDB, using localStorage fallback', err);
    try {
      if (record.dataUrl.length < 2_000_000) {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${uri}`, JSON.stringify(record));
      }
    } catch {
      // Storage quota reached, cache remains in-memory
    }
  }

  return { uri, record };
}

/**
 * Retrieve an attachment dataUrl by its uri
 */
export async function getAttachment(uri: string): Promise<string | null> {
  if (!uri) return null;

  // Direct check in-memory cache
  if (attachmentCache.has(uri)) {
    return attachmentCache.get(uri)!.dataUrl;
  }

  // Query IndexedDB
  try {
    const db = await openAttachmentDB();
    const result = await new Promise<AttachmentRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(uri);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result) {
      attachmentCache.set(uri, result);
      return result.dataUrl;
    }
  } catch (err) {
    console.debug('IndexedDB lookup error for', uri, err);
  }

  // Fallback to localStorage
  try {
    const fallback = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uri}`);
    if (fallback) {
      const record = JSON.parse(fallback) as AttachmentRecord;
      attachmentCache.set(uri, record);
      return record.dataUrl;
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Synchronously get dataUrl if already cached in memory
 */
export function getAttachmentSync(uri: string): string | null {
  if (attachmentCache.has(uri)) {
    return attachmentCache.get(uri)!.dataUrl;
  }
  return null;
}

/**
 * Resolves any image src (whether attachment:, http:, or data:)
 */
export async function resolveImageSrc(src: string): Promise<string> {
  if (!src) return '';
  if (src.startsWith('attachment:')) {
    const dataUrl = await getAttachment(src);
    return dataUrl || src;
  }
  return src;
}

/**
 * Preload all attachments into the in-memory cache on app load
 */
export async function preloadAttachments(): Promise<void> {
  try {
    const db = await openAttachmentDB();
    const records = await new Promise<AttachmentRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const record of records) {
      attachmentCache.set(record.id, record);
    }
  } catch (err) {
    console.debug('Failed to preload attachments from IndexedDB:', err);
  }
}

/**
 * Scan markdown content and return all detected images
 */
export function findImagesInContent(content: string): NoteImageInfo[] {
  if (!content) return [];
  const results: NoteImageInfo[] = [];
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const alt = match[1] || 'Image';
    let rawSrc = match[2].trim();
    // Strip optional title in quotes
    const titleMatch = rawSrc.match(/^(.*?)\s+["'].*?["']$/);
    if (titleMatch) {
      rawSrc = titleMatch[1];
    }

    results.push({
      alt,
      src: rawSrc,
      isAttachment: rawSrc.startsWith('attachment:'),
      isDataUrl: rawSrc.startsWith('data:image/'),
      isWebUrl: rawSrc.startsWith('http://') || rawSrc.startsWith('https://'),
      fullMatch: match[0],
      index: match.index,
    });
  }

  return results;
}

export const extractNoteImages = findImagesInContent;

/**
 * Extract raw base64 data URLs from markdown content, store them in IndexedDB,
 * and replace the huge base64 text with clean user-friendly `attachment:` references.
 */
export async function extractAndMigrateDataUrls(
  content: string
): Promise<{ newContent: string; migratedCount: number }> {
  if (!content || !content.includes('data:image/')) {
    return { newContent: content, migratedCount: 0 };
  }

  // Regex matching ![alt](data:image/...;base64,...)
  const regex = /!\[(.*?)\]\((data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+(?:\s+["'].*?["'])?)\)/g;

  let newContent = content;
  let migratedCount = 0;
  const matches: Array<{ fullMatch: string; alt: string; dataUrl: string; titleSuffix: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const alt = match[1] || 'Image';
    let srcPart = match[2].trim();
    let titleSuffix = '';

    const titleMatch = srcPart.match(/^(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)(\s+["'].*?["'])$/);
    if (titleMatch) {
      srcPart = titleMatch[1];
      titleSuffix = titleMatch[2];
    }

    matches.push({
      fullMatch: match[0],
      alt,
      dataUrl: srcPart,
      titleSuffix,
    });
  }

  for (const item of matches) {
    try {
      const { uri } = await saveAttachment(item.dataUrl, item.alt || 'image');
      const replacement = `![${item.alt}](${uri}${item.titleSuffix})`;
      newContent = newContent.replace(item.fullMatch, replacement);
      migratedCount++;
    } catch (err) {
      console.error('Failed to migrate data URL to attachment:', err);
    }
  }

  return { newContent, migratedCount };
}

export async function migrateNoteImagesToAttachments(
  content: string
): Promise<{ updatedContent: string; convertedCount: number }> {
  const result = await extractAndMigrateDataUrls(content);
  return { updatedContent: result.newContent, convertedCount: result.migratedCount };
}

