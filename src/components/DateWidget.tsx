import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronDown, Check, X, CalendarDays } from 'lucide-react';

export interface DateWidgetProps {
  dateStr: string;
  label?: string;
  timeStr?: string;
  rawSyntax: string;
  onUpdateSyntax?: (newSyntax: string) => void;
  interactive?: boolean;
}

export const DateWidget: React.FC<DateWidgetProps> = ({
  dateStr,
  label,
  timeStr,
  rawSyntax,
  onUpdateSyntax,
  interactive = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(dateStr);
  const [tempTime, setTempTime] = useState(timeStr || '');
  const containerRef = useRef<HTMLElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Compute formatted date and relative tag
  const { formattedDate, relativeTag, urgencyColor } = React.useMemo(() => {
    const parsed = new Date(dateStr + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      return { formattedDate: dateStr, relativeTag: '', urgencyColor: 'text-[#c084fc]' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = parsed.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: parsed.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    };
    const formatted = parsed.toLocaleDateString(undefined, options);

    let tag = '';
    let color = 'bg-[#1f1338] text-[#c084fc] border-[#2e1c52]';

    if (diffDays === 0) {
      tag = 'Today';
      color = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
    } else if (diffDays === 1) {
      tag = 'Tomorrow';
      color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    } else if (diffDays === -1) {
      tag = 'Yesterday';
      color = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    } else if (diffDays > 1 && diffDays <= 7) {
      tag = `In ${diffDays}d`;
      color = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    } else if (diffDays > 7) {
      tag = `In ${Math.round(diffDays / 7)}w`;
      color = 'bg-[#1f1338] text-[#c084fc] border-[#2e1c52]';
    } else if (diffDays < -1) {
      tag = `${Math.abs(diffDays)}d ago`;
      color = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }

    return { formattedDate: formatted, relativeTag: tag, urgencyColor: color };
  }, [dateStr]);

  const handleApplyDate = (newDate: string, newTime?: string) => {
    if (!onUpdateSyntax) return;
    const cleanDate = newDate || new Date().toISOString().split('T')[0];
    const newSyntax = formatDateSyntax({
      date: cleanDate,
      label,
      time: newTime,
    });
    onUpdateSyntax(newSyntax);
    setIsOpen(false);
  };

  const setRelativeOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    handleApplyDate(iso, tempTime);
  };

  return (
    <span ref={containerRef} className="inline-block relative my-0.5 mx-0.5 align-middle text-left">
      <button
        type="button"
        onClick={() => interactive && setIsOpen(!isOpen)}
        disabled={!interactive}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-['Space_Mono',monospace] bg-[#150d24] border border-[#2e1c52] hover:border-[#ec4899] hover:bg-[#1f1338] text-[#faf5ff] transition-all cursor-pointer shadow-2xs group active:scale-95 ${
          isOpen ? 'ring-1 ring-[#ec4899] border-[#ec4899]' : ''
        }`}
        title={interactive ? 'Click to change date' : dateStr}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#ec4899] group-hover:scale-110 transition-transform" />

        {label && (
          <span className="text-[10px] uppercase font-semibold text-[#c084fc] border-r border-[#2e1c52] pr-1.5">
            {label}
          </span>
        )}

        <span className="font-medium text-[#faf5ff]">{formattedDate}</span>

        {timeStr && (
          <span className="text-[10px] text-[#c084fc] inline-flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {timeStr}
          </span>
        )}

        {relativeTag && (
          <span className={`text-[9px] px-1.5 py-0.2 rounded-[4px] border ${urgencyColor}`}>
            {relativeTag}
          </span>
        )}

        {interactive && (
          <ChevronDown className="w-3 h-3 text-[#c084fc] opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Popover Date Editor */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-[#150d24] border border-[#2e1c52] rounded-[8px] p-3 shadow-2xl font-['Space_Grotesk',sans-serif] text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e1c52]">
            <div className="flex items-center gap-1.5 text-[#faf5ff] font-semibold">
              <CalendarDays className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Select Date</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 rounded-[4px] text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-1 mb-2.5 font-['Space_Mono',monospace] text-[10px]">
            <button
              type="button"
              onClick={() => setRelativeOffset(0)}
              className="px-1.5 py-1 bg-[#1f1338] hover:bg-[#2e1c52] text-[#faf5ff] rounded-[4px] border border-[#2e1c52] hover:border-[#ec4899]/50 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setRelativeOffset(1)}
              className="px-1.5 py-1 bg-[#1f1338] hover:bg-[#2e1c52] text-[#faf5ff] rounded-[4px] border border-[#2e1c52] hover:border-[#ec4899]/50 transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setRelativeOffset(7)}
              className="px-1.5 py-1 bg-[#1f1338] hover:bg-[#2e1c52] text-[#faf5ff] rounded-[4px] border border-[#2e1c52] hover:border-[#ec4899]/50 transition-colors cursor-pointer"
            >
              +1 Week
            </button>
          </div>

          {/* HTML5 Date Input */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-[#c084fc] mb-1 font-['Space_Mono',monospace]">
                CALENDAR DATE
              </label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[4px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-[10px] text-[#c084fc] mb-1 font-['Space_Mono',monospace]">
                TIME (OPTIONAL)
              </label>
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[4px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
            </div>

            <button
              type="button"
              onClick={() => handleApplyDate(tempDate, tempTime)}
              className="w-full mt-2 py-1.5 text-xs font-semibold text-white bg-[#ec4899] hover:bg-[#db2777] rounded-[4px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-3 h-3" />
              <span>Update Date</span>
            </button>
          </div>
        </div>
      )}
    </span>
  );
};

export function formatDateSyntax(data: { date: string; label?: string; time?: string }): string {
  const parts = [`date: ${data.date}`];
  if (data.label) {
    parts.push(`label: "${data.label.replace(/"/g, '')}"`);
  }
  if (data.time) {
    parts.push(`time: "${data.time.replace(/"/g, '')}"`);
  }
  return `[${parts.join(' | ')}]`;
}

export function parseDateSyntax(raw: string): { date: string; label?: string; time?: string } | null {
  // Matches [date: 2026-09-10 | label: "Due Date" | time: "14:00"]
  const bracketMatch = raw.match(/^\[date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})(?:\s*\|\s*label:\s*"([^"]*)")?(?:\s*\|\s*time:\s*"([^"]*)")?\]$/i);
  if (bracketMatch) {
    return {
      date: bracketMatch[1],
      label: bracketMatch[2] || undefined,
      time: bracketMatch[3] || undefined,
    };
  }

  // Matches @date(2026-09-10) or @date(2026-09-10 "Due Date")
  const atMatch = raw.match(/^@date\(([0-9]{4}-[0-9]{2}-[0-9]{2})(?:\s*["'](.*?)["'])?\)$/i);
  if (atMatch) {
    return {
      date: atMatch[1],
      label: atMatch[2] || undefined,
    };
  }

  // Matches standalone @YYYY-MM-DD
  const simpleAtMatch = raw.match(/^@([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
  if (simpleAtMatch) {
    return {
      date: simpleAtMatch[1],
    };
  }

  return null;
}
