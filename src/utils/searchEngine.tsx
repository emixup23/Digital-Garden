import React from 'react';
import { NoteFile, Folder } from '../types';

export interface ParsedQuery {
  raw: string;
  terms: string[];
  exactPhrases: string[];
  tagFilters: string[];
  folderFilters: string[];
  titleFilters: string[];
  contentFilters: string[];
  hasImage: boolean;
  hasTodo: boolean;
  hasDone: boolean;
  hasLink: boolean;
  isRecent: boolean;
  negatedTerms: string[];
}

export interface NoteSearchResult {
  note: NoteFile;
  score: number;
  matchedFields: ('title' | 'tag' | 'content' | 'folder')[];
  matchedTags: string[];
  snippet: string | null;
  folderName: string;
}

export type SearchResultMatch = NoteSearchResult;

const RECENT_SEARCHES_KEY = 'pkm_recent_search_queries_v1';
const MAX_RECENT_SEARCHES = 8;

/**
 * Retrieve recent search queries from localStorage
 */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new search query to recent searches
 */
export function saveRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  try {
    const existing = getRecentSearches().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.debug('Failed to save recent search query:', err);
  }
}

/**
 * Remove a single recent query
 */
export function removeRecentSearch(query: string): string[] {
  try {
    const existing = getRecentSearches().filter(
      (item) => item.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(existing));
    return existing;
  } catch {
    return [];
  }
}

/**
 * Clear all recent search queries
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}
}

/**
 * Parses user search query into structured operators and tokens
 * Supports:
 * - tag:foo or #foo
 * - folder:bar or dir:bar
 * - title:baz
 * - content:qux
 * - has:image / has:todo / has:done / has:link
 * - is:recent / is:today
 * - "exact phrase"
 * - -negatedTerm
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = {
    raw: query,
    terms: [],
    exactPhrases: [],
    tagFilters: [],
    folderFilters: [],
    titleFilters: [],
    contentFilters: [],
    hasImage: false,
    hasTodo: false,
    hasDone: false,
    hasLink: false,
    isRecent: false,
    negatedTerms: [],
  };

  if (!query || !query.trim()) return parsed;

  let working = query.trim();

  // Extract exact phrases wrapped in double quotes
  const quoteRegex = /"([^"]+)"/g;
  let quoteMatch: RegExpExecArray | null;
  while ((quoteMatch = quoteRegex.exec(working)) !== null) {
    if (quoteMatch[1]?.trim()) {
      parsed.exactPhrases.push(quoteMatch[1].trim().toLowerCase());
    }
  }
  working = working.replace(quoteRegex, ' ');

  // Split remaining string by whitespace
  const tokens = working.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const lower = token.toLowerCase();

    // Negated term
    if (token.startsWith('-') && token.length > 1) {
      parsed.negatedTerms.push(token.slice(1).toLowerCase());
      continue;
    }

    // Hashtag e.g. #productivity
    if (token.startsWith('#') && token.length > 1) {
      parsed.tagFilters.push(token.slice(1).toLowerCase());
      continue;
    }

    // Explicit tag:
    if (lower.startsWith('tag:')) {
      const val = token.slice(4).trim().toLowerCase();
      if (val) parsed.tagFilters.push(val);
      continue;
    }

    // Explicit folder: or dir:
    if (lower.startsWith('folder:') || lower.startsWith('dir:')) {
      const idx = token.indexOf(':');
      const val = token.slice(idx + 1).trim().toLowerCase();
      if (val) parsed.folderFilters.push(val);
      continue;
    }

    // Explicit title:
    if (lower.startsWith('title:')) {
      const val = token.slice(6).trim().toLowerCase();
      if (val) parsed.titleFilters.push(val);
      continue;
    }

    // Explicit content:
    if (lower.startsWith('content:')) {
      const val = token.slice(8).trim().toLowerCase();
      if (val) parsed.contentFilters.push(val);
      continue;
    }

    // has: operators
    if (lower.startsWith('has:')) {
      const target = lower.slice(4);
      if (target === 'image' || target === 'images' || target === 'attachment') {
        parsed.hasImage = true;
      } else if (target === 'todo' || target === 'task' || target === 'tasks') {
        parsed.hasTodo = true;
      } else if (target === 'done' || target === 'completed') {
        parsed.hasDone = true;
      } else if (target === 'link' || target === 'links' || target === 'wikilink') {
        parsed.hasLink = true;
      }
      continue;
    }

    // is: operators
    if (lower === 'is:recent' || lower === 'is:today') {
      parsed.isRecent = true;
      continue;
    }

    // General term
    parsed.terms.push(lower);
  }

  return parsed;
}

/**
 * Resolves full hierarchical path for a directory, e.g. '01 - Systems / Architecture'
 */
