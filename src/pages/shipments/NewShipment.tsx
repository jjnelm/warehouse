import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, Package2, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  minimum_stock: number;
  current_stock?: number;
}

interface ShippingMethod {
  value: string;
  label: string;
  defaultCarrier: string;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  { value: 'standard', label: 'Standard Shipping', defaultCarrier: 'UPS' },
  { value: 'express', label: 'Express Shipping', defaultCarrier: 'FedEx' },
  { value: 'overnight', label: 'Overnight Shipping', defaultCarrier: 'DHL' },
  { value: 'freight', label: 'Freight Shipping', defaultCarrier: 'TNT' }
];

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
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [stockWarnings, setStockWarnings] = useState<{ [key: string]: string }>({});
  const [creditWarning, setCreditWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Calculate totals whenever products change
    const newSubtotal = selectedProducts.reduce((sum, product) => {
      return sum + (product.quantity * product.unit_price);
    }, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + (parseFloat(shippingCost) || 0));
  }, [selectedProducts, shippingCost]);

  useEffect(() => {
    // Check credit limit when customer or total changes
    if (selectedCustomer && total > 0) {
      checkCreditLimit();
    }
  }, [selectedCustomer, total]);

  useEffect(() => {
    // Update carrier when shipping method changes
    const method = SHIPPING_METHODS.find(m => m.value === shippingMethod);
    if (method) {
      setCarrier(method.defaultCarrier);
    }
  }, [shippingMethod]);

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, address')
        .order('name');

      if (error) throw error;
      console.log('Fetched customers:', data);
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
      
      const transformedData = data?.map(product => {
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
      toast.error('Failed to fetch products');
    }
  };

  const checkCreditLimit = async () => {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('credit_limit, current_balance')
        .eq('id', selectedCustomer)
        .single();

      if (customerError) throw customerError;

      const availableCredit = customerData.credit_limit - customerData.current_balance;
      const newBalance = customerData.current_balance + total;

      if (newBalance > customerData.credit_limit) {
        setCreditWarning(`Warning: This order will exceed the customer's credit limit. Current balance: $${customerData.current_balance.toLocaleString()}, Credit limit: $${customerData.credit_limit.toLocaleString()}`);
      } else if (newBalance > customerData.credit_limit * 0.8) {
        setCreditWarning(`Warning: This order will use more than 80% of the available credit. Available credit: $${availableCredit.toLocaleString()}`);
      } else {
        setCreditWarning(null);
      }
    } catch (error) {
      console.error('Error checking credit limit:', error);
    }
  };

  const validateForm = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return false;
    }
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return false;
    }
    if (selectedProducts.some(p => !p.id)) {
      toast.error('Please select a product for all items');
      return false;
    }
    if (selectedProducts.some(p => p.quantity <= 0)) {
      toast.error('Please enter valid quantities');
      return false;
    }
    if (Object.keys(stockWarnings).length > 0) {
      toast.error('Please resolve stock warnings before proceeding');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Update customer's credit limit if needed
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('credit_limit, current_balance')
        .eq('id', selectedCustomer)
        .single();

      if (customerError) throw customerError;

      if (customerData && (customerData.current_balance + total) > customerData.credit_limit) {
        // Update credit limit to accommodate the order
        const { error: updateError } = await supabase
          .from('customers')
          .update({ credit_limit: total * 2 }) // Set credit limit to double the order amount
          .eq('id', selectedCustomer);

        if (updateError) throw updateError;
      }

      // Generate order number
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `ORD-${dateStr}-${randomNum}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: 'outbound',
          status: 'pending',
          customer_id: selectedCustomer,
          notes: notes || null,
          user_id: user.id,
          shipping_method: shippingMethod || null,
          carrier: carrier || null,
          tracking_number: trackingNumber || null,
          estimated_delivery: estimatedDelivery || null,
          shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
          shipping_status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Failed to create order');

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

      if (itemsError) {
        // If items insertion fails, delete the order
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        throw itemsError;
      }

      // Update the order with the total amount
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: total
        })
        .eq('id', order.id);

      if (updateError) {
        // If update fails, delete the order and items
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        throw updateError;
      }

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
      
      if (product) {
        if (requestedQuantity > (product.current_stock || 0)) {
          setStockWarnings(prev => ({
            ...prev,
            [product.id]: `Warning: Requested quantity (${requestedQuantity}) exceeds available stock (${product.current_stock})`
          }));
        } else if (requestedQuantity <= 0) {
          setStockWarnings(prev => ({
            ...prev,
            [product.id]: 'Quantity must be greater than 0'
          }));
        } else {
          setStockWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings[product.id];
            return newWarnings;
          });
        }
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

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  console.log('Selected customer:', selectedCustomer);
  console.log('Selected customer data:', selectedCustomerData);
  console.log('All customers:', customers);

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
                {selectedCustomerData?.address && (
                  <p className="mt-2 text-sm text-gray-500">
                    Shipping Address: {selectedCustomerData.address}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Shipping Method
                </label>
                <Select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  options={SHIPPING_METHODS.map(method => ({
                    value: method.value,
                    label: method.label
                  }))}
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
                        label: `${p.name} (${p.sku}) - Stock: ${p.current_stock} - Price: ${formatCurrency(p.unit_price)}`
                      }))}
                    />
                    {stockWarnings[product.id] && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {stockWarnings[product.id]}
                      </p>
                    )}
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

        <Card className={currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Cost:</span>
                <span>{formatCurrency(parseFloat(shippingCost) || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {creditWarning && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-700">{creditWarning}</p>
                </div>
              )}
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
          <Button 
            type="submit" 
            disabled={loading || Object.keys(stockWarnings).length > 0}
          >
            {loading ? (
              <>
                <Package2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                Create Shipment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 