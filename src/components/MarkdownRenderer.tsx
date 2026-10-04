import React from 'react';
import { ExternalLink, PlusCircle, CheckSquare, Square, Boxes, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { NoteFile } from '../types';
import { getTagColor, getTagBadgeStyle } from '../utils/tagColors';
import { CodeBlock } from './CodeBlock';
import { MarkdownImage } from './MarkdownImage';
import { SelectionWidget, parseSelectionSyntax } from './SelectionWidget';
import { DateWidget, parseDateSyntax } from './DateWidget';
import { InNoteBanner, parseBannerSyntax } from './ColoredBanner';
import { MarkdownTable } from './MarkdownTable';
import { parseMarkdownTable, isTableDelimiterLine, ParsedTable } from '../utils/tableUtils';
import {
  loadCanvasBoards,
  saveCanvasBoards,
  parseCanvasLink,
  findCanvasByIdOrName,
  createNewCanvas,
} from '../utils/canvasStore';

interface MarkdownRendererProps {
  content: string;
  allNotes: NoteFile[];
  onNavigateToNote: (title: string) => void;
  onCreateNoteFromLink: (title: string) => void;
  onNavigateToCanvas?: (canvasIdentifier: string, targetCardId?: string) => void;
  onCreateCanvasFromLink?: (canvasName: string) => void;
  onTagClick?: (tag: string) => void;
  onToggleCheckbox?: (lineIndex: number, newChecked: boolean) => void;
  onUpdateContent?: (newContent: string) => void;
  globalFoldAction?: 'fold-all' | 'expand-all' | null;
  globalFoldVersion?: number;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  allNotes,
  onNavigateToNote,
  onCreateNoteFromLink,
  onNavigateToCanvas,
  onCreateCanvasFromLink,
  onTagClick,
  onToggleCheckbox,
  onUpdateContent,
  globalFoldAction,
  globalFoldVersion,
}) => {
  // Strip frontmatter for rendering
  let bodyText = content;
  const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  let frontmatterLinesCount = 0;
  if (frontmatterMatch) {
    frontmatterLinesCount = frontmatterMatch[0].split('\n').length - 1;
    bodyText = content.slice(frontmatterMatch[0].length);
  }

  // Create lookup map of existing notes
  const existingNotesMap = React.useMemo(() => {
    const map = new Map<string, NoteFile>();
    allNotes.forEach((n) => {
      map.set(n.title.toLowerCase(), n);
      map.set(n.name.replace(/\.(md|mf)$/i, '').toLowerCase(), n);
    });
    return map;
  }, [allNotes]);

  // Load saved canvas boards
  const canvasBoards = React.useMemo(() => {
    return loadCanvasBoards();
  }, [content]);

  const handleCanvasClick = (canvasIdentifier: string, cardId?: string) => {
    if (onNavigateToCanvas) {
      onNavigateToCanvas(canvasIdentifier, cardId);
      return;
    }
    const existing = findCanvasByIdOrName(canvasBoards, canvasIdentifier);
    if (!existing) {
      if (onCreateCanvasFromLink) {
        onCreateCanvasFromLink(canvasIdentifier);
      } else {
        const newBoard = createNewCanvas(canvasIdentifier);
        const next = [...canvasBoards, newBoard];
        saveCanvasBoards(next);
      }
    }
  };

  // Helper to replace raw syntax block in the whole document content
  const handleUpdateBlock = (oldSyntax: string, newSyntax: string) => {
    if (!onUpdateContent) return;
    const index = content.indexOf(oldSyntax);
    if (index !== -1) {
      const updated = content.slice(0, index) + newSyntax + content.slice(index + oldSyntax.length);
      onUpdateContent(updated);
    }
  };

  // Helper to parse CSS inline style attributes safely
  const parseStyleAttr = (styleStr: string): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (!styleStr) return styles;
    const rules = styleStr.split(';');
    for (const rule of rules) {
      const colonIdx = rule.indexOf(':');
      if (colonIdx === -1) continue;
      const key = rule.slice(0, colonIdx).trim().toLowerCase();
      const val = rule.slice(colonIdx + 1).trim();
      if (!key || !val) continue;
      if (key === 'color') styles.color = val;
      else if (key === 'background-color' || key === 'background') styles.backgroundColor = val;
      else if (key === 'font-weight') styles.fontWeight = val as any;
      else if (key === 'text-decoration') styles.textDecoration = val;
      else if (key === 'font-size') styles.fontSize = val;
      else if (key === 'border-radius') styles.borderRadius = val;
      else if (key === 'padding') styles.padding = val;
      else if (key === 'border' || key === 'border-color') styles.borderColor = val;
    }
    return styles;
  };

  // Helper to detect and parse colored or standard headings (H1-H6, HTML, spans, font tags, color attributes)
  const parseHeadingLine = (line: string): {
    level: number;
    content: string;
    customColor?: string;
    customStyle?: React.CSSProperties;
  } | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 1. HTML Heading tags: <h1 style="color: red">Title</h1> through <h6>
    const htmlHeadingMatch = trimmed.match(/^<h([1-6])(?:\s+style=["'](.*?)["'])?(?:\s+class=["'][^"']*["'])?\s*>([\s\S]*?)<\/h\1>$/i);
    if (htmlHeadingMatch) {
      const level = parseInt(htmlHeadingMatch[1], 10);
      const styleAttr = htmlHeadingMatch[2] || '';
      const customStyle = styleAttr ? parseStyleAttr(styleAttr) : undefined;
      const customColor = (customStyle?.color as string) || undefined;
      return {
        level,
        content: htmlHeadingMatch[3].trim(),
        customColor,
        customStyle,
      };
    }

    // 2. Span wrapping a heading: e.g. <span style="color: #ec4899">## Core Pillars</span>
    const spanHeadingMatch = trimmed.match(/^<span\s+style=["'](.*?)["']\s*>\s*(#{1,6})\s+([\s\S]*?)<\/span>$/i);
    if (spanHeadingMatch) {
      const customStyle = parseStyleAttr(spanHeadingMatch[1]);
      const customColor = (customStyle?.color as string) || undefined;
      const level = spanHeadingMatch[2].length;
      return {
        level,
        content: spanHeadingMatch[3].trim(),
        customColor,
        customStyle,
      };
    }

    // 3. Font tag wrapping a heading: e.g. <font color="#ec4899"># Title</font>
    const fontHeadingMatch = trimmed.match(/^<font\s+color=["'](.*?)["']\s*>\s*(#{1,6})\s+([\s\S]*?)<\/font>$/i);
    if (fontHeadingMatch) {
      const customColor = fontHeadingMatch[1].trim();
      const level = fontHeadingMatch[2].length;
      return {
        level,
        content: fontHeadingMatch[3].trim(),
        customColor,
        customStyle: { color: customColor },
      };
    }

    // 4. Color shorthand wrapping a heading: e.g. [color:#ec4899:## Core Pillars]
    const colorShortHeadingMatch = trimmed.match(/^\[color:([a-zA-Z0-9#\(\),.\s%_-]+):\s*(#{1,6})\s+([\s\S]*?)\]$/i);
    if (colorShortHeadingMatch) {
      const customColor = colorShortHeadingMatch[1].trim();
      const level = colorShortHeadingMatch[2].length;
      return {
        level,
        content: colorShortHeadingMatch[3].trim(),
        customColor,
        customStyle: { color: customColor },
      };
    }

    // 5. Standard Markdown Heading: #{1,6} with optional spaces and colored heading attributes
    const mdHeadingMatch = trimmed.match(/^(#{1,6})\s+([\s\S]*)$/);
    if (mdHeadingMatch) {
      const level = mdHeadingMatch[1].length;
      let rawContent = mdHeadingMatch[2].trim();
      let customColor: string | undefined = undefined;
      let customStyle: React.CSSProperties | undefined = undefined;

      // Check if inner content is wrapped in <span style="...">
      const innerSpanMatch = rawContent.match(/^<span\s+style=["'](.*?)["']\s*>([\s\S]*?)<\/span>$/i);
      if (innerSpanMatch) {
        customStyle = parseStyleAttr(innerSpanMatch[1]);
        if (customStyle.color) {
          customColor = customStyle.color as string;
        }
        // Normalize inner content so outer span doesn't duplicate styling
        rawContent = innerSpanMatch[2].trim();
      }

      // Check for trailing color attribute: e.g. "## Title [color:#ec4899]"
      const trailingColorMatch = rawContent.match(/^(.*?)\s*\[color:([a-zA-Z0-9#\(\),.\s%_-]+)\]$/i);
      if (trailingColorMatch) {
        rawContent = trailingColorMatch[1].trim();
        customColor = trailingColorMatch[2].trim();
      }

      // Check for trailing curly color: e.g. "## Title {color: #ec4899}" or "## Title {: style="color: #ec4899"}"
      const curlyColorMatch = rawContent.match(/^(.*?)\s*\{:?\s*(?:style=["'])?color:\s*([a-zA-Z0-9#\(\),.\s%_-]+)["']?\s*\}$/i);
      if (curlyColorMatch) {
        rawContent = curlyColorMatch[1].trim();
        customColor = curlyColorMatch[2].trim();
      }

      // Check for HTML comment color: e.g. "## Title <!-- color: #ec4899 -->"
      const commentColorMatch = rawContent.match(/^(.*?)\s*<!--\s*color:\s*([a-zA-Z0-9#\(\),.\s%_-]+)\s*-->$/i);
      if (commentColorMatch) {
        rawContent = commentColorMatch[1].trim();
        customColor = commentColorMatch[2].trim();
      }

      // Check for leading color shorthand: e.g. "[color:#ec4899:Title]"
      const leadingColorShortMatch = rawContent.match(/^\[color:([a-zA-Z0-9#\(\),.\s%_-]+):(.*)\]$/i);
      if (leadingColorShortMatch) {
        customColor = leadingColorShortMatch[1].trim();
        rawContent = leadingColorShortMatch[2].trim();
      }

      // Check for font tag inside: e.g. "<font color="#ec4899">Title</font>"
      const innerFontMatch = rawContent.match(/^<font\s+color=["'](.*?)["']>([\s\S]*?)<\/font>$/i);
      if (innerFontMatch) {
        customColor = innerFontMatch[1].trim();
        rawContent = innerFontMatch[2].trim();
      }

      return {
        level,
        content: rawContent,
        customColor,
        customStyle,
      };
    }

    return null;
  };

  // Helper to render inline text with [[Wiki-links]], ![Images](url), [Markdown Links](url), URLs, #tags, dates, selections, colors, highlights, **bold**, *italic*, `code`
  const renderInline = (text: string) => {
    // Regex for tokens: colored spans, fonts, marks, color shorthand, dates, selections, images, embedded wikilinks, wiki links, md links, urls, tags, code, bold, italic
    const tokenRegex = /(<span\s+style=["'][^"']*["']>[\s\S]*?<\/span>|<font\s+color=["'][^"']*["']>[\s\S]*?<\/font>|<mark(?:\s+style=["'][^"']*["'])?>[\s\S]*?<\/mark>|\[color:[^:]+:[^\]]+\]|==[^=\n]+==|\[date:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}[^\]]*\]|@date\([0-9]{4}-[0-9]{2}-[0-9]{2}[^)]*\)|@(?:[0-9]{4}-[0-9]{2}-[0-9]{2})|\[(?:multiselect|singleselect):[^\]]+\]|!\[\[.*?\]\]|!\[.*?\]\(.*?\)|\[\[.*?\]\]|\[.*?\]\(.*?\)|\bhttps?:\/\/[^\s<]+|#[a-zA-Z0-9_\-]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // HTML styled colored span: <span style="color: #hex...">content</span>
      const spanMatch = part.match(/^<span\s+style=["'](.*?)["']>([\s\S]*?)<\/span>$/i);
      if (spanMatch) {
        const parsedStyles = parseStyleAttr(spanMatch[1]);
        const innerContent = spanMatch[2];
        const hasBg = Boolean(parsedStyles.backgroundColor);
        return (
          <span
            key={idx}
            style={{
              ...parsedStyles,
              ...(hasBg ? { padding: '1px 6px', borderRadius: '4px' } : {}),
            }}
            className={hasBg ? 'inline-block my-0.5 align-baseline font-medium' : undefined}
          >
            {renderInline(innerContent)}
          </span>
        );
      }

      // HTML font tag: <font color="#hex">content</font>
      const fontMatch = part.match(/^<font\s+color=["'](.*?)["']>([\s\S]*?)<\/font>$/i);
      if (fontMatch) {
        const color = fontMatch[1];
        const innerContent = fontMatch[2];
        return (
          <span key={idx} style={{ color }}>
            {renderInline(innerContent)}
          </span>
        );
      }

      // Color shorthand: [color:#hex:content] or [color:red:content]
      const colorShortMatch = part.match(/^\[color:([a-zA-Z0-9#\(\),.\s%_-]+):(.*)\]$/);
      if (colorShortMatch) {
        const color = colorShortMatch[1].trim();
        const innerContent = colorShortMatch[2];
        return (
          <span key={idx} style={{ color }}>
            {renderInline(innerContent)}
          </span>
        );
      }

      // Markdown highlight: ==highlighted text== or <mark>text</mark>
      const markMatch = part.match(/^==([^=\n]+)==$/) || part.match(/^<mark(?:\s+style=["'](.*?)["'])?>([\s\S]*?)<\/mark>$/i);
      if (markMatch) {
        const customStyle = markMatch[2] ? parseStyleAttr(markMatch[1] || '') : {};
        const innerContent = markMatch[2] !== undefined ? markMatch[2] : markMatch[1];
        return (
          <mark
            key={idx}
            style={customStyle}
            className="bg-[#ec4899]/25 text-[#faf5ff] px-1.5 py-0.5 rounded-[4px] border border-[#ec4899]/40 font-medium inline-block mx-0.5 align-baseline"
          >
            {renderInline(innerContent)}
          </mark>
        );
      }

      // Date Widget: [date: YYYY-MM-DD ...] or @date(...) or @YYYY-MM-DD
      const parsedDate = parseDateSyntax(part);
      if (parsedDate) {
        return (
          <DateWidget
            key={idx}
            dateStr={parsedDate.date}
            label={parsedDate.label}
            timeStr={parsedDate.time}
            rawSyntax={part}
            onUpdateSyntax={(newSyntax) => handleUpdateBlock(part, newSyntax)}
            interactive={!!onUpdateContent}
          />
        );
      }

      // Inline Multi/Single Selection Widget: [multiselect: ...] or [singleselect: ...]
      const parsedSel = parseSelectionSyntax(part);
      if (parsedSel) {
        return (
          <SelectionWidget
            key={idx}
            type={parsedSel.type}
            title={parsedSel.title}
            options={parsedSel.options}
            selected={parsedSel.selected}
            color={parsedSel.color}
            rawSyntax={part}
            onUpdateSyntax={(newSyntax) => handleUpdateBlock(part, newSyntax)}
            interactive={!!onUpdateContent}
          />
        );
      }

      // Embedded Wiki-link: ![[Target]] (e.g. ![[canvas:My Board]] or ![[My Board.canvas]])
      if (part.startsWith('![[') && part.endsWith(']]')) {
        const inner = part.slice(3, -2).trim();
        let target = inner;
        let alias = inner;
        if (inner.includes('|')) {
          const split = inner.split('|');
          target = split[0].trim();
          alias = split[1].trim();
        }

        const parsedCanvas = parseCanvasLink(target);
        if (parsedCanvas.isCanvas) {
          const matchingCanvas = findCanvasByIdOrName(canvasBoards, parsedCanvas.canvasIdentifier);
          if (matchingCanvas) {
            return (
              <div
                key={idx}
                className="my-3 p-3.5 rounded-xl bg-[#130b21] border border-[#a855f7]/40 hover:border-[#a855f7] shadow-lg transition-all group max-w-xl"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e1c52]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
                      <Boxes className="w-4 h-4 text-[#c084fc]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#faf5ff] flex items-center gap-1.5 font-['Space_Mono',monospace]">
                        <span>{alias !== target ? alias : matchingCanvas.name}</span>
                        <span className="text-[10px] text-[#c084fc] bg-[#a855f7]/20 px-1.5 py-0.2 rounded border border-[#a855f7]/30">
                          Canvas
                        </span>
                      </div>
                      <div className="text-[11px] text-[#c084fc]/70">
                        {matchingCanvas.nodes.length} cards · {matchingCanvas.edges.length} connections
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCanvasClick(matchingCanvas.id, parsedCanvas.cardId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-medium cursor-pointer shadow-sm transition-transform active:scale-95"
                  >
                    <span>Open Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {matchingCanvas.nodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchingCanvas.nodes.slice(0, 5).map((node) => (
                      <span
                        key={node.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border"
                        style={{
                          backgroundColor: node.bgColor || '#1f1338',
                          borderColor: node.borderColor || node.color || '#3b2366',
                          color: '#faf5ff',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: node.color || '#ec4899' }}
                        />
                        <span className="truncate max-w-[120px]">{node.title || node.type}</span>
                      </span>
                    ))}
                    {matchingCanvas.nodes.length > 5 && (
                      <span className="text-[10px] text-[#c084fc]/60 font-mono self-center">
                        +{matchingCanvas.nodes.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }
        }
      }

      // Markdown Image: ![alt](url) or ![alt](url "title")
      if (part.startsWith('![') && part.endsWith(')')) {
        const imageMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imageMatch) {
          const alt = imageMatch[1];
          let src = imageMatch[2].trim();
          let title = '';
          const titleMatch = src.match(/^(.*?)\s+["'](.*?)["']$/);
          if (titleMatch) {
            src = titleMatch[1];
            title = titleMatch[2];
          }
          return <MarkdownImage key={idx} src={src} alt={alt} title={title} />;
        }
      }

      // Wiki-link: [[Target]] or [[Target|Alias]]
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const inner = part.slice(2, -2).trim();
        let target = inner;
        let alias = inner;
        if (inner.includes('|')) {
          const split = inner.split('|');
          target = split[0].trim();
          alias = split[1].trim();
        }

        const rawTarget = target.trim();
        const cleanTarget = rawTarget.replace(/\.(md|mf)$/i, '').trim();

        // 1. Explicit Canvas Reference: [[canvas:Board Name]] or [[Board Name.canvas]]
        const parsedCanvas = parseCanvasLink(rawTarget);
        if (parsedCanvas.isCanvas) {
          const matchingCanvas = findCanvasByIdOrName(canvasBoards, parsedCanvas.canvasIdentifier);
          if (matchingCanvas) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCanvasClick(matchingCanvas.id, parsedCanvas.cardId)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#c084fc] bg-[#1a0b2e] hover:bg-[#281245] border border-[#a855f7]/60 hover:border-[#c084fc] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs hover:shadow-[0_0_12px_rgba(168,85,247,0.35)] active:scale-95"
                title={`Open Canvas: ${matchingCanvas.name} (${matchingCanvas.nodes.length} cards)`}
              >
                <Boxes className="w-3.5 h-3.5 text-[#c084fc] group-hover:scale-115 group-hover:text-[#e879f9] transition-all" />
                <span className="text-[9px] font-mono uppercase tracking-wide text-[#c084fc] bg-[#a855f7]/25 px-1 py-0.2 rounded border border-[#a855f7]/40">
                  Canvas
                </span>
                <span className="text-[#faf5ff] group-hover:text-[#c084fc] transition-colors">
                  {alias !== rawTarget ? alias : matchingCanvas.name}
                </span>
                {parsedCanvas.cardId && (
                  <span className="text-[9px] text-[#c084fc]/80 font-mono bg-[#150d24] px-1 py-0.2 rounded border border-[#3b2366]">
                    #{parsedCanvas.cardId}
                  </span>
                )}
                <span className="text-[10px] text-[#c084fc]/70 font-mono">
                  ({matchingCanvas.nodes.length})
                </span>
              </button>
            );
          } else {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCanvasClick(parsedCanvas.canvasIdentifier, parsedCanvas.cardId)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#c084fc] bg-[#150d24] hover:bg-[#281245] border border-dashed border-[#a855f7]/50 hover:border-[#c084fc] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs active:scale-95"
                title={`Canvas "${parsedCanvas.canvasIdentifier}" does not exist yet. Click to create.`}
              >
                <Boxes className="w-3.5 h-3.5 text-[#a855f7] group-hover:scale-115 transition-all" />
                <span className="text-[9px] font-mono text-[#c084fc] bg-[#a855f7]/20 px-1 py-0.2 rounded">Canvas</span>
                <span className="text-[#faf5ff]">{alias !== rawTarget ? alias : parsedCanvas.canvasIdentifier}</span>
                <span className="text-[9px] text-[#faf5ff]/90 font-normal bg-[#a855f7]/30 px-1 py-0.2 rounded border border-[#a855f7]/50">new</span>
              </button>
            );
          }
        }

        // 2. Note Reference
        const existing = existingNotesMap.get(cleanTarget.toLowerCase());
        if (existing) {
          return (
            <button
              key={idx}
              id={`wiki-link-${idx}`}
              type="button"
              onClick={() => onNavigateToNote(existing.title)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#ec4899] bg-[#0c0714] hover:bg-[#251543] border-[#2e1c52] hover:border-[#ec4899] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] active:scale-95"
              title={`Navigate to: ${existing.title}`}
            >
              <ExternalLink className="w-3 h-3 text-[#ec4899] group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
              <span className="text-[#faf5ff] group-hover:text-[#ec4899] transition-colors">{alias}</span>
            </button>
          );
        }

        // 3. Fallback: Check if target matches existing Canvas by name
        const matchingCanvasByName = findCanvasByIdOrName(canvasBoards, cleanTarget);
        if (matchingCanvasByName) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCanvasClick(matchingCanvasByName.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#c084fc] bg-[#1a0b2e] hover:bg-[#281245] border border-[#a855f7]/60 hover:border-[#c084fc] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs hover:shadow-[0_0_12px_rgba(168,85,247,0.35)] active:scale-95"
              title={`Open Canvas: ${matchingCanvasByName.name} (${matchingCanvasByName.nodes.length} cards)`}
            >
              <Boxes className="w-3.5 h-3.5 text-[#c084fc] group-hover:scale-115 transition-all" />
              <span className="text-[9px] font-mono uppercase text-[#c084fc] bg-[#a855f7]/25 px-1 py-0.2 rounded border border-[#a855f7]/40">Canvas</span>
              <span className="text-[#faf5ff] group-hover:text-[#c084fc] transition-colors">{alias}</span>
              <span className="text-[10px] text-[#c084fc]/70 font-mono">({matchingCanvasByName.nodes.length})</span>
            </button>
          );
        }

        // 4. Ghost Note
        return (
          <button
            key={idx}
            id={`ghost-link-${idx}`}
            type="button"
            onClick={() => onCreateNoteFromLink(cleanTarget)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#ec4899] bg-[#0c0714] hover:bg-[#251543] border border-dashed border-[#c084fc]/50 hover:border-[#ec4899] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] active:scale-95"
            title={`Note "${cleanTarget}" does not exist yet. Click to create.`}
          >
            <PlusCircle className="w-3 h-3 text-[#ec4899] group-hover:scale-115 group-hover:text-[#f472b6] transition-all" />
            <span className="text-[#faf5ff] group-hover:text-[#ec4899] transition-colors">{alias}</span>
            <span className="text-[9px] text-[#faf5ff]/90 font-normal bg-[#1f1338] group-hover:bg-[#ec4899]/30 px-1 py-0.2 rounded-[4px] border border-[#2e1c52] group-hover:border-[#ec4899]/50 transition-colors">new</span>
          </button>
        );
      }

      // Standard Markdown link: [label](url)
      const mdLinkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (mdLinkMatch) {
        const label = mdLinkMatch[1];
        const href = mdLinkMatch[2].trim();

        // Canvas Markdown Link: [Label](canvas:board-name) or [Label](canvas:id#cardId)
        if (href.startsWith('canvas:')) {
          const parsed = parseCanvasLink(href);
          const matchingCanvas = findCanvasByIdOrName(canvasBoards, parsed.canvasIdentifier);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCanvasClick(matchingCanvas ? matchingCanvas.id : parsed.canvasIdentifier, parsed.cardId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5 text-xs font-semibold text-[#faf5ff] hover:text-[#c084fc] bg-[#1a0b2e] hover:bg-[#281245] border border-[#a855f7]/60 hover:border-[#c084fc] rounded-[6px] transition-all duration-150 cursor-pointer group font-['Space_Mono',monospace] shadow-2xs hover:shadow-[0_0_12px_rgba(168,85,247,0.35)] active:scale-95"
              title={`Open Canvas: ${matchingCanvas ? matchingCanvas.name : parsed.canvasIdentifier}`}
            >
              <Boxes className="w-3.5 h-3.5 text-[#c084fc] group-hover:scale-115 transition-all" />
              <span className="text-[9px] font-mono uppercase text-[#c084fc] bg-[#a855f7]/25 px-1 py-0.2 rounded border border-[#a855f7]/40">Canvas</span>
              <span className="text-[#faf5ff] group-hover:text-[#c084fc] transition-colors">{label}</span>
              {matchingCanvas && (
                <span className="text-[10px] text-[#c084fc]/70 font-mono">({matchingCanvas.nodes.length})</span>
              )}
            </button>
          );
        }

        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#ec4899] hover:text-[#f472b6] underline underline-offset-4 decoration-[#ec4899]/40 hover:decoration-[#ec4899] px-1 py-0.5 rounded-[4px] hover:bg-[#ec4899]/15 transition-all group font-medium cursor-pointer"
            title={href}
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </a>
        );
      }

      // Bare HTTP/HTTPS URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#ec4899] hover:text-[#f472b6] underline underline-offset-4 decoration-[#ec4899]/40 hover:decoration-[#ec4899] px-1 py-0.5 rounded-[4px] hover:bg-[#ec4899]/15 transition-all group font-mono text-xs cursor-pointer"
            title={part}
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </a>
        );
      }

      // Inline #tag
      if (part.startsWith('#') && !part.includes(' ')) {
        const tag = part.slice(1);
        const tagColor = getTagColor(tag);
        return (
          <button
            key={idx}
            id={`tag-${tag}-${idx}`}
            type="button"
            onClick={() => onTagClick?.(tag)}
            style={getTagBadgeStyle(tag, false)}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-[11px] font-['Space_Mono',monospace] rounded-[4px] border transition-all duration-150 hover:brightness-125 hover:scale-105 hover:shadow-md cursor-pointer font-medium shadow-2xs active:scale-95 group"
            title={`Filter by #${tag}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block shrink-0 transition-transform group-hover:scale-125"
              style={{ backgroundColor: tagColor.dot }}
            />
            <span>#{tag}</span>
          </button>
        );
      }

      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 text-xs font-['Space_Mono',monospace] text-[#faf5ff] bg-[#1f1338] rounded-[4px] border border-[#2e1c52]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="font-bold text-[#faf5ff]">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic *italic*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="italic text-[#c084fc]">
            {part.slice(1, -1)}
          </em>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  // Parse body lines into structural blocks (preserving multiline code blocks, banners, selections)
  const blocks = React.useMemo(() => {
    const rawLines = bodyText.split('\n');
    const result: Array<{
      type:
        | 'code'
        | 'heading'
        | 'task'
        | 'ul'
        | 'ol'
        | 'blockquote'
        | 'empty'
        | 'paragraph'
        | 'image'
        | 'banner'
        | 'selection'
        | 'table';
      content?: string;
      src?: string;
      level?: number;
      language?: string;
      isChecked?: boolean;
      num?: string;
      fullLineIndex: number;
      key: string;
      parsedTable?: ParsedTable;
      customColor?: string;
      customStyle?: React.CSSProperties;
    }> = [];

    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();
      const fullLineIndex = frontmatterLinesCount + i;

      // Standalone image line: ![alt](url)
      const imageLineMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageLineMatch) {
        let src = imageLineMatch[2].trim();
        let title = '';
        const titleMatch = src.match(/^(.*?)\s+["'](.*?)["']$/);
        if (titleMatch) {
          src = titleMatch[1];
          title = titleMatch[2];
        }
        result.push({
          type: 'image',
          content: imageLineMatch[1],
          src,
          language: title,
          fullLineIndex,
          key: `img-${i}`,
        });
        i++;
        continue;
      }

      // Fenced code block ```lang
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        const startLine = i;
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
          codeLines.push(rawLines[i]);
          i++;
        }
        // If closing fence exists, advance past it
        if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
          i++;
        }
        result.push({
          type: 'code',
          language: lang,
          content: codeLines.join('\n'),
          fullLineIndex: frontmatterLinesCount + startLine,
          key: `code-${startLine}`,
        });
        continue;
      }

      // Fenced Banner Block: :::banner{...} ... :::
      if (trimmed.startsWith(':::banner')) {
        const startLine = i;
        // Check if single-line :::banner...:::
        if (trimmed.slice(9).includes(':::')) {
          result.push({
            type: 'banner',
            content: line,
            fullLineIndex: frontmatterLinesCount + startLine,
            key: `banner-${startLine}`,
          });
          i++;
          continue;
        }

        const bannerLines: string[] = [line];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith(':::')) {
          bannerLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length && rawLines[i].trim().startsWith(':::')) {
          bannerLines.push(rawLines[i]);
          i++;
        }
        result.push({
          type: 'banner',
          content: bannerLines.join('\n'),
          fullLineIndex: frontmatterLinesCount + startLine,
          key: `banner-${startLine}`,
        });
        continue;
      }

      // Fenced Selection Block: :::multiselect{...} or :::singleselect{...}
      if (trimmed.startsWith(':::multiselect') || trimmed.startsWith(':::singleselect')) {
        const selLines: string[] = [line];
        const startLine = i;
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith(':::')) {
          selLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length && rawLines[i].trim().startsWith(':::')) {
          selLines.push(rawLines[i]);
          i++;
        }
        result.push({
          type: 'selection',
          content: selLines.join('\n'),
          fullLineIndex: frontmatterLinesCount + startLine,
          key: `sel-${startLine}`,
        });
        continue;
      }

      // Callout Banner: > [!banner...]
      if (trimmed.match(/^>\s*\[!banner/i)) {
        const calloutLines: string[] = [line];
        const startLine = i;
        i++;
        while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
          calloutLines.push(rawLines[i]);
          i++;
        }
        result.push({
          type: 'banner',
          content: calloutLines.join('\n'),
          fullLineIndex: frontmatterLinesCount + startLine,
          key: `banner-callout-${startLine}`,
        });
        continue;
      }

      // Standalone [multiselect: ...] or [singleselect: ...]
      if (trimmed.match(/^\[(?:multiselect|singleselect):/i)) {
        result.push({
          type: 'selection',
          content: trimmed,
          fullLineIndex,
          key: `sel-${i}`,
        });
        i++;
        continue;
      }

      // Empty line
      if (!trimmed) {
        result.push({
          type: 'empty',
          fullLineIndex,
          key: `empty-${i}`,
        });
        i++;
        continue;
      }

      // Markdown Table: header line with pipe, followed by delimiter line with dashes & pipes
      if (
        line.includes('|') &&
        i + 1 < rawLines.length &&
        isTableDelimiterLine(rawLines[i + 1])
      ) {
        const startLine = i;
        const tableLines: string[] = [line, rawLines[i + 1]];
        i += 2;
        while (i < rawLines.length && rawLines[i].trim().includes('|')) {
          tableLines.push(rawLines[i]);
          i++;
        }
        const fullTableText = tableLines.join('\n');
        const parsed = parseMarkdownTable(fullTableText);
        if (parsed) {
          result.push({
            type: 'table',
            content: fullTableText,
            parsedTable: parsed,
            fullLineIndex: frontmatterLinesCount + startLine,
            key: `table-${startLine}`,
          });
          continue;
        }
      }

      // Headings (H1-H6, HTML, spans, font tags, and color attributes)
      const parsedHeading = parseHeadingLine(line);
      if (parsedHeading) {
        result.push({
          type: 'heading',
          level: parsedHeading.level,
          content: parsedHeading.content,
          customColor: parsedHeading.customColor,
          customStyle: parsedHeading.customStyle,
          fullLineIndex,
          key: `h${parsedHeading.level}-${i}`,
        });
        i++;
        continue;
      }

      // Checkbox / task item: - [ ] or - [x]
      const checkboxMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (checkboxMatch) {
        result.push({
          type: 'task',
          isChecked: checkboxMatch[2].toLowerCase() === 'x',
          content: checkboxMatch[3],
          fullLineIndex,
          key: `task-${i}`,
        });
        i++;
        continue;
      }

      // Unordered list item: - or *
      if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push({
          type: 'ul',
          content: line.slice(2),
          fullLineIndex,
          key: `ul-${i}`,
        });
        i++;
        continue;
      }

      // Ordered list item: 1. 2.
      const orderedMatch = line.match(/^(\d+)\.\s*(.*)$/);
      if (orderedMatch) {
        result.push({
          type: 'ol',
          num: orderedMatch[1],
          content: orderedMatch[2],
          fullLineIndex,
          key: `ol-${i}`,
        });
        i++;
        continue;
      }

      // Blockquote: >
      if (line.startsWith('> ')) {
        result.push({
          type: 'blockquote',
          content: line.slice(2),
          fullLineIndex,
          key: `quote-${i}`,
        });
        i++;
        continue;
      }

      // Standard paragraph
      result.push({
        type: 'paragraph',
        content: line,
        fullLineIndex,
        key: `p-${i}`,
      });
      i++;
    }

    return result;
  }, [bodyText, frontmatterLinesCount]);

  return (
    <div className="note-rendered-content max-w-none text-[#faf5ff] text-sm leading-relaxed space-y-2.5 font-['Space_Grotesk',sans-serif]">
      {blocks.map((block) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={block.key}
              id={block.key}
              code={block.content || ''}
              language={block.language}
              globalFoldAction={globalFoldAction}
              globalFoldVersion={globalFoldVersion}
            />
          );
        }

        if (block.type === 'empty') {
          return <div key={block.key} className="h-2" />;
        }

        // Standalone Image
        if (block.type === 'image') {
          return (
            <div key={block.key} className="py-1">
              <MarkdownImage
                src={block.src || ''}
                alt={block.content || ''}
                title={block.language}
              />
            </div>
          );
        }

        // Banner Block (Fenced :::banner or > [!banner])
        if (block.type === 'banner') {
          const rawText = block.content || '';
          if (rawText.startsWith('>')) {
            const lines = rawText.split('\n');
            const firstLine = lines[0];
            const calloutHeader = parseBannerSyntax(firstLine);
            const bodyLines = lines.slice(1).map((l) => l.replace(/^>\s?/, ''));
            const bodyContent = bodyLines.join('\n');
            return (
              <InNoteBanner
                key={block.key}
                title={calloutHeader?.title}
                color={calloutHeader?.color || 'violet'}
                icon={calloutHeader?.icon || 'sparkles'}
                content={bodyContent}
              >
                {renderInline(bodyContent)}
              </InNoteBanner>
            );
          } else {
            const parsed = parseBannerSyntax(rawText) || {
              title: undefined,
              color: 'violet',
              icon: 'sparkles',
              content: rawText.replace(/^:::banner[^\n]*\r?\n?/, '').replace(/\r?\n?:::\s*$/, '').trim(),
            };
            return (
              <InNoteBanner
                key={block.key}
                title={parsed.title}
                color={parsed.color}
                icon={parsed.icon}
                content={parsed.content}
              >
                {renderInline(parsed.content)}
              </InNoteBanner>
            );
          }
        }

        // Selection Block (Fenced :::multiselect/:::singleselect or bracket [multiselect:...])
        if (block.type === 'selection') {
          const rawText = block.content || '';
          const parsed = parseSelectionSyntax(rawText);
          if (parsed) {
            return (
              <SelectionWidget
                key={block.key}
                type={parsed.type}
                title={parsed.title}
                options={parsed.options}
                selected={parsed.selected}
                color={parsed.color}
                rawSyntax={rawText}
                onUpdateSyntax={(newSyntax) => handleUpdateBlock(rawText, newSyntax)}
                interactive={!!onUpdateContent}
              />
            );
          }
        }

        // Markdown Table Block
        if (block.type === 'table' && block.parsedTable) {
          return (
            <MarkdownTable
              key={block.key}
              parsed={block.parsedTable}
              rawSyntax={block.content || ''}
              renderInline={renderInline}
              onUpdateSyntax={(newSyntax) => handleUpdateBlock(block.content || '', newSyntax)}
              interactive={!!onUpdateContent}
            />
          );
        }

        // Headings (Levels 1 to 6)
        if (block.type === 'heading' && block.level) {
          const level = Math.min(6, Math.max(1, block.level));
          const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

          const baseClass =
            level === 1
              ? 'text-2xl font-bold tracking-tight mt-5 mb-2.5 pb-1.5 border-b'
              : level === 2
              ? 'text-xl font-bold tracking-tight mt-4 mb-2 pb-0.5'
              : level === 3
              ? 'text-base font-bold tracking-tight mt-3 mb-1.5'
              : level === 4
              ? 'text-sm font-semibold tracking-tight mt-2.5 mb-1'
              : level === 5
              ? 'text-xs font-semibold tracking-wide uppercase mt-2 mb-1'
              : 'text-[11px] font-semibold tracking-widest uppercase mt-1.5 mb-0.5 opacity-85';

          // Distinct PKM heading hierarchy colors when no custom color is specified
          const defaultHeadingColors: Record<number, string> = {
            1: '#faf5ff', // Pearl White
            2: '#f472b6', // Cyber Pink (H2)
            3: '#38bdf8', // Cyber Cyan (H3)
            4: '#c084fc', // Purple Glow (H4)
            5: '#34d399', // Matrix Emerald (H5)
            6: '#fbbf24', // Amber Gold (H6)
          };

          const effectiveHeadingColor = block.customColor || defaultHeadingColors[level] || '#faf5ff';
          const borderClass = level === 1 ? 'border-b' : '';

          const headingStyle: React.CSSProperties = {
            color: effectiveHeadingColor,
            ...(level === 1 ? { borderColor: `${effectiveHeadingColor}40` } : {}),
            ...block.customStyle,
          };

          return React.createElement(
            Tag,
            {
              key: block.key,
              className: `${baseClass} ${borderClass}`.trim(),
              style: headingStyle,
            },
            renderInline(block.content || '')
          );
        }

        // Task / Checkbox list item
        if (block.type === 'task') {
          return (
            <div
              key={block.key}
              className="flex items-start gap-2 py-1 px-1.5 -mx-1.5 rounded-[6px] group cursor-pointer hover:bg-[#1f1338]/60 transition-colors border border-transparent hover:border-[#2e1c52]/60"
              onClick={() => onToggleCheckbox?.(block.fullLineIndex, !block.isChecked)}
            >
              <button
                type="button"
                className="mt-0.5 text-[#c084fc] group-hover:text-[#ec4899] focus:outline-none cursor-pointer rounded-[4px] p-0.5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'transparent' }}
              >
                {block.isChecked ? (
                  <CheckSquare className="w-4 h-4 text-[#ec4899]" />
                ) : (
                  <Square className="w-4 h-4 text-[#c084fc]/60 group-hover:text-[#ec4899] transition-colors" />
                )}
              </button>
              <span className={block.isChecked ? 'line-through text-[#c084fc]/50 transition-colors' : 'text-[#faf5ff] transition-colors'}>
                {renderInline(block.content || '')}
              </span>
            </div>
          );
        }

        // Unordered list item: - or *
        if (block.type === 'ul') {
          return (
            <div key={block.key} className="flex items-start gap-2 py-0.5 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] mt-2 shrink-0" />
              <span className="text-[#faf5ff]">{renderInline(block.content || '')}</span>
            </div>
          );
        }

        // Ordered list item: 1. 2.
        if (block.type === 'ol') {
          return (
            <div key={block.key} className="flex items-start gap-2 py-0.5 pl-2">
              <span className="font-['Space_Mono',monospace] text-xs text-[#c084fc] shrink-0 mt-0.5 w-4 text-right">
                {block.num}.
              </span>
              <span className="text-[#faf5ff]">{renderInline(block.content || '')}</span>
            </div>
          );
        }

        // Blockquote: >
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={block.key}
              className="pl-3 py-1.5 my-1 border-l-2 border-[#ec4899] text-[#faf5ff] italic bg-[#1f1338]/60 rounded-r-[6px]"
            >
              {renderInline(block.content || '')}
            </blockquote>
          );
        }

        // Standard paragraph (using div to prevent HTML hydration errors with embedded widgets like DateWidget and SelectionWidget)
        return (
          <div key={block.key} className="py-0.5 text-[#faf5ff]">
            {renderInline(block.content || '')}
          </div>
        );
      })}
    </div>
  );
};
