import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  useEffect(() => {
    fetchDashboardOrders();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  const fetchDashboardOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getDashboardOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        sortBy,
        order: sortOrder
      });

      setOrders(response.orders);
      setPagination(response.pagination);
      setStatistics(response.statistics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrder(orderId, { status: newStatus });
      fetchDashboardOrders(); // Refresh data
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !orders.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Dashboard</h1>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-900">Total Revenue</h3>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(statistics.totalRevenue)}
            </p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-900">Total Orders</h3>
            <p className="text-2xl font-bold text-green-700">{statistics.totalOrders}</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
            <p className="text-2xl font-bold text-yellow-700">{statistics.pendingOrders}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-purple-900">Delivered</h3>
            <p className="text-2xl font-bold text-purple-700">{statistics.deliveredOrders}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="createdAt">Date Created</option>
              <option value="totalAmount">Total Amount</option>
              <option value="status">Status</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order._id.slice(-8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.userId?.username || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                    ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
                    ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalCount} total orders)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!pagination.hasPrevious}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDashboard;