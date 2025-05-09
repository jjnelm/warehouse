import React from 'react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context

export default function Reports() {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <div
      className={`p-6 ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`p-6 ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <h2 className="text-lg font-semibold mb-4">Inventory Report</h2>
          <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            View detailed inventory statistics and stock levels
          </p>
          <button
            className={`px-4 py-2 rounded ${
              currentTheme === 'dark'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Generate Report
          </button>
        </Card>
        
        <Card className={`p-6 ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <h2 className="text-lg font-semibold mb-4">Sales Report</h2>
          <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Analyze sales performance and trends
          </p>
          <button
            className={`px-4 py-2 rounded ${
              currentTheme === 'dark'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Generate Report
          </button>
        </Card>
        
        <Card className={`p-6 ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Review order history and fulfillment metrics
          </p>
          <button
            className={`px-4 py-2 rounded ${
              currentTheme === 'dark'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            Generate Report
          </button>
        </Card>
      </div>
    </div>
  );
}