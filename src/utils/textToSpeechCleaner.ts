/**
 * Text-to-speech cleaner utility for MindForge
 * Converts markdown and MF note content into natural, fluid spoken text
 * and chunks into sentences for sequential playback and tracking.
 */

export interface SpeechSentence {
  id: string;
  text: string;
  rawIndex: number;
}

/**
 * Strips markdown syntax, frontmatter, and code fences into clean spoken text
 */
export function cleanMarkdownForSpeech(rawContent: string, noteTitle?: string): string {
  if (!rawContent) return noteTitle || '';

  let text = rawContent;

  // 1. Remove YAML / MF metadata frontmatter (--- ... ---)
  text = text.replace(/^---[\s\S]*?---\n*/m, '');

  // 2. Remove MF custom comment blocks (<!-- mf-metadata ... -->)
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Remove code blocks ```lang ... ``` and replace with brief contextual note
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang) => {
    const langLabel = lang ? `${lang} code snippet` : 'code block';
    return ` [${langLabel}] `;
  });

  // 4. Remove inline code `code`
  text = text.replace(/`([^`]+)`/g, '$1');

  // 5. Remove image syntax ![alt](url) -> "Image: alt"
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, alt) => {
    return alt ? `Image: ${alt}. ` : 'Image. ';
  });

  // 6. Wikilinks [[target|label]] -> "label", [[target]] -> "target"
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
    return (label || target || '').trim();
  });

  // 7. Markdown links [text](url) -> "text"
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip colored spans and font tags early so colored headings normalize cleanly
  text = text.replace(/<span\s+style=["'][^"']*["']>([\s\S]*?)<\/span>/gi, '$1');
  text = text.replace(/<font\s+color=["'][^"']*["']>([\s\S]*?)<\/font>/gi, '$1');
  text = text.replace(/\[color:[^:]+:([^\]]+)\]/g, '$1');

  // 8. Headers # Header -> "Header."
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1. ');

  // 9. Blockquotes > quote -> "Quote: quote."
  text = text.replace(/^>\s*(.+)$/gm, '$1. ');

  // 10. Checkboxes: - [ ] Task -> "To do: Task." and - [x] Task -> "Completed: Task."
  text = text.replace(/^[-*+]\s+\[ \]\s+(.+)$/gm, 'To do: $1. ');
  text = text.replace(/^[-*+]\s+\[[xX]\]\s+(.+)$/gm, 'Completed: $1. ');

  // 11. Unordered lists: - item -> "item."
  text = text.replace(/^[-*+]\s+(.+)$/gm, '$1. ');

  // 12. Ordered lists: 1. item -> "1. item."
  text = text.replace(/^\d+\.\s+(.+)$/gm, '$1. ');

  // 13. Tables | a | b | -> clean text
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_match, content) => {
    const cells = content.split('|').map((c: string) => c.trim()).filter((c: string) => c && !c.match(/^:?-+:?$/));
    return cells.join(', ') + '. ';
  });

  // 14. Horizontal rules
  text = text.replace(/^([-*_]){3,}\s*$/gm, ' ');

  // 15. Bold, italic, strikethrough, highlights, colored text
  text = text.replace(/<span\s+style=["'][^"']*["']>([\s\S]*?)<\/span>/gi, '$1');
  text = text.replace(/<font\s+color=["'][^"']*["']>([\s\S]*?)<\/font>/gi, '$1');
  text = text.replace(/<mark(?:\s+style=["'][^"']*["'])?>([\s\S]*?)<\/mark>/gi, '$1');
  text = text.replace(/\[color:[^:]+:([^\]]+)\]/g, '$1');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/___([^_]+)___/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/==([^=]+)==/g, '$1');

  // 16. Tags (#productivity -> "tag productivity")
  text = text.replace(/(?:^|\s)#([a-zA-Z0-9_\-\/]+)/g, ' $1');

  // 17. Clean repeated newlines and excessive whitespace
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{2,}/g, '. ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\s{2,}/g, ' ');

  // Ensure title is spoken first if provided and not already opening the text
  if (noteTitle && !text.toLowerCase().startsWith(noteTitle.toLowerCase())) {
    text = `${noteTitle}. ${text}`;
  }

  return text.trim();
}

/**
 * Splits clean text into natural sentences for speech synthesis
 */
export function splitIntoSentences(text: string): SpeechSentence[] {
  if (!text || !text.trim()) return [];

  // Match sentences ending in ., !, ?, or newlines, respecting abbreviations and numbers
  // Split on punctuation followed by space or end of string
  const rawSegments = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [text];

  const sentences: SpeechSentence[] = [];
  let index = 0;

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    // Ignore empty or pure punctuation segments
    if (trimmed.length > 1 && /[a-zA-Z0-9]/.test(trimmed)) {
      sentences.push({
        id: `sent-${index}`,
        text: trimmed,
        rawIndex: index,
      });
      index++;
    }
  }

  // Fallback if no punctuation matched
  if (sentences.length === 0 && text.trim()) {
    sentences.push({
      id: 'sent-0',
      text: text.trim(),
      rawIndex: 0,
    });
  }

  return sentences;
}
