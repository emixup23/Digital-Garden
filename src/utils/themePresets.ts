import { ThemeConfig } from '../types';

export const BORDERLESS_MINIMAL_THEME: ThemeConfig = {
  id: 'borderless-minimal',
  name: 'Borderless Minimal',
  description: 'Ultra-clean modern dark aesthetic with completely borderless buttons and seamless surfaces',
  isDark: true,
  borderlessButtons: true,
  primaryColor: '#a855f7',
  primaryHoverColor: '#9333ea',
  primaryLightColor: 'rgba(168, 85, 247, 0.15)',
  backgroundColor: '#09090b',
  surfaceColor: '#121216',
  surfaceSecondaryColor: '#1c1c22',
  borderColor: '#27272a',
  textColor: '#fafafa',
  textMutedColor: '#a1a1aa',
  noteButtonBg: '#22222a',
  radiusPx: '8px',
  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMono: "'Space Mono', monospace",
};

export const BORDERLESS_LIGHT_THEME: ThemeConfig = {
  id: 'borderless-light',
  name: 'Borderless Light',
  description: 'Pure editorial light theme with seamless borderless buttons, soft depth, and indigo accents',
  isDark: false,
  borderlessButtons: true,
  primaryColor: '#6366f1',
  primaryHoverColor: '#4f46e5',
  primaryLightColor: 'rgba(99, 102, 241, 0.12)',
  backgroundColor: '#f8fafc',
  surfaceColor: '#ffffff',
  surfaceSecondaryColor: '#f1f5f9',
  borderColor: '#e2e8f0',
  textColor: '#0f172a',
  textMutedColor: '#64748b',
  noteButtonBg: '#e2e8f0',
  radiusPx: '8px',
  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMono: "'Space Mono', monospace",
};

export const DEFAULT_THEME: ThemeConfig = {
  id: 'neon-cyber',
  name: 'Neon Cyber',
  description: 'Signature vibrant pink accent with atmospheric deep purple dark canvas',
  isDark: true,
  borderlessButtons: false,
  primaryColor: '#ec4899',
  primaryHoverColor: '#db2777',
  primaryLightColor: 'rgba(236, 72, 153, 0.15)',
  backgroundColor: '#0c0714',
  surfaceColor: '#150d24',
  surfaceSecondaryColor: '#1f1338',
  borderColor: '#2e1c52',
  textColor: '#faf5ff',
  textMutedColor: '#c084fc',
  noteButtonBg: 'rgb(12 7 20)',
  radiusPx: '6px',
  fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMono: "'Space Mono', monospace",
};

