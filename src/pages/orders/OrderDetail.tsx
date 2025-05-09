import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package2, Truck, MapPin, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, ShipmentTracking } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { toast } from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNote, setTrackingNote] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          supplier:suppliers(name),
          customer:customers(name),
          items:order_items(
            *,
            product:products(name, sku)
          ),
          tracking_history:shipment_tracking(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error loading order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;
      toast.success('Order status updated');
      fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const updateShippingStatus = async (status: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ shipping_status: status })
        .eq('id', order.id);

      if (error) throw error;

      // Add tracking history entry
      const { error: trackingError } = await supabase
        .from('shipment_tracking')
        .insert({
          order_id: order.id,
          status,
          notes: trackingNote
        });

      if (trackingError) throw trackingError;

      toast.success('Shipping status updated');
      setTrackingNote('');
      fetchOrder();
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast.error('Error updating shipping status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Package2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-medium">Order not found</h2>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.order_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {order.order_type === 'inbound' ? 'Supplier' : 'Customer'}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.order_type === 'inbound'
                    ? order.supplier?.name
                    : order.customer?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(order.created_at)}</dd>
              </div>
              {order.expected_arrival && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expected Arrival</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(order.expected_arrival)}</dd>
                </div>
              )}
              {order.notes && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Update Status</label>
              <div className="mt-2 flex space-x-2">
                <Select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={updating}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' }
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Carrier</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.carrier || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tracking Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.tracking_number || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Method</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.shipping_method || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Cost</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.shipping_cost ? formatCurrency(order.shipping_cost) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.estimated_delivery ? formatDate(order.estimated_delivery) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.shipping_status || '-'}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Update Shipping Status</label>
              <div className="mt-2 space-y-2">
                <Select
                  value={order.shipping_status || 'pending'}
                  onChange={(e) => updateShippingStatus(e.target.value)}
                  disabled={updating}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_transit', label: 'In Transit' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'failed', label: 'Failed' }
                  ]}
                />
                <Input
                  type="text"
                  placeholder="Add tracking note..."
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  disabled={updating}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product?.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tracking History */}
        {order.tracking_history && order.tracking_history.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  {order.tracking_history.map((tracking, index) => (
                    <li key={tracking.id}>
                      <div className="relative pb-8">
                        {index !== order.tracking_history!.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center ring-8 ring-white">
                              <Truck className="h-5 w-5 text-primary-600" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500 capitalize">
                                {tracking.status}
                                {tracking.location && ` at ${tracking.location}`}
                              </p>
                              {tracking.notes && (
                                <p className="mt-1 text-sm text-gray-900">{tracking.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(tracking.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}