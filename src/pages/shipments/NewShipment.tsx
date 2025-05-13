import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  minimum_stock: number;
  current_stock?: number;
}

export default function NewShipment() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; quantity: number; unit_price: number }[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          description,
          unit_price,
          minimum_stock,
          category_id,
          image_url,
          archived,
          inventory!left (
            quantity
          )
        `)
        .eq('archived', false)
        .order('name');

      if (error) throw error;
      
      // Transform the data to include current_stock
      const transformedData = data?.map(product => {
        // Sum up quantities from all inventory locations
        const totalStock = product.inventory?.reduce((sum: number, inv: { quantity: number }) => {
          return sum + (inv.quantity || 0);
        }, 0) || 0;

        return {
          ...product,
          current_stock: totalStock
        };
      }) || [];
      
      setProducts(transformedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const generateOrderNumber = () => {
    const prefix = 'SH';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      const orderNumber = generateOrderNumber();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: selectedCustomer,
          order_type: 'outbound',
          status: 'pending',
          shipping_status: 'pending',
          tracking_number: trackingNumber,
          shipping_method: shippingMethod,
          carrier: carrier,
          estimated_delivery: estimatedDelivery || null,
          shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
          notes: notes || null,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const orderItems = selectedProducts.map(product => ({
        order_id: order.id,
        product_id: product.id,
        quantity: product.quantity,
        unit_price: product.unit_price,
        subtotal: product.quantity * product.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Shipment created successfully');
      navigate('/shipments');
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: 'id' | 'quantity' | 'unit_price', value: string | number) => {
    const newProducts = [...selectedProducts];
    if (field === 'id') {
      const product = products.find(p => p.id === value);
      newProducts[index] = {
        ...newProducts[index],
        id: value as string,
        unit_price: product?.unit_price || 0
      };
    } else if (field === 'quantity') {
      const product = products.find(p => p.id === newProducts[index].id);
      const requestedQuantity = Number(value);
      
      if (product && requestedQuantity > (product.current_stock || 0)) {
        toast.error(`Cannot order more than available stock (${product.current_stock} units)`);
        return;
      }
      
      newProducts[index] = {
        ...newProducts[index],
        quantity: requestedQuantity
      };
    } else {
      newProducts[index] = {
        ...newProducts[index],
        [field]: Number(value)
      };
    }
    setSelectedProducts(newProducts);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Create New Shipment</h1>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              fetchCustomers();
              fetchProducts();
            }}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/shipments')}
          >
            Cancel
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className={currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Shipment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Customer <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  options={customers.map(customer => ({
                    value: customer.id,
                    label: `${customer.name} (${customer.email})`
                  }))}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Shipping Method
                </label>
                <Input
                  type="text"
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  placeholder="e.g., Standard, Express"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Carrier
                </label>
                <Input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g., UPS, FedEx"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tracking Number
                </label>
                <Input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Estimated Delivery
                </label>
                <Input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Shipping Cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Shipment Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProducts.map((product, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Product <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={product.id}
                      onChange={(e) => updateProduct(index, 'id', e.target.value)}
                      options={products.map(p => ({
                        value: p.id,
                        label: `${p.name} (${p.sku}) - Stock: ${p.current_stock} - Price: $${p.unit_price}`
                      }))}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Unit Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.unit_price}
                      onChange={(e) => updateProduct(index, 'unit_price', e.target.value)}
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeProduct(index)}
                      disabled={selectedProducts.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/shipments')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shipment'}
          </Button>
        </div>
      </form>
    </div>
  );
} 