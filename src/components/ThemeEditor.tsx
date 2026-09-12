import { useState, useMemo, FC } from 'react';
import {
  Palette,
  X,
  RotateCcw,
  Check,
  Copy,
  Download,
  Upload,
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Type,
  Square,
  FileText,
  ExternalLink,
  PlusCircle,
  Tag as TagIcon,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ThemeConfig } from '../types';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  generateHoverColor,
  generateLightColor,
  getContrastRatio,
} from '../utils/themePresets';

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme?: ThemeConfig;
  currentTheme?: ThemeConfig;
  onThemeChange?: (newTheme: ThemeConfig) => void;
  onApplyTheme?: (newTheme: ThemeConfig) => void;
  onResetDefault: () => void;
}

type TabKey = 'presets' | 'palette' | 'style' | 'json';

export const ThemeEditor: FC<ThemeEditorProps> = ({
  isOpen,
  onClose,
  activeTheme: propActiveTheme,
  currentTheme: propCurrentTheme,
  onThemeChange: propOnThemeChange,
  onApplyTheme: propOnApplyTheme,
  onResetDefault,
}) => {
  const activeTheme: ThemeConfig = {
    ...DEFAULT_THEME,
    ...(propActiveTheme || propCurrentTheme || {}),
  };
  const onThemeChange = propOnThemeChange || propOnApplyTheme || (() => {});

  const [activeTab, setActiveTab] = useState<TabKey>('presets');
  const [filterMode, setFilterMode] = useState<'all' | 'dark' | 'light'>('all');
  const [copiedToast, setCopiedToast] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Curated accent swatch options for fast palette matching
  const ACCENT_SWATCHES = [
    { label: 'Cyber Pink', hex: '#ec4899' },
    { label: 'Neon Violet', hex: '#a855f7' },
    { label: 'Electric Blue', hex: '#3b82f6' },
    { label: 'Arctic Cyan', hex: '#06b6d4' },
    { label: 'Emerald Mint', hex: '#10b981' },
    { label: 'Matrix Lime', hex: '#22c55e' },
    { label: 'Amber Gold', hex: '#f59e0b' },
    { label: 'Sunset Orange', hex: '#f97316' },
    { label: 'Crimson Rose', hex: '#f43f5e' },
    { label: 'Royal Indigo', hex: '#6366f1' },
  ];

  // Radius options
  const RADIUS_OPTIONS = [
    { label: 'Sharp', value: '0px', description: '0px - Brutalist hard edges' },
    { label: 'Compact', value: '4px', description: '4px - Dense technical UI' },
    { label: 'Standard', value: '6px', description: '6px - Balanced modern default' },
    { label: 'Rounded', value: '10px', description: '10px - Soft friendly corners' },
    { label: 'Smooth', value: '14px', description: '14px - Organic fluid shape' },
  ];

  // Font options
  const FONT_OPTIONS = [
    {
      label: 'Space Grotesk & Space Mono',
      font: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      fontMono: "'Space Mono', monospace",
      desc: 'Technical, geometric, modern PKM aesthetic (Default)',
    },
    {
      label: 'Inter & JetBrains Mono',
      font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
      desc: 'Clean, legible, product interface precision',
    },
    {
      label: 'System Native & Monospace',
      font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontMono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      desc: 'Blazing fast native operating system fonts',
    },
  ];

  // Handlers for updating individual theme properties
  const updateField = (field: keyof ThemeConfig, value: string | boolean) => {
    const nextTheme: ThemeConfig = {
      ...activeTheme,
      [field]: value,
    };

    // Auto-compute hover and light colors when primary changes
    if (field === 'primaryColor' && typeof value === 'string') {
      nextTheme.primaryHoverColor = generateHoverColor(value);
      nextTheme.primaryLightColor = generateLightColor(value, 0.15);
    }

    onThemeChange(nextTheme);
  };

  // Contrast metrics
  const textContrast = getContrastRatio(activeTheme.textColor, activeTheme.backgroundColor);
  const accentContrast = getContrastRatio(activeTheme.primaryColor, activeTheme.backgroundColor);

  // Filter presets
  const filteredPresets = THEME_PRESETS.filter((p) => {
    if (filterMode === 'dark') return p.isDark;
    if (filterMode === 'light') return !p.isDark;
    return true;
  });

  // Export JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(activeTheme, null, 2));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(activeTheme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeTheme.id || 'custom-theme'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      if (!parsed.primaryColor || !parsed.backgroundColor) {
        throw new Error('Theme configuration must at least include primaryColor and backgroundColor.');
      }
      const newTheme: ThemeConfig = {
        ...DEFAULT_THEME,
        ...parsed,
        id: parsed.id || `custom-${Date.now()}`,
        name: parsed.name || 'Imported Custom Theme',
      };
      onThemeChange(newTheme);
      setJsonInput('');
      setActiveTab('presets');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-5xl h-[88vh] max-h-[780px] bg-[#150d24] border border-[#2e1c52] rounded-[6px] shadow-2xl flex flex-col overflow-hidden text-[#faf5ff] font-['Space_Grotesk',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#2e1c52] flex items-center justify-between shrink-0 bg-[#150d24]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[6px] bg-[#ec4899]/15 border border-[#ec4899]/40 text-[#ec4899]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#faf5ff] tracking-tight">Theme Studio & Palette Editor</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#1f1338] text-[#ec4899] border border-[#2e1c52]">
                  {activeTheme.name}
                </span>
              </div>
              <p className="text-[11px] text-[#c084fc]">
                Real-time custom styling for surfaces, typography, links, and borders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reset-theme-default"
              type="button"
              onClick={onResetDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] border border-transparent hover:border-[#2e1c52] transition-colors cursor-pointer"
              title="Reset to Neon Cyber Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>

            <button
              id="btn-close-theme-editor"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] transition-colors cursor-pointer border border-transparent hover:border-[#2e1c52]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-[#2e1c52] bg-[#0c0714]/60 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 py-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Presets</span>
              <span className="text-[10px] opacity-75 font-mono">({THEME_PRESETS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('palette')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'palette'
                  ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Palette Tuning</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'style'
                  ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Radius & Fonts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                  : 'text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import / Export</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#c084fc]">
            <span className="inline-flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: activeTheme.primaryColor }}
              />
              <span className="uppercase">{activeTheme.primaryColor}</span>
            </span>
          </div>
        </div>

        {/* Main Body: Two Columns (Controls on Left, Live Preview on Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Controls Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: CURATED PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-0.5 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        filterMode === 'all'
                          ? 'bg-[#ec4899] text-[#faf5ff] font-semibold'
                          : 'text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      All Themes ({THEME_PRESETS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('dark')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        filterMode === 'dark'
                          ? 'bg-[#ec4899] text-[#faf5ff] font-semibold'
                          : 'text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>Dark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('light')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        filterMode === 'light'
                          ? 'bg-[#ec4899] text-[#faf5ff] font-semibold'
                          : 'text-[#c084fc] hover:text-[#faf5ff]'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>Light</span>
                    </button>
                  </div>

                  <span className="text-xs text-[#c084fc] font-mono">1-click instant switch</span>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPresets.map((preset) => {
                    const isCurrent = activeTheme.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => onThemeChange(preset)}
                        className={`p-3.5 rounded-[6px] border text-left cursor-pointer transition-all hover:scale-[1.01] relative flex flex-col justify-between gap-3 ${
                          isCurrent
                            ? 'border-[#ec4899] bg-[#1f1338] shadow-md ring-1 ring-[#ec4899]/50'
                            : 'border-[#2e1c52] bg-[#150d24] hover:border-[#ec4899]/50 hover:bg-[#1f1338]/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-[#faf5ff]">{preset.name}</h3>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-[4px] font-mono ${
                                  preset.isDark
                                    ? 'bg-black/30 text-[#c084fc] border border-[#2e1c52]'
                                    : 'bg-white/10 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {preset.isDark ? 'Dark' : 'Light'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#c084fc] mt-0.5 line-clamp-1">{preset.description}</p>
                          </div>
                          {isCurrent && (
                            <div className="p-1 rounded-full bg-[#ec4899] text-[#faf5ff] shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Visual Palette Strip */}
                        <div className="flex items-center gap-1.5 p-1 rounded-[4px] bg-black/20 border border-[#2e1c52]/60">
                          {/* Accent */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.primaryColor }}
                            title={`Primary Accent: ${preset.primaryColor}`}
                          />
                          {/* Background */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.backgroundColor }}
                            title={`Background Canvas: ${preset.backgroundColor}`}
                          />
                          {/* Surface */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.surfaceColor }}
                            title={`Surface Tone: ${preset.surfaceColor}`}
                          />
                          {/* Secondary Surface */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.surfaceSecondaryColor }}
                            title={`Secondary: ${preset.surfaceSecondaryColor}`}
                          />
                          {/* Border */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.borderColor }}
                            title={`Border Outline: ${preset.borderColor}`}
                          />
                          {/* Note Button */}
                          <div
                            className="w-5 h-5 rounded-[3px] border border-white/20 shrink-0"
                            style={{ backgroundColor: preset.noteButtonBg }}
                            title={`Note Content Buttons: ${preset.noteButtonBg}`}
                          />

                          <div className="ml-auto text-[10px] font-mono text-[#c084fc] uppercase">
                            {preset.primaryColor}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PALETTE TUNING */}
            {activeTab === 'palette' && (
              <div className="space-y-6">
                {/* Accent Color Picker & Quick Swatches */}
                <div className="p-4 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[#faf5ff] block">Primary Accent Color</label>
                      <p className="text-[11px] text-[#c084fc]">
                        Powers navigation links, active badges, highlights, and bidirectional relationships
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.primaryColor.startsWith('#') ? activeTheme.primaryColor : '#ec4899'}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeTheme.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                      />
                    </div>
                  </div>

                  {/* Curated Swatches */}
                  <div className="pt-2 border-t border-[#2e1c52]/60 flex flex-wrap gap-1.5">
                    {ACCENT_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => updateField('primaryColor', swatch.hex)}
                        className={`px-2 py-1 rounded-[4px] text-[10px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                          activeTheme.primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'border-[#faf5ff] bg-black/40 text-[#faf5ff] font-bold shadow-xs'
                            : 'border-[#2e1c52] hover:border-[#faf5ff]/40 text-[#c084fc]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Surfaces & Canvases */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] font-mono">
                    Canvases & Surfaces
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Background Canvas */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Background Canvas</span>
                        <span className="text-[10px] text-[#c084fc]">Deep background tone</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.backgroundColor.startsWith('#') ? activeTheme.backgroundColor : '#0c0714'}
                          onChange={(e) => updateField('backgroundColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.backgroundColor}
                          onChange={(e) => updateField('backgroundColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>

                    {/* Primary Surface */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Primary Surface</span>
                        <span className="text-[10px] text-[#c084fc]">Sidebar, modals, cards</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.surfaceColor.startsWith('#') ? activeTheme.surfaceColor : '#150d24'}
                          onChange={(e) => updateField('surfaceColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.surfaceColor}
                          onChange={(e) => updateField('surfaceColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>

                    {/* Secondary Surface */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Elevated Surface</span>
                        <span className="text-[10px] text-[#c084fc]">Inputs, search, badges</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.surfaceSecondaryColor.startsWith('#') ? activeTheme.surfaceSecondaryColor : '#1f1338'}
                          onChange={(e) => updateField('surfaceSecondaryColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.surfaceSecondaryColor}
                          onChange={(e) => updateField('surfaceSecondaryColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>

                    {/* Border & Outline */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Border & Dividers</span>
                        <span className="text-[10px] text-[#c084fc]">Panel partitions & lines</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.borderColor.startsWith('#') ? activeTheme.borderColor : '#2e1c52'}
                          onChange={(e) => updateField('borderColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.borderColor}
                          onChange={(e) => updateField('borderColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Colors & Note Specifics */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c084fc] font-mono">
                    Text & Content Buttons
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Text */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Primary Text</span>
                        <span className="text-[10px] text-[#c084fc]">Headings and note prose</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.textColor.startsWith('#') ? activeTheme.textColor : '#faf5ff'}
                          onChange={(e) => updateField('textColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.textColor}
                          onChange={(e) => updateField('textColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>

                    {/* Muted Text */}
                    <div className="p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#faf5ff] block">Muted Text</span>
                        <span className="text-[10px] text-[#c084fc]">Subtitles, icons, metadata</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={activeTheme.textMutedColor.startsWith('#') ? activeTheme.textMutedColor : '#c084fc'}
                          onChange={(e) => updateField('textMutedColor', e.target.value)}
                          className="w-7 h-7 rounded-[4px] border border-[#2e1c52] cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTheme.textMutedColor}
                          onChange={(e) => updateField('textMutedColor', e.target.value)}
                          className="w-20 px-1.5 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>

                    {/* Buttons Inside Notes (User Custom Feature) */}
                    <div className="sm:col-span-2 p-3 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#faf5ff]">Buttons Inside Notes Background</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/40">
                            Custom Feature
                          </span>
                        </div>
                        <span className="text-[10px] text-[#c084fc]">
                          Applies specifically to wikilinks, ghost links, and interactive buttons inside markdown notes
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={activeTheme.noteButtonBg}
                          onChange={(e) => updateField('noteButtonBg', e.target.value)}
                          placeholder="rgb(12 7 20) or #0c0714"
                          className="w-36 px-2 py-1 text-xs font-mono rounded-[4px] bg-[#150d24] border border-[#2e1c52] text-[#faf5ff]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RADIUS & FONTS */}
            {activeTab === 'style' && (
              <div className="space-y-6">
                {/* Border Radius Selection */}
                <div className="p-4 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#faf5ff] block">Corner Radius Geometry</label>
                    <p className="text-[11px] text-[#c084fc]">
                      Sets curvature on buttons, search inputs, panels, modal dialogs, and tags
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {RADIUS_OPTIONS.map((opt) => {
                      const isSelected = activeTheme.radiusPx === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField('radiusPx', opt.value)}
                          className={`p-2.5 border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#ec4899] bg-[#ec4899]/15 text-[#faf5ff] font-bold shadow-xs'
                              : 'border-[#2e1c52] bg-[#150d24] text-[#c084fc] hover:text-[#faf5ff] hover:border-[#ec4899]/50'
                          }`}
                          style={{ borderRadius: opt.value }}
                        >
                          <div
                            className="w-5 h-5 mx-auto mb-1.5 border border-current flex items-center justify-center text-[10px]"
                            style={{ borderRadius: opt.value }}
                          >
                            <Square className="w-2.5 h-2.5" />
                          </div>
                          <span className="text-xs block">{opt.label}</span>
                          <span className="text-[10px] font-mono opacity-60 block">{opt.value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Pairing Selection */}
                <div className="p-4 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#faf5ff] block">Typography System</label>
                    <p className="text-[11px] text-[#c084fc]">
                      Pairing for markdown body text, headings, code blocks, and graph statistics
                    </p>
                  </div>

                  <div className="space-y-2">
                    {FONT_OPTIONS.map((f) => {
                      const isSelected = activeTheme.fontFamily === f.font;
                      return (
                        <div
                          key={f.label}
                          onClick={() => {
                            const next = {
                              ...activeTheme,
                              fontFamily: f.font,
                              fontFamilyMono: f.fontMono,
                            };
                            onThemeChange(next);
                          }}
                          className={`p-3 rounded-[6px] border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#ec4899] bg-[#150d24] shadow-xs'
                              : 'border-[#2e1c52] bg-[#150d24]/60 hover:bg-[#150d24] hover:border-[#ec4899]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#faf5ff]">{f.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#ec4899]" />}
                          </div>
                          <p className="text-[11px] text-[#c084fc] mt-0.5">{f.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: IMPORT / EXPORT */}
            {activeTab === 'json' && (
              <div className="space-y-4">
                <div className="p-4 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#faf5ff]">Export Current Theme</h3>
                      <p className="text-[11px] text-[#c084fc]">
                        Copy or download active configuration to back up or share your custom palette
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyJSON}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#ec4899] text-[#faf5ff] hover:bg-[#db2777] transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToast ? 'Copied!' : 'Copy JSON'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadJSON}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#150d24] border border-[#2e1c52] text-[#faf5ff] hover:bg-[#2e1c52] transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 rounded-[4px] bg-[#0c0714] border border-[#2e1c52] text-[11px] font-mono text-[#c084fc] overflow-x-auto max-h-48">
                    {JSON.stringify(activeTheme, null, 2)}
                  </pre>
                </div>

                <div className="p-4 rounded-[6px] bg-[#1f1338] border border-[#2e1c52] space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#faf5ff]">Import Theme JSON</h3>
                    <p className="text-[11px] text-[#c084fc]">
                      Paste custom theme JSON schema to apply community colors or external configurations
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{"name": "Custom Neo", "primaryColor": "#06b6d4", "backgroundColor": "#070b12", ...}'
                    className="w-full p-2.5 rounded-[4px] bg-[#0c0714] border border-[#2e1c52] text-xs font-mono text-[#faf5ff] focus:outline-none focus:border-[#ec4899] placeholder:text-[#c084fc]/40"
                  />

                  {jsonError && (
                    <div className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-[4px] border border-rose-800/40">
                      {jsonError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!jsonInput.trim()}
                    onClick={handleImportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#ec4899] text-[#faf5ff] hover:bg-[#db2777] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Apply & Save Theme</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Column */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#2e1c52] bg-[#0c0714]/80 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#faf5ff] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Interactive Live Preview</span>
                </span>
                <span className="text-[10px] font-mono text-[#c084fc] px-1.5 py-0.5 rounded-[4px] bg-[#1f1338] border border-[#2e1c52]">
                  Live Sandbox
                </span>
              </div>

              {/* Sample Note Card Preview */}
              <div
                className="p-4 rounded-[6px] border space-y-3 transition-colors shadow-lg"
                style={{
                  backgroundColor: activeTheme.surfaceColor,
                  borderColor: activeTheme.borderColor,
                  borderRadius: activeTheme.radiusPx,
                  color: activeTheme.textColor,
                }}
              >
                {/* Note Breadcrumb & Heading */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono" style={{ color: activeTheme.textMutedColor }}>
                    Vault / Architecture
                  </div>
                  <h4 className="text-sm font-bold tracking-tight">System Architecture</h4>
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  A resilient decoupled architecture using bidirectional graph linkages and fast reactive state.
                </p>

                {/* Sample Buttons / Wiki Links using noteButtonBg */}
                <div className="pt-2 border-t space-y-2" style={{ borderColor: activeTheme.borderColor }}>
                  <div className="text-[10px] font-mono" style={{ color: activeTheme.textMutedColor }}>
                    Links inside note (bg: {activeTheme.noteButtonBg}):
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-[6px] font-mono cursor-pointer transition-colors"
                      style={{
                        backgroundColor: activeTheme.noteButtonBg,
                        borderColor: activeTheme.borderColor,
                        color: activeTheme.textColor,
                        borderRadius: activeTheme.radiusPx,
                      }}
                    >
                      <ExternalLink className="w-3 h-3" style={{ color: activeTheme.primaryColor }} />
                      <span>Data Pipeline</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border rounded-[6px] font-mono cursor-pointer transition-colors"
                      style={{
                        backgroundColor: activeTheme.noteButtonBg,
                        borderColor: activeTheme.borderColor,
                        color: activeTheme.textColor,
                        borderRadius: activeTheme.radiusPx,
                      }}
                    >
                      <PlusCircle className="w-3 h-3" style={{ color: activeTheme.primaryColor }} />
                      <span>Queue Service</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-black/20" style={{ color: activeTheme.textMutedColor }}>
                        new
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sample Tag & Status */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: activeTheme.borderColor }}>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border font-medium"
                    style={{
                      backgroundColor: activeTheme.noteButtonBg,
                      borderColor: activeTheme.borderColor,
                      color: activeTheme.textMutedColor,
                      borderRadius: activeTheme.radiusPx,
                    }}
                  >
                    <TagIcon className="w-3 h-3" style={{ color: activeTheme.primaryColor }} />
                    <span>#graph</span>
                  </span>

                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded shadow-xs"
                    style={{
                      backgroundColor: activeTheme.primaryColor,
                      color: activeTheme.isDark ? '#faf5ff' : '#ffffff',
                      borderRadius: activeTheme.radiusPx,
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bidirectional</span>
                  </span>
                </div>
              </div>

              {/* Sample Mini Graph Node representation */}
              <div
                className="p-3 rounded-[6px] border space-y-2 text-xs"
                style={{
                  backgroundColor: activeTheme.surfaceSecondaryColor,
                  borderColor: activeTheme.borderColor,
                  borderRadius: activeTheme.radiusPx,
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: activeTheme.textMutedColor }}>
                  <span>Knowledge Graph Node</span>
                  <span>r={activeTheme.radiusPx}</span>
                </div>
                <div className="flex items-center justify-center py-3">
                  <div className="relative flex items-center justify-center">
                    <div
                      className="w-10 h-10 rounded-full border border-dashed animate-pulse"
                      style={{ borderColor: activeTheme.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full absolute shadow-sm"
                      style={{ backgroundColor: activeTheme.primaryColor }}
                    />
                  </div>
                  <div
                    className="h-0.5 w-16 border-t"
                    style={{ borderColor: activeTheme.primaryColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activeTheme.textColor }}
                  />
                </div>
              </div>

              {/* Contrast Metrics Card */}
              <div className="p-3 rounded-[6px] bg-[#150d24] border border-[#2e1c52] space-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-[#faf5ff]">
                  <Info className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Readability & Contrast Metrics</span>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-[#c084fc]">
                    <span>Text on Background:</span>
                    <span className="font-bold text-[#faf5ff]">
                      {textContrast.toFixed(1)}:1 {textContrast >= 4.5 ? '✓ AA Pass' : '⚠ Low'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#c084fc]">
                    <span>Accent on Background:</span>
                    <span className="font-bold text-[#faf5ff]">
                      {accentContrast.toFixed(1)}:1 {accentContrast >= 3.0 ? '✓ AA Large' : '⚠ Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#2e1c52] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-[6px] text-xs font-semibold bg-[#ec4899] text-[#faf5ff] hover:bg-[#db2777] shadow-sm transition-colors cursor-pointer text-center"
              >
                Apply Theme & Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
