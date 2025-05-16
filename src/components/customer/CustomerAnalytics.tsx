import { useState, useEffect } from 'react';
import { CustomerAnalytics as CustomerAnalyticsType } from '../../types/customer';
import { supabase } from '../../lib/supabase';

interface CustomerAnalyticsProps {
  customerId: string;
}

export default function CustomerAnalytics({ customerId }: CustomerAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CustomerAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [customerId]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Calculate analytics
      const totalOrders = data?.length || 0;
      const totalSpent = data?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = data?.[0]?.created_at || null;

      // Calculate order frequency (orders per month)
      const orderDates = data?.map((order) => new Date(order.created_at)) || [];
      const orderFrequency = calculateOrderFrequency(orderDates);

      // Calculate payment history
      const paymentHistory = {
        onTime: data?.filter((order) => order.status === 'completed').length || 0,
        late: data?.filter((order) => order.status === 'pending').length || 0,
        outstanding: data?.filter((order) => order.status === 'cancelled').length || 0,
      };

      setAnalytics({
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrderDate || '',
        orderFrequency,
        paymentHistory,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderFrequency = (dates: Date[]): number => {
    if (dates.length < 2) return 0;

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];

    const monthsDiff =
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (lastDate.getMonth() - firstDate.getMonth());

    return monthsDiff > 0 ? dates.length / monthsDiff : dates.length;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {analytics.totalOrders}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${analytics.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${analytics.averageOrderValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Last Order</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {analytics.lastOrderDate
              ? new Date(analytics.lastOrderDate).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Order Frequency</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {analytics.orderFrequency.toFixed(1)}/month
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Payment History</h3>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">On Time:</span>
              <span className="font-medium text-green-600">
                {analytics.paymentHistory.onTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Late:</span>
              <span className="font-medium text-yellow-600">
                {analytics.paymentHistory.late}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-medium text-red-600">
                {analytics.paymentHistory.outstanding}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2 text-gray-700">
            <li>
              • Customer has placed {analytics.totalOrders} orders with an average value of $
              {analytics.averageOrderValue.toLocaleString()}
            </li>
            <li>
              • Orders approximately {analytics.orderFrequency.toFixed(1)} times per month
            </li>
            <li>
              • Payment reliability: {Math.round(
                (analytics.paymentHistory.onTime / analytics.totalOrders) * 100
              )}% on-time payments
            </li>
            {analytics.lastOrderDate && (
              <li>
                • Last order was placed on{' '}
                {new Date(analytics.lastOrderDate).toLocaleDateString()}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 