'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorTheme, OFFICE_365_THEMES, applyThemeToDocument, getSavedThemeId } from '../theme';

export interface SchoolProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  affiliation: string;
}

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => void;
  schoolLogo: string | null;
  setSchoolLogo: (logo: string | null) => void;
  schoolProfile: SchoolProfile;
  setSchoolProfile: (profile: Partial<SchoolProfile>) => void;
}

const defaultProfile: SchoolProfile = {
  name: 'Eduvera International Academy',
  tagline: 'Excellence in Academic Governance & Leadership',
  address: '450 University Way, Suite 100, Academic District',
  phone: '+92 (021) 3582-9011',
  email: 'admissions@eduvera.school',
  website: 'https://eduvera.school',
  affiliation: 'Federal Board of Intermediate and Secondary Education (FBISE)',
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: OFFICE_365_THEMES[0],
  setTheme: () => {},
  schoolLogo: null,
  setSchoolLogo: () => {},
  schoolProfile: defaultProfile,
  setSchoolProfile: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(OFFICE_365_THEMES[0]);
  const [schoolLogo, setSchoolLogoState] = useState<string | null>(null);
  const [schoolProfile, setSchoolProfileState] = useState<SchoolProfile>(defaultProfile);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initialize Theme
    const savedThemeId = getSavedThemeId();
    const foundTheme = OFFICE_365_THEMES.find((t) => t.id === savedThemeId) || OFFICE_365_THEMES[0];
    setCurrentTheme(foundTheme);
    applyThemeToDocument(foundTheme.id);

    // 2. Initialize School Logo
    const savedLogo = localStorage.getItem('eduvera_school_logo');
    if (savedLogo) {
      setSchoolLogoState(savedLogo);
    }

    // 3. Initialize School Profile
    const savedName = localStorage.getItem('eduvera_school_name');
    const savedProfile = localStorage.getItem('eduvera_school_profile');
    if (savedProfile) {
      try {
        setSchoolProfileState(JSON.parse(savedProfile));
      } catch {}
    } else if (savedName) {
      setSchoolProfileState((prev) => ({ ...prev, name: savedName }));
    }
  }, []);

  const setTheme = (themeId: string) => {
    const found = OFFICE_365_THEMES.find((t) => t.id === themeId) || OFFICE_365_THEMES[0];
    setCurrentTheme(found);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eduvera_theme', found.id);
    }
    applyThemeToDocument(found.id);
  };

  const setSchoolLogo = (logo: string | null) => {
    setSchoolLogoState(logo);
    if (typeof window !== 'undefined') {
      if (logo) {
        localStorage.setItem('eduvera_school_logo', logo);
      } else {
        localStorage.removeItem('eduvera_school_logo');
      }
    }
  };

  const setSchoolProfile = (partial: Partial<SchoolProfile>) => {
    setSchoolProfileState((prev) => {
      const updated = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eduvera_school_profile', JSON.stringify(updated));
        if (updated.name) {
          localStorage.setItem('eduvera_school_name', updated.name);
        }
      }
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        schoolLogo,
        setSchoolLogo,
        schoolProfile,
        setSchoolProfile,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
