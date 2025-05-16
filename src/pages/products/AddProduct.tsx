import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';

interface AddProductForm {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  unit_price: number;
  minimum_stock: number;
}

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [qrValue, setQrValue] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AddProductForm>();

  const watchSku = watch('sku');
  const watchName = watch('name');

  useEffect(() => {
    if (watchSku && watchName) {
      setQrValue(JSON.stringify({
        sku: watchSku,
        name: watchName,
        timestamp: new Date().toISOString()
      }));
    }
  }, [watchSku, watchName]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories') // Replace 'categories' with your actual table name
          .select('id, name');

        if (error) {
          throw error;
        }

        const formattedCategories = data.map((category: { id: string; name: string }) => ({
          value: category.id,
          label: category.name,
        }));

        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: AddProductForm) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: data.name,
            sku: data.sku,
            description: data.description || null,
            category_id: data.category_id,
            unit_price: parseFloat(data.unit_price.toString()),
            minimum_stock: parseInt(data.minimum_stock.toString()),
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('A product with this SKU already exists');
        } else if (error.code === '42501') {
          toast.error('You do not have permission to add products');
        } else {
          toast.error('Error adding product: ' + error.message);
        }
        return;
      }

      toast.success('Product added successfully');
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
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
            onClick={() => navigate('/products')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  label="Product Name"
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Product name is required',
                  })}
                />

                <Input
                  label="SKU"
                  error={errors.sku?.message}
                  {...register('sku', {
                    required: 'SKU is required',
                    pattern: {
                      value: /^[A-Za-z0-9-]+$/,
                      message: 'SKU can only contain letters, numbers, and hyphens',
                    },
                  })}
                />

                <Select
                  label="Category"
                  options={categories}
                  error={errors.category_id?.message}
                  {...register('category_id', {
                    required: 'Category is required',
                  })}
                />

                <Input
                  type="number"
                  label="Unit Price"
                  step="0.01"
                  error={errors.unit_price?.message}
                  {...register('unit_price', {
                    required: 'Unit price is required',
                    min: {
                      value: 0,
                      message: 'Price must be greater than 0',
                    },
                  })}
                />

                <Input
                  type="number"
                  label="Minimum Stock"
                  error={errors.minimum_stock?.message}
                  {...register('minimum_stock', {
                    required: 'Minimum stock is required',
                    min: {
                      value: 0,
                      message: 'Minimum stock must be greater than 0',
                    },
                  })}
                />

                <div className="col-span-2">
                  <Input
                    label="Description"
                    error={errors.description?.message}
                    {...register('description')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                >
                  Create Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-4">
              {qrValue ? (
                <>
                  <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    This QR code contains the product SKU and name.
                    <br />
                    It will be generated automatically as you fill in the product details.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Fill in the product SKU and name to generate a QR code.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProduct;