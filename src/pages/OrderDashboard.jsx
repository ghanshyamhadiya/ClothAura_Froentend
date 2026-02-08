import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useSocket } from '../context/SocketContext';
import { toastService } from '../services/toastService';
import AdminOwnerAnalytics from '../components/Dashboard/AdminOwnerAnalytics';
import Loading from '../components/Loading';
import OrderDetailsModal from '../components/common/OrderDetailsModal';
import OwnerRevenueAnalytics from '../components/Dashboard/OwnerRevenueAnalytics ';

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'analytics'

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    fetchDashboardOrders();
  }, [currentPage, statusFilter]);

  // Real-time order updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewOrder = (data) => {
      // Only add if on first page and no filters
      if (currentPage === 1 && !statusFilter) {
        setOrders(prev => {
          // Check if already exists (to avoid duplicates)
          const exists = prev.some(o => o._id === (data._id || data.order?._id));
          if (exists) return prev;

          const newOrder = data.order || data;
          toastService.info(`New order received: #${newOrder._id.slice(-6).toUpperCase()}`);
          return [newOrder, ...prev].slice(0, 10); // Keep limit
        });
      } else {
        // Just notify if not on first page
        toastService.info('New order received! Check the list.');
      }
    };

    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(order =>
        order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
      ));

      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(prev => ({ ...prev, ...updatedOrder }));
      }
    };

    const handleOrderApprovalRequired = (data) => {
      // For owners, this is equivalent to new order needing action
      if (userRole === 'owner') {
        handleNewOrder(data);
      }
    };

    const handleOrderApproved = (data) => {
      const updatedOrder = { ...data.order, status: 'processing', approvalStatus: 'approved' };
      handleOrderUpdated(updatedOrder);
    };

    const handleOrderRejected = (data) => {
      const updatedOrder = { ...data.order, status: 'cancelled', approvalStatus: 'rejected' };
      handleOrderUpdated(updatedOrder);
    };

    // Listen for admin events
    if (userRole === 'admin') {
      on('orderCreated', handleNewOrder);
    }

    // Listen for owner events
    on('order:approval-required', handleOrderApprovalRequired);

    // Common events
    on('orderUpdated', handleOrderUpdated); // Global update event
    on('order:approved', handleOrderApproved);
    on('order:rejected', handleOrderRejected);

    return () => {
      if (userRole === 'admin') {
        off('orderCreated', handleNewOrder);
      }
      off('order:approval-required', handleOrderApprovalRequired);
      off('orderUpdated', handleOrderUpdated);
      off('order:approved', handleOrderApproved);
      off('order:rejected', handleOrderRejected);
    };
  }, [isConnected, currentPage, statusFilter, userRole, selectedOrder]);

  const fetchDashboardOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getDashboardOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
      });

      setOrders(res.orders);
      setPagination(res.pagination);
      setUserRole(res.role);
      setError(null);
    } catch (err) {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrder(orderId, { status: newStatus });
      // No need to fetch manually, socket will update
      // But for faster UI feedback we can update locally too
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const calculateOwnerOrderTotal = (order) => {
    if (userRole !== 'owner') return order.totalAmount;

    const ownerItemsTotal = order.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    if (order.coupon?.discountAmount && order.subtotal > 0) {
      const discountRatio = order.coupon.discountAmount / order.subtotal;
      return Math.round(ownerItemsTotal - ownerItemsTotal * discountRatio);
    }

    return Math.round(ownerItemsTotal);
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-gray-200 text-gray-900',
      shipped: 'bg-gray-300 text-gray-900',
      delivered: 'bg-black text-white',
      cancelled: 'bg-red-50 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-center py-20 text-red-600 text-xl">{error}</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-black mb-8">
              {userRole === 'admin' ? '📊 Admin Dashboard' : '🏪 Owner Dashboard'}
            </h1>

            {/* Tabs - Only for Admin */}
            {userRole === 'admin' && (
              <div className="flex gap-10 border-b-2 border-gray-200">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-2 text-lg font-medium transition-all border-b-4 ${activeTab === 'orders'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-2 text-lg font-medium transition-all border-b-4 ${activeTab === 'analytics'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  Analytics
                </button>
              </div>
            )}

            {/* Owner Tabs */}
            {userRole === 'owner' && (
              <div className="flex gap-10 border-b-2 border-gray-200">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-2 text-lg font-medium transition-all border-b-4 ${activeTab === 'orders'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-2 text-lg font-medium transition-all border-b-4 ${activeTab === 'analytics'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  Revenue Analytics
                </button>
              </div>
            )}
          </div>

          {/* Content Based on Role & Tab */}
          {userRole === 'admin' ? (
            <>
              {activeTab === 'analytics' ? (
                <AdminOwnerAnalytics />
              ) : (
                <OrdersSection
                  orders={orders}
                  pagination={pagination}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onViewDetails={(order) => {
                    setSelectedOrder(order);
                    setShowDetailsModal(true);
                  }}
                  onStatusChange={handleStatusChange}
                  calculateOwnerOrderTotal={calculateOwnerOrderTotal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusStyle={getStatusStyle}
                />
              )}
            </>
          ) : (
            /* Owner View */
            <>
              {activeTab === 'analytics' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <OwnerRevenueAnalytics />
                </motion.div>
              ) : (
                <OrdersSection
                  orders={orders}
                  pagination={pagination}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onViewDetails={(order) => {
                    setSelectedOrder(order);
                    setShowDetailsModal(true);
                  }}
                  onStatusChange={handleStatusChange}
                  calculateOwnerOrderTotal={calculateOwnerOrderTotal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusStyle={getStatusStyle}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal - Available for both Admin & Owner */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        userRole={userRole}
        calculateOwnerOrderTotal={calculateOwnerOrderTotal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />
    </>
  );
};

/* Reusable Orders Table Section */
const OrdersSection = ({
  orders,
  pagination,
  currentPage,
  setCurrentPage,
  onViewDetails,
  onStatusChange,
  calculateOwnerOrderTotal,
  formatCurrency,
  formatDate,
  getStatusStyle,
}) => (
  <>
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-8 py-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <motion.tr
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-all duration-200"
              >
                <td className="px-8 py-6 font-mono text-sm text-gray-900">
                  #{order._id.slice(-8).toUpperCase()}
                </td>
                <td className="px-8 py-6 text-sm font-medium text-black">
                  {order.userId?.username || '—'}
                </td>
                <td className="px-8 py-6 text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-8 py-6 text-sm font-bold text-black">
                  {formatCurrency(calculateOwnerOrderTotal(order))}
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => onViewDetails(order)}
                      className="text-gray-600 hover:text-black transition-colors"
                      aria-label="View order details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-black transition-all"
                    >
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Pagination */}
    {pagination.totalPages > 1 && (
      <div className="flex justify-center items-center gap-8 mt-12">
        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={!pagination.hasPrevious}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <span className="text-lg font-medium">
          Page {currentPage} of {pagination.totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={!pagination.hasNext}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )}
  </>
);

export default OrderDashboard;