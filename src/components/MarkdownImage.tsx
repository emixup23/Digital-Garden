import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  X,
  AlertCircle,
  Copy,
  Check,
  Paperclip,
} from 'lucide-react';
import { getAttachmentSync, resolveImageSrc } from '../utils/attachmentStore';

interface MarkdownImageProps {
  src: string;
  alt: string;
  title?: string;
}

export const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, alt, title }) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (src.startsWith('attachment:')) {
      return getAttachmentSync(src) || '';
    }
    return src;
  });
  const [isResolving, setIsResolving] = useState<boolean>(() => {
    return src.startsWith('attachment:') && !getAttachmentSync(src);
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolve attachment: URLs asynchronously if not in memory cache
  useEffect(() => {
    let isMounted = true;
    if (src.startsWith('attachment:')) {
      const sync = getAttachmentSync(src);
      if (sync) {
        setResolvedSrc(sync);
        setIsResolving(false);
      } else {
        setIsResolving(true);
        resolveImageSrc(src).then((url) => {
          if (isMounted) {
            if (url) {
              setResolvedSrc(url);
              setHasError(false);
            } else {
              setHasError(true);
            }
            setIsResolving(false);
          }
        });
      }
    } else {
      setResolvedSrc(src);
      setIsResolving(false);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  const isAttachment = src.startsWith('attachment:');
  const cleanFilename = isAttachment ? src.replace('attachment:', '') : '';

  // Handle image download
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadTarget = resolvedSrc || src;
    try {
      const a = document.createElement('a');
      a.href = downloadTarget;
      a.download = isAttachment
        ? cleanFilename
        : alt
        ? `${alt.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.png`
        : 'vault-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(downloadTarget, '_blank');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(src).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (hasError) {
    return (
      <div className="my-3 p-3.5 rounded-[8px] bg-[#1a0f2e] border border-rose-900/60 flex items-start gap-3 text-xs text-rose-200">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-rose-300">Unable to load image</div>
          <div className="text-[11px] text-rose-300/70 truncate mt-0.5 font-mono">
            {alt ? `${alt}: ` : ''}{src.slice(0, 120)}{src.length > 120 ? '...' : ''}
          </div>
          {!src.startsWith('data:') && !isAttachment && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#ec4899] hover:underline font-medium"
            >
              <span>Try opening image link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <figure className="my-3 group inline-block max-w-full">
        <div
          className="relative inline-block overflow-hidden rounded-[8px] border border-[#2e1c52] bg-[#150d24] cursor-zoom-in transition-all duration-200 group-hover:border-[#ec4899]/60 group-hover:shadow-[0_4px_20px_rgba(236,72,153,0.15)]"
          onClick={() => setIsLightboxOpen(true)}
        >
          {/* Skeleton placeholder while image loads or resolves */}
          {(!isLoaded || isResolving) && (
            <div className="w-64 h-36 flex flex-col items-center justify-center bg-[#150d24] animate-pulse text-[#c084fc]/50 gap-2">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[11px] font-mono">Loading image...</span>
            </div>
          )}

          {resolvedSrc && (
            <img
              src={resolvedSrc}
              alt={alt || 'Note image'}
              title={title || alt}
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className={`max-w-full max-h-[520px] object-contain block transition-opacity duration-300 ${
                isLoaded && !isResolving ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            />
          )}

          {/* Hover overlay hint */}
          {isLoaded && !isResolving && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-[6px] bg-[#150d24]/90 border border-[#ec4899]/40 text-[#faf5ff] text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                <ZoomIn className="w-3.5 h-3.5 text-[#ec4899]" />
                <span>View Full Size</span>
              </span>
            </div>
          )}
        </div>

        {/* Caption & Attachment Badge */}
        <figcaption className="text-xs text-[#c084fc]/80 mt-1.5 px-1 font-['Space_Grotesk',sans-serif] italic flex items-center flex-wrap gap-2">
          {alt && alt.trim() && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]/70 shrink-0" />
              <span>{alt}</span>
            </span>
          )}
          {isAttachment && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-mono rounded bg-[#1e1236] text-[#c084fc] border border-[#2e1c52]">
              <Paperclip className="w-2.5 h-2.5 text-[#ec4899]" />
              <span className="truncate max-w-[180px]">{cleanFilename}</span>
            </span>
          )}
        </figcaption>
      </figure>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-100 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-[#faf5ff]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 truncate max-w-lg">
              <ImageIcon className="w-4 h-4 text-[#ec4899] shrink-0" />
              <span className="text-sm font-semibold truncate">
                {alt || title || (isAttachment ? cleanFilename : 'Image Preview')}
              </span>
              {isAttachment && (
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Vault Attachment
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] text-xs text-[#faf5ff] flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copy markdown code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#c084fc]" />}
                <span>{copied ? 'Copied' : 'Copy Syntax'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-2.5 py-1 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] text-xs text-[#faf5ff] flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Download Image"
              >
                <Download className="w-3.5 h-3.5 text-[#ec4899]" />
                <span>Save Image</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-[6px] bg-[#1f1338] hover:bg-[#281745] border border-[#2e1c52] text-[#faf5ff] cursor-pointer transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Centered Image Container */}
          <div
            className="relative max-w-5xl max-h-[82vh] overflow-auto rounded-[10px] border border-[#2e1c52] bg-[#0c0714] shadow-2xl p-2 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {resolvedSrc ? (
              <img
                src={resolvedSrc}
                alt={alt || 'Full size note image'}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[78vh] object-contain rounded-[6px]"
              />
            ) : (
              <div className="w-64 h-36 flex items-center justify-center text-[#c084fc]">
                Loading image...
              </div>
            )}
          </div>

          {alt && (
            <div className="mt-3 text-xs text-[#c084fc]/90 font-mono text-center max-w-xl truncate">
              {alt}
            </div>
          )}
        </div>
      )}
    </>
  );
};

