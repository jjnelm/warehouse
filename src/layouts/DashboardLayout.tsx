import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Content area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content */}
        <main
          className={`flex-1 px-4 py-8 sm:px-6 lg:px-8 ${
            currentTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;