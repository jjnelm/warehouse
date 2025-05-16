import { useState, useEffect } from 'react';
import { CommunicationLog } from '../../types/customer';

interface Props {
  customerId: string;
}

const CommunicationLogs = ({ customerId }: Props) => {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLog, setNewLog] = useState<Partial<CommunicationLog>>({
    type: 'email',
    subject: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // TODO: Implement API call to fetch communication logs
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch communication logs');
        setLoading(false);
      }
    };

    fetchLogs();
  }, [customerId]);

  const handleAddLog = async () => {
    try {
      // TODO: Implement API call to add new communication log
      setIsAddingNew(false);
      setNewLog({
        type: 'email',
        subject: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    } catch (error) {
      console.error('Failed to add communication log:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading communication logs...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Communication Log</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Entry
        </button>
      </div>

      {isAddingNew && (
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Add New Communication Log</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={newLog.type}
                onChange={(e) =>
                  setNewLog({ ...newLog, type: e.target.value as any })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                value={newLog.subject}
                onChange={(e) =>
                  setNewLog({ ...newLog, subject: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                value={newLog.content}
                onChange={(e) =>
                  setNewLog({ ...newLog, content: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={newLog.date}
                onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Follow-up Date
              </label>
              <input
                type="date"
                value={newLog.follow_up_date}
                onChange={(e) =>
                  setNewLog({ ...newLog, follow_up_date: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLog}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No communication logs found</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.type === 'email'
                        ? 'bg-blue-100 text-blue-800'
                        : log.type === 'phone'
                        ? 'bg-green-100 text-green-800'
                        : log.type === 'meeting'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.date).toLocaleDateString()}
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">{log.subject}</h3>
              <p className="text-gray-600 mb-4">{log.content}</p>
              {log.follow_up_date && (
                <div className="text-sm text-gray-500">
                  Follow-up: {new Date(log.follow_up_date).toLocaleDateString()}
                </div>
              )}
              <div className="mt-4 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    // TODO: Implement edit log
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete log
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunicationLogs; 