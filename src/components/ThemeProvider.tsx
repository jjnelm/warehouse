import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();

  useEffect(() => {
    // Get the current theme
    const currentTheme = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

    // Add transition class before changing theme
    document.documentElement.classList.add('theme-transition');

    // Update the document class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(currentTheme);

    // Update the meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        currentTheme === 'dark' ? '#1f2937' : '#ffffff'
      );
    }

    // Remove transition class after theme change
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Add transition class before changing theme
      document.documentElement.classList.add('theme-transition');

      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(e.matches ? 'dark' : 'light');

      // Remove transition class after theme change
      const timeoutId = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 200);

      return () => clearTimeout(timeoutId);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return <>{children}</>;
}; 