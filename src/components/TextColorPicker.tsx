import React, { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Highlighter,
  Baseline,
} from 'lucide-react';

export interface TextColorOption {
  name: string;
  hex: string;
  bgHex?: string;
}

export const TEXT_COLOR_PRESETS: TextColorOption[] = [
  { name: 'Cyber Pink', hex: '#ec4899', bgHex: 'rgba(236,72,153,0.22)' },
  { name: 'Neon Purple', hex: '#c084fc', bgHex: 'rgba(192,132,252,0.22)' },
  { name: 'Electric Indigo', hex: '#818cf8', bgHex: 'rgba(129,140,248,0.22)' },
  { name: 'Cyber Cyan', hex: '#38bdf8', bgHex: 'rgba(56,189,248,0.22)' },
  { name: 'Teal Mint', hex: '#2dd4bf', bgHex: 'rgba(45,212,191,0.22)' },
  { name: 'Matrix Green', hex: '#4ade80', bgHex: 'rgba(74,222,128,0.22)' },
  { name: 'Neon Lime', hex: '#a3e635', bgHex: 'rgba(163,230,53,0.22)' },
  { name: 'Solar Yellow', hex: '#facc15', bgHex: 'rgba(250,204,21,0.22)' },
  { name: 'Sunset Orange', hex: '#fb923c', bgHex: 'rgba(251,146,60,0.22)' },
  { name: 'Rose Red', hex: '#f43f5e', bgHex: 'rgba(244,63,94,0.22)' },
  { name: 'Pure White', hex: '#faf5ff', bgHex: 'rgba(250,245,255,0.18)' },
  { name: 'Muted Slate', hex: '#94a3b8', bgHex: 'rgba(148,163,184,0.22)' },
];

export interface TextColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeColor: string;
  selectedText?: string;
  onApplyColor: (color: string, mode: 'color' | 'highlight') => void;
  onClearColor: () => void;
}

export const TextColorPicker: React.FC<TextColorPickerProps> = ({
  isOpen,
  onClose,
  activeColor,
  selectedText = '',
  onApplyColor,
  onClearColor,
}) => {
  const [mode, setMode] = useState<'color' | 'highlight'>('color');
  const [customHex, setCustomHex] = useState(activeColor || '#ec4899');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeColor) {
      setCustomHex(activeColor);
    }
  }, [activeColor]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setCustomHex(val);
  };

  const handleApply = (colorToApply?: string) => {
    const color = colorToApply || customHex;
    onApplyColor(color, mode);
    onClose();
  };

  const previewDisplay = selectedText.trim()
    ? selectedText.length > 30
      ? selectedText.slice(0, 30) + '...'
      : selectedText
    : 'MindForge Text';

  return (
    <div
      ref={popoverRef}
      id="text-color-picker-popover"
      className="absolute top-full left-0 mt-1.5 w-72 bg-[#150d24] border border-[#3b2366] rounded-[8px] shadow-2xl p-3 z-50 ring-1 ring-black/60 font-['Space_Grotesk',sans-serif] animate-in fade-in zoom-in-95 duration-100"
      style={{ zIndex: 120 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2e1c52]/60 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#faf5ff]">
          <Palette className="w-3.5 h-3.5 text-[#ec4899]" />
          <span>Text Color & Styling</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#c084fc] hover:text-[#faf5ff] p-0.5 rounded-[4px] hover:bg-[#251543] transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode Tabs: Text Color vs Highlight */}
      <div className="flex items-center p-0.5 bg-[#0c0714] rounded-[6px] border border-[#2e1c52] mb-3">
        <button
          type="button"
          onClick={() => setMode('color')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded-[4px] font-medium transition-all ${
            mode === 'color'
              ? 'bg-[#ec4899] text-[#faf5ff] shadow-xs'
              : 'text-[#c084fc] hover:text-[#faf5ff]'
          }`}
        >
          <Baseline className="w-3.5 h-3.5" />
          <span>Text Color</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('highlight')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded-[4px] font-medium transition-all ${
            mode === 'highlight'
              ? 'bg-[#ec4899] text-[#faf5ff] shadow-xs'
              : 'text-[#c084fc] hover:text-[#faf5ff]'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>Highlight</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="bg-[#0c0714] border border-[#2e1c52] rounded-[6px] p-2.5 mb-3 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-[#c084fc]/60 font-mono mb-1 uppercase tracking-wider">
          Live Preview
        </span>
        <div className="py-1">
          {mode === 'color' ? (
            <span
              className="text-sm font-semibold transition-colors duration-150"
              style={{ color: customHex }}
            >
              {previewDisplay}
            </span>
          ) : (
            <span
              className="text-sm font-semibold px-2 py-0.5 rounded-[4px] transition-colors duration-150 border"
              style={{
                backgroundColor: customHex.startsWith('#')
                  ? `${customHex}33`
                  : customHex,
                color: customHex,
                borderColor: `${customHex}66`,
              }}
            >
              {previewDisplay}
            </span>
          )}
        </div>
      </div>

      {/* Palette Color Presets Grid */}
      <div className="mb-3">
        <div className="text-[10px] font-mono text-[#c084fc]/70 uppercase tracking-wider mb-1.5">
          Curated Palette
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {TEXT_COLOR_PRESETS.map((item) => {
            const isSelected = customHex.toLowerCase() === item.hex.toLowerCase();
            return (
              <button
                key={item.hex}
                type="button"
                onClick={() => {
                  setCustomHex(item.hex);
                  handleApply(item.hex);
                }}
                className={`w-7 h-7 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)] ring-1 ring-white/60'
                    : 'border-[#2e1c52] hover:border-[#faf5ff] hover:scale-105'
                }`}
                style={{ backgroundColor: item.hex }}
                title={`${item.name} (${item.hex})`}
              >
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-black drop-shadow-sm" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input & HTML5 Picker */}
      <div className="mb-3">
        <div className="text-[10px] font-mono text-[#c084fc]/70 uppercase tracking-wider mb-1.5">
          Custom Color Hex
        </div>
        <div className="flex items-center gap-2">
          {/* Native HTML5 Color Picker swatch */}
          <div className="relative shrink-0 w-8 h-8 rounded-[6px] overflow-hidden border border-[#3b2366] bg-[#0c0714] cursor-pointer hover:border-[#ec4899] transition-colors">
            <input
              type="color"
              value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#ec4899'}
              onChange={(e) => setCustomHex(e.target.value)}
              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-100"
              title="Pick custom color"
            />
          </div>

          {/* Hex input */}
          <input
            type="text"
            value={customHex}
            onChange={handleHexInputChange}
            placeholder="#ec4899"
            className="flex-1 px-2.5 py-1.5 bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-xs font-mono text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-hidden focus:border-[#ec4899] transition-colors"
          />

          {/* Apply Custom Button */}
          <button
            type="button"
            onClick={() => handleApply()}
            className="px-2.5 py-1.5 bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] rounded-[6px] text-xs font-medium cursor-pointer transition-colors shadow-xs active:scale-95 shrink-0"
            title="Apply custom color"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Footer Actions: Reset / Clear Format & Help */}
      <div className="pt-2 border-t border-[#2e1c52]/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            onClearColor();
            onClose();
          }}
          className="inline-flex items-center gap-1 text-[11px] text-[#c084fc] hover:text-rose-400 p-1 rounded-[4px] hover:bg-[#251543] transition-colors cursor-pointer"
          title="Remove color or span tags from selection"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Remove Color</span>
        </button>

        <span className="text-[10px] text-[#c084fc]/50 font-mono">
          Markdown / HTML
        </span>
      </div>
    </div>
  );
};
