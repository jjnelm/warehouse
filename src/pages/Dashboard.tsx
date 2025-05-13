import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  Box, 
  Clipboard, 
  Package, 
  PieChart,
  RefreshCw, 
  Truck 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { DashboardMetrics, Order, Product } from '../types';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useTheme } from '../contexts/ThemeContext'; // Import the theme context

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orderStatusCounts, setOrderStatusCounts] = useState<number[]>([0, 0, 0, 0]); // Pending, Processing, Completed, Cancelled
  const { currentTheme } = useTheme(); // Get the current theme

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Calculate low stock items with inventory join
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(`
          product_id,
          quantity,
          product:product_id(
            id,
            name,
            sku,
            description,
            category_id,
            unit_price,
            image_url,
            minimum_stock,
            archived,
            created_at,
            updated_at,
            category:category_id(name)
          )
        `);

      // Filter low stock items
      const lowStockInventory = inventoryData?.filter(
        (item: any) => item.quantity <= (item.product?.minimum_stock || 0)
      ) || [];

      // Remove duplicates by product ID
      const uniqueLowStockInventory = Array.from(
        new Map(lowStockInventory.map((item: any) => [item.product.id, item])).values()
      ) as any[];

      // Transform low stock products
      const transformedLowStock = uniqueLowStockInventory.map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        description: item.product.description,
        category_id: item.product.category_id,
        category: item.product.category,
        unit_price: item.product.unit_price,
        image_url: item.product.image_url,
        minimum_stock: item.product.minimum_stock,
        archived: item.product.archived,
        created_at: item.product.created_at,
        updated_at: item.product.updated_at,
        current_stock: item.quantity
      }));

      setLowStockProducts(transformedLowStock);

      // Fetch pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch today's completed orders
      const today = new Date().toISOString().split('T')[0];
      const { count: completedOrdersToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', `${today}T00:00:00`)
        .lt('updated_at', `${today}T23:59:59`);

      // Fetch recent orders with proper typing
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_type,
          status,
          supplier_id,
          customer_id,
          expected_arrival,
          notes,
          user_id,
          created_at,
          updated_at,
          supplier:supplier_id(name),
          customer:customer_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Transform orders to ensure unique IDs
      const transformedOrders = (recentOrdersData || []).map((order: any) => ({
        ...order,
        id: `order-${order.id}` // Add prefix to ensure uniqueness
      }));

      setRecentOrders(transformedOrders as unknown as Order[]);

      // Fetch inventory by category
      const { data: categoryInventory } = await supabase
        .from('categories')
        .select(`
          name,
          products!inner(id)
        `);

      const inventoryByCategory = categoryInventory?.map(item => ({
        category: item.name,
        count: (item.products as any[]).length,
      })) || [];

      // Calculate inventory value (simplified)
      const { data: inventoryValue } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product:product_id(unit_price)
        `);

      const totalValue = inventoryValue?.reduce((sum, item: any) => {
        return sum + (item.quantity * (item.product?.unit_price || 0));
      }, 0) || 0;

      // Set metrics
      setMetrics({
        total_products: totalProducts || 0,
        low_stock_items: lowStockInventory.length,
        pending_orders: pendingOrders || 0,
        completed_orders_today: completedOrdersToday || 0,
        inventory_value: totalValue,
        inventory_by_category: inventoryByCategory,
        recent_activity: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            action: 'Product added',
            details: 'New product SKU-12345 was added to inventory',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Order fulfilled',
            details: 'Order #ORD-789 was marked as completed',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'Low stock alert',
            details: 'Product SKU-5678 is below minimum stock level',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatusCounts = async () => {
    try {
      const statuses = ['pending', 'processing', 'completed', 'cancelled'];
      const statusCounts = await Promise.all(
        statuses.map(async (status) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          return count || 0;
        })
      );
      setOrderStatusCounts(statusCounts);
    } catch (error) {
      console.error('Error fetching order status counts:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchOrderStatusCounts();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Chart data for inventory by category
  const categoryChartData = {
    labels: metrics?.inventory_by_category.map(item => item.category) || [],
    datasets: [
      {
        data: metrics?.inventory_by_category.map(item => item.count) || [],
        backgroundColor: [
          '#4338CA', // primary
          '#0E7490', // secondary
          '#F59E0B', // accent
          '#16A34A', // success
          '#EF4444', // error
          '#6B7280', // gray
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for orders by status
  const orderStatusChartData = {
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Orders by Status',
        data: orderStatusCounts,
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)', // pending (amber)
          'rgba(37, 99, 235, 0.7)', // processing (blue)
          'rgba(22, 163, 74, 0.7)', // completed (green)
          'rgba(239, 68, 68, 0.7)', // cancelled (red)
        ],
        borderColor: [
          'rgb(245, 158, 11)',
          'rgb(37, 99, 235)',
          'rgb(22, 163, 74)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div
        className={`flex h-full items-center justify-center ${
          currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        <div className="flex flex-col items-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`animate-fade-in ${
        currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            size="sm"
            icon={<Clipboard className="h-4 w-4" />}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Products
                </p>
                <h3 className="mt-1 text-3xl font-semibold">
                  {metrics?.total_products}
                </h3>
              </div>
              <div className="rounded-full bg-primary-100 p-3 text-primary-600">
                <Box className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center text-sm font-medium text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                12%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Low Stock Items
                </p>
                <h3 className="mt-1 text-3xl font-semibold">
                  {metrics?.low_stock_items}
                </h3>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center text-sm font-medium text-red-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                8%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pending Orders
                </p>
                <h3 className="mt-1 text-3xl font-semibold">
                  {metrics?.pending_orders}
                </h3>
              </div>
              <div className="rounded-full bg-secondary-100 p-3 text-secondary-600">
                <Clipboard className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center text-sm font-medium text-green-600">
                <ArrowDown className="mr-1 h-4 w-4" />
                4%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Inventory Value
                </p>
                <h3 className="mt-1 text-3xl font-semibold">
                  {formatCurrency(metrics?.inventory_value || 0)}
                </h3>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="flex items-center text-sm font-medium text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                7%
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inventory by Category */}
        <Card className="col-span-1 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary-600" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut 
                data={categoryChartData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="col-span-1 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5 text-primary-600" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar 
                data={orderStatusChartData} 
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}  
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="col-span-1 animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clipboard className="mr-2 h-5 w-5 text-primary-600" />
                Recent Orders
              </span>
              <Link to="/orders">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b text-left text-sm font-medium ${
                      currentTheme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <th className="pb-3 pl-4 pr-3">Order #</th>
                    <th className="px-3 pb-3">Type</th>
                    <th className="px-3 pb-3">Status</th>
                    <th className="px-3 pb-3">Date</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    currentTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}
                >
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td
                        className={`whitespace-nowrap py-3 pl-4 pr-3 font-medium ${
                          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        <Link
                          to={`/orders/${order.id}`}
                          className={`hover:${
                            currentTheme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                          }`}
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 capitalize ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {order.order_type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.status === 'pending'
                              ? currentTheme === 'dark'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-yellow-100 text-yellow-800'
                              : order.status === 'processing'
                              ? currentTheme === 'dark'
                                ? 'bg-blue-900 text-blue-300'
                                : 'bg-blue-100 text-blue-800'
                              : order.status === 'completed'
                              ? currentTheme === 'dark'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-green-100 text-green-800'
                              : currentTheme === 'dark'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className={`py-4 text-center ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="col-span-1 animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                Low Stock Items
              </span>
              <Link to="/inventory">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b text-left text-sm font-medium ${
                      currentTheme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <th className="pb-3 pl-4 pr-3">Product</th>
                    <th className="px-3 pb-3">SKU</th>
                    <th className="px-3 pb-3">Category</th>
                    <th className="px-3 pb-3">Stock Level</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    currentTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}
                >
                  {lowStockProducts.map((product) => (
                    <tr key={`low-stock-${product.id}`} className="text-sm">
                      <td
                        className={`whitespace-nowrap py-3 pl-4 pr-3 font-medium ${
                          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        <Link
                          to={`/products/${product.id}`}
                          className={`hover:${
                            currentTheme === 'dark' ? 'text-primary-400' : 'text-primary-600'
                          }`}
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {product.sku}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {product.category?.name}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 ${
                          currentTheme === 'dark' ? 'text-red-400' : 'text-red-600'
                        }`}
                      >
                        <span className="font-medium">
                          {product.current_stock} / {product.minimum_stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className={`py-4 text-center ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        No low stock items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;