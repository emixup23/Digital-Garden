import React, { useState, useEffect, useMemo } from 'react';
import hljs from 'highlight.js';
import {
  Check,
  Copy,
  Code2,
  Terminal,
  Database,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FoldVertical,
  UnfoldVertical,
} from 'lucide-react';

export interface CodeBlockProps {
  id?: string;
  code: string;
  language?: string;
  defaultFolded?: boolean;
  globalFoldAction?: 'fold-all' | 'expand-all' | null;
  globalFoldVersion?: number;
  onToggleFold?: (isFolded: boolean) => void;
}

// Map aliases to official highlight.js language names
const LANGUAGE_MAP: Record<string, string> = {
  html: 'xml',
  htm: 'xml',
  xml: 'xml',
  svg: 'xml',
  php: 'php',
  phtml: 'php',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  python: 'python',
  py: 'python',
  sql: 'sql',
  mysql: 'sql',
  pgsql: 'sql',
  postgres: 'sql',
  sqlite: 'sql',
  json: 'json',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  bash: 'bash',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  markdown: 'markdown',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  rust: 'rust',
  rs: 'rust',
  go: 'go',
  golang: 'go',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
};

// Friendly display names and theme badges
export const LANGUAGE_METADATA: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; iconType: string }
> = {
  html: {
    label: 'HTML',
    color: '#f97316', // orange
    bgColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
    iconType: 'html',
  },
  xml: {
    label: 'XML',
    color: '#06b6d4', // cyan
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    iconType: 'xml',
  },
  php: {
    label: 'PHP',
    color: '#818cf8', // indigo/violet
    bgColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.35)',
    iconType: 'php',
  },
  javascript: {
    label: 'JavaScript',
    color: '#facc15', // yellow
    bgColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.35)',
    iconType: 'js',
  },
  js: {
    label: 'JavaScript',
    color: '#facc15',
    bgColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.35)',
    iconType: 'js',
  },
  typescript: {
    label: 'TypeScript',
    color: '#38bdf8', // sky blue
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    iconType: 'ts',
  },
  ts: {
    label: 'TypeScript',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    iconType: 'ts',
  },
  python: {
    label: 'Python',
    color: '#38bdf8', // blue / yellow
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    iconType: 'py',
  },
  py: {
    label: 'Python',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    iconType: 'py',
  },
  sql: {
    label: 'SQL',
    color: '#2dd4bf', // teal
    bgColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.35)',
    iconType: 'sql',
  },
  json: {
    label: 'JSON',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    iconType: 'code',
  },
  css: {
    label: 'CSS',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    iconType: 'code',
  },
  bash: {
    label: 'Bash / Shell',
    color: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.35)',
    iconType: 'term',
  },
  sh: {
    label: 'Shell',
    color: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.35)',
    iconType: 'term',
  },
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  id,
  code,
  language,
  defaultFolded,
  globalFoldAction,
  globalFoldVersion,
  onToggleFold,
}) => {
  const [copied, setCopied] = useState(false);

  // Parse out fold flag from language descriptor (e.g. ```javascript fold or ```python:collapse)
  const isLanguageHintFolded = useMemo(() => {
    const raw = (language || '').toLowerCase();
    return /\b(fold|folded|collapse|collapsed)\b/.test(raw);
  }, [language]);

  const initialFoldState = useMemo(() => {
    if (defaultFolded !== undefined) return defaultFolded;
    return isLanguageHintFolded;
  }, [defaultFolded, isLanguageHintFolded]);

  const [isFolded, setIsFolded] = useState<boolean>(initialFoldState);

  // Synchronize when a document-level global fold action is triggered
  useEffect(() => {
    if (globalFoldVersion && globalFoldAction) {
      if (globalFoldAction === 'fold-all') {
        setIsFolded(true);
      } else if (globalFoldAction === 'expand-all') {
        setIsFolded(false);
      }
    }
  }, [globalFoldVersion, globalFoldAction]);

  // Clean language name by removing any fold or collapse annotations
  const cleanLang = useMemo(() => {
    return (language || '')
      .toLowerCase()
      .replace(/\b(fold|folded|collapse|collapsed)\b/gi, '')
      .replace(/[:[\]{}]/g, '')
      .trim();
  }, [language]);

  const hljsLang = LANGUAGE_MAP[cleanLang] || cleanLang;
  const meta = LANGUAGE_METADATA[cleanLang] || {
    label: cleanLang ? cleanLang.toUpperCase() : 'CODE',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
    iconType: 'code',
  };

  // Split code lines
  const codeLines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);

  // First non-empty meaningful line for preview snippet when folded
  const firstMeaningfulLine = useMemo(() => {
    for (const line of codeLines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) return trimmed;
    }
    return codeLines[0] || '';
  }, [codeLines]);

  // Perform syntax highlighting
  const highlightedHtml = useMemo(() => {
    const trimmedCode = code.replace(/\n$/, '');
    if (!trimmedCode) return '';

    try {
      if (hljsLang && hljs.getLanguage(hljsLang)) {
        return hljs.highlight(trimmedCode, { language: hljsLang, ignoreIllegals: true }).value;
      }
      // Auto-detect if no language or unknown
      const auto = hljs.highlightAuto(trimmedCode, [
        'xml',
        'php',
        'javascript',
        'python',
        'sql',
        'json',
        'css',
        'bash',
        'typescript',
      ]);
      return auto.value;
    } catch {
      // Fallback: escape HTML entities
      return trimmedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, hljsLang]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleToggleFold = () => {
    setIsFolded((prev) => {
      const next = !prev;
      onToggleFold?.(next);
      return next;
    });
  };

  return (
    <div
      id={id}
      data-codeblock="true"
      className="my-3 rounded-[8px] overflow-hidden border border-[#2e1c52] bg-[#0c0714] shadow-md font-['Space_Mono',monospace] text-xs transition-all duration-150 group/codeblock"
    >
      {/* Code Header Bar with interactive toggle */}
      <div
        onClick={handleToggleFold}
        className="px-3 py-1.5 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between select-none cursor-pointer hover:bg-[#1a1030] transition-colors"
        title={isFolded ? 'Click to expand code block' : 'Click to collapse code block'}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Fold / Unfold Chevron Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFold();
            }}
            className="p-1 rounded-[4px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#251543] transition-all cursor-pointer shrink-0"
            title={isFolded ? 'Expand code block' : 'Collapse code block'}
            aria-expanded={!isFolded}
            aria-label={isFolded ? 'Expand code block' : 'Collapse code block'}
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isFolded ? '' : 'rotate-90 text-[#faf5ff]'
              }`}
            />
          </button>

          {/* Language badge */}
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase border shrink-0"
            style={{
              color: meta.color,
              backgroundColor: meta.bgColor,
              borderColor: meta.borderColor,
            }}
          >
            {meta.iconType === 'sql' ? (
              <Database className="w-3 h-3" />
            ) : meta.iconType === 'term' ? (
              <Terminal className="w-3 h-3" />
            ) : (
              <Code2 className="w-3 h-3" />
            )}
            <span>{meta.label}</span>
          </span>

          {/* Line count or Folded indicator */}
          {isFolded ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#251543] text-[#ec4899] border border-[#ec4899]/30 tracking-tight shrink-0 font-sans">
              Folded · {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
            </span>
          ) : (
            <span className="text-[10px] text-[#c084fc]/60 shrink-0">
              {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
            </span>
          )}
        </div>

        {/* Right side controls: Fold Toggle & Copy */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Explicit Fold / Unfold text action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFold();
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] transition-colors cursor-pointer"
            title={isFolded ? 'Expand code block' : 'Collapse code block'}
          >
            {isFolded ? (
              <>
                <FoldVertical className="w-3 h-3 text-[#ec4899]" />
                <span className="text-[#ec4899] font-medium hidden sm:inline">Expand</span>
              </>
            ) : (
              <>
                <UnfoldVertical className="w-3 h-3" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            )}
          </button>

          <div className="h-3 w-px bg-[#2e1c52]" />

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] border border-transparent hover:border-[#2e1c52] transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* When Folded: Show clean compact teaser preview */}
      {isFolded ? (
        <div
          onClick={handleToggleFold}
          className="px-3.5 py-2 bg-[#0a0512] hover:bg-[#140b24] cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors group select-none border-t border-[#2e1c52]/40"
          title="Click to expand code block"
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 font-mono text-[#c084fc]/70 group-hover:text-[#faf5ff]">
            <span className="text-[#ec4899] text-[9px] font-bold tracking-wider font-sans uppercase bg-[#ec4899]/15 px-1.5 py-0.5 rounded border border-[#ec4899]/30 shrink-0">
              Folded
            </span>
            <span className="truncate text-[12px] opacity-85 text-[#e2e8f0]/90 font-mono">
              {firstMeaningfulLine || '// (empty code block)'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-[11px] font-sans font-medium text-[#ec4899] group-hover:text-[#f472b6]">
            <span>Expand ({codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'})</span>
            <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>
      ) : (
        /* When Expanded: Full code block with line numbers */
        <>
          <div className="flex overflow-x-auto text-[13px] leading-relaxed p-3 bg-[#0a0512]">
            {/* Line Numbers */}
            <div className="pr-3 mr-3 border-r border-[#2e1c52]/60 select-none text-[#c084fc]/40 text-right font-mono shrink-0">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Highlighted Code */}
            <pre className="m-0 p-0 overflow-x-auto w-full font-mono text-[#faf5ff]">
              <code
                className={`hljs ${hljsLang ? `language-${hljsLang}` : ''}`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            </pre>
          </div>

          {/* Bottom collapse bar for long code blocks (> 15 lines) */}
          {codeLines.length > 15 && (
            <div
              onClick={handleToggleFold}
              className="px-3 py-1 bg-[#10091e] border-t border-[#2e1c52]/60 flex items-center justify-center gap-1.5 text-[11px] text-[#c084fc]/70 hover:text-[#ec4899] hover:bg-[#180d2e] cursor-pointer select-none transition-colors group font-sans"
              title="Collapse code block back up"
            >
              <ChevronUp className="w-3.5 h-3.5 text-[#ec4899] group-hover:-translate-y-0.5 transition-transform" />
              <span>Collapse code block ({codeLines.length} lines)</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
