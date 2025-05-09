import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Trash, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentTheme } = useTheme(); // Get the current theme

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product details');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/products/edit/${id}`);
  };

  const handleArchive = async () => {
    if (!product) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('products')
        .update({ archived: !product.archived })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Product ${product.archived ? 'unarchived' : 'archived'} successfully`);
      setProduct({ ...product, archived: !product.archived });
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product status');
    } finally {
      setIsProcessing(false);
      setArchiveModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsProcessing(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex h-full items-center justify-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className={`text-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <h2 className="text-lg font-medium">Product not found</h2>
        <Link
          to="/products"
          className={`font-medium ${
            currentTheme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
          }`}
        >
          Back to Products
        </Link>
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
            onClick={() => navigate('/products')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Archive className="h-4 w-4" />}
            onClick={() => setArchiveModalOpen(true)}
            disabled={isProcessing}
          >
            {product.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash className="h-4 w-4" />}
            onClick={() => setDeleteModalOpen(true)}
            disabled={isProcessing}
          >
            Delete
          </Button>
        </div>
      </div>

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
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium">
                  SKU
                </dt>
                <dd className="mt-1">
                  {product.sku}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Category
                </dt>
                <dd className="mt-1">
                  {product.category?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Unit Price
                </dt>
                <dd className="mt-1">
                  {formatCurrency(product.unit_price)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Minimum Stock
                </dt>
                <dd className="mt-1">
                  {product.minimum_stock}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.archived
                        ? currentTheme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-800'
                        : currentTheme === 'dark'
                        ? 'bg-green-700 text-green-300'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {product.archived ? 'Archived' : 'Active'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Created
                </dt>
                <dd className="mt-1">
                  {formatDate(product.created_at)}
                </dd>
              </div>
            </dl>
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
            <p>
              {product.description || 'No description available.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete ${product.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title={product.archived ? 'Unarchive Product' : 'Archive Product'}
        description={`Are you sure you want to ${product.archived ? 'unarchive' : 'archive'} ${product.name}?`}
        confirmText={product.archived ? 'Unarchive' : 'Archive'}
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  );
};

export default ProductDetail;