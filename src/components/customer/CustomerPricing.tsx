import { useState, useEffect } from 'react';
import { CustomerPricing as CustomerPricingType } from '../../types/customer';
import { supabase } from '../../lib/supabase';

interface CustomerPricingProps {
  customerId: string;
}

export default function CustomerPricing({ customerId }: CustomerPricingProps) {
  const [pricingRules, setPricingRules] = useState<CustomerPricingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<CustomerPricingType>>({
    product_id: '',
    special_price: 0,
    discount_percentage: 0,
    valid_from: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPricingRules();
  }, [customerId]);

  const fetchPricingRules = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('customer_pricing')
        .select('*')
        .eq('customer_id', customerId)
        .order('valid_from', { ascending: false });

      if (fetchError) throw fetchError;
      setPricingRules(data || []);
    } catch (err) {
      setError('Failed to load pricing rules');
      console.error('Error fetching pricing rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.product_id || !newRule.valid_from) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('customer_pricing')
        .insert([
          {
            customer_id: customerId,
            product_id: newRule.product_id,
            special_price: newRule.special_price,
            discount_percentage: newRule.discount_percentage,
            valid_from: newRule.valid_from,
            valid_to: newRule.valid_to,
          },
        ]);

      if (insertError) throw insertError;

      await fetchPricingRules();
      setIsAdding(false);
      setNewRule({
        product_id: '',
        special_price: 0,
        discount_percentage: 0,
        valid_from: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setError('Failed to add pricing rule');
      console.error('Error adding pricing rule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('customer_pricing')
        .delete()
        .eq('id', ruleId);

      if (deleteError) throw deleteError;

      await fetchPricingRules();
    } catch (err) {
      setError('Failed to delete pricing rule');
      console.error('Error deleting pricing rule:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isAdding) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading pricing rules...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Customer Pricing Rules</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Add Pricing Rule
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Pricing Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product ID</label>
              <input
                type="text"
                value={newRule.product_id}
                onChange={(e) => setNewRule({ ...newRule, product_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Special Price</label>
              <input
                type="number"
                value={newRule.special_price}
                onChange={(e) => setNewRule({ ...newRule, special_price: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
              <input
                type="number"
                value={newRule.discount_percentage}
                onChange={(e) => setNewRule({ ...newRule, discount_percentage: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valid From</label>
              <input
                type="date"
                value={newRule.valid_from}
                onChange={(e) => setNewRule({ ...newRule, valid_from: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valid To</label>
              <input
                type="date"
                value={newRule.valid_to}
                onChange={(e) => setNewRule({ ...newRule, valid_to: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRule}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {pricingRules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pricing rules found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.product_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${rule.special_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rule.valid_from).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.valid_to ? new Date(rule.valid_to).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 