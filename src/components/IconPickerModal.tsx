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
  Server,
  Cloud,
  Terminal,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ICON_LIBRARY,
  ICON_CATEGORIES,
  ICON_LIBRARIES,
  IconCategory,
  IconLibraryId,
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

// Preset sample SVGs for quick testing & inspiration (including Linux Tux & Cloud Infra)
const SAMPLE_SVGS: { name: string; label: string; library: string; svg: string }[] = [
  {
    name: 'tux',
    label: 'Linux Tux Penguin',
    library: 'Linux',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 2 8 3.5 8 6v4c-1.5.5-3 2-3 4.5 0 2 1.5 3 2.5 3.5-.2.8-.5 1.5-1.5 2-.5.3-.5.9 0 1.2 1.2.7 3 .8 4.5.3 1 .3 2 .3 3 0 1.5.5 3.3.4 4.5-.3.5-.3.5-.9 0-1.2-1-.5-1.3-1.2-1.5-2 1-.5 2.5-1.5 2.5-3.5 0-2.5-1.5-4-3-4.5V6c0-2.5-1.5-4-4-4zm-1.5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
  },
  {
    name: 'k8s_wheel',
    label: 'Kubernetes Helm',
    library: 'DevOps',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>',
  },
  {
    name: 'cloud_cluster',
    label: 'Cloud Server Rack',
    library: 'Cloud',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><rect x="4" y="16" width="16" height="4" rx="1"/><line x1="8" y1="18" x2="8.01" y2="18"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  },
  {
    name: 'terminal_root',
    label: 'Root Shell Prompt',
    library: 'SysAdmin',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  },
  {
    name: 'atom',
    label: 'Quantum Node',
    library: 'Science',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>',
  },
];

