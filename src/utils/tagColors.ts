import React from 'react';

export interface TagColorDef {
  name: string;
  dot: string;       // Hex for SVG nodes, D3 fills, dot indicators
  bg: string;        // Soft background with transparency
  border: string;    // Subtle border
  text: string;      // High-contrast legible text
  activeBg: string;  // Solid vibrant background when selected/filtered
  activeText: string;// Contrast text on active background
}

export const TAG_COLOR_PALETTE: TagColorDef[] = [
  {
    name: 'coral',
    dot: '#ff5c7c',
    bg: 'rgba(255, 92, 124, 0.16)',
    border: 'rgba(255, 92, 124, 0.38)',
    text: '#ff8da3',
    activeBg: '#ff5c7c',
    activeText: '#0c0714',
  },
  {
    name: 'amber',
    dot: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.16)',
    border: 'rgba(251, 191, 36, 0.38)',
    text: '#fcd34d',
    activeBg: '#fbbf24',
    activeText: '#0c0714',
  },
  {
    name: 'emerald',
    dot: '#34d399',
    bg: 'rgba(52, 211, 153, 0.16)',
    border: 'rgba(52, 211, 153, 0.38)',
    text: '#6ee7b7',
    activeBg: '#34d399',
    activeText: '#0c0714',
  },
  {
    name: 'cyan',
    dot: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.16)',
    border: 'rgba(34, 211, 238, 0.38)',
    text: '#67e8f9',
    activeBg: '#22d3ee',
    activeText: '#0c0714',
  },
  {
    name: 'sky',
    dot: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.16)',
    border: 'rgba(96, 165, 250, 0.38)',
    text: '#93c5fd',
    activeBg: '#60a5fa',
    activeText: '#0c0714',
  },
  {
    name: 'violet',
    dot: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.16)',
    border: 'rgba(167, 139, 250, 0.38)',
    text: '#c4b5fd',
    activeBg: '#a78bfa',
    activeText: '#0c0714',
  },
  {
    name: 'fuchsia',
    dot: '#e879f9',
    bg: 'rgba(232, 121, 249, 0.16)',
    border: 'rgba(232, 121, 249, 0.38)',
    text: '#f0abfc',
    activeBg: '#e879f9',
    activeText: '#0c0714',
  },
  {
    name: 'pink',
    dot: '#f472b6',
    bg: 'rgba(244, 114, 182, 0.16)',
    border: 'rgba(244, 114, 182, 0.38)',
    text: '#f9a8d4',
    activeBg: '#f472b6',
    activeText: '#0c0714',
  },
  {
    name: 'orange',
    dot: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.16)',
    border: 'rgba(251, 146, 60, 0.38)',
    text: '#fdba74',
    activeBg: '#fb923c',
    activeText: '#0c0714',
  },
  {
    name: 'lime',
    dot: '#a3e635',
    bg: 'rgba(163, 230, 53, 0.16)',
    border: 'rgba(163, 230, 53, 0.38)',
    text: '#bef264',
    activeBg: '#a3e635',
    activeText: '#0c0714',
  },
  {
    name: 'teal',
    dot: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.16)',
    border: 'rgba(45, 212, 191, 0.38)',
    text: '#5eead4',
    activeBg: '#2dd4bf',
    activeText: '#0c0714',
  },
  {
    name: 'indigo',
    dot: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.16)',
    border: 'rgba(129, 140, 248, 0.38)',
    text: '#a5b4fc',
    activeBg: '#818cf8',
    activeText: '#0c0714',
  },
];

export function cleanTagName(tag: string): string {
  if (!tag) return '';
  return tag.replace(/^#+/, '').trim().toLowerCase();
}

/**
 * Deterministically maps any tag name to a consistent index in the color palette
 */
export function getTagColorIndex(tag: string): number {
  const clean = cleanTagName(tag);
  if (!clean) return 0;
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % TAG_COLOR_PALETTE.length;
}

/**
 * Returns the full color configuration for a tag
 */
export function getTagColor(tag: string): TagColorDef {
  const index = getTagColorIndex(tag);
  return TAG_COLOR_PALETTE[index];
}

/**
 * Returns the hex dot color for a tag (useful for canvas / SVG / D3 fills)
 */
export function getTagHex(tag: string): string {
  return getTagColor(tag).dot;
}

/**
 * Generates an inline style object for tag badges, chips, or buttons
 */
export function getTagBadgeStyle(tag: string, isSelected: boolean = false): React.CSSProperties {
  const c = getTagColor(tag);
  if (isSelected) {
    return {
      backgroundColor: c.activeBg,
      color: c.activeText,
      borderColor: c.activeBg,
    };
  }
  return {
    backgroundColor: c.bg,
    color: c.text,
    borderColor: c.border,
  };
}
