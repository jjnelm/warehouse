import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { WarehouseLocation } from '../../types';

interface EditLocationForm {
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  capacity: number;
  location_type: string;
  rotation_method: string;
  notes: string;
}

const EditLocation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentTheme } = useTheme();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditLocationForm>();

  useEffect(() => {
    fetchLocation();
  }, [id]);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Location not found');
        navigate('/locations');
        return;
      }

      // Set form values
      setValue('zone', data.zone);
      setValue('aisle', data.aisle);
      setValue('rack', data.rack);
      setValue('bin', data.bin);
      setValue('capacity', data.capacity);
      setValue('location_type', data.location_type || 'Standard');
      setValue('rotation_method', data.rotation_method || 'FIFO');
      setValue('notes', data.notes || '');
    } catch (error) {
      console.error('Error fetching location:', error);
      toast.error('Failed to load location details');
      navigate('/locations');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditLocationForm) => {
    try {
      setIsProcessing(true);

      // Check if the new location code already exists
      const { data: existingLocations, error: checkError } = await supabase
        .from('warehouse_locations')
        .select('id')
        .eq('zone', data.zone)
        .eq('aisle', data.aisle)
        .eq('rack', data.rack)
        .eq('bin', data.bin)
        .neq('id', id);

      if (checkError) throw checkError;

      if (existingLocations && existingLocations.length > 0) {
        toast.error('A location with this code already exists');
        return;
      }

      const { error } = await supabase
        .from('warehouse_locations')
        .update({
          zone: data.zone,
          aisle: data.aisle,
          rack: data.rack,
          bin: data.bin,
          capacity: data.capacity,
          location_type: data.location_type,
          rotation_method: data.rotation_method,
          notes: data.notes
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Location updated successfully');
      navigate('/locations');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading location details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/locations')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Location</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update warehouse location details
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Zone"
                {...register('zone', {
                  required: 'Zone is required'
                })}
                error={errors.zone?.message}
              />
              <Input
                label="Aisle"
                {...register('aisle', {
                  required: 'Aisle is required'
                })}
                error={errors.aisle?.message}
              />
              <Input
                label="Rack"
                {...register('rack', {
                  required: 'Rack is required'
                })}
                error={errors.rack?.message}
              />
              <Input
                label="Bin"
                {...register('bin', {
                  required: 'Bin is required'
                })}
                error={errors.bin?.message}
              />
              <Input
                label="Capacity"
                type="number"
                {...register('capacity', {
                  required: 'Capacity is required',
                  min: {
                    value: 1,
                    message: 'Capacity must be at least 1'
                  }
                })}
                error={errors.capacity?.message}
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
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/locations')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isProcessing}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLocation; 