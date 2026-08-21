import React, { createContext, useContext, useState, useEffect } from 'react';
import { CooperativeTheme, defaultTheme } from '../components/home/ThemeCustomizerModal';

interface ThemeContextType {
  theme: CooperativeTheme;
  setTheme: (theme: CooperativeTheme) => void;
  updateColor: (key: keyof CooperativeTheme, value: string) => void;
  resetTheme: () => void;
}

const THEME_STORAGE_KEY = 'coop_custom_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<CooperativeTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultTheme, ...JSON.parse(saved) };
      } catch (e) {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  const applyToDOM = (t: CooperativeTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--coop-primary', t.primaryAccent || '#15803d');
    root.style.setProperty('--coop-topbar-bg', t.topBarBg || '#29323b');
    root.style.setProperty('--coop-topbar-text', t.topBarText || '#ffffff');
    root.style.setProperty('--coop-sidebar-bg', t.sidebarBg || '#333d47');
    root.style.setProperty('--coop-sidebar-text', t.sidebarText || '#f8fafc');
    root.style.setProperty('--coop-canvas-bg', t.canvasBg || '#dcdfe4');
    root.style.setProperty('--coop-canvas-ribbon1', t.canvasRibbon1 || t.primaryAccent || '#15803d');
    root.style.setProperty('--coop-canvas-ribbon2', t.canvasRibbon2 || t.topBarBg || '#29323b');
    root.style.setProperty('--coop-tile-title', t.tileTitleColor || t.primaryAccent || '#15803d');
    root.style.setProperty('--coop-tile-bg', t.tileBg || '#ffffff');
    root.style.setProperty('--coop-tile-border', t.tileBorder || '#cbd5e1');
  };

  useEffect(() => {
    applyToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: CooperativeTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
    applyToDOM(newTheme);
  };

  const updateColor = (key: keyof CooperativeTheme, value: string) => {
    setThemeState(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
      applyToDOM(updated);
      return updated;
    });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, updateColor, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
