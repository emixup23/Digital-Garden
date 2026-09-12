import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Check,
  RotateCcw,
  Palette,
  Code,
  Folder as FolderIcon,
  FileCode,
  Upload,
  Copy,
  Trash2,
  AlertCircle,
  FileUp,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ICON_LIBRARY,
  ICON_CATEGORIES,
  IconCategory,
  PRESET_ICON_COLORS,
  CustomIconRenderer,
  isSvgMarkup,
  sanitizeSvgString,
} from '../utils/iconLibrary';

export interface IconPickerTarget {
  type: 'folder' | 'note';
  id: string;
  name: string;
  currentIcon?: string;
  currentIconColor?: string;
}

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: IconPickerTarget | null;
  onSave: (targetId: string, type: 'folder' | 'note', iconName: string | undefined, iconColor: string | undefined) => void;
}

// Preset sample SVGs for quick testing & inspiration
const SAMPLE_SVGS: { name: string; label: string; svg: string }[] = [
  {
    name: 'sparkle',
    label: 'Sparkle Star',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>',
  },
  {
    name: 'atom',
    label: 'Quantum Atom',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>',
  },
  {
    name: 'infinity',
    label: 'Infinity Node',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.267-8-12.356-8-5.096 0-5.096 8 0 8 5.09 0 7.261-8 12.356-8z"/></svg>',
  },
  {
    name: 'rocket',
    label: 'Rocket Launch',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  },
  {
    name: 'shield',
    label: 'Shield Vault',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  },
];

