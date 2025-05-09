import React from 'react';
import { Card } from '../components/ui/Card';
import { useThemeStore } from '../stores/themeStore';
import { Moon, Sun, Monitor } from 'lucide-react';

const Settings = () => {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Force immediate theme update
    document.documentElement.classList.remove('light', 'dark');
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(newTheme);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Appearance</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize how WarehouseIQ looks on your device.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-colors ${
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Sun className="h-6 w-6 text-gray-900 dark:text-gray-100 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Light</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-colors ${
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Moon className="h-6 w-6 text-gray-900 dark:text-gray-100 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark</span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-colors ${
                theme === 'system'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Monitor className="h-6 w-6 text-gray-900 dark:text-gray-100 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">System</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;