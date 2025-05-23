import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';

interface UpdateStockForm {
  quantity: number;
  adjustment_type: 'add' | 'remove';
  notes?: string;
}

interface UpdateStockProps {
  inventoryId: string;
  currentQuantity: number;
  onSuccess?: () => void;
}

const UpdateStock = ({ inventoryId, currentQuantity, onSuccess }: UpdateStockProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<UpdateStockForm>({
    defaultValues: {
      quantity: 0,
      adjustment_type: 'add',
    },
  });
  const { currentTheme } = useTheme();

  const adjustmentType = watch('adjustment_type');

  const onSubmit = async (data: UpdateStockForm) => {
    if (!user) {
      toast.error('Please sign in to update stock');
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      setLoading(true);

      const adjustmentQuantity = Number(data.quantity);
      const newQuantity = adjustmentType === 'add'
        ? currentQuantity + adjustmentQuantity
        : currentQuantity - adjustmentQuantity;

      if (newQuantity < 0) {
        toast.error('Cannot reduce stock below 0');
        return;
      }

      const { data: updateData, error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_by: user.id
        })
        .eq('id', inventoryId)
        .select('id, quantity, updated_by, updated_at')
        .single();

      if (error) {
        console.error('Update error:', error);
        toast.error('Error updating stock: ' + error.message);
        return;
      }

      toast.success('Stock updated successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/inventory');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`animate-fade-in ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Update Stock
          </h1>
        </div>
      </div>

      <Card
        className={`${
          currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <CardHeader>
          <CardTitle>Stock Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Current Stock */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Current Stock
                </label>
                <div
                  className={`mt-1 text-lg font-medium ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {currentQuantity}
                </div>
              </div>

              {/* Adjustment Type */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Adjustment Type
                </label>
                <select
                  className={`mt-1 block w-full rounded-md shadow-sm focus:outline-none ${
                    currentTheme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  {...register('adjustment_type')}
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: {
                      value: 1,
                      message: 'Quantity must be greater than 0',
                    },
                    valueAsNumber: true,
                  })}
                  className={`mt-1 ${
                    currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Notes
                </label>
                <Input
                  type="text"
                  {...register('notes')}
                  className={`mt-1 ${
                    currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateStock;