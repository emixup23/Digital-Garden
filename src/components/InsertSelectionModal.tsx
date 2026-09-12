import React, { useState } from 'react';
import { X, CheckSquare, ListFilter, Plus, Trash2, Check, SlidersHorizontal } from 'lucide-react';
import { formatSelectionSyntax } from './SelectionWidget';

interface InsertSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownSyntax: string) => void;
  defaultType?: 'multi' | 'single';
}

const PRESETS: Record<
  string,
  { label: string; type: 'multi' | 'single'; title: string; options: string[]; color: string }
> = {
  priority: {
    label: 'Priority (Single)',
    type: 'single',
    title: 'Priority',
    options: ['Low', 'Medium', 'High', 'Urgent'],
    color: 'rose',
  },
  status: {
    label: 'Project Status (Single)',
    type: 'single',
    title: 'Status',
    options: ['To Do', 'In Progress', 'In Review', 'Completed'],
    color: 'emerald',
  },
  techStack: {
    label: 'Tech Stack (Multi)',
    type: 'multi',
    title: 'Tech Stack',
    options: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
    color: 'violet',
  },
  deliverables: {
    label: 'Sprint Deliverables (Multi)',
    type: 'multi',
    title: 'Sprint Scope',
    options: ['UI Prototypes', 'Core Engine', 'Unit Tests', 'Documentation', 'Deployment'],
    color: 'cyan',
  },
  review: {
    label: 'Approval Stage (Single)',
    type: 'single',
    title: 'Review Status',
    options: ['Draft', 'Needs Revisions', 'Approved'],
    color: 'amber',
  },
};

