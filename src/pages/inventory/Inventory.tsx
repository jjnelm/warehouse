import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Inventory as InventoryType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { formatDate, getStockLevelColor } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context
import { format } from 'date-fns';

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const { currentTheme } = useTheme(); // Get the current theme
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
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
            )
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.products?.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isLowStock = item.quantity <= (item.products?.minimum_stock || 0);
    
    return matchesSearch && (!showLowStockOnly || isLowStock);
  });

  const lowStockCount = inventory.filter(
    (item) => item.quantity <= (item.products?.minimum_stock || 0)
  ).length;

  return (
    <div
      className={`animate-fade-in ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Inventory
          </h1>
          {lowStockCount > 0 && (
            <div
              className={`mt-2 flex items-center text-sm ${
                currentTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'
              }`}
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              <span>{lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below minimum stock</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Button
            size="sm"
            variant={showLowStockOnly ? "primary" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="flex items-center"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {showLowStockOnly ? 'Show All' : 'Show Low Stock'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => fetchInventory()}
          >
            Refresh
          </Button>
          <Link to="/inventory/add">
            <Button size="sm" icon={<Plus className="h-4 w-4" />}>
              Add Inventory
            </Button>
          </Link>
        </div>
      </div>

      <Card
        className={`${
          currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <Input
                  type="search"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${
                    currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const isLowStock = item.quantity <= (item.products?.minimum_stock || 0);
                    return (
                      <TableRow
                        key={item.id}
                        className={`${
                          isLowStock
                            ? currentTheme === 'dark'
                              ? 'bg-yellow-900/20'
                              : 'bg-yellow-50'
                            : ''
                        }`}
                      >
                        <TableCell>
                          <Link
                            to={`/inventory/${item.id}`}
                            className={`font-medium ${
                              currentTheme === 'dark'
                                ? 'text-primary-400 hover:text-primary-300'
                                : 'text-primary-600 hover:text-primary-500'
                            }`}
                          >
                            {item.products?.name}
                          </Link>
                        </TableCell>
                        <TableCell
                          className={`${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {item.products?.sku}
                        </TableCell>
                        <TableCell
                          className={`${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {item.products?.category?.name}
                        </TableCell>
                        <TableCell
                          className={`${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {item.warehouse_locations &&
                            `${item.warehouse_locations.zone}-${item.warehouse_locations.aisle}-${item.warehouse_locations.rack}-${item.warehouse_locations.bin}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${getStockLevelColor(
                                item.quantity,
                                item.products?.minimum_stock || 0
                              )}`}
                            >
                              {item.quantity}
                            </span>
                            {isLowStock && (
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  currentTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-500'
                                }`}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={`${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {item.products?.minimum_stock || 0}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {item.created_by_user?.email || 'System'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.updated_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {item.updated_by_user?.email || 'System'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/inventory/${item.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className={`py-4 text-center ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;