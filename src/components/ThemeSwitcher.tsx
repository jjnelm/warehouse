import { useTheme } from '../contexts/ThemeContext';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
];

export function ThemeSwitcher() {
  const { theme, primaryColor, setTheme, setPrimaryColor } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-4 p-4 bg-surface rounded-xl shadow-card">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded-lg ${
            theme === 'light'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-light text-text-primary'
          }`}
          aria-label="Light mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded-lg ${
            theme === 'dark'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-light text-text-primary'
          }`}
          aria-label="Dark mode"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setPrimaryColor(color.value)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              primaryColor === color.value
                ? 'border-primary-500 scale-110'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color.value }}
            aria-label={`Set ${color.name} as primary color`}
          />
        ))}
      </div>
    </div>
  );
} 