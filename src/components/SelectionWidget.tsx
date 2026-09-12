import React from 'react';
import { CheckSquare, Square, Disc, Circle, Check, SlidersHorizontal, ListFilter } from 'lucide-react';

export interface SelectionWidgetProps {
  type: 'multi' | 'single';
  title?: string;
  options: string[];
  selected: string[];
  color?: string; // 'violet' | 'rose' | 'emerald' | 'amber' | 'cyan' | 'indigo'
  rawSyntax: string;
  onUpdateSyntax?: (newSyntax: string) => void;
  interactive?: boolean;
}

const COLOR_MAP: Record<
  string,
  {
    border: string;
    bg: string;
    badge: string;
    activeOptionBg: string;
    activeOptionBorder: string;
    activeOptionText: string;
    accent: string;
  }
> = {
  violet: {
    border: 'border-[#a855f7]/40',
    bg: 'bg-[#150d24]',
    badge: 'bg-[#a855f7]/20 text-[#d8b4fe] border-[#a855f7]/40',
    activeOptionBg: 'bg-[#a855f7]/25',
    activeOptionBorder: 'border-[#c084fc]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    accent: '#a855f7',
  },
  rose: {
    border: 'border-[#ec4899]/40',
    bg: 'bg-[#1c0b1e]',
    badge: 'bg-[#ec4899]/20 text-[#fbcfe8] border-[#ec4899]/40',
    activeOptionBg: 'bg-[#ec4899]/25',
    activeOptionBorder: 'border-[#f472b6]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(236,72,153,0.2)]',
    accent: '#ec4899',
  },
  emerald: {
    border: 'border-[#10b981]/40',
    bg: 'bg-[#081b16]',
    badge: 'bg-[#10b981]/20 text-[#a7f3d0] border-[#10b981]/40',
    activeOptionBg: 'bg-[#10b981]/25',
    activeOptionBorder: 'border-[#34d399]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    accent: '#10b981',
  },
  amber: {
    border: 'border-[#f59e0b]/40',
    bg: 'bg-[#1c1407]',
    badge: 'bg-[#f59e0b]/20 text-[#fde68a] border-[#f59e0b]/40',
    activeOptionBg: 'bg-[#f59e0b]/25',
    activeOptionBorder: 'border-[#fbbf24]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    accent: '#f59e0b',
  },
  cyan: {
    border: 'border-[#06b6d4]/40',
    bg: 'bg-[#091a24]',
    badge: 'bg-[#06b6d4]/20 text-[#a5f3fc] border-[#06b6d4]/40',
    activeOptionBg: 'bg-[#06b6d4]/25',
    activeOptionBorder: 'border-[#22d3ee]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    accent: '#06b6d4',
  },
  indigo: {
    border: 'border-[#6366f1]/40',
    bg: 'bg-[#0f112e]',
    badge: 'bg-[#6366f1]/20 text-[#c7d2fe] border-[#6366f1]/40',
    activeOptionBg: 'bg-[#6366f1]/25',
    activeOptionBorder: 'border-[#818cf8]',
    activeOptionText: 'text-[#faf5ff] font-medium shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    accent: '#6366f1',
  },
};