function extractSvgMetrics(svg: string): { viewBox?: string; dimensions?: string } {
  const vbMatch = svg.match(/viewBox=["']([^"']+)["']/i);
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/[\s,]+/);
    if (parts.length >= 4) {
      return {
        viewBox: vbMatch[1],
        dimensions: `${parts[2]} × ${parts[3]}`,
      };
    }
    return { viewBox: vbMatch[1] };
  }
  return {};
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  target,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'upload' | 'custom'>('all');
  const [selectedIconName, setSelectedIconName] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [customSvgInput, setCustomSvgInput] = useState('');
  const [customHexInput, setCustomHexInput] = useState('');

  // SVG file upload states
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or target changes
  React.useEffect(() => {
    if (isOpen && target) {
      setSelectedIconName(target.currentIcon);
      setSelectedColor(target.currentIconColor);
      setSearchQuery('');
      setUploadError(null);
      setIsCopied(false);
      setShowCodeEditor(false);

      if (target.currentIcon && isSvgMarkup(target.currentIcon)) {
        setSelectedCategory('upload');
        setCustomSvgInput(target.currentIcon);
        setUploadedFileName('Current Custom SVG');
        setUploadedFileSize(`${(new Blob([target.currentIcon]).size / 1024).toFixed(1)} KB`);
      } else {
        setSelectedCategory(target.type === 'folder' ? 'folders' : 'docs');
        setCustomSvgInput('');
        setUploadedFileName(null);
        setUploadedFileSize(null);
      }
      setCustomHexInput(target.currentIconColor || '');
    }
  }, [isOpen, target]);

  // Process selected or dropped SVG file
  const processSvgFile = async (file: File) => {
    setUploadError(null);

    const isSvgExt = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';
    if (!isSvgExt) {
      setUploadError('Please select a file with the .svg extension.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setUploadError('File exceeds 1MB limit. Please choose an optimized vector icon.');
      return;
    }

    try {
      const text = await file.text();
      if (!isSvgMarkup(text)) {
        setUploadError('Invalid SVG: The file does not contain valid <svg> ... </svg> markup.');
        return;
      }

      // Check XML validity using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        setUploadError('SVG syntax error. The file contains malformed XML.');
        return;
      }

      const cleaned = sanitizeSvgString(text);
      if (!cleaned || !isSvgMarkup(cleaned)) {
        setUploadError('Could not parse clean SVG elements from this file.');
        return;
      }

      setCustomSvgInput(cleaned);
      setSelectedIconName(cleaned);
      setSelectedCategory('upload');
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      setIsCopied(false);
    } catch (err) {
      console.error('Failed to read SVG file', err);
      setUploadError('Unable to read the uploaded file. Please try again.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSvgFile(files[0]);
    }
    // reset input so selecting the same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSvgFile(files[0]);
    }
  };

  const handleCopySvg = async () => {
    if (!customSvgInput) return;
    try {
      await navigator.clipboard.writeText(customSvgInput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSelectSample = (sampleSvg: string, label: string) => {
    const cleaned = sanitizeSvgString(sampleSvg);
    setCustomSvgInput(cleaned);
    setSelectedIconName(cleaned);
    setSelectedCategory('upload');
    setUploadedFileName(`${label.toLowerCase().replace(/\s+/g, '-')}.svg`);
    setUploadedFileSize(`${(new Blob([cleaned]).size / 1024).toFixed(1)} KB`);
    setUploadError(null);
  };

  const handleClearUploadedSvg = () => {
    setCustomSvgInput('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setUploadError(null);
    setSelectedIconName(undefined);
  };

  // Filter icons based on search query and category
  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ICON_LIBRARY.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'upload' && selectedCategory !== 'custom') {
        if (item.category !== selectedCategory) return false;
      }

      // Search query filter
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.label.toLowerCase().includes(q)) return true;
      return item.keywords.some((kw) => kw.toLowerCase().includes(q));
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen || !target) return null;

  const handleApply = () => {
    let finalIcon: string | undefined = selectedIconName;
    if (selectedCategory === 'upload' || selectedCategory === 'custom') {
      finalIcon = customSvgInput.trim() ? sanitizeSvgString(customSvgInput.trim()) : undefined;
    }
    const finalColor = selectedColor || undefined;
    onSave(target.id, target.type, finalIcon, finalColor);
    onClose();
  };

  const handleResetToDefault = () => {
    setSelectedIconName(undefined);
    setSelectedColor(undefined);
    setCustomSvgInput('');
    setCustomHexInput('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setUploadError(null);
  };

  const isFolder = target.type === 'folder';
  const defaultFallback = isFolder ? FolderIcon : FileCode;
  const effectiveColor = selectedColor || (isFolder ? '#ec4899' : '#c084fc');
  const isCustomSvgActive = (selectedCategory === 'upload' || selectedCategory === 'custom') && Boolean(customSvgInput.trim());
  const activeIconDisplay = isCustomSvgActive ? customSvgInput : selectedIconName;
  const metrics = customSvgInput ? extractSvgMetrics(customSvgInput) : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-['Space_Grotesk',sans-serif] animate-in fade-in duration-150">
      {/* Hidden File Input for .svg selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        id="icon-picker-modal-dialog"
        className="relative w-full max-w-2xl bg-[#150d24] border border-[#2e1c52] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#faf5ff]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e1c52] bg-[#19102b]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#2e1c52] p-1.5"
              style={{ backgroundColor: '#1f1338' }}
            >
              <CustomIconRenderer
                iconName={activeIconDisplay}
                color={effectiveColor}
                defaultIcon={defaultFallback}
                className="w-5 h-5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#faf5ff]">
                  Customize {isFolder ? 'Directory' : 'File'} Icon
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-['Space_Mono',monospace] bg-[#2e1c52] text-[#ec4899] font-semibold">
                  {isFolder ? 'Folder' : 'Note'}
                </span>
              </div>
              <p className="text-xs text-[#c084fc]/70 truncate max-w-md">
                {target.name}
              </p>
            </div>
          </div>

          <button
            id="btn-close-icon-picker"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#2e1c52] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar, Quick Upload & Category Switcher */}
        <div className="px-5 pt-3.5 pb-2 border-b border-[#2e1c52] bg-[#150d24] space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-icon-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search icons (e.g. brain, git, code, folder, science, lock)..."
                disabled={selectedCategory === 'upload' || selectedCategory === 'custom'}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-[#1f1338] border border-[#2e1c52] rounded-lg text-[#faf5ff] placeholder-[#c084fc]/50 focus:outline-none focus:border-[#ec4899] disabled:opacity-50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c084fc] hover:text-[#faf5ff] cursor-pointer text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Upload SVG Button */}
            <button
              id="btn-quick-upload-svg"
              type="button"
              onClick={() => {
                setSelectedCategory('upload');
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#ec4899]/20 hover:bg-[#ec4899]/30 border border-[#ec4899]/60 text-[#faf5ff] transition-colors cursor-pointer whitespace-nowrap font-medium"
              title="Upload an .svg vector file"
            >
              <Upload className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>Upload SVG</span>
            </button>

            {/* Quick reset button */}
            <button
              id="btn-reset-icon"
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#1f1338] hover:bg-[#2e1c52] border border-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer whitespace-nowrap"
              title="Reset to default icon and color"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Default</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
            {/* Upload SVG Tab */}
            <button
              id="tab-upload-svg"
              type="button"
              onClick={() => setSelectedCategory('upload')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'upload'
                  ? 'bg-[#ec4899] text-[#faf5ff] shadow-xs ring-1 ring-[#ec4899]'
                  : 'bg-[#1f1338] text-[#faf5ff] border border-[#ec4899]/40 hover:bg-[#2e1c52]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload SVG</span>
              {customSvgInput && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                    : 'bg-[#1f1338] text-[#c084fc] hover:bg-[#2e1c52] hover:text-[#faf5ff]'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <button
              id="tab-paste-svg"
              type="button"
              onClick={() => setSelectedCategory('custom')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'custom'
                  ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                  : 'bg-[#1f1338] text-[#c084fc] hover:bg-[#2e1c52] hover:text-[#faf5ff]'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Paste Code</span>
            </button>
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="px-5 py-2.5 bg-[#19102b] border-b border-[#2e1c52] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-[#c084fc] font-medium shrink-0">
            <Palette className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Icon Accent:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {/* Default Inherit option */}
            <button
              type="button"
              onClick={() => setSelectedColor(undefined)}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                selectedColor === undefined
                  ? 'border-[#ec4899] bg-[#ec4899]/20 text-[#faf5ff] font-bold'
                  : 'border-[#2e1c52] bg-[#1f1338] text-[#c084fc] hover:border-[#c084fc]'
              }`}
              title="Use default theme color"
            >
              Auto
            </button>

            {/* Preset Color Swatches */}
            {PRESET_ICON_COLORS.map((c) => {
              const isSelected = selectedColor === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative shrink-0 ${
                    isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#150d24] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-black absolute inset-0 m-auto stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Hex input */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-[#c084fc]/70 font-mono">#</span>
            <input
              type="text"
              placeholder="ec4899"
              value={customHexInput.replace(/^#/, '')}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                setCustomHexInput(val);
                if (val.length === 6 || val.length === 3) {
                  setSelectedColor(`#${val}`);
                }
              }}
              className="w-16 px-1.5 py-0.5 text-[11px] font-mono bg-[#1f1338] border border-[#2e1c52] rounded text-[#faf5ff] focus:outline-none focus:border-[#ec4899]"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[280px] max-h-[400px]">
          {selectedCategory === 'upload' ? (
            /* Upload SVG Tab */
            <div className="space-y-4">
              {/* Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-lg flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-100">Upload Issue</p>
                    <p className="text-[11px] opacity-90">{uploadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-rose-400 hover:text-rose-100 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Upload Drag & Drop Zone */}
              <div
                id="svg-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                  isDraggingOver
                    ? 'border-[#ec4899] bg-[#ec4899]/15 scale-[1.01]'
                    : 'border-[#3b2366] bg-[#1a0f30]/60 hover:bg-[#1f1338] hover:border-[#ec4899]/70'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#150d24] border border-[#2e1c52] flex items-center justify-center mb-2.5 group-hover:border-[#ec4899] transition-colors">
                  <FileUp className="w-6 h-6 text-[#ec4899]" />
                </div>
                <h3 className="text-xs font-bold text-[#faf5ff] mb-1">
                  {isDraggingOver ? 'Drop your SVG icon here!' : 'Click to browse or drop an .svg file'}
                </h3>
                <p className="text-[11px] text-[#c084fc]/70 max-w-sm">
                  Export vector graphics from Figma, Illustrator, FontAwesome, or Lucide. Accepts standard <code className="text-[#faf5ff] font-mono text-[10px] bg-[#150d24] px-1 py-0.5 rounded">.svg</code> files (max 1MB).
                </p>
              </div>

              {/* Active Uploaded SVG Status Card & Multi-Scale Preview */}
              {customSvgInput.trim() && (
                <div className="p-4 bg-[#1a0f30] border border-[#3b2366] rounded-xl space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e1c52] pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#150d24] border border-[#2e1c52] flex items-center justify-center p-1.5 shrink-0">
                        <CustomIconRenderer
                          iconName={customSvgInput}
                          color={effectiveColor}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#faf5ff] truncate max-w-[200px]">
                            {uploadedFileName || 'Custom SVG Icon'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold font-mono">
                            <Check className="w-2.5 h-2.5" /> SVG OK
                          </span>
                        </div>
                        <div className="text-[10px] text-[#c084fc]/70 font-mono">
                          {uploadedFileSize ? `${uploadedFileSize} • ` : ''}
                          {metrics.dimensions ? `${metrics.dimensions} • ` : ''}
                          {metrics.viewBox ? `viewBox: ${metrics.viewBox}` : 'Vector'}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#150d24] hover:bg-[#251740] border border-[#2e1c52] text-[#faf5ff] cursor-pointer"
                        title="Upload another SVG file"
                      >
                        <Upload className="w-3 h-3 text-[#c084fc]" />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopySvg}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#150d24] hover:bg-[#251740] border border-[#2e1c52] text-[#faf5ff] cursor-pointer"
                        title="Copy SVG markup to clipboard"
                      >
                        {isCopied ? (
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#c084fc]" />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearUploadedSvg}
                        className="p-1 rounded text-[#c084fc] hover:text-rose-400 hover:bg-[#150d24] cursor-pointer"
                        title="Clear custom SVG"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Scale Live Preview Strip */}
                  <div>
                    <div className="text-[11px] font-semibold text-[#faf5ff] mb-2 flex items-center justify-between">
                      <span>Multi-Scale Live Preview:</span>
                      <span className="text-[10px] text-[#c084fc]/70 font-normal">
                        Renders in file tree, tabs, and note header
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-3.5 h-3.5"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">14px (Tree)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-4.5 h-4.5"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">18px (Tabs)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-6 h-6"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">24px (Header)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-9 h-9"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">36px (Zoom)</span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Raw SVG code viewer/editor */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCodeEditor((prev) => !prev)}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#c084fc] hover:text-[#faf5ff] cursor-pointer"
                    >
                      {showCodeEditor ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>{showCodeEditor ? 'Hide SVG Code' : 'View / Edit SVG Markup'}</span>
                    </button>

                    {showCodeEditor && (
                      <div className="mt-2 space-y-1.5">
                        <textarea
                          rows={4}
                          value={customSvgInput}
                          onChange={(e) => setCustomSvgInput(e.target.value)}
                          className="w-full p-2 text-[10px] font-mono bg-[#150d24] border border-[#2e1c52] rounded text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-none focus:border-[#ec4899] resize-none"
                        />
                        <p className="text-[10px] text-[#c084fc]/60">
                          Changes take effect instantly. Keep viewBox for proper scaling.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sample Vector Templates */}
              <div>
                <div className="text-[11px] font-semibold text-[#faf5ff] mb-2 flex items-center gap-1.5">
                  <span>Or select a sample SVG vector icon:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SAMPLE_SVGS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => handleSelectSample(sample.svg, sample.label)}
                      className="p-2.5 rounded-lg bg-[#1f1338] border border-[#2e1c52] hover:border-[#ec4899] hover:bg-[#281845] transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer group"
                    >
                      <CustomIconRenderer
                        iconName={sample.svg}
                        color={effectiveColor}
                        className="w-5 h-5 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-medium text-[#faf5ff] truncate max-w-full">
                        {sample.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedCategory === 'custom' ? (
            /* Paste Raw Code Tab */
            <div className="space-y-3">
              <div className="p-3 bg-[#1f1338] border border-[#2e1c52] rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#faf5ff]">Paste Raw SVG Markup</span>
                  <span className="text-[10px] text-[#c084fc] font-mono">&lt;svg ...&gt;...&lt;/svg&gt;</span>
                </div>
                <p className="text-[11px] text-[#c084fc]/80 leading-relaxed">
                  You can paste custom SVG vector code from your favorite icon libraries (e.g. Feather, FontAwesome, Material, Heroicons, or bespoke illustrations).
                </p>
                <textarea
                  id="textarea-custom-svg"
                  rows={6}
                  value={customSvgInput}
                  onChange={(e) => {
                    setCustomSvgInput(e.target.value);
                    if (isSvgMarkup(e.target.value)) {
                      setSelectedIconName(e.target.value);
                      setUploadedFileName('Pasted SVG');
                    }
                  }}
                  placeholder='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
                  className="w-full p-2.5 text-xs font-mono bg-[#150d24] border border-[#2e1c52] rounded text-[#faf5ff] placeholder-[#c084fc]/40 focus:outline-none focus:border-[#ec4899] resize-none"
                />
              </div>

              {/* Live Preview of custom SVG */}
              {customSvgInput.trim() && (
                <div className="p-3 bg-[#1f1338] border border-[#2e1c52] rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#150d24] border border-[#2e1c52] flex items-center justify-center p-2">
                    <CustomIconRenderer
                      iconName={customSvgInput}
                      color={effectiveColor}
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#faf5ff]">Custom SVG Preview</div>
                    <div className="text-[11px] text-[#c084fc]/70">
                      Renders dynamically in sidebar, tabs, and headers with selected accent color.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Curated SVG Icon Grid */
            <>
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {filteredIcons.map((item) => {
                    const isSelected = selectedIconName?.toLowerCase() === item.name.toLowerCase();
                    const IconComp = item.component;

                    return (
                      <button
                        key={item.name}
                        id={`btn-icon-item-${item.name}`}
                        type="button"
                        onClick={() => {
                          setSelectedIconName(item.name);
                          setCustomSvgInput('');
                          setUploadedFileName(null);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-center transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#faf5ff] ring-1 ring-[#ec4899]'
                            : 'bg-[#1f1338] border-[#2e1c52] text-[#faf5ff]/80 hover:border-[#c084fc]/70 hover:bg-[#2a1a4c] hover:text-[#faf5ff]'
                        }`}
                        title={item.label}
                      >
                        <IconComp
                          className="w-5 h-5 transition-transform group-hover:scale-110"
                          style={{ color: isSelected ? effectiveColor : undefined }}
                        />
                        <span className="text-[10px] truncate max-w-full font-mono text-[#c084fc] group-hover:text-[#faf5ff]">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Search className="w-8 h-8 text-[#c084fc]/40 mx-auto" />
                  <div className="text-xs text-[#faf5ff] font-medium">No SVG icons match "{searchQuery}"</div>
                  <div className="text-[11px] text-[#c084fc]/60">
                    Try searching for terms like "folder", "code", "book", "brain", "tool", or "git", or upload your own SVG above.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer & Live Item Preview */}
        <div className="px-5 py-3.5 bg-[#19102b] border-t border-[#2e1c52] flex items-center justify-between gap-4">
          {/* Live Preview Strip */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-[#c084fc] uppercase tracking-wider font-mono font-semibold shrink-0">
              Preview:
            </span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#150d24] border border-[#2e1c52] truncate">
              <CustomIconRenderer
                iconName={activeIconDisplay}
                color={effectiveColor}
                defaultIcon={defaultFallback}
                className="w-4 h-4 shrink-0"
              />
              <span className="text-xs font-medium text-[#faf5ff] truncate">
                {target.name}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-cancel-icon-picker"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c084fc] hover:text-[#faf5ff] hover:bg-[#1f1338] transition-colors cursor-pointer border border-transparent"
            >
              Cancel
            </button>
            <button
              id="btn-save-icon-picker"
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#ec4899] hover:bg-[#db2777] text-[#faf5ff] transition-colors cursor-pointer shadow-sm"
              style={{ backgroundColor: '#ec4899', color: '#faf5ff' }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Icon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
