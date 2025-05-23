import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, RefreshCw, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Inventory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate, getStockLevelColor } from '../../lib/utils';
import UpdateStock from './UpdateStock';
import UpdateLocation from './UpdateLocation';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const InventoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [showUpdateLocation, setShowUpdateLocation] = useState(false);
  const { currentTheme } = useTheme(); // Get the current theme

  useEffect(() => {
    if (id === 'add') {
      navigate('/inventory/add');
      return;
    }
    fetchInventoryItem();
  }, [id]);

  const fetchInventoryItem = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            name,
            sku,
            description,
            minimum_stock,
            category:category_id (
              name
            ),
            image_url
          ),
          warehouse_locations (
            zone,
            aisle,
            rack,
            bin,
            capacity
          ),
          created_by_user:profiles!inventory_created_by_fkey(email),
          updated_by_user:profiles!inventory_updated_by_fkey(email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      toast.error('Failed to fetch inventory item');
      navigate('/inventory');
    } finally {
      setLoading(false);
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

  if (!inventory) {
    return (
      <div
        className={`text-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <h2 className="text-lg font-medium">Inventory item not found</h2>
        <Link
          to="/inventory"
          className={`font-medium ${
            currentTheme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
          }`}
        >
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (showUpdateStock) {
    return (
      <UpdateStock
        inventoryId={inventory.id}
        currentQuantity={inventory.quantity}
        onSuccess={() => {
          setShowUpdateStock(false);
          fetchInventoryItem();
        }}
      />
    );
  }

  if (showUpdateLocation) {
    return (
      <UpdateLocation
        inventoryId={inventory.id}
        currentLocationId={inventory.location_id}
        onSuccess={() => {
          setShowUpdateLocation(false);
          fetchInventoryItem();
        }}
      />
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
            onClick={() => navigate('/inventory')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {inventory.products?.name}
          </h1>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => setShowUpdateLocation(true)}
          >
            Update Location
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => setShowUpdateStock(true)}
          >
            Update Stock
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <CardHeader>
            <CardTitle>Inventory Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
              <div>
                <dt className="text-sm font-medium">
                  Quantity
                </dt>
                <dd className="mt-1">
                  <span
                    className={`font-medium ${getStockLevelColor(
                      inventory.quantity,
                      inventory.products?.minimum_stock || 0
                    )}`}
                  >
                    {inventory.quantity}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Location
                </dt>
                <dd className="mt-1">
                  {inventory.warehouse_locations &&
                    `${inventory.warehouse_locations.zone}-${inventory.warehouse_locations.aisle}-${inventory.warehouse_locations.rack}-${inventory.warehouse_locations.bin}`}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {format(new Date(inventory.created_at), 'MMM d, yyyy HH:mm')}
                    {inventory.created_by_user?.email && (
                      <span className="ml-2 text-gray-500">
                        by {inventory.created_by_user.email}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {format(new Date(inventory.updated_at), 'MMM d, yyyy HH:mm')}
                    {inventory.updated_by_user?.email && (
                      <span className="ml-2 text-gray-500">
                        by {inventory.updated_by_user.email}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {inventory.lot_number && (
                <div>
                  <dt className="text-sm font-medium">
                    Lot Number
                  </dt>
                  <dd className="mt-1">
                    {inventory.lot_number}
                  </dd>
                </div>
              )}
              {inventory.expiry_date && (
                <div>
                  <dt className="text-sm font-medium">
                    Expiry Date
                  </dt>
                  <dd className="mt-1">
                    {formatDate(inventory.expiry_date)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card
          className={`${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
              <div className="sm:col-span-2">
                {inventory.products?.image_url ? (
                  <div className="mb-4">
                    <img
                      src={inventory.products.image_url}
                      alt={inventory.products.name}
                      className="h-48 w-48 object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="mb-4 h-48 w-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <dt className="text-sm font-medium">
                  SKU
                </dt>
                <dd className="mt-1">
                  {inventory.products?.sku}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Category
                </dt>
                <dd className="mt-1">
                  {inventory.products?.category?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">
                  Description
                </dt>
                <dd className="mt-1">
                  {inventory.products?.description || (
                    <span
                      className={`italic ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      No description available.
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDetail;