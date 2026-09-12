import React from 'react';
import {
  Sparkles,
  Flame,
  Rocket,
  Star,
  AlertCircle,
  Info,
  CheckCircle2,
  Bookmark,
  Compass,
  Zap,
  Palette,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';

export const BANNER_COLOR_PRESETS: Record<
  string,
  {
    name: string;
    gradient: string;
    border: string;
    bg: string;
    text: string;
    accent: string;
    iconColor: string;
  }
> = {
  violet: {
    name: 'Nebula Violet',
    gradient: 'linear-gradient(135deg, #6d28d9, #be185d)',
    border: 'border-[#a855f7]/50',
    bg: 'bg-[#1a0f2e]',
    text: 'text-[#faf5ff]',
    accent: '#a855f7',
    iconColor: '#c084fc',
  },
  rose: {
    name: 'Sunset Rose',
    gradient: 'linear-gradient(135deg, #db2777, #ea580c)',
    border: 'border-[#ec4899]/50',
    bg: 'bg-[#220c1d]',
    text: 'text-[#faf5ff]',
    accent: '#ec4899',
    iconColor: '#f472b6',
  },
  emerald: {
    name: 'Aurora Emerald',
    gradient: 'linear-gradient(135deg, #059669, #0d9488)',
    border: 'border-[#10b981]/50',
    bg: 'bg-[#081f19]',
    text: 'text-[#faf5ff]',
    accent: '#10b981',
    iconColor: '#34d399',
  },
  amber: {
    name: 'Solar Amber',
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    border: 'border-[#f59e0b]/50',
    bg: 'bg-[#201507]',
    text: 'text-[#faf5ff]',
    accent: '#f59e0b',
    iconColor: '#fbbf24',
  },
  cyan: {
    name: 'Cyber Cyan',
    gradient: 'linear-gradient(135deg, #0284c7, #6366f1)',
    border: 'border-[#06b6d4]/50',
    bg: 'bg-[#0a1a29]',
    text: 'text-[#faf5ff]',
    accent: '#06b6d4',
    iconColor: '#22d3ee',
  },
  indigo: {
    name: 'Royal Indigo',
    gradient: 'linear-gradient(135deg, #4338ca, #7e22ce)',
    border: 'border-[#6366f1]/50',
    bg: 'bg-[#111338]',
    text: 'text-[#faf5ff]',
    accent: '#6366f1',
    iconColor: '#818cf8',
  },
  obsidian: {
    name: 'Midnight Obsidian',
    gradient: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
    border: 'border-[#3b2366]',
    bg: 'bg-[#120a21]',
    text: 'text-[#faf5ff]',
    accent: '#c084fc',
    iconColor: '#c084fc',
  },
};

export const BANNER_ICONS: Record<string, React.ElementType> = {
  sparkles: Sparkles,
  flame: Flame,
  rocket: Rocket,
  star: Star,
  alert: AlertCircle,
  info: Info,
  check: CheckCircle2,
  bookmark: Bookmark,
  compass: Compass,
  zap: Zap,
};

// In-Note Banner Block Component
export interface InNoteBannerProps {
  title?: string;
  content: string;
  color?: string;
  icon?: string;
  children?: React.ReactNode;
}

export const InNoteBanner: React.FC<InNoteBannerProps> = ({
  title,
  content,
  color = 'violet',
  icon = 'sparkles',
  children,
}) => {
  const theme = BANNER_COLOR_PRESETS[color.toLowerCase()] || BANNER_COLOR_PRESETS.violet;
  const IconComponent = BANNER_ICONS[icon.toLowerCase()] || Sparkles;

  return (
    <div
      className={`my-3.5 rounded-[10px] border ${theme.border} ${theme.bg} overflow-hidden shadow-md font-['Space_Grotesk',sans-serif] relative group`}
    >
      {/* Top Gradient Stripe */}
      <div
        className="h-1.5 w-full"
        style={{ background: theme.gradient }}
      />

      <div className="p-4 flex items-start gap-3.5">
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 shadow-xs mt-0.5"
          style={{ background: theme.gradient }}
        >
          <IconComponent className="w-4.5 h-4.5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-bold tracking-tight text-[#faf5ff] mb-1">
              {title}
            </h4>
          )}
          <div className="text-xs leading-relaxed text-[#faf5ff]/90">
            {children || content}
          </div>
        </div>
      </div>
    </div>
  );
};

// Top Note Header Banner Component
export interface NoteHeaderBannerProps {
  bannerColor: string;
  bannerHeight?: 'sm' | 'md' | 'lg';
  bannerIcon?: string;
  onChangeBanner?: () => void;
  onToggleHeight?: () => void;
  onRemoveBanner?: () => void;
  readOnly?: boolean;
}

