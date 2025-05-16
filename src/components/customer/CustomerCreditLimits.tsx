import { useState, useEffect, useCallback } from 'react';
import { Customer } from '../../types/customer';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CustomerCreditLimitsProps {
  customer: Customer;
  onUpdate?: () => void;
}

export default function CustomerCreditLimits({ customer, onUpdate }: CustomerCreditLimitsProps) {
  const [creditLimit, setCreditLimit] = useState(customer.credit_limit || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role on component mount
  useEffect(() => {
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

  // Update local state when customer prop changes
  useEffect(() => {
    const componentId = Math.random().toString(36).substr(2, 9);
    console.log('CustomerCreditLimits - State update:', {
      componentId,
      customerId: customer.id,
      customerName: customer.name,
      creditLimit: customer.credit_limit,
      timestamp: new Date().toISOString(),
      reason: 'Customer prop changed'
    });
    setCreditLimit(customer.credit_limit || 0);
    setIsEditing(false);
  }, [customer.id, customer.credit_limit]);

  const currentBalance = customer.current_balance || 0;
  const availableCredit = creditLimit - currentBalance;

  const handleUpdateCreditLimit = useCallback(async () => {
    if (!userRole) {
      setError('Unable to verify user permissions');
      return;
    }

    if (userRole !== 'admin' && userRole !== 'manager') {
      setError('Only administrators and managers can update credit limits');
      return;
    }

    if (creditLimit < currentBalance) {
      setError('Credit limit cannot be less than current balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const componentId = Math.random().toString(36).substr(2, 9);
      console.log('Starting credit limit update:', {
        componentId,
        customerId: customer.id,
        customerName: customer.name,
        newCreditLimit: creditLimit,
        currentBalance: currentBalance,
        userRole,
        timestamp: new Date().toISOString()
      });

      // First verify the customer exists
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, credit_limit')
        .eq('id', customer.id)
        .single();

      if (customerError) {
        console.error('Error verifying customer:', {
          componentId,
          error: customerError,
          customerId: customer.id
        });
        throw new Error('Failed to verify customer');
      }

      if (!customerData) {
        console.error('Customer not found:', {
          componentId,
          customerId: customer.id
        });
        throw new Error('Customer not found in database');
      }
      
      // Then update the credit limit
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          credit_limit: creditLimit,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (updateError) {
        console.error('Error updating credit limit:', {
          componentId,
          error: updateError,
          customerId: customer.id
        });
        throw updateError;
      }

      // Fetch the updated customer data
      const { data: updatedCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, name, credit_limit, current_balance')
        .eq('id', customer.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated customer:', {
          componentId,
          error: fetchError,
          customerId: customer.id
        });
        throw new Error('Failed to verify credit limit update');
      }

      if (!updatedCustomer) {
        console.error('Updated customer not found:', {
          componentId,
          customerId: customer.id
        });
        throw new Error('Failed to verify credit limit update - customer not found');
      }

      console.log('Update verification:', {
        componentId,
        updatedCustomer,
        customerId: customer.id,
        expectedCreditLimit: creditLimit,
        actualCreditLimit: updatedCustomer.credit_limit
      });

      if (updatedCustomer.credit_limit !== creditLimit) {
        console.error('Credit limit update verification failed:', {
          componentId,
          updatedCustomer,
          expectedCreditLimit: creditLimit,
          actualCreditLimit: updatedCustomer.credit_limit
        });
        throw new Error('Credit limit update verification failed');
      }
      
      // Update local state
      setCreditLimit(updatedCustomer.credit_limit || 0);
      setIsEditing(false);
      
      // Show success message
      toast.success(`Credit limit updated for ${customer.name} to $${creditLimit.toLocaleString()}`);
      
      // Notify parent component to refresh
      if (onUpdate) {
        console.log('Calling onUpdate callback:', {
          componentId,
          customerId: customer.id,
          customerName: customer.name
        });
        await onUpdate();
      }
    } catch (err) {
      console.error('Error in handleUpdateCreditLimit:', {
        error: err,
        customerId: customer.id,
        customerName: customer.name,
        userRole
      });
      setError(err instanceof Error ? err.message : 'Failed to update credit limit');
      toast.error(err instanceof Error ? err.message : 'Failed to update credit limit');
      // Reset to original value on error
      setCreditLimit(customer.credit_limit || 0);
    } finally {
      setLoading(false);
    }
  }, [creditLimit, currentBalance, customer, onUpdate, userRole]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Credit Management</h2>
        {!isEditing && (userRole === 'admin' || userRole === 'manager') && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Edit Credit Limit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Credit Limit</h3>
          {isEditing ? (
            <div className="mt-2">
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min={currentBalance}
              />
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleUpdateCreditLimit}
                  disabled={loading}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setCreditLimit(customer.credit_limit || 0);
                  }}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              ${creditLimit.toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Current Balance</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${currentBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Available Credit</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${availableCredit.toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
} 