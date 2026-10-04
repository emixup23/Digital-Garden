import { NoteFile, GraphNode, GraphLink, BacklinkItem, OutgoingLinkItem, Folder } from '../types';
import { parseCanvasLink, findCanvasByIdOrName, loadCanvasBoards } from './canvasStore';

/**
 * Parses a markdown (.md) or .mf file content into frontmatter metadata and body text
 */
export function parseMfContent(raw: string): {
  title?: string;
  tags: string[];
  content: string;
  icon?: string;
  iconColor?: string;
  bannerColor?: string;
  bannerHeight?: 'sm' | 'md' | 'lg';
  bannerIcon?: string;
} {
  let tags: string[] = [];
  let title: string | undefined = undefined;
  let icon: string | undefined = undefined;
  let iconColor: string | undefined = undefined;
  let bannerColor: string | undefined = undefined;
  let bannerHeight: 'sm' | 'md' | 'lg' | undefined = undefined;
  let bannerIcon: string | undefined = undefined;
  let body = raw;

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = raw.match(frontmatterRegex);

  if (match) {
    const yaml = match[1];
    body = raw.slice(match[0].length);

    // Extract title
    const titleMatch = yaml.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].replace(/['"]/g, '').trim();
    }

    // Extract icon
    const iconMatch = yaml.match(/^icon:\s*(.+)$/m);
    if (iconMatch) {
      const rawIcon = iconMatch[1].trim();
      if (rawIcon.startsWith('"') && rawIcon.endsWith('"')) {
        try {
          icon = JSON.parse(rawIcon);
        } catch {
          icon = rawIcon.slice(1, -1);
        }
      } else {
        icon = rawIcon.replace(/^['"]|['"]$/g, '').trim();
      }
    }

    // Extract iconColor
    const colorMatch = yaml.match(/^iconColor:\s*(.+)$/m);
    if (colorMatch) {
      iconColor = colorMatch[1].replace(/['"]/g, '').trim();
    }

    // Extract bannerColor
    const bannerColorMatch = yaml.match(/^bannerColor:\s*(.+)$/m);
    if (bannerColorMatch) {
      bannerColor = bannerColorMatch[1].replace(/^['"]|['"]$/g, '').trim();
    }

    // Extract bannerHeight
    const bannerHeightMatch = yaml.match(/^bannerHeight:\s*(.+)$/m);
    if (bannerHeightMatch) {
      const h = bannerHeightMatch[1].replace(/['"]/g, '').trim();
      if (h === 'sm' || h === 'md' || h === 'lg') {
        bannerHeight = h;
      }
    }

    // Extract bannerIcon
    const bannerIconMatch = yaml.match(/^bannerIcon:\s*(.+)$/m);
    if (bannerIconMatch) {
      bannerIcon = bannerIconMatch[1].replace(/^['"]|['"]$/g, '').trim();
    }

    // Extract tags
    const tagsArrayMatch = yaml.match(/^tags:\s*\[(.*?)\]/m);
    if (tagsArrayMatch) {
      tags = tagsArrayMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/['"]/g, '').replace(/^#/, ''))
        .filter(Boolean);
    } else {
      const tagsListMatch = yaml.match(/^tags:\s*\n((?:\s*-\s*.+\r?\n?)+)/m);
      if (tagsListMatch) {
        tags = tagsListMatch[1]
          .split('\n')
          .map((line) => line.replace(/^\s*-\s*/, '').replace(/['"]/g, '').trim())
          .filter(Boolean);
      }
    }
  }

  // Also extract inline #tags from body (avoiding hex colors like #fff or code blocks if possible)
  const inlineTagRegex = /(?:^|\s)#([a-zA-Z0-9_\-]+)(?!\w)/g;
  let tagMatch;
  while ((tagMatch = inlineTagRegex.exec(body)) !== null) {
    const foundTag = tagMatch[1].toLowerCase();
    if (!tags.map((t) => t.toLowerCase()).includes(foundTag)) {
      tags.push(foundTag);
    }
  }

  return { title, tags, content: body, icon, iconColor, bannerColor, bannerHeight, bannerIcon };
}

/**
 * Formats a note into valid markdown (.md) content with clean frontmatter
 */
export function formatMfContent(
  title: string,
  tags: string[],
  bodyContent: string,
  icon?: string,
  iconColor?: string,
  bannerColor?: string,
  bannerHeight?: 'sm' | 'md' | 'lg',
  bannerIcon?: string
): string {
  const cleanTags = Array.from(new Set(tags.map((t) => t.replace(/^#/, '').trim()))).filter(Boolean);
  const frontmatterLines = [
    '---',
    `title: "${title}"`,
    cleanTags.length > 0 ? `tags: [${cleanTags.map((t) => `"${t}"`).join(', ')}]` : 'tags: []',
    `date: "${new Date().toISOString().split('T')[0]}"`,
  ];

  if (icon) {
    frontmatterLines.push(`icon: ${JSON.stringify(icon)}`);
  }
  if (iconColor) {
    frontmatterLines.push(`iconColor: "${iconColor}"`);
  }
  if (bannerColor) {
    frontmatterLines.push(`bannerColor: "${bannerColor}"`);
  }
  if (bannerHeight) {
    frontmatterLines.push(`bannerHeight: "${bannerHeight}"`);
  }
  if (bannerIcon) {
    frontmatterLines.push(`bannerIcon: "${bannerIcon}"`);
  }

  frontmatterLines.push('---', '');
  return `${frontmatterLines.join('\n')}${bodyContent}`;
}

// Aliases for clear semantic naming
export const parseMdContent = parseMfContent;
export const formatMdContent = formatMfContent;

/**
 * Extracts all [[Wiki Links]] from markdown text
 */
export function extractWikiLinks(text: string): { raw: string; target: string; alias?: string }[] {
  const regex = /\[\[(.*?)\]\]/g;
  const links: { raw: string; target: string; alias?: string }[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const inner = match[1].trim();
    if (inner.includes('|')) {
      const [target, alias] = inner.split('|');
      links.push({ raw: match[0], target: target.trim(), alias: alias.trim() });
    } else {
      links.push({ raw: match[0], target: inner });
    }
  }

  return links;
}

/**
 * Finds all backlinks for a specific target note across all notes
 */
export function findBacklinksForNote(targetNote: NoteFile, allNotes: NoteFile[]): BacklinkItem[] {
  const targetCleanTitle = targetNote.title.toLowerCase();
  const targetCleanName = targetNote.name.replace(/\.(md|mf)$/i, '').toLowerCase();

  const backlinks: BacklinkItem[] = [];

  for (const source of allNotes) {
    if (source.id === targetNote.id) continue;

    const links = extractWikiLinks(source.content);
    const hasMatch = links.some((l) => {
      const clean = l.target.replace(/\.(md|mf)$/i, '').toLowerCase();
      return clean === targetCleanTitle || clean === targetCleanName;
    });

    if (hasMatch) {
      // Find sentence/line context snippet
      const lines = source.content.split('\n');
      let snippet = '';
      for (const line of lines) {
        if (
          line.toLowerCase().includes(`[[${targetCleanTitle}`) ||
          line.toLowerCase().includes(`[[${targetCleanName}`) ||
          line.toLowerCase().includes(targetCleanTitle)
        ) {
          snippet = line.trim();
          break;
        }
      }

      if (!snippet) {
        snippet = source.content.slice(0, 120).trim() + '...';
      }

      backlinks.push({
        sourceNoteId: source.id,
        sourceNoteTitle: source.title,
        sourceNoteName: source.name,
        snippet,
      });
    }
  }

  return backlinks;
}

/**
 * Finds all outgoing links from a specific note
 */
export function findOutgoingLinks(sourceNote: NoteFile, allNotes: NoteFile[]): OutgoingLinkItem[] {
  const links = extractWikiLinks(sourceNote.content);
  const result: OutgoingLinkItem[] = [];
  const seenTargets = new Set<string>();

  for (const link of links) {
    const rawTarget = link.target.trim();
    const cleanTarget = rawTarget.replace(/\.(md|mf)$/i, '').trim();

    // 1. Explicit Canvas Link: [[canvas:Canvas Name]] or [[Canvas.canvas]]
    const parsedCanvas = parseCanvasLink(rawTarget);
    if (parsedCanvas.isCanvas) {
      const key = `canvas:${parsedCanvas.canvasIdentifier.toLowerCase()}`;
      if (seenTargets.has(key)) continue;
      seenTargets.add(key);

      const savedCanvases = loadCanvasBoards();
      const matchingCanvas = findCanvasByIdOrName(savedCanvases, parsedCanvas.canvasIdentifier);

      result.push({
        targetTitle: link.alias || (matchingCanvas ? matchingCanvas.name : parsedCanvas.canvasIdentifier),
        targetNoteId: null,
        isExisting: !!matchingCanvas,
        isCanvas: true,
        canvasId: matchingCanvas ? matchingCanvas.id : parsedCanvas.canvasIdentifier,
        targetCardId: parsedCanvas.cardId || null,
      });
      continue;
    }

    if (seenTargets.has(cleanTarget.toLowerCase())) continue;
    seenTargets.add(cleanTarget.toLowerCase());

    const matchingNote = allNotes.find(
      (n) =>
        n.title.toLowerCase() === cleanTarget.toLowerCase() ||
        n.name.replace(/\.(md|mf)$/i, '').toLowerCase() === cleanTarget.toLowerCase()
    );

    // If note not found, check if it matches a canvas board name!
    if (!matchingNote) {
      const savedCanvases = loadCanvasBoards();
      const matchingCanvas = findCanvasByIdOrName(savedCanvases, cleanTarget);
      if (matchingCanvas) {
        result.push({
          targetTitle: link.alias ? `${matchingCanvas.name} (${link.alias})` : matchingCanvas.name,
          targetNoteId: null,
          isExisting: true,
          isCanvas: true,
          canvasId: matchingCanvas.id,
        });
        continue;
      }
    }

    result.push({
      targetTitle: link.alias ? `${cleanTarget} (${link.alias})` : cleanTarget,
      targetNoteId: matchingNote ? matchingNote.id : null,
      isExisting: !!matchingNote,
    });
  }

  return result;
}

/**
 * Builds nodes and links for the bidirectional graph
 */
export function buildGraphData(
  notes: NoteFile[],
  folders: Folder[],
  includeTagNodes: boolean = false
): { nodes: GraphNode[]; links: GraphLink[] } {
  const folderMap = new Map<string, string>();
  folders.forEach((f) => folderMap.set(f.id, f.name));

  // Map for fast note title lookup
  const noteByTitle = new Map<string, NoteFile>();
  const noteById = new Map<string, NoteFile>();

  notes.forEach((n) => {
    noteByTitle.set(n.title.toLowerCase(), n);
    noteByTitle.set(n.name.replace(/\.(md|mf)$/i, '').toLowerCase(), n);
    noteById.set(n.id, n);
  });

  // Track directed adjacency: sourceId -> Set of targetIds
  const directedEdges = new Map<string, Set<string>>();
  notes.forEach((n) => directedEdges.set(n.id, new Set()));

  // In-degree & Out-degree counters
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  notes.forEach((n) => {
    inDegreeMap.set(n.id, 0);
    outDegreeMap.set(n.id, 0);
  });

  // Extract all links
  notes.forEach((source) => {
    const rawLinks = extractWikiLinks(source.content);
    rawLinks.forEach((l) => {
      const cleanTarget = l.target.replace(/\.(md|mf)$/i, '').toLowerCase();
      const targetNote = noteByTitle.get(cleanTarget);
      if (targetNote && targetNote.id !== source.id) {
        const edgeSet = directedEdges.get(source.id);
        if (edgeSet && !edgeSet.has(targetNote.id)) {
          edgeSet.add(targetNote.id);
          outDegreeMap.set(source.id, (outDegreeMap.get(source.id) || 0) + 1);
          inDegreeMap.set(targetNote.id, (inDegreeMap.get(targetNote.id) || 0) + 1);
        }
      }
    });
  });

  // Build Note Nodes
  const nodes: GraphNode[] = notes.map((n) => {
    const inD = inDegreeMap.get(n.id) || 0;
    const outD = outDegreeMap.get(n.id) || 0;
    return {
      id: n.id,
      title: n.title,
      name: n.name,
      type: 'note',
      folderId: n.folderId,
      folderName: n.folderId ? folderMap.get(n.folderId) : 'Root',
      connectionsCount: inD + outD,
      inDegree: inD,
      outDegree: outD,
      tags: n.tags,
    };
  });

  // Build Links with Bidirectional detection
  const links: GraphLink[] = [];
  const processedPairs = new Set<string>();

  notes.forEach((source) => {
    const targets = directedEdges.get(source.id);
    if (!targets) return;

    targets.forEach((targetId) => {
      const pairKey = [source.id, targetId].sort().join('<->');
      if (processedPairs.has(pairKey)) return;

      const isReverseLinked = directedEdges.get(targetId)?.has(source.id) || false;

      links.push({
        source: source.id,
        target: targetId,
        bidirectional: isReverseLinked,
        type: 'direct',
      });

      processedPairs.add(pairKey);
    });
  });

  // Optional: Add Tag nodes
  if (includeTagNodes) {
    const tagToNotes = new Map<string, string[]>();
    notes.forEach((n) => {
      n.tags.forEach((tag) => {
        const clean = tag.toLowerCase();
        if (!tagToNotes.has(clean)) tagToNotes.set(clean, []);
        tagToNotes.get(clean)!.push(n.id);
      });
    });

    tagToNotes.forEach((noteIds, tag) => {
      if (noteIds.length > 0) {
        const tagNodeId = `tag-${tag}`;
        nodes.push({
          id: tagNodeId,
          title: `#${tag}`,
          name: `#${tag}`,
          type: 'tag',
          connectionsCount: noteIds.length,
          inDegree: noteIds.length,
          outDegree: 0,
        });

        noteIds.forEach((nId) => {
          links.push({
            source: nId,
            target: tagNodeId,
            bidirectional: false,
            type: 'tag',
          });
        });
      }
    });
  }

  return { nodes, links };
}
