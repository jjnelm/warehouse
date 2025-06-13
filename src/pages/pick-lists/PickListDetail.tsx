import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package2, Check, X, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PickList, PickListItem, WarehouseLocation } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

export default function PickListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pickList, setPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [tempQuantities, setTempQuantities] = useState<Record<string, string>>({});
  const [tempLocations, setTempLocations] = useState<Record<string, string>>({});
  const [tempNotes, setTempNotes] = useState<Record<string, string>>({});
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (id) {
      fetchPickList();
      fetchLocations();
    }
  }, [id]);

  const fetchPickList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pick_lists')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            customer:customers(name)
          ),
          items:pick_list_items(
            *,
            product:products(
              id,
              name,
              sku,
              description
            ),
            location:warehouse_locations(
              id,
              name,
              zone,
              aisle,
              rack,
              bin
            )
          ),
          assigned_to_user:profiles!pick_lists_assigned_to_fkey(email),
          created_by_user:profiles!pick_lists_created_by_fkey(email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPickList(data);
    } catch (error) {
      console.error('Error fetching pick list:', error);
      toast.error('Error loading pick list details');
      navigate('/pick-lists');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Error loading warehouse locations');
    }
  };

  const updatePickListItem = async (itemId: string, updates: Partial<PickListItem>) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('pick_list_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item updated successfully');
      fetchPickList();
    } catch (error) {
      console.error('Error updating pick list item:', error);
      toast.error('Error updating item');
    } finally {
      setUpdating(false);
    }
  };

  const updatePickListStatus = async (status: string) => {
    if (!pickList) return;

    try {
      setUpdating(true);
      const updates: any = { status };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pick_lists')
        .update(updates)
        .eq('id', pickList.id);

      if (error) throw error;
      toast.success('Pick list status updated');
      fetchPickList();
    } catch (error) {
      console.error('Error updating pick list status:', error);
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const assignToMe = async () => {
    if (!pickList) return;

    try {
      setUpdating(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      const { error } = await supabase
        .from('pick_lists')
        .update({
          assigned_to: user.id,
          status: 'in_progress'
        })
        .eq('id', pickList.id);

      if (error) throw error;
      toast.success('Pick list assigned to you');
      fetchPickList();
    } catch (error) {
      console.error('Error assigning pick list:', error);
      toast.error('Error assigning pick list');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveItem = async (itemId: string) => {
    const updates: Partial<PickListItem> = {};
    
    // Only include fields that have changed
    const currentItem = pickList?.items?.find(item => item.id === itemId);
    if (!currentItem) return;

    const quantity = parseInt(tempQuantities[itemId] || '0');
    if (!isNaN(quantity) && quantity >= 0 && quantity <= currentItem.quantity) {
      // Check available stock before updating
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('quantity')
        .eq('product_id', currentItem.product_id)
        .single();

      if (stockError) {
        toast.error('Failed to check stock availability');
        return;
      }

      const availableStock = stockData?.quantity || 0;
      if (quantity > availableStock) {
        toast.error(`Only ${availableStock} units available for this product`);
        return;
      }

      updates.quantity_picked = quantity;
    }

    if (tempLocations[itemId] !== undefined) {
      updates.location_id = tempLocations[itemId];
    }

    if (tempNotes[itemId] !== undefined) {
      updates.notes = tempNotes[itemId];
    }

    if (Object.keys(updates).length > 0) {
      await updatePickListItem(itemId, updates);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!pickList) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Pick list not found</div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Pick List #{pickList?.pick_list_number}</h1>
            <p className="text-muted-foreground">
              Order #{pickList?.order?.order_number} - {pickList?.order?.customer?.name || 'Unknown Customer'}
            </p>
          </div>
          <div className="flex gap-2">
            {pickList?.status === 'pending' && (
              <Button onClick={assignToMe}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign to Me
              </Button>
            )}
            {pickList?.status === 'in_progress' && (
              <Button onClick={() => updatePickListStatus('completed')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Pick List
              </Button>
            )}
            {pickList?.status !== 'completed' && pickList?.status !== 'cancelled' && (
              <Button variant="danger" onClick={() => updatePickListStatus('cancelled')}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Order Number
                </label>
                <Input value={pickList?.order?.order_number || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Customer
                </label>
                <Input value={pickList?.order?.customer?.name || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <Input value={pickList?.status || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Assigned To
                </label>
                <Input value={pickList?.assigned_to_user?.email || 'Unassigned'} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Created By
                </label>
                <Input value={pickList?.created_by_user?.email || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Created At
                </label>
                <Input value={pickList?.created_at ? new Date(pickList.created_at).toLocaleString() : ''} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items to Pick</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pickList?.items?.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {item.product?.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        Location: {item.location?.name || 'No location assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Quantity: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">
                        Picked: {item.quantity_picked || 0}
                      </p>
                    </div>
                  </div>
                  {pickList.status === 'in_progress' && (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Quantity Picked
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={tempQuantities[item.id] ?? (item.quantity_picked || 0)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setTempQuantities(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value
                                }));
                              }}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">
                              of {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Location
                          </label>
                          <Select
                            value={tempLocations[item.id] ?? (item.location_id || '')}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              setTempLocations(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }));
                            }}
                            options={[
                              { value: '', label: 'Select location' },
                              ...locations.map(location => ({
                                value: location.id,
                                label: `${location.zone}-${location.aisle}-${location.rack}-${location.bin}`
                              }))
                            ]}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Notes
                          </label>
                          <Input
                            value={tempNotes[item.id] ?? (item.notes || '')}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setTempNotes(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }));
                            }}
                            placeholder="Add picking notes..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSaveItem(item.id)}
                          disabled={updating}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 