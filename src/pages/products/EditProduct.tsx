import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, Category } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    unit_price: '',
    minimum_stock: '',
    image_url: '',
  });
  const { currentTheme } = useTheme(); // Get the current theme

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        sku: data.sku,
        description: data.description || '',
        category_id: data.category_id,
        unit_price: data.unit_price.toString(),
        minimum_stock: data.minimum_stock.toString(),
        image_url: data.image_url || '',
      });
      setImagePreview(data.image_url || null);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product details');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

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

      // Update form data with new image URL
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: formData.category_id,
          unit_price: Number(formData.unit_price),
          minimum_stock: Number(formData.minimum_stock),
          image_url: formData.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Product updated successfully');
      navigate(`/products/${id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Handle number inputs
    if (type === 'number') {
      const numValue = value === '' ? '' : Number(value);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div
        className={`flex h-full items-center justify-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <div
          className={`h-8 w-8 animate-spin rounded-full border-4 ${
            currentTheme === 'dark'
              ? 'border-primary-600 border-t-transparent'
              : 'border-primary-500 border-t-transparent'
          }`}
        />
      </div>
    );
  }

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
            onClick={() => navigate(`/products/${id}`)}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className={`block text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Product Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="sku"
                    className={`block text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    SKU
                  </label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="category_id"
                    className={`block text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Category
                  </label>
                  <Select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit_price"
                    className={`block text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Unit Price
                  </label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={handleChange}
                    required
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="minimum_stock"
                    className={`block text-sm font-medium ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Minimum Stock
                  </label>
                  <Input
                    id="minimum_stock"
                    name="minimum_stock"
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={handleChange}
                    required
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  } mb-2`}>
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
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className={`mt-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                    }`}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Or enter a URL to an image of the product. The image should be publicly accessible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Product Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:outline-none ${
                    currentTheme === 'dark'
                      ? 'bg-gray-800 text-white border-gray-600 focus:border-primary-500 focus:ring-primary-500'
                      : 'bg-white text-gray-900 border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            icon={<Save className="h-4 w-4" />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;