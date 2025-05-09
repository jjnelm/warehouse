import React from 'react';
import { Card } from '../components/ui/Card';

export default function Reports() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory Report</h2>
          <p className="text-gray-600 mb-4">View detailed inventory statistics and stock levels</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Generate Report
          </button>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sales Report</h2>
          <p className="text-gray-600 mb-4">Analyze sales performance and trends</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Generate Report
          </button>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          <p className="text-gray-600 mb-4">Review order history and fulfillment metrics</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Generate Report
          </button>
        </Card>
      </div>
    </div>
  );
}