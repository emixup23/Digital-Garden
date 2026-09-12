import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Palette,
  Check,
  Flame,
  Rocket,
  Star,
  AlertCircle,
  Info,
  CheckCircle2,
  Bookmark,
  Compass,
  Zap,
} from 'lucide-react';
import { BANNER_COLOR_PRESETS, BANNER_ICONS, formatBannerSyntax } from './ColoredBanner';

interface InsertBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'in-note' | 'header';
  initialContent?: string;
  onInsertInNote?: (bannerSyntax: string) => void;
  onInsertInNoteBanner?: (bannerSyntax: string) => void;
  onSetNoteBanner?: (color: string, icon: string, height?: 'sm' | 'md' | 'lg') => void;
  onSetNoteHeaderBanner?: (color: string, icon: string, height?: 'sm' | 'md' | 'lg') => void;
  currentBannerColor?: string;
  currentHeaderBannerColor?: string;
  currentBannerIcon?: string;
  currentHeaderBannerIcon?: string;
  currentBannerHeight?: 'sm' | 'md' | 'lg';
  currentHeaderBannerHeight?: 'sm' | 'md' | 'lg';
}

export const InsertBannerModal: React.FC<InsertBannerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'in-note',
  initialContent,
  onInsertInNote,
  onInsertInNoteBanner,
  onSetNoteBanner,
  onSetNoteHeaderBanner,
  currentBannerColor,
  currentHeaderBannerColor,
  currentBannerIcon,
  currentHeaderBannerIcon,
  currentBannerHeight,
  currentHeaderBannerHeight,
}) => {
  const effectiveBannerColor = currentBannerColor || currentHeaderBannerColor;
  const effectiveBannerIcon = currentBannerIcon || currentHeaderBannerIcon;
  const effectiveBannerHeight = currentBannerHeight || currentHeaderBannerHeight || 'md';

  const [activeTab, setActiveTab] = useState<'in-note' | 'header'>(defaultTab);
  const [selectedColor, setSelectedColor] = useState('violet');
  const [selectedIcon, setSelectedIcon] = useState('sparkles');
  const [bannerTitle, setBannerTitle] = useState('Important Milestone');
  const [bannerContent, setBannerContent] = useState(
    initialContent || 'This note contains critical architectural specifications. Please review all decisions before finalizing.'
  );
  const [headerHeight, setHeaderHeight] = useState<'sm' | 'md' | 'lg'>('md');

  // Sync state whenever the modal opens or note banners change
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSelectedColor(effectiveBannerColor || 'violet');
      setSelectedIcon(effectiveBannerIcon || 'sparkles');
      setHeaderHeight(effectiveBannerHeight);
      if (initialContent) {
        setBannerContent(initialContent);
      }
    }
  }, [isOpen, defaultTab, initialContent, effectiveBannerColor, effectiveBannerIcon, effectiveBannerHeight]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'in-note') {
      const syntax = formatBannerSyntax({
        title: bannerTitle.trim() || undefined,
        content: bannerContent.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
      const insertFn = onInsertInNote || onInsertInNoteBanner;
      if (insertFn) {
        insertFn(syntax);
      }
    } else {
      const setFn = onSetNoteBanner || onSetNoteHeaderBanner;
      if (setFn) {
        setFn(selectedColor, selectedIcon, headerHeight);
      }
    }
    onClose();
  };

  const preset = BANNER_COLOR_PRESETS[selectedColor] || BANNER_COLOR_PRESETS.violet;
  const IconComponent = BANNER_ICONS[selectedIcon] || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Space_Grotesk',sans-serif]">
      <div className="relative w-full max-w-lg bg-[#150d24] border border-[#2e1c52] rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2e1c52] flex items-center justify-between bg-[#1f1338]">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-[#ec4899]" />
            <div>
              <h2 className="text-base font-semibold text-[#faf5ff]">Colored Banner Studio</h2>
              <p className="text-[11px] text-[#c084fc]/70 font-['Space_Mono',monospace]">
                Add vibrant decorative or callout banners to your notes
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

        {/* Tab Switcher: In-Note Block vs Note Header */}
        <div className="flex border-b border-[#2e1c52] bg-[#0c0714] px-4 pt-2 font-['Space_Mono',monospace]">
          <button
            type="button"
            onClick={() => setActiveTab('in-note')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'in-note'
                ? 'border-[#ec4899] text-[#faf5ff]'
                : 'border-transparent text-[#c084fc] hover:text-[#faf5ff]'
            }`}
          >
            In-Note Banner Block
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'header'
                ? 'border-[#ec4899] text-[#faf5ff]'
                : 'border-transparent text-[#c084fc] hover:text-[#faf5ff]'
            }`}
          >
            Top Note Hero Banner
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              COLOR THEME / GRADIENT
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(BANNER_COLOR_PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedColor(key)}
                  className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedColor === key
                      ? 'border-[#faf5ff] ring-1 ring-[#faf5ff] bg-[#1f1338]'
                      : 'border-[#2e1c52] hover:border-[#ec4899]/50 bg-[#0c0714]'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-[4px] shrink-0 shadow-xs"
                    style={{ background: p.gradient }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium text-[#faf5ff] truncate">{p.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Icon */}
          <div>
            <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
              BANNER ICON
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(BANNER_ICONS).map(([key, IconComp]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedIcon(key)}
                  className={`w-8 h-8 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer ${
                    selectedIcon === key
                      ? 'bg-[#ec4899] border-[#ec4899] text-white shadow-xs'
                      : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] hover:border-[#ec4899]/50'
                  }`}
                  title={key}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1 Specific: Title and Text content */}
          {activeTab === 'in-note' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#faf5ff] mb-1">
                  Banner Title (Optional)
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g., Notice, Announcement, Key Rule..."
                  className="w-full px-3 py-1.5 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#faf5ff] mb-1">
                  Banner Message Content
                </label>
                <textarea
                  rows={3}
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                  placeholder="Write banner details or alert..."
                  className="w-full px-3 py-2 text-xs bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-sans"
                />
              </div>
            </>
          )}

          {/* Tab 2 Specific: Height choice */}
          {activeTab === 'header' && (
            <div>
              <label className="block text-xs font-medium text-[#c084fc] mb-1.5 font-['Space_Mono',monospace]">
                BANNER HEIGHT
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sm', 'md', 'lg'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHeaderHeight(h)}
                    className={`py-2 px-3 text-xs rounded-[6px] border transition-all cursor-pointer font-['Space_Mono',monospace] ${
                      headerHeight === h
                        ? 'bg-[#ec4899] border-[#ec4899] text-white font-semibold shadow-xs'
                        : 'bg-[#0c0714] border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff]'
                    }`}
                  >
                    {h === 'sm' ? 'Compact (80px)' : h === 'md' ? 'Medium (120px)' : 'Tall (180px)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div>
            <label className="block text-[10px] text-[#c084fc] mb-1 font-['Space_Mono',monospace]">
              LIVE PREVIEW
            </label>
            {activeTab === 'in-note' ? (
              <div
                className={`rounded-[8px] border ${preset.border} ${preset.bg} overflow-hidden shadow-xs`}
              >
                <div className="h-1.5 w-full" style={{ background: preset.gradient }} />
                <div className="p-3 flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 shadow-xs"
                    style={{ background: preset.gradient }}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {bannerTitle && (
                      <h4 className="text-xs font-bold text-[#faf5ff] mb-0.5">{bannerTitle}</h4>
                    )}
                    <p className="text-[11px] text-[#faf5ff]/80 leading-relaxed">
                      {bannerContent || 'Banner message goes here...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-24 rounded-[8px] overflow-hidden border border-[#2e1c52]">
                <div className="absolute inset-0" style={{ background: preset.gradient }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0714] via-transparent to-black/10" />
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[6px] bg-black/40 backdrop-blur-xs flex items-center justify-center border border-white/20">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white drop-shadow-md">
                    Top Note Banner
                  </span>
                </div>
              </div>
            )}
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
              <span>{activeTab === 'in-note' ? 'Insert In-Note Banner' : 'Set Note Banner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
