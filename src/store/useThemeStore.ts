import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const THEME_KEY = 'sundargram_theme_mode';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<(t: Theme) => void>();

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);

  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#000000' : '#ffffff');
  }
}

// Initial apply
if (typeof window !== 'undefined') {
  applyTheme(currentTheme);
}

export function useThemeStore() {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  useEffect(() => {
    const cb = (t: Theme) => setThemeState(t);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const setTheme = (t: Theme) => {
    currentTheme = t;
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
    listeners.forEach((l) => l(t));
  };

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}
