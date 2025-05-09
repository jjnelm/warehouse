import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';

interface AddInventoryForm {
  product_id: string;
  location_id: string;
  quantity: number;
  lot_number?: string;
  expiry_date?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Location {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
}

const AddInventory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<AddInventoryForm>();

  useEffect(() => {
    fetchProducts();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

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

  const onSubmit = async (data: AddInventoryForm) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('inventory')
        .insert([
          {
            product_id: data.product_id,
            location_id: data.location_id,
            quantity: parseInt(data.quantity.toString()),
            lot_number: data.lot_number || null,
            expiry_date: data.expiry_date || null,
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('A product with this lot number already exists in this location');
        } else {
          toast.error('Error adding inventory: ' + error.message);
        }
        return;
      }
      
      toast.success('Inventory added successfully');
      navigate('/inventory');
    } catch (error) {
      console.error('Error adding inventory:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
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
          <h1 className="text-2xl font-bold text-gray-900">Add Inventory</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Select
                label="Product"
                options={products.map(product => ({
                  value: product.id,
                  label: `${product.name} (${product.sku})`
                }))}
                error={errors.product_id?.message}
                {...register('product_id', {
                  required: 'Product is required',
                })}
              />

              <Select
                label="Location"
                options={locations.map(location => ({
                  value: location.id,
                  label: `${location.zone}-${location.aisle}-${location.rack}-${location.bin}`
                }))}
                error={errors.location_id?.message}
                {...register('location_id', {
                  required: 'Location is required',
                })}
              />

              <Input
                type="number"
                label="Quantity"
                error={errors.quantity?.message}
                {...register('quantity', {
                  required: 'Quantity is required',
                  min: {
                    value: 0,
                    message: 'Quantity must be greater than 0',
                  },
                })}
              />

              <Input
                label="Lot Number"
                error={errors.lot_number?.message}
                {...register('lot_number')}
              />

              <Input
                type="date"
                label="Expiry Date"
                error={errors.expiry_date?.message}
                {...register('expiry_date')}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/inventory')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
              >
                Add Inventory
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddInventory; 