import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

export default function AddCustomer() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme(); // Get the current theme

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be implemented here
  };

  return (
    <div
      className={`p-6 ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <h1 className="text-2xl font-semibold mb-6">Add New Customer</h1>
      
      <div
        className={`rounded-lg shadow p-6 ${
          currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-1 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Customer Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter customer email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className={`block text-sm font-medium mb-1 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}