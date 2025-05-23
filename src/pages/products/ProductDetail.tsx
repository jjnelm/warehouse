import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Trash, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { Product, Inventory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate, getStockLevelColor } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context
import UpdateLocation from '../inventory/UpdateLocation';

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
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);

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

  if (editingInventoryId) {
    const inventoryItem = inventory.find(item => item.id === editingInventoryId);
    if (inventoryItem) {
      return (
        <UpdateLocation
          inventoryId={inventoryItem.id}
          currentLocationId={inventoryItem.location_id}
          onSuccess={() => {
            setEditingInventoryId(null);
            fetchInventory();
          }}
        />
      );
    }
  }

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
      className={`animate-fade-in min-h-screen ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/products')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              SKU: {product.sku}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={handleEdit}
            className="hover:bg-primary-50 dark:hover:bg-primary-900"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Archive className="h-4 w-4" />}
            onClick={() => setArchiveModalOpen(true)}
            disabled={isProcessing}
            className="hover:bg-yellow-50 dark:hover:bg-yellow-900"
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Product Information */}
        <div className="lg:col-span-2 space-y-6">
        <Card
          className={`${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-sm hover:shadow-md transition-shadow duration-200`}
        >
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-semibold">Product Information</CardTitle>
          </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
                    <dd className="mt-1 text-lg font-medium">{product.category?.name}</dd>
              </div>
              <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Price</dt>
                    <dd className="mt-1 text-lg font-medium text-primary-600 dark:text-primary-400">
                  {formatCurrency(product.unit_price)}
                </dd>
              </div>
              <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Minimum Stock</dt>
                    <dd className="mt-1 text-lg font-medium">{product.minimum_stock}</dd>
                  </div>
              </div>
                <div className="space-y-6">
              <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Stock</dt>
                <dd className="mt-1 flex items-center gap-2">
                      <span className={`text-lg font-medium ${getStockLevelColor(totalStock, product.minimum_stock)}`}>
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
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
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
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-lg font-medium">{formatDate(product.created_at)}</dd>
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

          {/* Description Card */}
          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Inventory Locations Card */}
          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-semibold">Inventory Locations</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {inventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Zone/Area</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU/Item Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Capacity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rotation Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Movement</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              {item.warehouse_locations &&
                                `${item.warehouse_locations.zone}-${item.warehouse_locations.aisle}-${item.warehouse_locations.rack}-${item.warehouse_locations.bin}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.warehouse_locations?.zone}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {product.sku}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              item.quantity === 0
                                ? currentTheme === 'dark'
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-800'
                                : item.quantity > (item.warehouse_locations?.capacity || 0)
                                ? currentTheme === 'dark'
                                  ? 'bg-red-900 text-red-300'
                                  : 'bg-red-100 text-red-800'
                                : item.quantity < ((item.warehouse_locations?.capacity || 0) * 0.2)
                                ? currentTheme === 'dark'
                                  ? 'bg-yellow-900 text-yellow-300'
                                  : 'bg-yellow-100 text-yellow-800'
                                : currentTheme === 'dark'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.quantity === 0
                                ? 'Out of Stock'
                                : item.quantity > (item.warehouse_locations?.capacity || 0)
                                ? 'Over Stock'
                                : item.quantity < ((item.warehouse_locations?.capacity || 0) * 0.2)
                                ? 'Low on Stock'
                                : 'In Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.warehouse_locations?.location_type || 'Standard'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.warehouse_locations?.capacity || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.warehouse_locations?.rotation_method || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {formatDate(item.updated_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.warehouse_locations?.notes || 'No notes'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit className="h-4 w-4" />}
                              onClick={() => setEditingInventoryId(item.id)}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                        </div>
              ) : (
                <div className={`text-center py-8 ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-1">No Inventory Items</p>
                  <p className="text-sm">No inventory items found for this product.</p>
                          </div>
                        )}
            </CardContent>
          </Card>
                          </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image Card */}
          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-semibold">Product Image</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {product.image_url ? (
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card
            className={`${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-semibold">Product QR Code</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Scan this QR code to view product details
                  <br />
                  Works on all devices without login
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
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