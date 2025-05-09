import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function Customers() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <Link to="/customers/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>
      
      {/* Customer list will be implemented here */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 text-center text-gray-500">
          No customers found. Add your first customer to get started.
        </div>
      </div>
    </div>
  );
}