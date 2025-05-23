import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, QrCode, Edit, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WarehouseLocation } from '../../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

const Locations = () => {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentTheme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data: locationsData, error: locationsError } = await supabase
        .from('warehouse_locations')
        .select('*')
        .order('zone, aisle, rack, bin');

      if (locationsError) throw locationsError;

      // Get current inventory for each location
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          location_id, 
          quantity,
          updated_at,
          updated_by_user:updated_by (
            email
          )
        `);

      if (inventoryError) throw inventoryError;

      // Calculate current usage and get last movement for each location
      const locationsWithUsage = locationsData.map((location) => {
        const locationInventory = inventoryData.filter((inv) => inv.location_id === location.id);
        const currentUsage = locationInventory.reduce((sum, inv) => sum + inv.quantity, 0);
        
        // Get the most recent update from any inventory item in this location
        const lastMovement = locationInventory.length > 0 
          ? locationInventory.reduce((latest, inv) => {
              const latestDate = new Date(latest.updated_at);
              const currentDate = new Date(inv.updated_at);
              return currentDate > latestDate ? inv : latest;
            }, locationInventory[0])
          : null;

        return {
          ...location,
          current_usage: currentUsage,
          last_movement: lastMovement ? {
            date: lastMovement.updated_at,
            user: lastMovement.updated_by_user?.[0]?.email || 'System'
          } : null
        };
      });

      setLocations(locationsWithUsage);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    try {
      setIsProcessing(true);

      // Check if user has admin role
      if (userRole !== 'admin') {
        toast.error('Only administrators can delete locations');
        return;
      }

      // Check if location has any inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id')
        .eq('location_id', selectedLocation.id);

      if (inventoryError) throw inventoryError;

      if (inventoryData && inventoryData.length > 0) {
        toast.error('Cannot delete location with existing inventory');
        return;
      }

      // Delete the location from the database
      const { error: deleteError } = await supabase
        .from('warehouse_locations')
        .delete()
        .match({ id: selectedLocation.id });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Remove the deleted location from the state
      setLocations(prevLocations => 
        prevLocations.filter(loc => loc.id !== selectedLocation.id)
      );

      toast.success('Location deleted successfully');
      setDeleteModalOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    } finally {
      setIsProcessing(false);
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
                <TableHead>Location Code</TableHead>
                <TableHead>Zone/Area</TableHead>
                <TableHead>Location Type</TableHead>
                <TableHead>Max Capacity</TableHead>
                <TableHead>Current Usage</TableHead>
                <TableHead>Capacity Status</TableHead>
                <TableHead>Last Movement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
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
                    <TableCell>{location.zone}</TableCell>
                    <TableCell>{location.location_type || 'Standard'}</TableCell>
                    <TableCell>{location.capacity}</TableCell>
                    <TableCell>{location.current_usage || 0}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          location.current_usage > location.capacity
                            ? currentTheme === 'dark'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-red-100 text-red-800'
                            : currentTheme === 'dark'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {location.current_usage > location.capacity
                          ? 'Over Stock'
                          : 'Available'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {location.last_movement ? (
                        <>
                          {formatDate(location.last_movement.date)}
                          <br />
                          {location.last_movement.user}
                        </>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/locations/${location.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Link to={`/locations/${location.id}/qr`}>
                          <Button variant="outline" size="sm">
                            <QrCode className="mr-2 h-4 w-4" />
                            View QR
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location);
                            setDeleteModalOpen(true);
                          }}
                          disabled={location.current_usage > 0}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Location"
        description={`Are you sure you want to delete location ${selectedLocation?.zone}-${selectedLocation?.aisle}-${selectedLocation?.rack}-${selectedLocation?.bin}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Locations;