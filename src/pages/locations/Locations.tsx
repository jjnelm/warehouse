import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, QrCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WarehouseLocation } from '../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';

const Locations = () => {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTheme } = useTheme();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .order('zone, aisle, rack, bin');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your warehouse and storage locations
          </p>
        </div>
        <Link to="/locations/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No locations</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding a new warehouse or storage location.
                      </p>
                      <Link to="/locations/add" className="mt-6">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Location
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                        {`${location.zone}-${location.aisle}-${location.rack}-${location.bin}`}
                      </div>
                    </TableCell>
                    <TableCell>{location.capacity}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          location.reserved
                            ? currentTheme === 'dark'
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-800'
                            : currentTheme === 'dark'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {location.reserved ? 'Reserved' : 'Available'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/locations/${location.id}/qr`}>
                          <Button variant="outline" size="sm">
                            <QrCode className="mr-2 h-4 w-4" />
                            View QR
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Locations;