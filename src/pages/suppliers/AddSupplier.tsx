import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';

interface AddSupplierForm {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

export default function AddSupplier() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AddSupplierForm>();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Authentication error. Please sign in again.');
      navigate('/login');
    }
  };

  const onSubmit = async (data: AddSupplierForm) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add a supplier');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: data.name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Supplier added successfully');
      navigate('/suppliers');
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Error adding supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium">Please sign in to continue</h2>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Supplier Name"
                placeholder="Enter supplier name"
                error={errors.name?.message}
                {...register('name', { required: 'Supplier name is required' })}
              />
              <Input
                label="Contact Person"
                placeholder="Enter contact person name"
                error={errors.contact_name?.message}
                {...register('contact_name', { required: 'Contact person is required' })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter email address"
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="Enter phone number"
                error={errors.phone?.message}
                {...register('phone', { required: 'Phone number is required' })}
              />
              <div className="col-span-2">
                <Input
                  label="Address"
                  placeholder="Enter address"
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Notes"
                  placeholder="Enter any additional notes"
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/suppliers')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Supplier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}