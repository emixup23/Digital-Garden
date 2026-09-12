import React, { useState } from 'react';
import hljs from 'highlight.js';
import { Check, Copy, Code2, Terminal, Database, FileCode2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
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

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').trim().toLowerCase();
  const hljsLang = LANGUAGE_MAP[cleanLang] || cleanLang;
  const meta = LANGUAGE_METADATA[cleanLang] || {
    label: cleanLang ? cleanLang.toUpperCase() : 'CODE',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
    iconType: 'code',
  };

  // Perform syntax highlighting
  const highlightedHtml = React.useMemo(() => {
    const trimmedCode = code.replace(/\n$/, '');
    if (!trimmedCode) return '';

    try {
      if (hljsLang && hljs.getLanguage(hljsLang)) {
        return hljs.highlight(trimmedCode, { language: hljsLang, ignoreIllegals: true }).value;
      }
      // Auto-detect if no language or unknown
      const auto = hljs.highlightAuto(trimmedCode, ['xml', 'php', 'javascript', 'python', 'sql', 'json', 'css', 'bash', 'typescript']);
      return auto.value;
    } catch {
      // Fallback: escape HTML entities
      return trimmedCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [code, hljsLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const codeLines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="my-3 rounded-[8px] overflow-hidden border border-[#2e1c52] bg-[#0c0714] shadow-md font-['Space_Mono',monospace] text-xs">
      {/* Code Header Bar */}
      <div className="px-3 py-1.5 bg-[#150d24] border-b border-[#2e1c52] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {/* Language badge */}
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase border"
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

          <span className="text-[10px] text-[#c084fc]/60">
            {codeLines.length} {codeLines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

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
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Line Numbers */}
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
    </div>
  );
};
