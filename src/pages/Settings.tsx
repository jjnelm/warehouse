import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme, currentTheme } = useTheme();

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
          <div className="space-y-4">
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
        </div>
      </Card>
    </div>
  );
}