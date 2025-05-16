import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AlertTriangle, Package, MapPin, Calendar, Hash } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface ProductData {
  sku: string;
  name: string;
  description: string;
  category: {
    name: string;
  };
  unit_price: number;
  minimum_stock: number;
  archived: boolean;
  created_at: string;
  inventory: Array<{
    quantity: number;
    lot_number?: string;
    expiry_date?: string;
    warehouse_locations: {
      zone: string;
      aisle: string;
      rack: string;
      bin: string;
    };
  }>;
}

const ProductQRView = () => {
  const { sku } = useParams();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check system theme preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', handleThemeChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!sku) {
        setError('No product SKU provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories (
              name
            ),
            inventory:inventory (
              quantity,
              lot_number,
              expiry_date,
              warehouse_locations:location_id (
                zone,
                aisle,
                rack,
                bin
              )
            )
          `)
          .eq('sku', sku)
          .single();

        if (error) throw error;
        setProductData(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to fetch product data');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [sku]);

  if (loading) {
    return (
      <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="mx-auto max-w-3xl">
          <Card className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="mx-auto max-w-3xl">
          <Card className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-red-600">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <p className="text-lg font-medium">{error || 'Product not found'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalStock = productData.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const isLowStock = totalStock <= productData.minimum_stock;

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{productData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU</p>
                  <p className="mt-1">{productData.sku}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
                  <p className="mt-1">{productData.category?.name}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit Price</p>
                  <p className="mt-1">{formatCurrency(productData.unit_price)}</p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        productData.archived
                          ? isDarkMode
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-800'
                          : isDarkMode
                          ? 'bg-green-900 text-green-300'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {productData.archived ? 'Archived' : 'Active'}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                <p className="mt-1">{productData.description || 'No description available'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Stock</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={isLowStock ? 'text-red-500' : isDarkMode ? 'text-green-400' : 'text-green-600'}>
                      {totalStock}
                    </span>
                    {isLowStock && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isDarkMode
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Minimum Stock</p>
                  <p className="mt-1">{productData.minimum_stock}</p>
                </div>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inventory Locations</p>
                <div className="mt-2 space-y-3">
                  {productData.inventory.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                          <p className="mt-1 flex items-center">
                            <MapPin className={`mr-1 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            {item.warehouse_locations
                              ? `${item.warehouse_locations.zone}-${item.warehouse_locations.aisle}-${item.warehouse_locations.rack}-${item.warehouse_locations.bin}`
                              : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity</p>
                          <p className="mt-1 flex items-center">
                            <Package className={`mr-1 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            {item.quantity}
                          </p>
                        </div>
                        {item.lot_number && (
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lot Number</p>
                            <p className="mt-1 flex items-center">
                              <Hash className={`mr-1 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              {item.lot_number}
                            </p>
                          </div>
                        )}
                        {item.expiry_date && (
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Expiry Date</p>
                            <p className="mt-1 flex items-center">
                              <Calendar className={`mr-1 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                              {formatDate(item.expiry_date)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created</p>
                <p className="mt-1">{formatDate(productData.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductQRView; 