export const NoteHeaderBanner: React.FC<NoteHeaderBannerProps> = ({
  bannerColor,
  bannerHeight = 'md',
  bannerIcon = 'sparkles',
  onChangeBanner,
  onToggleHeight,
  onRemoveBanner,
  readOnly = false,
}) => {
  const preset = BANNER_COLOR_PRESETS[bannerColor.toLowerCase()];
  const backgroundStyle = preset ? { background: preset.gradient } : { background: bannerColor };
  const IconComponent = BANNER_ICONS[bannerIcon.toLowerCase()] || Sparkles;

  const heightClass =
    bannerHeight === 'sm' ? 'h-20 sm:h-24' : bannerHeight === 'lg' ? 'h-40 sm:h-52' : 'h-28 sm:h-36';

  return (
    <div className={`relative w-full ${heightClass} transition-all duration-200 overflow-hidden group select-none shrink-0`}>
      {/* Background with overlay */}
      <div
        className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.01]"
        style={backgroundStyle}
      />
      {/* Subtle bottom gradient shadow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0714] via-transparent to-black/15 pointer-events-none" />

      {/* Floating Action Buttons */}
      {!readOnly && (
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {onChangeBanner && (
            <button
              type="button"
              onClick={onChangeBanner}
              className="px-2.5 py-1 text-[11px] font-['Space_Mono',monospace] bg-black/60 hover:bg-black/85 text-[#faf5ff] rounded-[6px] backdrop-blur-md border border-white/20 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
              title="Change banner color, gradient, or icon"
            >
              <Palette className="w-3 h-3 text-[#ec4899]" />
              <span>Change Banner</span>
            </button>
          )}

          {onToggleHeight && (
            <button
              type="button"
              onClick={onToggleHeight}
              className="p-1 bg-black/60 hover:bg-black/85 text-[#faf5ff] rounded-[6px] backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              title={`Toggle Banner Height (Current: ${bannerHeight.toUpperCase()})`}
            >
              {bannerHeight === 'lg' ? (
                <Minimize2 className="w-3.5 h-3.5 text-[#c084fc]" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-[#c084fc]" />
              )}
            </button>
          )}

          {onRemoveBanner && (
            <button
              type="button"
              onClick={onRemoveBanner}
              className="p-1 bg-black/60 hover:bg-rose-950/80 text-rose-300 hover:text-white rounded-[6px] backdrop-blur-md border border-white/20 hover:border-rose-500/50 transition-all cursor-pointer"
              title="Remove Note Banner"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Optional decorative icon on bottom left */}
      <div className="absolute bottom-3 left-6 z-10 flex items-center gap-2">
        <div className="w-9 h-9 rounded-[8px] bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
          <IconComponent className="w-5 h-5 text-white drop-shadow-md" />
        </div>
      </div>
    </div>
  );
};

export function formatBannerSyntax(data: {
  title?: string;
  content: string;
  color?: string;
  icon?: string;
}): string {
  const colorStr = data.color || 'violet';
  const iconStr = data.icon || 'sparkles';
  const titleAttr = data.title ? ` title="${data.title.replace(/"/g, "'")}"` : '';

  return `:::banner{color="${colorStr}" icon="${iconStr}"${titleAttr}}\n${data.content}\n:::`;
}

export function parseBannerSyntax(raw: string): {
  title?: string;
  content: string;
  color: string;
  icon: string;
} | null {
  const trimmed = raw.trim();

  // Matches :::banner or :::banner{...} ... :::
  if (trimmed.startsWith(':::banner')) {
    const firstLineEnd = trimmed.indexOf('\n');
    const firstLine = firstLineEnd !== -1 ? trimmed.slice(0, firstLineEnd).trim() : trimmed;
    let body = '';

    if (firstLineEnd === -1) {
      // Single line banner: :::banner{...} content :::
      const closingBracket = trimmed.indexOf('}');
      if (closingBracket !== -1) {
        body = trimmed.slice(closingBracket + 1).replace(/:::\s*$/, '').trim();
      } else {
        body = trimmed.slice(9).replace(/:::\s*$/, '').trim();
      }
    } else {
      body = trimmed.slice(firstLineEnd + 1);
      // Strip trailing :::
      body = body.replace(/\r?\n?\s*:::\s*$/, '').trim();
    }

    // Extract attributes: title, color, icon
    const attrMatch = firstLine.match(/\{([^}]*)\}/);
    const attrs = attrMatch ? attrMatch[1] : '';

    const titleMatch = attrs.match(/title=["']([^"']*)["']/i);
    const colorMatch = attrs.match(/color=["']([^"']*)["']/i);
    const iconMatch = attrs.match(/icon=["']([^"']*)["']/i);

    return {
      title: titleMatch ? titleMatch[1] : undefined,
      content: body,
      color: colorMatch ? colorMatch[1] : 'violet',
      icon: iconMatch ? iconMatch[1] : 'sparkles',
    };
  }

  // Matches bracket syntax: [banner: "Title" | color: rose | icon: flame] message
  const bracketMatch = trimmed.match(/^\[banner(?::\s*["']([^"']*)["'])?(?:\s*\|\s*color:\s*([a-zA-Z0-9_\-]+))?(?:\s*\|\s*icon:\s*([a-zA-Z0-9_\-]+))?\](?:\s*(.*))?$/i);
  if (bracketMatch) {
    return {
      title: bracketMatch[1] || undefined,
      color: bracketMatch[2] || 'violet',
      icon: bracketMatch[3] || 'sparkles',
      content: bracketMatch[4] || '',
    };
  }

  // Matches > [!banner:rose] Title
  const calloutMatch = trimmed.match(/^>\s*\[!banner(?::([a-zA-Z0-9_\-]+))?\]\s*(.*)$/i);
  if (calloutMatch) {
    return {
      color: calloutMatch[1] || 'violet',
      title: calloutMatch[2] || undefined,
      content: '',
      icon: 'sparkles',
    };
  }

  return null;
}
