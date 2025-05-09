import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, Plus, AlertTriangle, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Inventory as InventoryType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
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

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryType | null>(null);

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
          products:product_id(
            id,
            name,
            sku,
            minimum_stock,
            categories:category_id(name)
          ),
          warehouse_locations:location_id(
            zone,
            aisle,
            rack,
            bin
          )
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

  const handleDeleteClick = (item: InventoryType) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setDeletingId(itemToDelete.id);
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success('Inventory item deleted successfully');
      setInventory(inventory.filter(item => item.id !== itemToDelete.id));
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory item');
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
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
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          {lowStockCount > 0 && (
            <div className="mt-2 flex items-center text-sm text-yellow-600">
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

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
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
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const isLowStock = item.quantity <= (item.products?.minimum_stock || 0);
                    return (
                      <TableRow key={item.id} className={isLowStock ? 'bg-yellow-50' : ''}>
                        <TableCell>
                          <Link
                            to={`/inventory/${item.id}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {item.products?.name}
                          </Link>
                        </TableCell>
                        <TableCell>{item.products?.sku}</TableCell>
                        <TableCell>{item.products?.categories?.name}</TableCell>
                        <TableCell>
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
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.products?.minimum_stock || 0}</TableCell>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash className="h-4 w-4" />}
                            onClick={() => handleDeleteClick(item)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
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

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        description={`Are you sure you want to delete ${itemToDelete?.products?.name} from inventory? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Inventory;