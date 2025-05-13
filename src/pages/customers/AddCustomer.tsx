import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AddCustomer() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer added successfully');
      navigate('/customers');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    } finally {
      setLoading(false);
    }
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="contact_name"
              className={`block text-sm font-medium mb-1 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Contact Name
            </label>
            <Input
              id="contact_name"
              type="text"
              placeholder="Enter contact name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className={`block text-sm font-medium mb-1 ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Address
            </label>
            <Input
              id="address"
              type="text"
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}