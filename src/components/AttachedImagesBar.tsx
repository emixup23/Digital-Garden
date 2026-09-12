import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  ZoomIn,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  AlertTriangle,
  FileImage,
} from 'lucide-react';
import {
  NoteImageInfo,
  resolveImageSrc,
  getAttachmentSync,
} from '../utils/attachmentStore';

interface AttachedImagesBarProps {
  images: NoteImageInfo[];
  onInsertNewImage: () => void;
  onCleanDataUrls?: () => void;
  isCleaning?: boolean;
  onSelectImageInEditor?: (image: NoteImageInfo) => void;
  onRemoveImageFromEditor?: (image: NoteImageInfo) => void;
}

export const AttachedImagesBar: React.FC<AttachedImagesBarProps> = ({
  images,
  onInsertNewImage,
  onCleanDataUrls,
  isCleaning = false,
  onSelectImageInEditor,
  onRemoveImageFromEditor,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Record<string, string>>({});
  const [copiedSrc, setCopiedSrc] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  // Check if any image is a huge raw data URL
  const hasRawDataUrls = images.some((img) => img.isDataUrl);
  const rawDataUrlsCount = images.filter((img) => img.isDataUrl).length;

  // Resolve thumbnails for attachment: uris
  useEffect(() => {
    let isMounted = true;
    images.forEach(async (img) => {
      if (resolvedThumbnails[img.src]) return;

      const sync = getAttachmentSync(img.src);
      if (sync) {
        if (isMounted) {
          setResolvedThumbnails((prev) => ({ ...prev, [img.src]: sync }));
        }
      } else {
        const resolved = await resolveImageSrc(img.src);
        if (isMounted && resolved) {
          setResolvedThumbnails((prev) => ({ ...prev, [img.src]: resolved }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [images]);

  if (images.length === 0 && !hasRawDataUrls) {
    return null;
  }

  const handleCopySyntax = (img: NoteImageInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(img.fullMatch).then(() => {
      setCopiedSrc(img.src);
      setTimeout(() => setCopiedSrc(null), 1800);
    });
  };

  return (
    <div className="bg-[#120a1f] border-b border-[#2e1c52] text-[#faf5ff] text-xs transition-all select-none">
      {/* Huge Data URL Warning Banner */}
      {hasRawDataUrls && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2 font-['Space_Mono',monospace] text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Note contains {rawDataUrlsCount} raw base64 image(s)</strong> that appear as huge text in the editor.
            </span>
          </div>
          {onCleanDataUrls && (
            <button
              type="button"
              onClick={onCleanDataUrls}
              disabled={isCleaning}
              className="px-2.5 py-1 text-xs font-semibold rounded-[6px] bg-amber-500 hover:bg-amber-400 text-[#0c0714] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCleaning ? 'Converting...' : 'Clean Up Image Text Now'}</span>
            </button>
          )}
        </div>
      )}

      {/* Bar Header */}
      <div className="px-4 py-1.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[#c084fc] hover:text-[#faf5ff] font-['Space_Mono',monospace] font-medium transition-colors cursor-pointer group"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#ec4899] group-hover:scale-110 transition-transform" />
          <span>Images in Note ({images.length})</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-60" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onInsertNewImage}
            className="h-6 px-2 flex items-center gap-1 text-[11px] rounded-[5px] bg-[#1a1030] hover:bg-[#281745] text-[#faf5ff] border border-[#2e1c52] hover:border-[#ec4899]/50 transition-colors cursor-pointer active:scale-95"
            title="Insert another image"
          >
            <Plus className="w-3 h-3 text-[#ec4899]" />
            <span>Add Image</span>
          </button>
        </div>
      </div>

      {/* Expanded Images Strip */}
      {isExpanded && (
        <div className="px-4 pb-2.5 pt-0.5 flex gap-2.5 overflow-x-auto scrollbar-thin">
          {images.map((img, idx) => {
            const displaySrc = resolvedThumbnails[img.src] || (img.isDataUrl ? img.src : img.isWebUrl ? img.src : '');
            const cleanDisplaySrc = img.isAttachment
              ? img.src.replace('attachment:', '')
              : img.isDataUrl
              ? 'Raw Base64 (Heavy)'
              : img.src;

            return (
              <div
                key={`${img.src}-${idx}`}
                className="group relative flex items-center gap-2.5 p-1.5 pr-2 rounded-[8px] bg-[#190e2b] border border-[#2e1c52] hover:border-[#ec4899]/50 transition-all shrink-0 max-w-[260px]"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => displaySrc && setLightboxImage({ src: displaySrc, alt: img.alt })}
                  className="w-10 h-10 rounded-[6px] bg-[#0c0714] border border-[#2e1c52] overflow-hidden flex items-center justify-center relative cursor-pointer group/thumb shrink-0"
                  title="Click to view full image"
                >
                  {displaySrc ? (
                    <>
                      <img
                        src={displaySrc}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5 text-white" />
                      </div>
                    </>
                  ) : (
                    <FileImage className="w-4 h-4 text-[#c084fc]/50" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div
                    onClick={() => onSelectImageInEditor?.(img)}
                    className="font-medium text-xs text-[#faf5ff] truncate cursor-pointer hover:text-[#ec4899] transition-colors"
                    title={`Click to find in editor: "${img.alt}"`}
                  >
                    {img.alt || 'Untitled Image'}
                  </div>
                  <div
                    className="text-[10px] font-['Space_Mono',monospace] text-[#c084fc]/70 truncate"
                    title={img.src}
                  >
                    {cleanDisplaySrc}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        img.isAttachment
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : img.isDataUrl
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {img.isAttachment ? 'Attachment' : img.isDataUrl ? 'Raw Text' : 'Web Link'}
                    </span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-col gap-1 items-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleCopySyntax(img, e)}
                    className="p-1 rounded hover:bg-[#281745] text-[#c084fc] hover:text-[#faf5ff] transition-colors cursor-pointer"
                    title="Copy Markdown code"
                  >
                    {copiedSrc === img.src ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  {onRemoveImageFromEditor && (
                    <button
                      type="button"
                      onClick={() => onRemoveImageFromEditor(img)}
                      className="p-1 rounded hover:bg-rose-500/20 text-[#c084fc] hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove image from note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-120 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-[#1f1338] text-white hover:bg-[#281745] border border-[#2e1c52] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-h-[82vh] max-w-full rounded-lg border border-[#2e1c52] shadow-2xl object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="mt-2 text-sm text-[#faf5ff] font-medium bg-[#150d24] px-4 py-1.5 rounded-full border border-[#2e1c52]">
              {lightboxImage.alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
