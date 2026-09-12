import React from 'react';
import { ExternalLink, PlusCircle, CheckSquare, Square } from 'lucide-react';
import { NoteFile } from '../types';
import { getTagColor, getTagBadgeStyle } from '../utils/tagColors';
import { CodeBlock } from './CodeBlock';
import { MarkdownImage } from './MarkdownImage';
import { SelectionWidget, parseSelectionSyntax } from './SelectionWidget';
import { DateWidget, parseDateSyntax } from './DateWidget';
import { InNoteBanner, parseBannerSyntax } from './ColoredBanner';

interface MarkdownRendererProps {
  content: string;
  allNotes: NoteFile[];
  onNavigateToNote: (title: string) => void;
  onCreateNoteFromLink: (title: string) => void;
  onTagClick?: (tag: string) => void;
  onToggleCheckbox?: (lineIndex: number, newChecked: boolean) => void;
  onUpdateContent?: (newContent: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  allNotes,
  onNavigateToNote,
  onCreateNoteFromLink,
  onTagClick,
  onToggleCheckbox,
  onUpdateContent,
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

  // Helper to replace raw syntax block in the whole document content
  const handleUpdateBlock = (oldSyntax: string, newSyntax: string) => {
    if (!onUpdateContent) return;
    const index = content.indexOf(oldSyntax);
    if (index !== -1) {
      const updated = content.slice(0, index) + newSyntax + content.slice(index + oldSyntax.length);
      onUpdateContent(updated);
    }
  };

  // Helper to render inline text with [[Wiki-links]], ![Images](url), [Markdown Links](url), URLs, #tags, dates, selections, **bold**, *italic*, `code`
  const renderInline = (text: string) => {
    // Regex for tokens: date, selection, images, wiki links, md links, urls, tags, code, bold, italic
    const tokenRegex = /(\[date:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}[^\]]*\]|@date\([0-9]{4}-[0-9]{2}-[0-9]{2}[^)]*\)|@(?:[0-9]{4}-[0-9]{2}-[0-9]{2})|\[(?:multiselect|singleselect):[^\]]+\]|!\[.*?\]\(.*?\)|\[\[.*?\]\]|\[.*?\]\(.*?\)|\bhttps?:\/\/[^\s<]+|#[a-zA-Z0-9_\-]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;

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

        const cleanTarget = target.replace(/\.(md|mf)$/i, '').trim();
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
        } else {
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
      }

      // Standard Markdown link: [label](url)
      const mdLinkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (mdLinkMatch) {
        const label = mdLinkMatch[1];
        const href = mdLinkMatch[2];
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
        | 'selection';
      content?: string;
      src?: string;
      level?: number;
      language?: string;
      isChecked?: boolean;
      num?: string;
      fullLineIndex: number;
      key: string;
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

      // Heading 1
      if (line.startsWith('# ')) {
        result.push({
          type: 'heading',
          level: 1,
          content: line.slice(2),
          fullLineIndex,
          key: `h1-${i}`,
        });
        i++;
        continue;
      }

      // Heading 2
      if (line.startsWith('## ')) {
        result.push({
          type: 'heading',
          level: 2,
          content: line.slice(3),
          fullLineIndex,
          key: `h2-${i}`,
        });
        i++;
        continue;
      }

      // Heading 3
      if (line.startsWith('### ')) {
        result.push({
          type: 'heading',
          level: 3,
          content: line.slice(4),
          fullLineIndex,
          key: `h3-${i}`,
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
              code={block.content || ''}
              language={block.language}
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

        // Heading 1
        if (block.type === 'heading' && block.level === 1) {
          return (
            <h1
              key={block.key}
              className="text-2xl font-bold tracking-tight text-[#faf5ff] mt-4 mb-2 pb-1 border-b border-[#2e1c52]"
            >
              {renderInline(block.content || '')}
            </h1>
          );
        }

        // Heading 2
        if (block.type === 'heading' && block.level === 2) {
          return (
            <h2
              key={block.key}
              className="text-lg font-bold tracking-tight text-[#faf5ff] mt-3 mb-1"
            >
              {renderInline(block.content || '')}
            </h2>
          );
        }

        // Heading 3
        if (block.type === 'heading' && block.level === 3) {
          return (
            <h3
              key={block.key}
              className="text-base font-semibold text-[#faf5ff] mt-2 mb-1"
            >
              {renderInline(block.content || '')}
            </h3>
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
