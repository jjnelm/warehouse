import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import { Sun, Moon, Monitor } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
];

export default function Settings() {
  const { theme, setTheme, currentTheme, primaryColor, setPrimaryColor } = useTheme();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
      
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Theme Settings</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Color Mode</h3>
              <div className="grid grid-cols-3 gap-4">
                {themeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 ${
                      theme === value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-6 w-6 mb-2 text-gray-900 dark:text-white" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Current theme: {currentTheme}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Primary Color</h3>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPrimaryColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                      primaryColor === color.value
                        ? 'border-primary-500 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Set ${color.name} as primary color`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Current primary color: {primaryColor}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}