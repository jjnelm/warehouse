import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';

export default function AddLocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    zone: '',
    aisle: '',
    rack: '',
    bin: '',
    capacity: '',
    location_type: 'Standard',
    rotation_method: 'FIFO',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
            location_type: formData.location_type,
            rotation_method: formData.rotation_method,
            notes: formData.notes,
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
              <Select
                id="zone"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                options={[
                  { value: 'Zone1', label: 'Zone1' },
                  { value: 'Zone2', label: 'Zone2' },
                  { value: 'Zone3', label: 'Zone3' },
                  { value: 'Zone4', label: 'Zone4' },
                ]}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="aisle" className="block text-sm font-medium text-gray-700">
                Aisle
              </label>
              <Select
                id="aisle"
                name="aisle"
                value={formData.aisle}
                onChange={handleChange}
                options={[
                  { value: 'Aisle1', label: 'Aisle1' },
                  { value: 'Aisle2', label: 'Aisle2' },
                  { value: 'Aisle3', label: 'Aisle3' },
                  { value: 'Aisle4', label: 'Aisle4' },
                ]}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="rack" className="block text-sm font-medium text-gray-700">
                Rack
              </label>
              <Select
                id="rack"
                name="rack"
                value={formData.rack}
                onChange={handleChange}
                options={[
                  { value: 'Rack1', label: 'Rack1' },
                  { value: 'Rack2', label: 'Rack2' },
                  { value: 'Rack3', label: 'Rack3' },
                  { value: 'Rack4', label: 'Rack4' },
                ]}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="bin" className="block text-sm font-medium text-gray-700">
                Bin
              </label>
              <Select
                id="bin"
                name="bin"
                value={formData.bin}
                onChange={handleChange}
                options={[
                  { value: 'Bin1', label: 'Bin1' },
                  { value: 'Bin2', label: 'Bin2' },
                  { value: 'Bin3', label: 'Bin3' },
                  { value: 'Bin4', label: 'Bin4' },
                ]}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Max Capacity
              </label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                required
                placeholder="Enter max capacity"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="location_type" className="block text-sm font-medium text-gray-700">
                Location Type
              </label>
              <Select
                id="location_type"
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                options={[
                  { value: 'Fixed', label: 'Fixed' },
                  { value: 'Dynamic', label: 'Dynamic' },
                ]}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="rotation_method" className="block text-sm font-medium text-gray-700">
                Rotation Method
              </label>
              <Select
                id="rotation_method"
                name="rotation_method"
                value={formData.rotation_method}
                onChange={handleChange}
                options={[
                  { value: 'FIFO', label: 'First In, First Out (FIFO)' },
                  { value: 'LIFO', label: 'Last In, First Out (LIFO)' },
                  { value: 'FEFO', label: 'First Expired, First Out (FEFO)' }
                ]}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Enter any additional notes"
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