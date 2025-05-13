import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Plus, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { formatDate, formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

export default function Shipments() {
  const [shipments, setShipments] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');
  const { currentTheme } = useTheme();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id(name),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            product:product_id(
              id,
              name,
              sku
            )
          )
        `)
        .eq('order_type', 'outbound')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const getShippingStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return currentTheme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return currentTheme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'delivered':
        return currentTheme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'failed':
        return currentTheme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      default:
        return currentTheme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesShippingStatus = shippingStatusFilter === 'all' || shipment.shipping_status === shippingStatusFilter;

    return matchesSearch && matchesStatus && matchesShippingStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <div className="flex space-x-4">
          <Button
            onClick={fetchShipments}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Link to="/shipments/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Shipment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`w-full ${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
        <Select
          value={shippingStatusFilter}
          onChange={(e) => setShippingStatusFilter(e.target.value)}
          className={`w-full ${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
          options={[
            { value: 'all', label: 'All Shipping Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_transit', label: 'In Transit' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: 'Failed' }
          ]}
        />
      </div>

      {/* Shipments Table */}
      <Card className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No shipments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className={`font-medium ${
                          currentTheme === 'dark' ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-500'
                        }`}
                      >
                        {shipment.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{shipment.customer?.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          shipment.status === 'pending'
                            ? currentTheme === 'dark'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-800'
                            : shipment.status === 'processing'
                            ? currentTheme === 'dark'
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-blue-100 text-blue-800'
                            : shipment.status === 'completed'
                            ? currentTheme === 'dark'
                              ? 'bg-green-900 text-green-300'
                              : 'bg-green-100 text-green-800'
                            : currentTheme === 'dark'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {shipment.shipping_status && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getShippingStatusColor(
                            shipment.shipping_status
                          )}`}
                        >
                          {shipment.shipping_status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {shipment.tracking_number ? (
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm">{shipment.tracking_number}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(shipment.created_at)}</TableCell>
                    <TableCell>{formatCurrency(shipment.total_amount || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 