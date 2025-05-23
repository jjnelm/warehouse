import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

interface Location {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  capacity: number;
  current_usage: number;
  location_type: string;
  rotation_method: string;
  notes?: string;
}

interface UpdateLocationForm {
  location_id: string;
  location_type: string;
  rotation_method: string;
  notes: string;
}

interface UpdateLocationProps {
  inventoryId: string;
  currentLocationId: string;
  onSuccess?: () => void;
}

const UpdateLocation = ({ inventoryId, currentLocationId, onSuccess }: UpdateLocationProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const { currentTheme } = useTheme();
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateLocationForm>({
    defaultValues: {
      location_type: 'Standard',
      rotation_method: 'FIFO',
      notes: ''
    }
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('id, zone, aisle, rack, bin, capacity, current_usage, location_type, rotation_method, notes')
        .order('zone, aisle, rack, bin');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const onSubmit = async (data: UpdateLocationForm) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('inventory')
        .update({ 
          location_id: data.location_id,
          location_type: data.location_type,
          rotation_method: data.rotation_method,
          notes: data.notes
        })
        .eq('id', inventoryId);

      if (error) throw error;
      
      toast.success('Location updated successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/inventory');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`animate-fade-in ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/inventory')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">Update Location</h1>
        </div>
      </div>

      <Card className={currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Select
              label="Location"
              options={locations.map(location => ({
                value: location.id,
                label: `${location.zone}-${location.aisle}-${location.rack}-${location.bin}`
              }))}
              defaultValue={currentLocationId}
              error={errors.location_id?.message}
              {...register('location_id', {
                required: 'Location is required',
              })}
            />

            <Select
              label="Location Type"
              options={[
                { value: 'Standard', label: 'Standard' },
                { value: 'Bulk', label: 'Bulk Storage' },
                { value: 'Picking', label: 'Picking Area' },
                { value: 'Receiving', label: 'Receiving Area' },
                { value: 'Shipping', label: 'Shipping Area' }
              ]}
              error={errors.location_type?.message}
              {...register('location_type')}
            />

            <Select
              label="Rotation Method"
              options={[
                { value: 'FIFO', label: 'First In, First Out (FIFO)' },
                { value: 'LIFO', label: 'Last In, First Out (LIFO)' },
                { value: 'FEFO', label: 'First Expired, First Out (FEFO)' }
              ]}
              error={errors.rotation_method?.message}
              {...register('rotation_method')}
            />

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter any additional notes"
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={loading}>
                Update Location
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateLocation; 