export const SelectionWidget: React.FC<SelectionWidgetProps> = ({
  type,
  title,
  options,
  selected,
  color = 'violet',
  rawSyntax,
  onUpdateSyntax,
  interactive = true,
}) => {
  const theme = COLOR_MAP[color.toLowerCase()] || COLOR_MAP.violet;

  // Toggle or select an option
  const handleOptionClick = (opt: string) => {
    if (!interactive || !onUpdateSyntax) return;

    let newSelected: string[];
    if (type === 'multi') {
      if (selected.includes(opt)) {
        newSelected = selected.filter((s) => s !== opt);
      } else {
        newSelected = [...selected, opt];
      }
    } else {
      // Single selection: if clicking the already selected, can either keep it or toggle off
      newSelected = selected.includes(opt) ? [] : [opt];
    }

    // Reconstruct syntax
    const updatedSyntax = formatSelectionSyntax({
      type,
      title,
      options,
      selected: newSelected,
      color,
    });

    onUpdateSyntax(updatedSyntax);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || !onUpdateSyntax || type !== 'multi') return;
    const updatedSyntax = formatSelectionSyntax({
      type,
      title,
      options,
      selected: [...options],
      color,
    });
    onUpdateSyntax(updatedSyntax);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive || !onUpdateSyntax) return;
    const updatedSyntax = formatSelectionSyntax({
      type,
      title,
      options,
      selected: [],
      color,
    });
    onUpdateSyntax(updatedSyntax);
  };

  const isMulti = type === 'multi';

  return (
    <div
      className={`my-3 p-3.5 rounded-[8px] border ${theme.border} ${theme.bg} shadow-sm transition-all text-[#faf5ff] font-['Space_Grotesk',sans-serif]`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[#2e1c52]/60">
        <div className="flex items-center gap-2">
          {isMulti ? (
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
          ) : (
            <ListFilter className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
          )}
          <span className="text-xs font-semibold tracking-wide text-[#faf5ff]">
            {title || (isMulti ? 'Multi Selection' : 'Single Selection')}
          </span>
          <span
            className={`text-[10px] font-['Space_Mono',monospace] px-1.5 py-0.2 rounded-full border ${theme.badge}`}
          >
            {isMulti
              ? `${selected.length} / ${options.length} selected`
              : selected.length > 0
              ? selected[0]
              : 'None selected'}
          </span>
        </div>

        {/* Quick actions for multi-select */}
        {isMulti && interactive && onUpdateSyntax && (
          <div className="flex items-center gap-1.5 text-[10px] font-['Space_Mono',monospace]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[#c084fc] hover:text-[#faf5ff] hover:underline cursor-pointer px-1 py-0.5"
              title="Select all options"
            >
              All
            </button>
            <span className="text-[#503577]">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[#c084fc] hover:text-[#faf5ff] hover:underline cursor-pointer px-1 py-0.5"
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Options grid / pills */}
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleOptionClick(opt)}
              disabled={!interactive}
              className={`group px-3 py-1.5 rounded-[6px] text-xs transition-all duration-150 flex items-center gap-2 border cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? `${theme.activeOptionBg} ${theme.activeOptionBorder} ${theme.activeOptionText}`
                  : 'bg-[#1f1338]/60 hover:bg-[#281745] text-[#c084fc] border-[#2e1c52] hover:border-[#ec4899]/50 hover:text-[#faf5ff]'
              }`}
              title={
                interactive
                  ? isMulti
                    ? isSelected
                      ? `Uncheck "${opt}"`
                      : `Check "${opt}"`
                    : isSelected
                    ? `Selected: "${opt}"`
                    : `Select "${opt}"`
                  : opt
              }
            >
              {isMulti ? (
                isSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#503577] group-hover:text-[#c084fc] shrink-0" />
                )
              ) : isSelected ? (
                <Disc className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#503577] group-hover:text-[#c084fc] shrink-0" />
              )}
              <span className="truncate">{opt}</span>
              {isSelected && (
                <Check className="w-3 h-3 text-[#ec4899] ml-0.5 opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export function formatSelectionSyntax(data: {
  type: 'multi' | 'single';
  title?: string;
  options: string[];
  selected: string[];
  color?: string;
}): string {
  const directive = data.type === 'multi' ? 'multiselect' : 'singleselect';
  const cleanTitle = (data.title || '').replace(/"/g, "'").trim();
  const optionsStr = data.options.join(', ');
  const selectedStr = data.selected.join(', ');
  const colorStr = data.color || 'violet';

  return `:::${directive}{title="${cleanTitle}" options="${optionsStr}" selected="${selectedStr}" color="${colorStr}"}\n:::`;
}

export function parseSelectionSyntax(raw: string): {
  type: 'multi' | 'single';
  title: string;
  options: string[];
  selected: string[];
  color: string;
} | null {
  // Matches :::multiselect{...} or :::singleselect{...}
  const blockMatch = raw.match(/^:::(multiselect|singleselect)\{(.*?)\}\s*(?:\r?\n:::)?$/s);
  if (blockMatch) {
    const type = blockMatch[1] === 'multiselect' ? 'multi' : 'single';
    const attrs = blockMatch[2];

    const titleMatch = attrs.match(/title="([^"]*)"/);
    const optionsMatch = attrs.match(/options="([^"]*)"/);
    const selectedMatch = attrs.match(/selected="([^"]*)"/);
    const colorMatch = attrs.match(/color="([^"]*)"/);

    const title = titleMatch ? titleMatch[1] : '';
    const options = optionsMatch
      ? optionsMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const selected = selectedMatch
      ? selectedMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const color = colorMatch ? colorMatch[1] : 'violet';

    return { type, title, options, selected, color };
  }

  // Also match bracket syntax [multiselect: "Title" | Opt1, Opt2 | selected: Opt1]
  const bracketMatch = raw.match(/^\[(multiselect|singleselect):\s*(?:"([^"]*)")?\s*\|\s*([^|]+)(?:\|\s*selected:\s*([^\]]*))?\]$/i);
  if (bracketMatch) {
    const type = bracketMatch[1].toLowerCase() === 'multiselect' ? 'multi' : 'single';
    const title = bracketMatch[2] || '';
    const options = bracketMatch[3]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const selected = bracketMatch[4]
      ? bracketMatch[4]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return { type, title, options, selected, color: 'violet' };
  }

  return null;
}
