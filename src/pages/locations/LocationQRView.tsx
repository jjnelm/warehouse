import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AlertTriangle, Package, MapPin, Edit } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

interface LocationInventory {
  id: string;
  quantity: number;
  lot_number?: string;
  expiry_date?: string;
  products: {
    id: string;
    name: string;
    sku: string;
    unit_price: number;
    minimum_stock: number;
    image_url: string | null;
    category: {
      name: string;
    };
  };
}

interface LocationData {
  id: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  capacity: number;
  inventory: LocationInventory[];
}

const LocationQRView = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationId = params.locationId || params.id;
  const isPublicRoute = location.pathname.startsWith('/l/');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTheme: isDarkMode } = useTheme();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!locationId) {
        setError('No location ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('warehouse_locations')
          .select(`
            *,
            inventory:inventory (
              id,
              quantity,
              lot_number,
              expiry_date,
              products:product_id (
                id,
                name,
                sku,
                unit_price,
                minimum_stock,
                image_url,
                category:category_id (
                  name
                )
              )
            )
          `)
          .eq('id', locationId)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Location not found');
          setLoading(false);
          return;
        }

        setLocationData(data);
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError('Failed to load location data');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId]);

  const handleUpdateStock = (inventoryId: string) => {
    if (!user) {
      toast.error('Please sign in to update stock');
      const currentPath = `/inventory/${inventoryId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    navigate(`/inventory/${inventoryId}`);
  };

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

  if (error || !locationData) {
    return (
      <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="mx-auto max-w-3xl">
          <Card className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-medium text-red-500">Error</h2>
                <p className="mt-2">{error || 'Location not found'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create QR code data
  const qrData = {
    l: `${locationData.zone}-${locationData.aisle}-${locationData.rack}-${locationData.bin}`,
    c: locationData.capacity,
    i: locationData.inventory.map(item => ({
      n: item.products?.name || 'Unknown Product',
      s: item.products?.sku || 'N/A',
      q: item.quantity,
      p: item.products?.unit_price || 0,
      c: item.products?.category?.name || 'Uncategorized',
      l: item.lot_number,
      e: item.expiry_date
    }))
  };

  // Create QR code URL
  const qrValue = `${window.location.origin}/l/${locationData.id}`;

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-6xl">
        <Card className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Location Info and QR Code */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Location Information</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                      <p className="mt-1 flex items-center">
                        <MapPin className={`mr-1 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        {`${locationData.zone}-${locationData.aisle}-${locationData.rack}-${locationData.bin}`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capacity</p>
                      <p className="mt-1">{locationData.capacity}</p>
                    </div>
                  </div>
                </div>

                {!isPublicRoute && (
                  <div>
                    <h3 className="text-lg font-medium">QR Code</h3>
                    <div className="mt-4 flex flex-col items-center justify-center">
                      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                        <QRCodeSVG
                          value={qrValue}
                          size={256}
                          level="M"
                          includeMargin={true}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                        Scan this QR code to view location details
                        <br />
                        Works on all devices without login
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Products List */}
              <div>
                <h3 className="text-lg font-medium mb-4">Products in Stock</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {locationData.inventory.length > 0 ? (
                    locationData.inventory.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            {item.products?.image_url ? (
                              <div className="mb-3">
                                <img
                                  src={item.products.image_url}
                                  alt={item.products?.name || 'Product image'}
                                  className="h-32 w-32 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="mb-3 h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Product</p>
                            <p className="mt-1 font-medium">{item.products?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-gray-500">SKU: {item.products?.sku || 'N/A'}</p>
                            <p className="text-sm text-gray-500">Category: {item.products?.category?.name || 'Uncategorized'}</p>
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Details</p>
                            <p className="mt-1">Quantity: {item.quantity}</p>
                            <p className="mt-1">Price: {formatCurrency(item.products?.unit_price || 0)}</p>
                            {item.lot_number && (
                              <p className="mt-1">Lot: {item.lot_number}</p>
                            )}
                            {item.expiry_date && (
                              <p className="mt-1">Expires: {new Date(item.expiry_date).toLocaleDateString()}</p>
                            )}
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-4 w-4" />}
                                onClick={() => handleUpdateStock(item.id)}
                              >
                                Update Stock
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No products in this location
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationQRView; 