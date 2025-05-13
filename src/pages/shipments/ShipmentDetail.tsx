import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatDate, formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNote, setTrackingNote] = useState('');
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (id) {
      fetchShipment();
    }
  }, [id]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id(
            id,
            name,
            contact_name,
            email,
            phone,
            address
          ),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            product:product_id(
              id,
              name,
              sku,
              description
            )
          )
        `)
        .eq('id', id)
        .eq('order_type', 'outbound')
        .single();

      if (error) throw error;
      setShipment(data);
    } catch (error) {
      toast.error('Failed to fetch shipment details');
    } finally {
      setLoading(false);
    }
  };

  const updateShipmentStatus = async (status: string) => {
    if (!shipment) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', shipment.id);

      if (error) throw error;
      toast.success('Shipment status updated');
      fetchShipment();
    } catch (error) {
      toast.error('Error updating shipment status');
    } finally {
      setUpdating(false);
    }
  };

  const updateShippingStatus = async (status: string) => {
    if (!shipment) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ shipping_status: status })
        .eq('id', shipment.id);

      if (error) throw error;

      // Add tracking history entry
      const { error: trackingError } = await supabase
        .from('shipment_tracking')
        .insert({
          order_id: shipment.id,
          status,
          notes: trackingNote
        });

      if (trackingError) throw trackingError;

      toast.success('Shipping status updated');
      setTrackingNote('');
      fetchShipment();
    } catch (error) {
      toast.error('Error updating shipping status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex h-full items-center justify-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <Package2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div
        className={`text-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <h2 className="text-lg font-medium">Shipment not found</h2>
        <Link
          to="/shipments"
          className={`font-medium ${
            currentTheme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
          }`}
        >
          Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipment {shipment.order_number}</h1>
          <p className="text-gray-500">Created on {formatDate(shipment.created_at)}</p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={fetchShipment}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={updating}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipment Details */}
        <Card
          className={`${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{shipment.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.customer?.name}</dd>
              </div>
              {shipment.notes && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{shipment.notes}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Update Status</label>
              <div className="mt-2 flex space-x-2">
                <Select
                  value={shipment.status}
                  onChange={(e) => updateShipmentStatus(e.target.value)}
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
        <Card
          className={`${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Carrier</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.carrier || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tracking Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.tracking_number || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Method</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.shipping_method || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Cost</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.shipping_cost ? formatCurrency(shipment.shipping_cost) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Shipping Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{shipment.shipping_status || '-'}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Update Shipping Status</label>
              <div className="mt-2 space-y-2">
                <Select
                  value={shipment.shipping_status || 'pending'}
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

        {/* Shipment Items */}
        <Card
          className={`md:col-span-2 ${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <CardHeader>
            <CardTitle>Items</CardTitle>
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
                  {shipment.items?.map((item) => (
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
                      {formatCurrency(shipment.total_amount || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 