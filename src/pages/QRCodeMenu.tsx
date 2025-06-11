import React from 'react';
import { QrCode } from 'lucide-react';
import QRCode from '../components/ui/QRCode';

interface QRCodeItem {
  title: string;
  path: string;
  description: string;
}

const qrCodeItems: QRCodeItem[] = [
  {
    title: 'Add Product',
    path: '/products/add',
    description: 'Scan to add a new product'
  },
  {
    title: 'Add Customer',
    path: '/customers/add',
    description: 'Scan to add a new customer'
  },
  {
    title: 'Add Supplier',
    path: '/suppliers/add',
    description: 'Scan to add a new supplier'
  },
  {
    title: 'Add Location',
    path: '/locations/add',
    description: 'Scan to add a new location'
  },
  {
    title: 'Create Order',
    path: '/orders/create',
    description: 'Scan to create a new order'
  },
  {
    title: 'New Shipment',
    path: '/shipments/new',
    description: 'Scan to create a new shipment'
  },
  {
    title: 'Add Inventory',
    path: '/inventory/add',
    description: 'Scan to add new inventory'
  }
];

export default function QRCodeMenu() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">QR Code Menu</h1>
            <p className="text-gray-600 mt-1">
              Scan these QR codes to quickly access different features
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodeItems.map((item) => (
            <div
              key={item.path}
              className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center"
            >
              <div className="mb-4">
                <QRCode
                  value={`${window.location.origin}${item.path}`}
                  title={item.title}
                  size={200}
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <QrCode className="w-6 h-6 text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                How to use these QR codes
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Scan any QR code with your mobile device to quickly access that feature.
                Make sure you're logged in to the application on your mobile device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 