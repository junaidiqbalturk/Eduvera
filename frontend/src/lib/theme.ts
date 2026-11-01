export interface ColorTheme {
  id: string;
  name: string;
  officeApp: 'Word' | 'Excel' | 'PowerPoint' | 'OneNote' | 'Outlook' | 'Teams';
  tagline: string;
  primary: string;
  primaryHover: string;
  primaryDark: string;
  primaryLight: string;
  primaryBorder: string;
  primaryRing: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
}

export const OFFICE_365_THEMES: ColorTheme[] = [
  {
    id: 'word-blue',
    name: 'Word Cobalt Blue',
    officeApp: 'Word',
    tagline: 'Classic institutional sapphire blue — crisp, authoritative & clean.',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryDark: '#1e40af',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    primaryRing: 'rgba(37, 99, 235, 0.25)',
    accent: '#3b82f6',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    id: 'excel-green',
    name: 'Excel Emerald',
    officeApp: 'Excel',
    tagline: 'Vibrant academic forest emerald — analytical, balanced & fresh.',
    primary: '#059669',
    primaryHover: '#047857',
    primaryDark: '#065f46',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    primaryRing: 'rgba(5, 150, 105, 0.25)',
    accent: '#10b981',
    badgeBg: '#d1fae5',
    badgeText: '#047857',
    gradient: 'from-emerald-600 to-emerald-800',
  },
  {
    id: 'powerpoint-crimson',
    name: 'PowerPoint Crimson',
    officeApp: 'PowerPoint',
    tagline: 'Energetic coral ruby — dynamic, expressive & presentation-ready.',
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryDark: '#9f1239',
    primaryLight: '#fff1f2',
    primaryBorder: '#fecdd3',
    primaryRing: 'rgba(225, 29, 72, 0.25)',
    accent: '#f43f5e',
    badgeBg: '#ffe4e6',
    badgeText: '#be123c',
    gradient: 'from-rose-600 to-rose-800',
  },
  {
    id: 'onenote-purple',
    name: 'OneNote Amethyst',
    officeApp: 'OneNote',
    tagline: 'Regal violet purple — creative, scholarly & prestigious.',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryDark: '#5b21b6',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryRing: 'rgba(124, 58, 237, 0.25)',
    accent: '#8b5cf6',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    gradient: 'from-violet-600 to-violet-800',
  },
  {
    id: 'outlook-cyan',
    name: 'Outlook Oceanic Cyan',
    officeApp: 'Outlook',
    tagline: 'Streamlined coastal cyan — clear, communicative & modern.',
    primary: '#0891b2',
    primaryHover: '#0e7490',
    primaryDark: '#155e75',
    primaryLight: '#ecfeff',
    primaryBorder: '#a5f3fc',
    primaryRing: 'rgba(8, 145, 178, 0.25)',
    accent: '#06b6d4',
    badgeBg: '#cffafe',
    badgeText: '#0e7490',
    gradient: 'from-cyan-600 to-cyan-800',
  },
  {
    id: 'teams-indigo',
    name: 'Teams Executive Indigo',
    officeApp: 'Teams',
    tagline: 'Polished digital indigo — collaborative, unified & contemporary.',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryDark: '#3730a3',
    primaryLight: '#eef2ff',
    primaryBorder: '#c7d2fe',
    primaryRing: 'rgba(79, 70, 229, 0.25)',
    accent: '#6366f1',
    badgeBg: '#e0e7ff',
    badgeText: '#4338ca',
    gradient: 'from-indigo-600 to-indigo-800',
  },
];

/**
 * Apply the selected theme to document style and inject comprehensive CSS rules
 * that instantly replace all primary/blue accents across the entire application.
 */
export const applyThemeToDocument = (themeId: string) => {
  if (typeof document === 'undefined') return;
  const theme = OFFICE_365_THEMES.find((t) => t.id === themeId) || OFFICE_365_THEMES[0];
  const root = document.documentElement;

  // Set CSS variables on root
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-hover', theme.primaryHover);
  root.style.setProperty('--theme-primary-dark', theme.primaryDark);
  root.style.setProperty('--theme-primary-light', theme.primaryLight);
  root.style.setProperty('--theme-primary-border', theme.primaryBorder);
  root.style.setProperty('--theme-primary-ring', theme.primaryRing);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-badge-bg', theme.badgeBg);
  root.style.setProperty('--theme-badge-text', theme.badgeText);
  root.dataset.theme = theme.id;

  // Injected high-specificity style element that forces all portal primary buttons,
  // badges, links, active sidebar states, and icons to adopt the theme color immediately!
  let styleEl = document.getElementById('eduvera-dynamic-theme-css') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'eduvera-dynamic-theme-css';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --theme-primary: ${theme.primary};
      --theme-primary-hover: ${theme.primaryHover};
      --theme-primary-dark: ${theme.primaryDark};
      --theme-primary-light: ${theme.primaryLight};
      --theme-primary-border: ${theme.primaryBorder};
      --theme-primary-ring: ${theme.primaryRing};
      --theme-accent: ${theme.accent};
      --theme-badge-bg: ${theme.badgeBg};
      --theme-badge-text: ${theme.badgeText};
    }

    /* All Primary Action Buttons & Fill Elements across the application */
    .bg-blue-600,
    .bg-blue-500,
    .bg-theme-primary {
      background-color: ${theme.primary} !important;
    }

    /* Hover States */
    .hover\\:bg-blue-700:hover,
    .hover\\:bg-blue-600:hover,
    .hover\\:bg-theme-primary-hover:hover {
      background-color: ${theme.primaryHover} !important;
    }

    /* Primary Text and Icons */
    .text-blue-600,
    .text-blue-500,
    .text-blue-400,
    .text-theme-primary {
      color: ${theme.primary} !important;
    }

    .text-blue-700,
    .text-blue-800,
    .text-theme-primary-dark {
      color: ${theme.primaryDark} !important;
    }

    /* Light Badge & Card Pill Backgrounds */
    .bg-blue-50,
    .bg-blue-500\\/10,
    .bg-blue-500\\/20,
    .bg-blue-600\\/10,
    .bg-blue-600\\/20,
    .bg-theme-primary-light {
      background-color: ${theme.primaryLight} !important;
    }

    /* Borders & Outlines */
    .border-blue-600,
    .border-blue-500,
    .border-theme-primary {
      border-color: ${theme.primary} !important;
    }

    .border-blue-200,
    .border-blue-300,
    .border-blue-500\\/30,
    .border-blue-200\\/60,
    .border-theme-primary-border {
      border-color: ${theme.primaryBorder} !important;
    }

    /* Focus Rings */
    .focus\\:border-blue-600:focus,
    .focus\\:border-blue-500:focus {
      border-color: ${theme.primary} !important;
    }

    .focus\\:ring-blue-600\\/10:focus,
    .focus\\:ring-blue-500\\/20:focus,
    .focus\\:ring-blue-500\\/30:focus {
      --tw-ring-color: ${theme.primaryRing} !important;
      box-shadow: 0 0 0 3px ${theme.primaryRing} !important;
    }
  `;
};

export const getSavedThemeId = (): string => {
  if (typeof window === 'undefined') return 'word-blue';
  return localStorage.getItem('eduvera_theme') || 'word-blue';
};

export const getSavedTheme = (): ColorTheme => {
  const id = getSavedThemeId();
  return OFFICE_365_THEMES.find((t) => t.id === id) || OFFICE_365_THEMES[0];
};
