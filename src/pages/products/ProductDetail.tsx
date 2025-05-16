import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Trash, RefreshCw, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { Product, Inventory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate, getStockLevelColor } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentTheme } = useTheme(); // Get the current theme

  useEffect(() => {
    fetchProduct();
    fetchInventory();
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

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          warehouse_locations:location_id (
            zone,
            aisle,
            rack,
            bin,
            capacity
          )
        `)
        .eq('product_id', id);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory information');
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

  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const isLowStock = totalStock <= (product?.minimum_stock || 0);

  // Create a shorter data format
  const qrData = {
    s: product.sku, // sku
    n: product.name, // name
    d: product.description, // description
    c: product.category?.name, // category
    p: product.unit_price, // price
    m: product.minimum_stock, // minimum stock
    q: totalStock, // current quantity
    l: inventory.map(item => ({
      l: item.warehouse_locations ? 
        `${item.warehouse_locations.zone}-${item.warehouse_locations.aisle}-${item.warehouse_locations.rack}-${item.warehouse_locations.bin}` : null,
      q: item.quantity,
      t: item.lot_number,
      e: item.expiry_date
    })),
    t: product.created_at, // timestamp
    a: product.archived ? 1 : 0 // archived status (1 or 0)
  };

  // Only include the SKU in the QR code
  const qrValue = `${window.location.origin}/p/${product.sku}`;

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
                  Current Stock
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className={getStockLevelColor(totalStock, product.minimum_stock)}>
                    {totalStock}
                  </span>
                  {isLowStock && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        currentTheme === 'dark'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </span>
                  )}
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

        <div className="grid gap-6">
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

          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <CardHeader>
              <CardTitle>Inventory Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {inventory.length > 0 ? (
                <div className="space-y-4">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-4 ${
                        currentTheme === 'dark'
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium">Location</dt>
                          <dd className="mt-1">
                            {item.warehouse_locations &&
                              `${item.warehouse_locations.zone}-${item.warehouse_locations.aisle}-${item.warehouse_locations.rack}-${item.warehouse_locations.bin}`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium">Quantity</dt>
                          <dd className="mt-1">{item.quantity}</dd>
                        </div>
                        {item.lot_number && (
                          <div>
                            <dt className="text-sm font-medium">Lot Number</dt>
                            <dd className="mt-1">{item.lot_number}</dd>
                          </div>
                        )}
                        {item.expiry_date && (
                          <div>
                            <dt className="text-sm font-medium">Expiry Date</dt>
                            <dd className="mt-1">{formatDate(item.expiry_date)}</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No inventory records found</p>
              )}
            </CardContent>
          </Card>

          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <CardHeader>
              <CardTitle>Product QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-4">
                <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG
                    value={qrValue}
                    size={256}
                    level="M"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Scan this QR code to view product details
                  <br />
                  Works on all devices without login
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
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