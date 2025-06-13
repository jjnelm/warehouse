import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PickList } from '../../types';
import { formatDate } from '../../lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

export default function PickLists() {
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { currentTheme } = useTheme();

  useEffect(() => {
    fetchPickLists();
  }, []);

  const fetchPickLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pick_lists')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            customer:customers(name)
          ),
          assigned_to_user:profiles!pick_lists_assigned_to_fkey(email),
          created_by_user:profiles!pick_lists_created_by_fkey(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPickLists(data);
    } catch (error) {
      console.error('Error fetching pick lists:', error);
      toast.error('Error loading pick lists');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return currentTheme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return currentTheme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'completed':
        return currentTheme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'cancelled':
        return currentTheme === 'dark' ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      default:
        return currentTheme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPickLists = pickLists.filter(pickList => {
    const matchesSearch = 
      pickList.pick_list_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickList.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickList.order?.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pickList.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`container mx-auto px-4 py-8 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pick Lists</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search pick lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${
              currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`w-full ${
            currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
        />
      </div>

      {/* Pick Lists Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pick List #</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPickLists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No pick lists found
                </TableCell>
              </TableRow>
            ) : (
              filteredPickLists.map((pickList) => (
                <TableRow key={pickList.id}>
                  <TableCell>{pickList.pick_list_number}</TableCell>
                  <TableCell>{pickList.order?.order_number}</TableCell>
                  <TableCell>{pickList.order?.customer?.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pickList.status)}`}>
                      {pickList.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{pickList.assigned_to_user?.email || '-'}</TableCell>
                  <TableCell>{formatDate(pickList.created_at)}</TableCell>
                  <TableCell>
                    <Link to={`/pick-lists/${pickList.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 