import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Eye,
  X,
  PackageCheck,
  TruckIcon
} from 'lucide-react';
import Button from '../Button';
import socketManager from '../../utils/socket';
import ConfirmationModal from '../model/ConfirmationModel';
import Loading from '../Loading';
import { toastService } from '../../services/toastService';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const statusConfig = {
    pending: {
      icon: <Clock className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Pending',
      canCancel: true,
      statusLine: 'Your order is being processed'
    },
    processing: {
      icon: <Package className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Processing',
      canCancel: true,
      statusLine: 'Your order is being prepared for dispatch'
    },
    shipped: {
      icon: <TruckIcon className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      label: 'Shipped',
      canCancel: false,
      statusLine: 'Your order is out for delivery'
    },
    delivered: {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Delivered',
      canCancel: false,
      statusLine: 'Your order has been delivered successfully'
    },
    cancelled: {
      icon: <XCircle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Cancelled',
      canCancel: false,
      statusLine: 'Your order has been cancelled'
    }
  };

  const paymentMethodConfig = {
    cod: { label: 'Cash on Delivery', icon: <Truck className="w-4 h-4" /> },
    card: { label: 'Credit/Debit Card', icon: <CreditCard className="w-4 h-4" /> },
    upi: { label: 'UPI Payment', icon: <CreditCard className="w-4 h-4" /> },
    wallet: { label: 'Digital Wallet', icon: <CreditCard className="w-4 h-4" /> }
  };

  // Safely get product name
  const getProductName = (item) => {
    if (!item || !item.productId) return 'Unknown Product';
    if (typeof item.productId === 'object' && item.productId.name) {
      return item.productId.name;
    }
    return `Product #${item.productId?.toString().slice(-6) || 'N/A'}`;
  };

  // Check if current user can update this order
  const canUpdateOrder = (order) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return order.items.some(item =>
      item.productId?.owner?._id?.toString() === user._id
    );
  };

  useEffect(() => {
    if (user?._id) {
      fetchOrders();
    }

    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }
    };

    const handleOrderDeleted = ({ id }) => {
      setOrders(prev => prev.filter(o => o._id !== id));
      if (selectedOrder?._id === id) {
        setSelectedOrder(null);
        setShowOrderDetails(false);
      }
    };

    socketManager.on('orderUpdated', handleOrderUpdated);
    socketManager.on('orderDeleted', handleOrderDeleted);

    return () => {
      socketManager.off('orderUpdated', handleOrderUpdated);
      socketManager.off('orderDeleted', handleOrderDeleted);
    };
  }, [user?._id]);

  const fetchOrders = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.getAllOrders(user._id);
      const sorted = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    try {
      setLoading(true);
      await orderService.cancelOrder(cancellingOrderId);
      toastService.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancellingOrderId(null);
      await fetchOrders();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await orderService.updateOrder(orderId, { status: newStatus });
      toastService.success('Order status updated!');
      await fetchOrders();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
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

  const formatPrice = (price) => {
    const num = Number(price) * 83;
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  };

  if (loading && orders.length === 0) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 mt-[10vh]"
    >
      <div className="max-w-6xl mx-auto pt-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-4 mb-8">
          <Button to="/" primary={false} className="p-3 border rounded-xl hover:bg-gray-100" icon={<ArrowLeft />} />
          <div className="p-3 bg-black rounded-2xl">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h3>
            <p className="text-gray-600 mb-8">Start shopping to see your orders here</p>
            <Button to="/">Continue Shopping</Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map(order => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const payment = paymentMethodConfig[order.paymentMethod] || { label: order.paymentMethod, icon: <CreditCard /> };

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${status.bgColor} ${status.borderColor} border`}>
                            <div className={status.color}>{status.icon}</div>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">Order #{order._id.slice(-8)}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${status.bgColor} ${status.color} border ${status.borderColor}`}>
                            {status.label}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">₹{formatPrice(order.totalAmount)}</p>
                            <p className="text-sm text-gray-600 flex items-center justify-end gap-1 mt-1">
                              {payment.icon} {payment.label}
                            </p>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl ${status.bgColor} ${status.borderColor} border mb-5`}
                      >
                        <p className={`text-sm font-medium ${status.color} flex items-center gap-2`}>
                          {status.icon} {status.statusLine}
                        </p>
                      </motion.div>

                      <div className="mb-5">
                        <p className="text-sm font-medium text-gray-700 mb-3">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                        <div className="flex flex-wrap gap-3">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-sm">
                              <span className="font-medium">{getProductName(item)}</span>
                              <span className="text-gray-500"> × {item.quantity}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
                              +{order.items.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      {order.shippingAddress && (
                        <div className="mb-5 p-4 bg-gray-50 rounded-xl border">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">Delivery Address</p>
                              <p className="text-sm text-gray-700">{order.shippingAddress.street}</p>
                              <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="flex-1"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {status.canCancel && (
                          <Button
                            onClick={() => {
                              setCancellingOrderId(order._id);
                              setShowCancelModal(true);
                            }}
                            variant="danger"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOrderDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <button onClick={() => setShowOrderDetails(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-5 bg-gray-50 rounded-2xl">
                  <div><p className="text-sm text-gray-600">Order ID</p><p className="font-bold">#{selectedOrder._id.slice(-8)}</p></div>
                  <div><p className="text-sm text-gray-600">Date</p><p className="font-bold">{formatDate(selectedOrder.createdAt)}</p></div>
                  <div><p className="text-sm text-gray-600">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={statusConfig[selectedOrder.status]?.color}>
                        {statusConfig[selectedOrder.status]?.icon}
                      </div>
                      <span className="font-bold">{statusConfig[selectedOrder.status]?.label}</span>
                    </div>
                  </div>
                  <div><p className="text-sm text-gray-600">Total</p><p className="font-bold text-xl">₹{formatPrice(selectedOrder.totalAmount)}</p></div>
                </div>

                {/* Admin / Owner Status Update */}
                {canUpdateOrder(selectedOrder) && (
                  <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-3">Update Order Status (Admin/Owner)</p>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                      disabled={loading}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Items Ordered</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-lg border">
                            <PackageCheck className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{getProductName(item)}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-bold">₹{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="text-lg font-bold mb-4">Delivery Address</h3>
                    <div className="p-5 bg-gray-50 rounded-2xl border">
                      <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-gray-600 mt-1" />
                        <div>
                          <p className="font-semibold">{selectedOrder.shippingAddress.street}</p>
                          <p className="text-gray-700">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                          <p className="text-gray-600">PIN: {selectedOrder.shippingAddress.postalCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This cannot be undone."
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep It"
        loading={loading}
        variant="danger"
      />
    </motion.div>
  );
};

export default OrderHistory;