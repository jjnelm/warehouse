import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer } from '../types/customer';
import { supabase } from '../lib/supabase';
import CustomerCreditLimits from '../components/customer/CustomerCreditLimits';
import OrderHistory from '../components/customer/OrderHistory';
import CustomerPricing from '../components/customer/CustomerPricing';
import CustomerAnalytics from '../components/customer/CustomerAnalytics';

export default function CustomerManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('credit');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (id) {
      console.log('CustomerManagement - URL ID changed:', {
        newId: id,
        currentCustomerId: customer?.id,
        timestamp: new Date().toISOString()
      });
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    if (!id) {
      console.error('No customer ID provided');
      return;
    }

    try {
      console.log('Fetching customer data:', {
        requestedId: id,
        currentCustomerId: customer?.id,
        timestamp: new Date().toISOString()
      });
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching customer:', {
          error: fetchError,
          requestedId: id
        });
        throw fetchError;
      }
      
      if (!data) {
        console.error('Customer not found:', {
          requestedId: id
        });
        throw new Error('Customer not found');
      }

      console.log('Fetched customer data:', {
        customerId: data.id,
        customerName: data.name,
        creditLimit: data.credit_limit,
        timestamp: new Date().toISOString()
      });
      setCustomer(data);
    } catch (err) {
      console.error('Error in fetchCustomer:', {
        error: err,
        requestedId: id
      });
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerUpdate = async () => {
    console.log('Handling customer update:', {
      customerId: customer?.id,
      customerName: customer?.name,
      timestamp: new Date().toISOString()
    });
    await fetchCustomer();
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'credit', label: 'Credit Limits' },
    { id: 'orders', label: 'Order History' },
    { id: 'pricing', label: 'Customer Pricing' },
    { id: 'analytics', label: 'Analytics' },
  ];

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading customer data...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-sm text-red-700">{error || 'Customer not found'}</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{customer?.name}</h1>
        <p className="text-gray-600">{customer?.email}</p>
        <p className="text-sm text-gray-500">Customer ID: {customer?.id}</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'credit' && customer && (
          <CustomerCreditLimits 
            key={`${customer.id}-${refreshKey}`}
            customer={customer} 
            onUpdate={handleCustomerUpdate} 
          />
        )}
        {activeTab === 'orders' && <OrderHistory customerId={customer?.id} />}
        {activeTab === 'pricing' && <CustomerPricing customerId={customer?.id} />}
        {activeTab === 'analytics' && <CustomerAnalytics customerId={customer?.id} />}
      </div>
    </div>
  );
} 