const COLOR_OPTIONS = [
  { id: 'violet', label: 'Violet', bg: 'bg-[#a855f7]' },
  { id: 'rose', label: 'Rose', bg: 'bg-[#ec4899]' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-[#10b981]' },
  { id: 'amber', label: 'Amber', bg: 'bg-[#f59e0b]' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-[#06b6d4]' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-[#6366f1]' },
];

export const InsertSelectionModal: React.FC<InsertSelectionModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  defaultType = 'multi',
}) => {
  const [type, setType] = useState<'multi' | 'single'>(defaultType);
  const [title, setTitle] = useState(defaultType === 'multi' ? 'Sprint Deliverables' : 'Priority');
  const [options, setOptions] = useState<string[]>(
    defaultType === 'multi'
      ? ['UI Design', 'API Integration', 'Unit Tests', 'Documentation']
      : ['Low', 'Medium', 'High', 'Urgent']
  );
  const [selected, setSelected] = useState<string[]>(
    defaultType === 'multi' ? ['UI Design'] : ['Medium']
  );
  const [color, setColor] = useState('violet');
  const [newOptionInput, setNewOptionInput] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setType(preset.type);
    setTitle(preset.title);
    setOptions([...preset.options]);
    setSelected(preset.type === 'single' ? [preset.options[1] || preset.options[0]] : [preset.options[0]]);
    setColor(preset.color);
  };

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      setOptions([...options, trimmed]);
    }
    setNewOptionInput('');
  };

  const handleRemoveOption = (optToRemove: string) => {
    setOptions(options.filter((o) => o !== optToRemove));
    setSelected(selected.filter((s) => s !== optToRemove));
  };

  const handleToggleSelected = (opt: string) => {
    if (type === 'multi') {
      if (selected.includes(opt)) {
        setSelected(selected.filter((s) => s !== opt));
      } else {
        setSelected([...selected, opt]);
      }
    } else {
      setSelected(selected.includes(opt) ? [] : [opt]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (options.length === 0) return;
    const syntax = formatSelectionSyntax({
      type,
      title,
      options,
      selected,
      color,
    });
    onInsert(syntax);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Space_Grotesk',sans-serif]">
      <div className="relative w-full max-w-lg bg-[#150d24] border border-[#2e1c52] rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2e1c52] flex items-center justify-between bg-[#1f1338]">
          <div className="flex items-center gap-2.5">
            {type === 'multi' ? (
              <SlidersHorizontal className="w-5 h-5 text-[#ec4899]" />
            ) : (
              <ListFilter className="w-5 h-5 text-[#c084fc]" />
            )}
            <div>
              <h2 className="text-base font-semibold text-[#faf5ff]">
                Insert {type === 'multi' ? 'Multi Selection' : 'Single Selection'}
              </h2>
              <p className="text-[11px] text-[#c084fc]/70 font-['Space_Mono',monospace]">
                Interactive selectable chips with markdown persistence
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Type Toggle Switcher */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              SELECTION MODE
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#0c0714] p-1 rounded-[8px] border border-[#2e1c52]">
              <button
                type="button"
                onClick={() => {
                  setType('multi');
                  if (title === 'Priority') setTitle('Sprint Scope');
                }}
                className={`py-2 px-3 rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'multi'
                    ? 'bg-[#ec4899] text-white shadow-xs font-semibold'
                    : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Multi Selection (Checkboxes)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('single');
                  if (selected.length > 1) setSelected(selected.slice(0, 1));
                  if (title === 'Sprint Scope') setTitle('Priority');
                }}
                className={`py-2 px-3 rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'single'
                    ? 'bg-[#ec4899] text-white shadow-xs font-semibold'
                    : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Single Selection (Radio)</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              QUICK PRESETS
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 text-[11px] rounded-[6px] bg-[#1f1338] hover:bg-[#2e1c52] border border-[#2e1c52] hover:border-[#ec4899]/50 text-[#faf5ff] transition-all cursor-pointer font-['Space_Mono',monospace]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Label */}
          <div>
            <label className="block text-xs font-medium text-[#faf5ff] mb-1">
              Title / Question Label
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deliverables, Priority, Status..."
              className="w-full px-3 py-2 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] placeholder-[#503577]"
            />
          </div>

          {/* Options Management */}
          <div>
            <label className="block text-xs font-medium text-[#faf5ff] mb-1">
              Options (click chips below to toggle default selected)
            </label>

            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                placeholder="Type an option name & press Add..."
                className="flex-1 px-3 py-1.5 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
              />
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 bg-[#1f1338] hover:bg-[#281745] text-[#faf5ff] border border-[#2e1c52] hover:border-[#ec4899] text-xs rounded-[6px] inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3 text-[#ec4899]" />
                <span>Add</span>
              </button>
            </div>

            {/* Chips list */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#0c0714] rounded-[6px] border border-[#2e1c52] min-h-[44px]">
              {options.length === 0 ? (
                <span className="text-[11px] text-[#503577] italic p-1">No options yet. Add options above.</span>
              ) : (
                options.map((opt) => {
                  const isChecked = selected.includes(opt);
                  return (
                    <div
                      key={opt}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs border transition-all select-none ${
                        isChecked
                          ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff] font-medium'
                          : 'bg-[#1f1338] border-[#2e1c52] text-[#c084fc]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSelected(opt)}
                        className="cursor-pointer inline-flex items-center gap-1 hover:text-[#faf5ff]"
                        title={isChecked ? 'Remove from initial selection' : 'Set as initially selected'}
                      >
                        {isChecked ? (
                          <Check className="w-3 h-3 text-[#ec4899]" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-xs border border-[#503577] inline-block" />
                        )}
                        <span>{opt}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt)}
                        className="text-[#c084fc]/50 hover:text-rose-400 p-0.5 ml-1 transition-colors cursor-pointer"
                        title={`Delete option "${opt}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              COLOR THEME
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs border transition-all cursor-pointer ${
                    color === c.id
                      ? 'bg-[#1f1338] border-[#faf5ff] text-[#faf5ff]'
                      : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:border-[#ec4899]/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#2e1c52] bg-[#1f1338] flex items-center justify-between">
          <span className="text-[11px] font-['Space_Mono',monospace] text-[#c084fc]">
            {options.length} options ({selected.length} pre-selected)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#c084fc] hover:text-[#faf5ff] bg-transparent hover:bg-[#2e1c52] rounded-[6px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={options.length === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Insert {type === 'multi' ? 'Multi Selection' : 'Single Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