export function getFolderPath(folderId: string | null | undefined, folders: Folder[]): string {
  if (!folderId) return 'Root';
  const path: string[] = [];
  let curr = folders.find((f) => f.id === folderId);
  const visited = new Set<string>();
  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    path.unshift(curr.name);
    curr = curr.parentId ? folders.find((f) => f.id === curr.parentId) : undefined;
  }
  return path.length > 0 ? path.join(' / ') : 'Root';
}

/**
 * Searches vault notes with rich relevance scoring, snippet extraction, and operator filters
 */
export function searchVaultNotes(
  notes: NoteFile[],
  folders: Folder[],
  query: string
): NoteSearchResult[] {
  if (!query || !query.trim()) {
    // Return sorted by updated time by default
    return notes.map((n) => {
      const pathName = getFolderPath(n.folderId, folders);
      return {
        note: n,
        score: 1,
        matchedFields: ['title'],
        matchedTags: [],
        snippet: null,
        folderName: pathName,
      };
    });
  }

  const parsed = parseSearchQuery(query);
  const now = Date.now();
  const ONE_DAY_MS = 86400000;
  const folderPathMap = new Map<string, string>();
  folders.forEach((f) => folderPathMap.set(f.id, getFolderPath(f.id, folders)));

  const results: NoteSearchResult[] = [];

  for (const note of notes) {
    const titleLower = (note.title || note.name || '').toLowerCase();
    const nameLower = (note.name || '').toLowerCase();
    const contentLower = (note.content || '').toLowerCase();
    const tagsLower = (note.tags || []).map((t) => t.toLowerCase());
    const folderName = (note.folderId ? folderPathMap.get(note.folderId) : 'Root') || 'Root';
    const folderNameLower = folderName.toLowerCase();

    // Check negated terms (if any match, exclude immediately)
    if (parsed.negatedTerms.length > 0) {
      const hasNegated = parsed.negatedTerms.some(
        (neg) =>
          titleLower.includes(neg) ||
          tagsLower.some((t) => t.includes(neg)) ||
          folderNameLower.includes(neg)
      );
      if (hasNegated) continue;
    }

    // Check tag filters
    if (parsed.tagFilters.length > 0) {
      const matchesAllTags = parsed.tagFilters.every((reqTag) =>
        tagsLower.some((t) => t.includes(reqTag))
      );
      if (!matchesAllTags) continue;
    }

    // Check folder filters
    if (parsed.folderFilters.length > 0) {
      const matchesFolder = parsed.folderFilters.some((reqFolder) =>
        folderNameLower.includes(reqFolder)
      );
      if (!matchesFolder) continue;
    }

    // Check title filters
    if (parsed.titleFilters.length > 0) {
      const matchesTitle = parsed.titleFilters.every((reqTitle) =>
        titleLower.includes(reqTitle) || nameLower.includes(reqTitle)
      );
      if (!matchesTitle) continue;
    }

    // Check content filters
    if (parsed.contentFilters.length > 0) {
      const matchesContent = parsed.contentFilters.every((reqContent) =>
        contentLower.includes(reqContent)
      );
      if (!matchesContent) continue;
    }

    // Check has:image
    if (parsed.hasImage) {
      const hasImg =
        contentLower.includes('![') ||
        contentLower.includes('attachment:') ||
        contentLower.includes('data:image/');
      if (!hasImg) continue;
    }

    // Check has:todo
    if (parsed.hasTodo) {
      const hasTodoItem = contentLower.includes('- [ ]') || contentLower.includes('* [ ]');
      if (!hasTodoItem) continue;
    }

    // Check has:done
    if (parsed.hasDone) {
      const hasDoneItem =
        contentLower.includes('- [x]') ||
        contentLower.includes('* [x]') ||
        contentLower.includes('- [X]');
      if (!hasDoneItem) continue;
    }

    // Check has:link
    if (parsed.hasLink) {
      const hasWikiLink = contentLower.includes('[[');
      if (!hasWikiLink) continue;
    }

    // Check is:recent
    if (parsed.isRecent) {
      const isWithinDay = now - (note.updatedAt || note.createdAt) <= ONE_DAY_MS * 2;
      if (!isWithinDay) continue;
    }

    // Check exact phrases
    if (parsed.exactPhrases.length > 0) {
      const matchesAllPhrases = parsed.exactPhrases.every(
        (phrase) =>
          titleLower.includes(phrase) ||
          contentLower.includes(phrase) ||
          folderNameLower.includes(phrase)
      );
      if (!matchesAllPhrases) continue;
    }

    // Scoring & matching terms
    let score = 0;
    const matchedFields = new Set<'title' | 'tag' | 'content' | 'folder'>();
    const matchedTags: string[] = [];

    const allQueryTerms = [...parsed.terms, ...parsed.exactPhrases];

    if (allQueryTerms.length === 0) {
      // If only filters were applied (e.g. `tag:pkm` or `has:todo`), give base score
      score = 50;
      if (parsed.tagFilters.length > 0) matchedFields.add('tag');
      if (parsed.folderFilters.length > 0) matchedFields.add('folder');
      if (parsed.titleFilters.length > 0) matchedFields.add('title');
      if (parsed.contentFilters.length > 0) matchedFields.add('content');
    } else {
      let matchedAllTerms = true;

      for (const term of allQueryTerms) {
        let termMatched = false;

        // Exact title match
        if (titleLower === term) {
          score += 1000;
          matchedFields.add('title');
          termMatched = true;
        } else if (titleLower.startsWith(term)) {
          score += 500;
          matchedFields.add('title');
          termMatched = true;
        } else if (titleLower.includes(term)) {
          score += 250;
          matchedFields.add('title');
          termMatched = true;
        }

        // Tag matches
        for (const tag of note.tags || []) {
          const tLower = tag.toLowerCase();
          if (tLower === term) {
            score += 180;
            matchedFields.add('tag');
            if (!matchedTags.includes(tag)) matchedTags.push(tag);
            termMatched = true;
          } else if (tLower.includes(term)) {
            score += 90;
            matchedFields.add('tag');
            if (!matchedTags.includes(tag)) matchedTags.push(tag);
            termMatched = true;
          }
        }

        // Folder match
        if (folderNameLower.includes(term)) {
          score += 40;
          matchedFields.add('folder');
          termMatched = true;
        }

        // Content match
        if (contentLower.includes(term)) {
          // Count occurrences (capped at 5 to prevent giant files skewing completely)
          const occurrences = (contentLower.split(term).length - 1);
          score += Math.min(occurrences, 5) * 25;
          matchedFields.add('content');
          termMatched = true;
        }

        if (!termMatched) {
          matchedAllTerms = false;
          break;
        }
      }

      if (!matchedAllTerms) {
        continue;
      }
    }

    // Recency bonus: Give up to 50 extra points for freshly updated notes
    const daysSinceUpdate = (now - (note.updatedAt || note.createdAt)) / ONE_DAY_MS;
    if (daysSinceUpdate <= 1) {
      score += 50;
    } else if (daysSinceUpdate <= 7) {
      score += 20;
    }

    // Extract snippet if content matched or if search query terms exist
    const snippet = extractSearchSnippet(note.content, allQueryTerms);

    results.push({
      note,
      score,
      matchedFields: Array.from(matchedFields),
      matchedTags,
      snippet,
      folderName,
    });
  }

  // Sort descending by score, then recency
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.note.updatedAt || 0) - (a.note.updatedAt || 0);
  });
}

