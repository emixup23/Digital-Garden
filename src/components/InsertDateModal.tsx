import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Check, CalendarDays, Tag } from 'lucide-react';
import { formatDateSyntax } from './DateWidget';

interface InsertDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (dateSyntax: string) => void;
}

const PRESET_OFFSETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '+2 Days', days: 2 },
  { label: 'Next Monday', special: 'nextMonday' },
  { label: '+1 Week', days: 7 },
  { label: '+2 Weeks', days: 14 },
  { label: '+1 Month', days: 30 },
];

const LABEL_PRESETS = [
  'Due Date',
  'Target',
  'Milestone',
  'Meeting',
  'Review',
  'Deadline',
  'Event',
];

export const InsertDateModal: React.FC<InsertDateModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('14:00');
  const [label, setLabel] = useState('Due Date');
  const [hasLabel, setHasLabel] = useState(true);

  if (!isOpen) return null;

  const handleSetOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const syntax = formatDateSyntax({
      date: selectedDate,
      label: hasLabel && label.trim() ? label.trim() : undefined,
      time: hasTime && time.trim() ? time.trim() : undefined,
    });
    onInsert(syntax);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Space_Grotesk',sans-serif]">
      <div className="relative w-full max-w-md bg-[#150d24] border border-[#2e1c52] rounded-[10px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2e1c52] flex items-center justify-between bg-[#1f1338]">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-[#ec4899]" />
            <div>
              <h2 className="text-base font-semibold text-[#faf5ff]">Insert Date Badge</h2>
              <p className="text-[11px] text-[#c084fc]/70 font-['Space_Mono',monospace]">
                Embed formatted, interactive date chips with relative tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Offset Shortcuts */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              QUICK SHORTCUTS
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_OFFSETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    p.special === 'nextMonday' ? handleSetNextMonday() : handleSetOffset(p.days ?? 0)
                  }
                  className="px-2.5 py-1 text-[11px] rounded-[6px] bg-[#1f1338] hover:bg-[#2e1c52] border border-[#2e1c52] hover:border-[#ec4899]/50 text-[#faf5ff] transition-all cursor-pointer font-['Space_Mono',monospace]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-medium text-[#faf5ff] mb-1">
              Select Calendar Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
            </div>
          </div>

          {/* Time Checkbox & Input */}
          <div className="p-3 rounded-[6px] bg-[#0c0714] border border-[#2e1c52] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#faf5ff]">
              <input
                type="checkbox"
                checked={hasTime}
                onChange={(e) => setHasTime(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#ec4899] rounded-[3px]"
              />
              <Clock className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="font-medium">Include Specific Time</span>
            </label>

            {hasTime && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#150d24] border border-[#2e1c52] rounded-[4px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
            )}
          </div>

          {/* Label Tag Checkbox & Presets */}
          <div className="p-3 rounded-[6px] bg-[#0c0714] border border-[#2e1c52] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#faf5ff]">
              <input
                type="checkbox"
                checked={hasLabel}
                onChange={(e) => setHasLabel(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#ec4899] rounded-[3px]"
              />
              <Tag className="w-3.5 h-3.5 text-[#ec4899]" />
              <span className="font-medium">Include Label Tag</span>
            </label>

            {hasLabel && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Due Date, Milestone, Review..."
                  className="w-full px-3 py-1.5 text-xs bg-[#150d24] border border-[#2e1c52] rounded-[4px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                />

                <div className="flex flex-wrap gap-1">
                  {LABEL_PRESETS.map((lp) => (
                    <button
                      key={lp}
                      type="button"
                      onClick={() => setLabel(lp)}
                      className={`px-2 py-0.5 text-[10px] rounded-[4px] border cursor-pointer transition-all ${
                        label === lp
                          ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff]'
                          : 'bg-[#1f1338] border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      {lp}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-[6px] bg-[#0c0714] border border-[#2e1c52]">
            <span className="block text-[10px] text-[#c084fc] mb-1 font-['Space_Mono',monospace]">
              SYNTAX PREVIEW
            </span>
            <code className="text-xs font-['Space_Mono',monospace] text-[#ec4899] break-all">
              {formatDateSyntax({
                date: selectedDate,
                label: hasLabel && label.trim() ? label.trim() : undefined,
                time: hasTime && time.trim() ? time.trim() : undefined,
              })}
            </code>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2e1c52]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#c084fc] hover:text-[#faf5ff] bg-transparent hover:bg-[#2e1c52] rounded-[6px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec4899] hover:bg-[#db2777] rounded-[6px] transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Date</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
