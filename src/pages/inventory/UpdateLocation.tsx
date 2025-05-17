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

interface UpdateLocationForm {
  location_id: string;
}

interface Location {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
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
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateLocationForm>();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('id, zone, aisle, rack, bin')
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
        .update({ location_id: data.location_id })
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