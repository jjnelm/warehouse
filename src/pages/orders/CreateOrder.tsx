import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Package2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Product, Supplier, Customer } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';

interface CreateOrderForm {
  order_type: 'inbound' | 'outbound';
  supplier_id?: string;
  customer_id?: string;
  expected_arrival?: string;
  notes?: string;
  shipping_method?: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_cost?: number;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface FormOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<FormOrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CreateOrderForm>({
    defaultValues: {
      order_type: 'inbound',
      items: [{ product_id: '', quantity: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading form data');
    }
  };

  const onSubmit = async (data: CreateOrderForm) => {
    try {
      setLoading(true);

      // For outbound orders, check stock availability for all items
      if (data.order_type === 'outbound') {
        for (const item of data.items) {
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('quantity, id')
            .eq('product_id', item.product_id)
            .order('created_at', { ascending: true }); // FIFO order

          if (inventoryError) {
            toast.error('Failed to check stock availability');
            return;
          }

          const availableStock = inventoryData?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
          if (item.quantity > availableStock) {
            const product = products.find(p => p.id === item.product_id);
            toast.error(`Insufficient stock for ${product?.name || 'product'}. Only ${availableStock} units available.`);
            return;
          }
        }
      }

      // Generate order number (format: ORD-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `ORD-${dateStr}-${randomNum}`;

      // Validate supplier/customer based on order type
      if (data.order_type === 'inbound' && !data.supplier_id) {
        toast.error('Supplier is required for inbound orders');
        return;
      }
      if (data.order_type === 'outbound' && !data.customer_id) {
        toast.error('Customer is required for outbound orders');
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: data.order_type,
          supplier_id: data.order_type === 'inbound' ? data.supplier_id : null,
          customer_id: data.order_type === 'outbound' ? data.customer_id : null,
          expected_arrival: data.expected_arrival || null,
          notes: data.notes || null,
          user_id: user.id,
          status: 'pending',
          shipping_status: 'pending',
          shipping_method: data.shipping_method || null,
          carrier: data.carrier || null,
          tracking_number: data.tracking_number || null,
          estimated_delivery: data.estimated_delivery || null,
          shipping_cost: data.shipping_cost || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // For outbound orders, deduct stock from inventory
      if (data.order_type === 'outbound') {
        for (const item of data.items) {
          let remainingQuantity = item.quantity;
          
          // Get inventory items ordered by creation date (FIFO)
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('id, quantity')
            .eq('product_id', item.product_id)
            .order('created_at', { ascending: true });

          if (inventoryError) throw inventoryError;

          // Deduct stock from each inventory item until we've satisfied the order quantity
          for (const inventory of inventoryData || []) {
            if (remainingQuantity <= 0) break;

            const deductionAmount = Math.min(remainingQuantity, inventory.quantity);
            const newQuantity = inventory.quantity - deductionAmount;

            const { error: updateError } = await supabase
              .from('inventory')
              .update({ quantity: newQuantity })
              .eq('id', inventory.id);

            if (updateError) throw updateError;

            remainingQuantity -= deductionAmount;
          }
        }
      }

      toast.success('Order created successfully');
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error creating order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedProduct || !quantity) return;

    // Check if product already exists in the order
    if (orderItems.some(item => item.product_id === selectedProduct.id)) {
      toast.error('This product is already in the order');
      return;
    }

    // Check available stock from inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', selectedProduct.id);

    if (inventoryError) {
      toast.error('Failed to check stock availability');
      return;
    }

    const availableStock = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} units available for ${selectedProduct.name}`);
      return;
    }

    setOrderItems([...orderItems, {
      product_id: selectedProduct.id,
      quantity: quantity,
      unit_price: selectedProduct.unit_price
    }]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Type
                </label>
                <Select
                  {...register('order_type', { required: 'Order type is required' })}
                  className="mt-1"
                  options={[
                    { value: 'inbound', label: 'Inbound (From Supplier)' },
                    { value: 'outbound', label: 'Outbound (To Customer)' }
                  ]}
                >
                  <option value="inbound">Inbound (From Supplier)</option>
                  <option value="outbound">Outbound (To Customer)</option>
                </Select>
                {errors.order_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.order_type.message}</p>
                )}
              </div>

              {watch('order_type') === 'inbound' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <Select
                    {...register('supplier_id', { 
                      required: watch('order_type') === 'inbound' ? 'Supplier is required' : false 
                    })}
                    className="mt-1"
                    options={suppliers.map(supplier => ({
                      value: supplier.id,
                      label: supplier.name
                    }))}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                  {errors.supplier_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <Select
                    {...register('customer_id', { 
                      required: watch('order_type') === 'outbound' ? 'Customer is required' : false 
                    })}
                    className="mt-1"
                    options={customers.map(customer => ({
                      value: customer.id,
                      label: customer.name
                    }))}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Arrival
                </label>
                <Input
                  type="date"
                  {...register('expected_arrival')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Method
                </label>
                <Input
                  type="text"
                  {...register('shipping_method')}
                  className="mt-1"
                  placeholder="e.g., Standard, Express"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <Input
                  type="text"
                  {...register('carrier')}
                  className="mt-1"
                  placeholder="e.g., UPS, FedEx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tracking Number
                </label>
                <Input
                  type="text"
                  {...register('tracking_number')}
                  className="mt-1"
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Delivery
                </label>
                <Input
                  type="date"
                  {...register('estimated_delivery')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('shipping_cost', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Shipping cost must be positive' }
                  })}
                  className="mt-1"
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <Input
                  type="text"
                  {...register('notes')}
                  className="mt-1"
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product
                    </label>
                    <Select
                      {...register(`items.${index}.product_id`, { required: 'Product is required' })}
                      className="mt-1"
                      options={products.map(product => ({
                        value: product.id,
                        label: product.name
                      }))}
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Select>
                    {errors.items?.[index]?.product_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.product_id?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`items.${index}.quantity`, {
                        required: 'Quantity is required',
                        min: { value: 1, message: 'Quantity must be at least 1' },
                        valueAsNumber: true
                      })}
                      className="mt-1"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Price
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.unit_price`, {
                        required: 'Unit price is required',
                        min: { value: 0, message: 'Unit price must be at least 0' },
                        valueAsNumber: true
                      })}
                      className="mt-1"
                    />
                    {errors.items?.[index]?.unit_price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.unit_price?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}