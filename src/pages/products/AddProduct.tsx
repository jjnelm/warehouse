import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
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
  image_url: string;
}

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [qrValue, setQrValue] = useState('');
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AddProductForm>();

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to upload images');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setUploading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please contact support.');
        } else if (uploadError.message.includes('violates row-level security policy')) {
          toast.error('You do not have permission to upload images. Please log in.');
        } else {
          toast.error('Failed to upload image: ' + uploadError.message);
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      // Set the image URL in the form
      setValue('image_url', publicUrl);
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      // Error toast is already shown in the if block above
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setValue('image_url', '');
    setImagePreview(null);
  };

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
            image_url: data.image_url || null,
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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="h-32 w-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </label>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload a product image (max 5MB, JPG, PNG, GIF)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <Input
                    label="Image URL (Optional)"
                    placeholder="https://example.com/image.jpg"
                    error={errors.image_url?.message}
                    {...register('image_url', {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'Please enter a valid URL starting with http:// or https://',
                      },
                    })}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Or enter a URL to an image of the product. The image should be publicly accessible.
                  </p>
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