const POPULAR_SEARCH_TAGS = [
  { label: '🐧 Linux', query: 'linux' },
  { label: 'Ubuntu', query: 'ubuntu' },
  { label: 'Arch', query: 'arch' },
  { label: 'Docker', query: 'docker' },
  { label: 'K8s', query: 'k8s' },
  { label: '☁️ AWS', query: 'aws' },
  { label: 'GCP', query: 'gcp' },
  { label: 'Azure', query: 'azure' },
  { label: 'Nginx', query: 'nginx' },
  { label: 'Postgres', query: 'postgres' },
  { label: 'WireGuard', query: 'wireguard' },
  { label: 'Redis', query: 'redis' },
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

function getLibraryBadgeStyle(library: string) {
  switch (library) {
    case 'si':
      return {
        label: 'SI',
        title: 'Simple Icons (Official Brands & Distros)',
        className: 'bg-cyan-950/90 text-cyan-300 border-cyan-800/70',
      };
    case 'fa6':
      return {
        label: 'FA6',
        title: 'Font Awesome 6 (Hardware & Cloud)',
        className: 'bg-indigo-950/90 text-indigo-300 border-indigo-800/70',
      };
    case 'vsc':
      return {
        label: 'VSC',
        title: 'VS Code Codicons (VMs & Azure)',
        className: 'bg-sky-950/90 text-sky-300 border-sky-800/70',
      };
    case 'di':
      return {
        label: 'DI',
        title: 'Devicons (Classic Developer & SysAdmin)',
        className: 'bg-emerald-950/90 text-emerald-300 border-emerald-800/70',
      };
    default:
      return {
        label: 'LUCIDE',
        title: 'Lucide Icons (Modern Minimalist)',
        className: 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-800/70',
      };
  }
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  target,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibraryId>('all');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or target changes
  React.useEffect(() => {
    if (isOpen && target) {
      setSelectedIconName(target.currentIcon);
      setSelectedColor(target.currentIconColor);
      setSearchQuery('');
      setSelectedLibrary('all');
      setUploadError(null);
      setIsCopied(false);

      if (target.currentIcon && isSvgMarkup(target.currentIcon)) {
        setSelectedCategory('upload');
        setCustomSvgInput(target.currentIcon);
        setUploadedFileName('Current Custom SVG');
        setUploadedFileSize(`${(new Blob([target.currentIcon]).size / 1024).toFixed(1)} KB`);
      } else {
        // If target already has an icon, check its category or default to all
        setSelectedCategory('all');
        setCustomSvgInput('');
        setUploadedFileName(null);
        setUploadedFileSize(null);
      }
      setCustomHexInput(target.currentIconColor || '');
    }
  }, [isOpen, target]);

  // Compute counts for libraries and categories
  const libraryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ICON_LIBRARY.length };
    for (const item of ICON_LIBRARY) {
      counts[item.library] = (counts[item.library] || 0) + 1;
    }
    return counts;
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ICON_LIBRARY.length };
    for (const item of ICON_LIBRARY) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

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

  // Filter icons based on search query, category, and icon library
  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ICON_LIBRARY.filter((item) => {
      // Library filter
      if (selectedLibrary !== 'all') {
        if (item.library !== selectedLibrary) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'upload' && selectedCategory !== 'custom') {
        if (item.category !== selectedCategory) return false;
      }

      // Search query filter
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.library.toLowerCase().includes(q)) return true;
      return item.keywords.some((kw) => kw.toLowerCase().includes(q));
    });
  }, [searchQuery, selectedCategory, selectedLibrary]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-['Space_Grotesk',sans-serif] animate-in fade-in duration-150">
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
        className="relative w-full max-w-3xl bg-[#150d24] border border-[#2e1c52] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#faf5ff]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2e1c52] bg-[#19102b]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#2e1c52] p-1.5 shadow-inner"
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
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-medium">
                  {ICON_LIBRARY.length} Icons across 5 Libraries
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

        {/* 1. Icon Library Selector Filter Row */}
        <div className="px-5 py-2.5 bg-[#120a20] border-b border-[#2e1c52] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#c084fc] font-medium mr-1">
            <Layers className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Library:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {ICON_LIBRARIES.map((lib) => {
              const isSelected = selectedLibrary === lib.id;
              const count = libraryCounts[lib.id] || 0;
              return (
                <button
                  key={lib.id}
                  type="button"
                  id={`btn-library-filter-${lib.id}`}
                  onClick={() => setSelectedLibrary(lib.id)}
                  title={lib.description}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                      : 'bg-[#1a0f2e] text-[#c084fc] hover:bg-[#251542] hover:text-[#faf5ff] border border-[#2e1c52]'
                  }`}
                >
                  <span>{lib.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-[#150d24] text-[#c084fc]/80'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search Bar & Quick Tags */}
        <div className="px-5 pt-3 pb-2.5 border-b border-[#2e1c52] bg-[#150d24] space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#c084fc] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-icon-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Linux distros, cloud providers, sysadmin tools, containers, DBs, or UI icons..."
                disabled={selectedCategory === 'upload' || selectedCategory === 'custom'}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-[#1f1338] border border-[#2e1c52] rounded-lg text-[#faf5ff] placeholder-[#c084fc]/50 focus:outline-none focus:border-[#ec4899] disabled:opacity-50 transition-colors font-mono"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#1f1338] hover:bg-[#281745] border border-[#ec4899]/60 text-[#faf5ff] transition-colors cursor-pointer whitespace-nowrap font-medium shadow-2xs"
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

          {/* Quick search suggestion tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
            <span className="text-[#c084fc]/60 shrink-0 font-mono">Quick:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag.query}
                type="button"
                onClick={() => {
                  setSearchQuery(tag.query);
                  if (selectedCategory === 'upload' || selectedCategory === 'custom') {
                    setSelectedCategory('all');
                  }
                }}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer font-mono ${
                  searchQuery.toLowerCase() === tag.query.toLowerCase()
                    ? 'bg-[#ec4899] text-[#faf5ff] font-semibold'
                    : 'bg-[#1f1338] hover:bg-[#2e1c52] text-[#c084fc] hover:text-[#faf5ff] border border-[#2e1c52]'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 text-xs scrollbar-none">
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

            {ICON_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`tab-category-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#ec4899] text-[#faf5ff] font-semibold shadow-xs'
                      : 'bg-[#1f1338] text-[#c084fc] hover:bg-[#2e1c52] hover:text-[#faf5ff]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-black/30 text-white' : 'text-[#c084fc]/70'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

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

        {/* 3. Color Palette Selector */}
        <div className="px-5 py-2 bg-[#19102b] border-b border-[#2e1c52] flex items-center justify-between gap-3 text-xs">
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

        {/* 4. Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[300px] max-h-[440px]">
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
                  Accepts standard <code className="text-[#faf5ff] font-mono text-[10px] bg-[#150d24] px-1 py-0.5 rounded">.svg</code> files from Linux distributions, cloud architectures, or custom design tools (max 1MB).
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
                            className="w-4 h-4"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">16px (Nav)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-5 h-5"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">20px (Title)</span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#150d24] border border-[#2e1c52] flex flex-col items-center justify-center gap-1.5">
                        <div className="h-8 flex items-center justify-center">
                          <CustomIconRenderer
                            iconName={customSvgInput}
                            color={effectiveColor}
                            className="w-7 h-7"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#c084fc]/70">28px (Hero)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Vector SVGs */}
              <div>
                <div className="text-[11px] font-semibold text-[#faf5ff] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Or select a sample Linux & Cloud SVG icon:</span>
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
                      <span className="text-[9px] font-mono text-[#c084fc]/70">
                        {sample.library}
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
                  Paste vector SVG markup from any Linux, Cloud, or custom design tool (e.g. Simple Icons, FontAwesome, SVGRepo, Figma, or GitHub).
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
                  placeholder='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.5 2 8 3.5 8 6v4c-1.5.5-3 2-3 4.5 0 2 1.5 3 2.5 3.5-.2.8-.5 1.5-1.5 2-.5.3-.5.9 0 1.2 1.2.7 3 .8 4.5.3 1 .3 2 .3 3 0 1.5.5 3.3.4 4.5-.3.5-.3.5-.9 0-1.2-1-.5-1.3-1.2-1.5-2 1-.5 2.5-1.5 2.5-3.5 0-2.5-1.5-4-3-4.5V6c0-2.5-1.5-4-4-4zm-1.5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>'
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
            /* Curated SVG Icon Grid with Multi-Library Badges */
            <>
              {filteredIcons.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#c084fc]/80 mb-2.5 px-0.5">
                    <span>
                      Showing <strong className="text-[#faf5ff]">{filteredIcons.length}</strong> icons
                      {selectedLibrary !== 'all' && (
                        <span> in <span className="text-[#ec4899] uppercase font-mono">{selectedLibrary}</span></span>
                      )}
                    </span>
                    <span className="text-[10px] text-[#c084fc]/60 font-mono">
                      Click icon to select
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-2">
                    {filteredIcons.map((item) => {
                      const isSelected = selectedIconName?.toLowerCase() === item.name.toLowerCase();
                      const IconComp = item.component;
                      const badgeInfo = getLibraryBadgeStyle(item.library);

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
                          className={`relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-center transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-[#2a1444] border-2 border-[#ec4899] text-[#faf5ff] ring-2 ring-[#ec4899]/50 shadow-md'
                              : 'bg-[#1f1338] border-[#2e1c52] text-[#faf5ff]/85 hover:border-[#c084fc]/70 hover:bg-[#2a1a4c] hover:text-[#faf5ff]'
                          }`}
                          title={`${item.label} (${item.name}) • ${badgeInfo.title}`}
                        >
                          {/* Library Tag Badge */}
                          <span
                            className={`absolute top-1 right-1 text-[8px] font-mono px-1 py-0.2 rounded border font-semibold ${badgeInfo.className}`}
                            title={badgeInfo.title}
                          >
                            {badgeInfo.label}
                          </span>

                          <div className="w-7 h-7 flex items-center justify-center mt-1">
                            <IconComp
                              className="w-5 h-5 transition-transform group-hover:scale-115 shrink-0"
                              style={{ color: isSelected ? (effectiveColor || '#ec4899') : '#faf5ff' }}
                            />
                          </div>

                          <span className="text-[10px] truncate max-w-full font-mono text-[#c084fc] group-hover:text-[#faf5ff] px-1">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Search className="w-8 h-8 text-[#c084fc]/40 mx-auto" />
                  <div className="text-xs text-[#faf5ff] font-medium">No icons match "{searchQuery}"</div>
                  <div className="text-[11px] text-[#c084fc]/60 max-w-md mx-auto">
                    Try searching for <span className="text-[#faf5ff]">"ubuntu"</span>, <span className="text-[#faf5ff]">"docker"</span>, <span className="text-[#faf5ff]">"aws"</span>, <span className="text-[#faf5ff]">"nginx"</span>, or switch to <strong className="text-[#ec4899]">All Libraries</strong> above.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 5. Modal Footer & Live Item Preview */}
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
