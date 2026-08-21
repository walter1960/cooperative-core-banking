import { CooperativeTheme, defaultTheme } from '../../components/home/ThemeCustomizerModal';

const THEME_STORAGE_KEY = 'coop_custom_theme';

export class ThemeManager {
  static getTheme(): CooperativeTheme {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultTheme, ...JSON.parse(saved) };
      } catch (e) {
        return defaultTheme;
      }
    }
    return defaultTheme;
  }

  static setTheme(theme: CooperativeTheme): void {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    this.applyToDOM(theme);
    window.dispatchEvent(new CustomEvent('coop-theme-changed', { detail: theme }));
  }

  static applyToDOM(theme: CooperativeTheme): void {
    const root = document.documentElement;
    root.style.setProperty('--coop-primary', theme.primaryAccent || '#15803d');
    root.style.setProperty('--coop-topbar-bg', theme.topBarBg || '#29323b');
    root.style.setProperty('--coop-topbar-text', theme.topBarText || '#ffffff');
    root.style.setProperty('--coop-sidebar-bg', theme.sidebarBg || '#333d47');
    root.style.setProperty('--coop-sidebar-text', theme.sidebarText || '#f8fafc');
    root.style.setProperty('--coop-canvas-bg', theme.canvasBg || '#dcdfe4');
    root.style.setProperty('--coop-canvas-ribbon1', theme.canvasRibbon1 || theme.primaryAccent || '#15803d');
    root.style.setProperty('--coop-canvas-ribbon2', theme.canvasRibbon2 || theme.topBarBg || '#29323b');
    root.style.setProperty('--coop-tile-title', theme.tileTitleColor || theme.primaryAccent || '#15803d');
    root.style.setProperty('--coop-tile-bg', theme.tileBg || '#ffffff');
    root.style.setProperty('--coop-tile-border', theme.tileBorder || '#cbd5e1');
  }

  static init(): void {
    const current = this.getTheme();
    this.applyToDOM(current);
  }
}