/**
 * Extracts a concise excerpt around the matching terms from note markdown content
 */
export function extractSearchSnippet(content: string, terms: string[], maxLen = 130): string | null {
  if (!content || terms.length === 0) return null;

  // Clean frontmatter and clean markdown headers
  let clean = content.replace(/^---[\s\S]*?---\s*/m, '');
  // Remove markdown images so raw base64 or long links don't mess up snippets
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, '[Image]');
  // Replace newlines with spaces for clean linear snippet
  const normalized = clean.replace(/\s+/g, ' ').trim();
  const normalizedLower = normalized.toLowerCase();

  // Find first matching term index
  let earliestIdx = -1;
  let matchedTerm = '';

  for (const term of terms) {
    if (!term || term.length < 2) continue;
    const idx = normalizedLower.indexOf(term.toLowerCase());
    if (idx !== -1) {
      if (earliestIdx === -1 || idx < earliestIdx) {
        earliestIdx = idx;
        matchedTerm = term;
      }
    }
  }

  if (earliestIdx === -1) {
    // If no term found in content (matched in title or tag), return leading snippet
    if (normalized.length <= maxLen) return normalized;
    return normalized.slice(0, maxLen).trim() + '...';
  }

  const start = Math.max(0, earliestIdx - 35);
  const end = Math.min(normalized.length, start + maxLen);

  let snippet = normalized.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < normalized.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Renders highlighted text, coloring matched search terms with pink accent
 */
export const HighlightedText: React.FC<{
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}> = ({ text, query, className = '', highlightClassName = '' }) => {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parsed = parseSearchQuery(query);
  const terms = Array.from(new Set([...parsed.terms, ...parsed.exactPhrases]))
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              className={`bg-[#ec4899]/25 text-[#faf5ff] font-semibold rounded-xs px-0.5 border-b border-[#ec4899] ${highlightClassName}`}
              style={{ backgroundColor: 'rgba(236, 72, 153, 0.3)', color: '#faf5ff' }}
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};
