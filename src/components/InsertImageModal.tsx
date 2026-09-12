import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link2,
  X,
  Sparkles,
  Check,
  AlertCircle,
  FileImage,
  ShieldCheck,
} from 'lucide-react';
import { saveAttachment } from '../utils/attachmentStore';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (markdownSyntax: string) => void;
}

const PRESET_IMAGES = [
  {
    title: 'Architecture & Graph',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    alt: 'System architecture nodes network',
  },
  {
    title: 'Code & Terminal',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    alt: 'Code editor terminal screen',
  },
  {
    title: 'Minimalist Workspace',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
    alt: 'Clean minimalist desk notebook and computer',
  },
  {
    title: 'Nebula & Cosmos',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    alt: 'Deep space purple galaxy stars',
  },
];

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
}) => {
  const [tab, setTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process selected file
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, SVG, GIF).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!altText) {
      setAltText(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewSrc(result);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleInsert = async () => {
    const caption = altText.trim() || 'Image';

    if (tab === 'upload') {
      if (!previewSrc && !selectedFile) {
        setError('Please choose an image file to upload.');
        return;
      }

      setIsSubmitting(true);
      try {
        const { uri } = await saveAttachment(selectedFile || previewSrc!, caption);
        const markdown = `\n![${caption}](${uri})\n`;
        onInsertImage(markdown);
        handleClose();
      } catch (err) {
        console.error('Failed to save image attachment:', err);
        setError('Failed to store image attachment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const src = tab === 'url' ? imageUrl.trim() : previewSrc;
    if (!src) {
      setError('Please provide an image source or upload a file.');
      return;
    }

    const markdown = `\n![${caption}](${src})\n`;
    onInsertImage(markdown);
    handleClose();
  };

  const handleClose = () => {
    setImageUrl('');
    setAltText('');
    setPreviewSrc(null);
    setSelectedFile(null);
    setIsSubmitting(false);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        id="modal-insert-image"
        className="w-full max-w-lg bg-[#150d24] border border-[#3b2366] rounded-[10px] shadow-2xl overflow-hidden flex flex-col font-['Space_Grotesk',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2e1c52] flex items-center justify-between bg-[#1a0f2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#ec4899]/15 border border-[#ec4899]/40 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-[#ec4899]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#faf5ff]">Insert Image</h3>
              <p className="text-[11px] text-[#c084fc]/70">
                Embed pictures cleanly as attachments without cluttering your note editor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-[6px] hover:bg-[#251543] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-[#2e1c52] bg-[#120a1f] px-5 pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('upload');
              setError(null);
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium transition-colors cursor-pointer border-b-2 ${
              tab === 'upload'
                ? 'border-[#ec4899] text-[#faf5ff]'
                : 'border-transparent text-[#c084fc]/70 hover:text-[#faf5ff]'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('url');
              setError(null);
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium transition-colors cursor-pointer border-b-2 ${
              tab === 'url'
                ? 'border-[#ec4899] text-[#faf5ff]'
                : 'border-transparent text-[#c084fc]/70 hover:text-[#faf5ff]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Image Web URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('presets');
              setError(null);
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-medium transition-colors cursor-pointer border-b-2 ${
              tab === 'presets'
                ? 'border-[#ec4899] text-[#faf5ff]'
                : 'border-transparent text-[#c084fc]/70 hover:text-[#faf5ff]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
            <span>Sample Presets</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Upload */}
          {tab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#ec4899] bg-[#ec4899]/10 scale-[1.01]'
                    : previewSrc
                    ? 'border-emerald-500/50 bg-[#120a1f]'
                    : 'border-[#2e1c52] hover:border-[#ec4899]/60 hover:bg-[#1a0f2e]'
                }`}
              >
                {previewSrc ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <img
                      src={previewSrc}
                      alt="Uploaded preview"
                      className="max-h-36 max-w-full object-contain rounded-[6px] border border-[#2e1c52]"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>{selectedFile?.name || 'Image ready'} • Click to change file</span>
                    </div>

                    <div className="w-full mt-1 p-2 rounded-[6px] bg-[#1a0f2e] border border-emerald-500/30 flex items-start gap-2 text-[11px] text-emerald-300/90 font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Saves as a lightweight vault attachment (e.g. <code>attachment:filename.png</code>) so your editor stays clean with zero base64 text bloat.
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#1f1338] flex items-center justify-center text-[#ec4899]">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-[#faf5ff] font-medium text-center">
                      Click to choose image or drag & drop here
                    </div>
                    <div className="text-[11px] text-[#c084fc]/60 text-center font-mono">
                      PNG, JPG, SVG, WebP, GIF • Stored cleanly as attachments
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: URL */}
          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#faf5ff] mb-1">
                  Image Web Link (URL)
                </label>
                <input
                  id="input-image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-xs text-[#faf5ff] focus:outline-none focus:border-[#ec4899] font-mono placeholder:text-[#c084fc]/40"
                />
              </div>

              {imageUrl && (
                <div className="p-2 border border-[#2e1c52] rounded-[6px] bg-[#0c0714] flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[#c084fc]/70 uppercase tracking-wider font-mono self-start mb-1">
                    Live Preview
                  </span>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    onError={() => setError('Cannot load image preview from this URL.')}
                    className="max-h-36 max-w-full object-contain rounded-[4px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Presets */}
          {tab === 'presets' && (
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(preset.url);
                    setAltText(preset.alt);
                    setPreviewSrc(preset.url);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className={`p-2 rounded-[8px] border text-left flex flex-col gap-1.5 transition-all cursor-pointer group ${
                    previewSrc === preset.url || imageUrl === preset.url
                      ? 'border-[#ec4899] bg-[#ec4899]/15'
                      : 'border-[#2e1c52] bg-[#0c0714] hover:border-[#ec4899]/50 hover:bg-[#1a0f2e]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-20 object-cover rounded-[4px] border border-[#2e1c52]/60"
                  />
                  <div className="text-[11px] font-medium text-[#faf5ff] group-hover:text-[#ec4899] truncate">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Alt / Caption Text Input (common to all tabs) */}
          <div className="pt-2 border-t border-[#2e1c52]/60">
            <label className="block text-xs font-semibold text-[#faf5ff] mb-1">
              Image Caption / Alt Description
            </label>
            <input
              id="input-image-alt"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g., System Architecture Diagram"
              className="w-full px-3 py-2 bg-[#0c0714] border border-[#2e1c52] rounded-[6px] text-xs text-[#faf5ff] focus:outline-none focus:border-[#ec4899] placeholder:text-[#c084fc]/40"
            />
            <div className="text-[10px] text-[#c084fc]/60 mt-1">
              Used as descriptive alt text and displayed as a clean caption under the image.
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-2.5 rounded-[6px] bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-[#2e1c52] bg-[#1a0f2e] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 rounded-[6px] hover:bg-[#251543] text-xs text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-insert-image"
            type="button"
            onClick={handleInsert}
            disabled={
              isSubmitting ||
              (tab === 'upload' ? !previewSrc : tab === 'url' ? !imageUrl.trim() : !previewSrc)
            }
            className="px-4 py-1.5 rounded-[6px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-[#faf5ff] flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving Attachment...' : 'Insert into Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

