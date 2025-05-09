import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function AddLocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    zone: '',
    aisle: '',
    rack: '',
    bin: '',
    capacity: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('warehouse_locations')
        .insert([
          {
            zone: formData.zone,
            aisle: formData.aisle,
            rack: formData.rack,
            bin: formData.bin,
            capacity: parseInt(formData.capacity),
            reserved: false
          }
        ]);

      if (error) throw error;

      toast.success('Location added successfully');
      navigate('/locations');
    } catch (error) {
      toast.error('Error adding location');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <MapPin className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Add New Location</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
                Zone
              </label>
              <Input
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                required
                placeholder="Enter zone"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="aisle" className="block text-sm font-medium text-gray-700">
                Aisle
              </label>
              <Input
                id="aisle"
                name="aisle"
                value={formData.aisle}
                onChange={handleChange}
                required
                placeholder="Enter aisle"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="rack" className="block text-sm font-medium text-gray-700">
                Rack
              </label>
              <Input
                id="rack"
                name="rack"
                value={formData.rack}
                onChange={handleChange}
                required
                placeholder="Enter rack"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="bin" className="block text-sm font-medium text-gray-700">
                Bin
              </label>
              <Input
                id="bin"
                name="bin"
                value={formData.bin}
                onChange={handleChange}
                required
                placeholder="Enter bin"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                required
                placeholder="Enter capacity"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/locations')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Location'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}