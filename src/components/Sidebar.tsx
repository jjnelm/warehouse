import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  Box, 
  Clipboard, 
  Home, 
  PackageOpen, 
  Settings, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  X,
  Store,
  MapPin,
  Truck,
  QrCode
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventory', href: '/inventory', icon: Box },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Shipments', href: '/shipments', icon: Truck },
    { name: 'Products', href: '/products', icon: PackageOpen },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Suppliers', href: '/suppliers', icon: Store },
    { name: 'Locations', href: '/locations', icon: MapPin },
    { name: 'QR Codes', href: '/qr-codes', icon: QrCode },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-30 transition-opacity duration-200 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 overflow-y-auto bg-primary-950 dark:bg-gray-900 p-4 transition-all duration-200 ease-in-out lg:static lg:left-auto lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className="mb-8 flex items-center justify-between pr-3 sm:px-2">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Warehouse className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">WarehouseIQ</span>
          </Link>
          {/* Close button */}
          <button
            className="text-gray-400 hover:text-gray-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-primary-900 text-white'
                    : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;