export const THEME_PRESETS: ThemeConfig[] = [
  BORDERLESS_MINIMAL_THEME,
  DEFAULT_THEME,
  {
    id: 'obsidian-dark',
    name: 'Obsidian Dark',
    description: 'Classic minimalist knowledge vault palette with violet accents',
    isDark: true,
    primaryColor: '#a855f7',
    primaryHoverColor: '#9333ea',
    primaryLightColor: 'rgba(168, 85, 247, 0.15)',
    backgroundColor: '#0f0f12',
    surfaceColor: '#18181c',
    surfaceSecondaryColor: '#222228',
    borderColor: '#2f303d',
    textColor: '#f3f4f6',
    textMutedColor: '#9ca3af',
    noteButtonBg: '#0f0f12',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Renowned dark theme featuring vivid magenta and deep blue surfaces',
    isDark: true,
    primaryColor: '#ff79c6',
    primaryHoverColor: '#ff92d0',
    primaryLightColor: 'rgba(255, 121, 198, 0.15)',
    backgroundColor: '#1e1f29',
    surfaceColor: '#282a36',
    surfaceSecondaryColor: '#343746',
    borderColor: '#44475a',
    textColor: '#f8f8f2',
    textMutedColor: '#bd93f9',
    noteButtonBg: '#1e1f29',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Vibrant neon indigo and electric teal inspired by nocturnal Tokyo',
    isDark: true,
    primaryColor: '#7aa2f7',
    primaryHoverColor: '#608eeb',
    primaryLightColor: 'rgba(122, 162, 247, 0.15)',
    backgroundColor: '#1a1b26',
    surfaceColor: '#24283b',
    surfaceSecondaryColor: '#2f354e',
    borderColor: '#414868',
    textColor: '#c0caf5',
    textMutedColor: '#7dcfff',
    noteButtonBg: '#1a1b26',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'nord-frost',
    name: 'Nord Frost',
    description: 'Subtle arctic dark slate with icy cyan links and cool tones',
    isDark: true,
    primaryColor: '#88c0d0',
    primaryHoverColor: '#72b2c4',
    primaryLightColor: 'rgba(136, 192, 208, 0.15)',
    backgroundColor: '#242933',
    surfaceColor: '#2e3440',
    surfaceSecondaryColor: '#3b4252',
    borderColor: '#4c566a',
    textColor: '#eceff4',
    textMutedColor: '#81a1c1',
    noteButtonBg: '#242933',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'forest-moss',
    name: 'Forest Moss',
    description: 'Earthy botanical green accents on deep organic pine shadows',
    isDark: true,
    primaryColor: '#10b981',
    primaryHoverColor: '#059669',
    primaryLightColor: 'rgba(16, 185, 129, 0.15)',
    backgroundColor: '#07140e',
    surfaceColor: '#0d241a',
    surfaceSecondaryColor: '#143325',
    borderColor: '#1c523b',
    textColor: '#ecfdf5',
    textMutedColor: '#6ee7b7',
    noteButtonBg: '#07140e',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Precision low-contrast palette with warm gold and oceanic teal',
    isDark: true,
    primaryColor: '#b58900',
    primaryHoverColor: '#a17a00',
    primaryLightColor: 'rgba(181, 137, 0, 0.15)',
    backgroundColor: '#002b36',
    surfaceColor: '#073642',
    surfaceSecondaryColor: '#0c4756',
    borderColor: '#586e75',
    textColor: '#fdf6e3',
    textMutedColor: '#93a1a1',
    noteButtonBg: '#002b36',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'sunset-crimson',
    name: 'Sunset Crimson',
    description: 'Warm ruby red highlights on dark burgundy surfaces',
    isDark: true,
    primaryColor: '#f43f5e',
    primaryHoverColor: '#e11d48',
    primaryLightColor: 'rgba(244, 63, 94, 0.15)',
    backgroundColor: '#14080e',
    surfaceColor: '#240d18',
    surfaceSecondaryColor: '#361324',
    borderColor: '#521c36',
    textColor: '#fff1f2',
    textMutedColor: '#fda4af',
    noteButtonBg: '#14080e',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'cyber-matrix',
    name: 'Cyber Matrix',
    description: 'High-tech terminal aesthetic with crisp neon matrix green',
    isDark: true,
    primaryColor: '#22c55e',
    primaryHoverColor: '#16a34a',
    primaryLightColor: 'rgba(34, 197, 94, 0.15)',
    backgroundColor: '#060b06',
    surfaceColor: '#0c170c',
    surfaceSecondaryColor: '#132413',
    borderColor: '#1d3d1d',
    textColor: '#f0fdf4',
    textMutedColor: '#86efac',
    noteButtonBg: '#060b06',
    radiusPx: '4px',
    fontFamily: "'Space Mono', monospace",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'minimal-paper',
    name: 'Minimal Paper',
    description: 'Clean high-contrast editorial light mode for reading and writing',
    isDark: false,
    primaryColor: '#9333ea',
    primaryHoverColor: '#7e22ce',
    primaryLightColor: 'rgba(147, 51, 234, 0.1)',
    backgroundColor: '#fafaf9',
    surfaceColor: '#f5f5f4',
    surfaceSecondaryColor: '#e7e5e4',
    borderColor: '#d6d3d1',
    textColor: '#1c1917',
    textMutedColor: '#78716c',
    noteButtonBg: '#ffffff',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  {
    id: 'alabaster-warm',
    name: 'Alabaster Warm',
    description: 'Soft cream parchment light mode with rose accents',
    isDark: false,
    primaryColor: '#e11d48',
    primaryHoverColor: '#be123c',
    primaryLightColor: 'rgba(225, 29, 72, 0.1)',
    backgroundColor: '#faf8f5',
    surfaceColor: '#f3eee6',
    surfaceSecondaryColor: '#e7dfd3',
    borderColor: '#d8cbba',
    textColor: '#26201a',
    textMutedColor: '#7e7062',
    noteButtonBg: '#faf8f5',
    radiusPx: '6px',
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Space Mono', monospace",
  },
  BORDERLESS_LIGHT_THEME,
];

const THEME_STORAGE_KEY = 'pkm_custom_theme_config';

/**
 * Apply the theme config directly to the browser DOM via CSS custom properties
 */
export function applyThemeToDOM(theme: ThemeConfig): void {
  const safeTheme: ThemeConfig = {
    ...DEFAULT_THEME,
    ...(theme || {}),
  };
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--primaryColor', safeTheme.primaryColor);
  root.style.setProperty('--primaryHoverColor', safeTheme.primaryHoverColor);
  root.style.setProperty('--primaryLightColor', safeTheme.primaryLightColor);
  root.style.setProperty('--backgroundColor', safeTheme.backgroundColor);
  root.style.setProperty('--surfaceColor', safeTheme.surfaceColor);
  root.style.setProperty('--surfaceSecondaryColor', safeTheme.surfaceSecondaryColor);
  root.style.setProperty('--borderColor', safeTheme.borderColor);
  root.style.setProperty('--textColor', safeTheme.textColor);
  root.style.setProperty('--textMutedColor', safeTheme.textMutedColor);
  root.style.setProperty('--noteBtnBg', safeTheme.noteButtonBg);
  root.style.setProperty('--radiusPx', safeTheme.radiusPx);
  root.style.setProperty('--fontFamily', safeTheme.fontFamily);
  root.style.setProperty('--fontFamilyMono', safeTheme.fontFamilyMono);

  // Sync Tailwind v4 root properties
  root.style.setProperty('--btn-bg', safeTheme.primaryColor);
  root.style.setProperty('--btn-bg-hover', safeTheme.primaryHoverColor);
  root.style.setProperty('--btn-text', safeTheme.isDark ? '#faf5ff' : '#ffffff');
  root.style.setProperty('--bg-primary', safeTheme.backgroundColor);
  root.style.setProperty('--bg-secondary', safeTheme.surfaceColor);
  root.style.setProperty('--text-primary', safeTheme.textColor);
  root.style.setProperty('--text-secondary', safeTheme.textMutedColor);

  // Toggle dark mode class
  if (safeTheme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Toggle borderless buttons class for seamless button styling
  if (safeTheme.borderlessButtons) {
    root.classList.add('theme-borderless-buttons');
  } else {
    root.classList.remove('theme-borderless-buttons');
  }
}

/**
 * Load active theme from localStorage or fallback to default
 */
export function loadActiveTheme(): ThemeConfig {
  try {
    const isActivated = localStorage.getItem('pkm_borderless_theme_activated');
    if (!isActivated) {
      localStorage.setItem('pkm_borderless_theme_activated', 'true');
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(BORDERLESS_MINIMAL_THEME));
      return BORDERLESS_MINIMAL_THEME;
    }

    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.primaryColor && parsed.backgroundColor) {
        return {
          ...DEFAULT_THEME,
          ...parsed,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load theme from storage', e);
  }
  return BORDERLESS_MINIMAL_THEME;
}

/**
 * Save active theme to localStorage
 */
export function saveActiveTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error('Failed to save theme to storage', e);
  }
}

/**
 * Helper to generate a slightly darker or lighter shade for hover state
 */
export function generateHoverColor(hex: string): string {
  // If hex starts with # and has 6 chars
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const factor = 0.85; // 15% darker
    const hr = Math.max(0, Math.min(255, Math.round(r * factor))).toString(16).padStart(2, '0');
    const hg = Math.max(0, Math.min(255, Math.round(g * factor))).toString(16).padStart(2, '0');
    const hb = Math.max(0, Math.min(255, Math.round(b * factor))).toString(16).padStart(2, '0');

    return `#${hr}${hg}${hb}`;
  }
  return hex;
}

/**
 * Helper to generate RGBA translucent light color
 */
export function generateLightColor(hex: string, alpha = 0.15): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/**
 * Calculate WCAG relative luminance
 */
function getLuminance(hex: string): number {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return 0.5;
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));

  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Calculate contrast ratio between two hex colors
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}
