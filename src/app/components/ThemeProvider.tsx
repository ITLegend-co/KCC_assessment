import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type KccTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: KccTheme;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'kcc-assessment-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): KccTheme {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<KccTheme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.kccTheme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The visual theme still works when storage is unavailable.
    }

    const themeColour = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColour?.setAttribute('content', theme === 'dark' ? '#080808' : '#e7e2d7');
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="kcc-theme-toggle"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
