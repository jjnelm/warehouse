import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { OrderItem } from '../../types';

interface Location {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  capacity: number;
  available_capacity: number;
}

interface AssignLocationsProps {
  orderId: string;
  items: OrderItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AssignLocations = ({ orderId, items, onSuccess, onCancel }: AssignLocationsProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string>>({});
  const [lotNumbers, setLotNumbers] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const { currentTheme } = useTheme();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data: locationsData, error: locationsError } = await supabase
        .from('warehouse_locations')
        .select('*');

      if (locationsError) throw locationsError;

      // Get current inventory for each location
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('location_id, quantity');

      if (inventoryError) throw inventoryError;

      // Calculate available capacity for each location
      const locationsWithCapacity = locationsData.map((location: Location) => {
        const currentQuantity = inventoryData
          .filter((inv) => inv.location_id === location.id)
          .reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0);

        return {
          ...location,
          available_capacity: location.capacity - currentQuantity
        };
      });

      setLocations(locationsWithCapacity);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Error loading locations');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (itemId: string, locationId: string) => {
    setSelectedLocations((prev) => ({
      ...prev,
      [itemId]: locationId
    }));
  };

  const handleLotNumberChange = (itemId: string, lotNumber: string) => {
    setLotNumbers((prev) => ({
      ...prev,
      [itemId]: lotNumber
    }));
  };

  const handleExpiryDateChange = (itemId: string, expiryDate: string) => {
    setExpiryDates((prev) => ({
      ...prev,
      [itemId]: expiryDate
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Validate that all items have locations assigned
      const unassignedItems = items.filter(
        (item) => !selectedLocations[item.id]
      );

      if (unassignedItems.length > 0) {
        toast.error('Please assign locations to all items');
        return;
      }

      // Check if any location exceeds capacity
      const locationQuantities: Record<string, number> = {};
      for (const item of items) {
        const locationId = selectedLocations[item.id];
        locationQuantities[locationId] = (locationQuantities[locationId] || 0) + item.quantity;
      }

      for (const [locationId, quantity] of Object.entries(locationQuantities)) {
        const location = locations.find((loc) => loc.id === locationId);
        if (location && quantity > location.available_capacity) {
          toast.error(`Location ${location.zone}-${location.aisle}-${location.rack}-${location.bin} exceeds capacity`);
          return;
        }
      }

      // Update inventory for each item
      for (const item of items) {
        const locationId = selectedLocations[item.id];
        const lotNumber = lotNumbers[item.id] || null;

        // Check if product with same lot number exists in this location
        if (lotNumber) {
          const { data: existingInventory, error: checkError } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('product_id', item.product_id)
            .eq('location_id', locationId)
            .eq('lot_number', lotNumber)
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw checkError;
          }

          if (existingInventory) {
            // Update existing inventory
            const { error: updateError } = await supabase
              .from('inventory')
              .update({
                quantity: existingInventory.quantity + item.quantity,
                updated_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingInventory.id);

            if (updateError) throw updateError;
            continue;
          }
        }

        // Insert new inventory record
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            product_id: item.product_id,
            location_id: locationId,
            quantity: item.quantity,
            lot_number: lotNumber,
            expiry_date: expiryDates[item.id] || null,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Mark order as completed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast.success('Order completed successfully');
      onSuccess();
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Error completing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`${
        currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <CardHeader>
        <CardTitle>Assign Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium">
                    {item.product?.name} ({item.product?.sku})
                  </h3>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="w-64">
                  <Select
                    value={selectedLocations[item.id] || ''}
                    onChange={(e) => handleLocationChange(item.id, e.target.value)}
                    disabled={loading}
                    options={[
                      { value: '', label: 'Select location' },
                      ...locations
                        .filter((loc) => loc.available_capacity >= item.quantity)
                        .map((loc) => ({
                          value: loc.id,
                          label: `${loc.zone}-${loc.aisle}-${loc.rack}-${loc.bin} (${loc.available_capacity} available)`
                        }))
                    ]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lot Number (Optional)
                  </label>
                  <Input
                    type="text"
                    value={lotNumbers[item.id] || ''}
                    onChange={(e) => handleLotNumberChange(item.id, e.target.value)}
                    disabled={loading}
                    placeholder="Enter lot number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={expiryDates[item.id] || ''}
                    onChange={(e) => handleExpiryDateChange(item.id, e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} isLoading={loading}>
              Complete Order
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignLocations; 