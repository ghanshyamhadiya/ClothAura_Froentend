import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  TruckIcon,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  MapPin,
  ArrowLeft,
  X,
  AlertCircle,
  Search,
  ShoppingBag,
  IndianRupee,
  Eye,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Box,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { toastService } from '../../services/toastService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Loading from '../Loading';
import Button from '../Button';

// Real-time connection indicator component
const RealTimeIndicator = ({ isConnected }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isConnected
      ? 'bg-green-100 text-green-700 border border-green-200'
      : 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}
  >
    {isConnected ? (
      <>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Wifi className="w-4 h-4" />
        </motion.div>
        <span>Live Updates</span>
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </>
    ) : (
      <>
        <WifiOff className="w-4 h-4" />
        <span>Offline</span>
      </>
    )}
  </motion.div>
);

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { user } = useAuth();
  const { on, off, isConnected } = useSocket();

  // Real-time animation states
  const [recentlyUpdatedOrders, setRecentlyUpdatedOrders] = useState(new Set());
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [statusChangeAnimation, setStatusChangeAnimation] = useState({});
  const updateTimeoutRef = useRef({});

  // Analytics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    totalSpent: 0
  });

  // Helper to mark order as recently updated with auto-clear
  const markOrderAsUpdated = useCallback((orderId, isNew = false) => {
    if (isNew) {
      setNewOrderIds(prev => new Set([...prev, orderId]));
    } else {
      setRecentlyUpdatedOrders(prev => new Set([...prev, orderId]));
    }

    // Clear the highlight after animation completes
    if (updateTimeoutRef.current[orderId]) {
      clearTimeout(updateTimeoutRef.current[orderId]);
    }

    updateTimeoutRef.current[orderId] = setTimeout(() => {
      setRecentlyUpdatedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      setNewOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }, 5000); // 5 seconds highlight duration
  }, []);

  // Trigger status change animation
  const triggerStatusAnimation = useCallback((orderId, newStatus) => {
    setStatusChangeAnimation(prev => ({ ...prev, [orderId]: newStatus }));
    setTimeout(() => {
      setStatusChangeAnimation(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    }, 2000);
  }, []);

  const paymentMethodConfig = {
    cod: { label: 'Cash on Delivery', icon: <Package className="w-4 h-4" /> },
    card: { label: 'Card Payment', icon: <CreditCard className="w-4 h-4" /> },
    upi: { label: 'UPI', icon: <CreditCard className="w-4 h-4" /> },
    wallet: { label: 'Wallet', icon: <CreditCard className="w-4 h-4" /> }
  };

  // Order progress levels configuration
  const orderLevels = [
    {
      key: 'pending',
      label: 'Order Placed',
      icon: <ShoppingBag className="w-5 h-5" />,
      description: 'Order received'
    },
    {
      key: 'processing',
      label: 'Processing',
      icon: <Box className="w-5 h-5" />,
      description: 'Being prepared'
    },
    {
      key: 'shipped',
      label: 'Shipped',
      icon: <TruckIcon className="w-5 h-5" />,
      description: 'Out for delivery'
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: <PackageCheck className="w-5 h-5" />,
      description: 'Completed'
    }
  ];

  const statusConfig = {
    pending: {
      icon: <Clock className="w-5 h-5" />,
      label: 'Pending',
      canCancel: true,
      statusLine: 'Order awaiting confirmation',
      level: 0
    },
    processing: {
      icon: <Package className="w-5 h-5" />,
      label: 'Processing',
      canCancel: true,
      statusLine: 'Being prepared for dispatch',
      level: 1
    },
    shipped: {
      icon: <TruckIcon className="w-5 h-5" />,
      label: 'Shipped',
      canCancel: false,
      statusLine: 'Out for delivery',
      level: 2
    },
    delivered: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Delivered',
      canCancel: false,
      statusLine: 'Successfully delivered',
      level: 3
    },
    cancelled: {
      icon: <XCircle className="w-5 h-5" />,
      label: 'Cancelled',
      canCancel: false,
      statusLine: 'Order cancelled',
      level: -1
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time order updates via socket
  useEffect(() => {
    if (!isConnected) return;

    const handleOrderCreated = (data) => {
      console.log('🆕 New order created:', data.orderId);
      const orderId = data.order?._id || data.orderId;

      // Add new order to the beginning of the list with animation
      setOrders(prev => {
        // Avoid duplicates
        if (prev.some(o => o._id === orderId)) return prev;
        return [data.order, ...prev];
      });

      // Mark as new for animation
      markOrderAsUpdated(orderId, true);

      toastService.success('🎉 Order placed successfully!', {
        icon: '📦'
      });
    };

    const handleOrderUpdated = (updatedOrder) => {
      console.log('📦 Order updated in real-time:', updatedOrder._id);
      const previousOrder = orders.find(o => o._id === updatedOrder._id);

      setOrders(prev => prev.map(order =>
        order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
      ));

      // Trigger animations
      markOrderAsUpdated(updatedOrder._id);
      if (previousOrder && previousOrder.status !== updatedOrder.status) {
        triggerStatusAnimation(updatedOrder._id, updatedOrder.status);
      }

      toastService.info(
        `📦 Order #${updatedOrder._id.slice(-6).toUpperCase()} updated to ${updatedOrder.status}`,
        { autoClose: 4000 }
      );
    };

    const handleOrderApproved = (data) => {
      console.log('✅ Order approved:', data.order._id);
      const orderId = data.order._id;

      setOrders(prev => prev.map(order =>
        order._id === orderId
          ? { ...order, ...data.order, status: 'processing', approvalStatus: 'approved' }
          : order
      ));

      markOrderAsUpdated(orderId);
      triggerStatusAnimation(orderId, 'processing');

      toastService.success('✅ Your order has been approved!', {
        autoClose: 5000
      });
    };

    const handleOrderRejected = (data) => {
      console.log('❌ Order rejected:', data.order._id);
      const orderId = data.order._id;

      setOrders(prev => prev.map(order =>
        order._id === orderId
          ? { ...order, ...data.order, status: 'cancelled', approvalStatus: 'rejected' }
          : order
      ));

      markOrderAsUpdated(orderId);
      triggerStatusAnimation(orderId, 'cancelled');

      toastService.error('❌ Your order was rejected', {
        autoClose: 5000
      });
    };

    const handleOrderStatusUpdated = (data) => {
      console.log('🔄 Order status updated:', data);
      const orderId = data.orderId;

      setOrders(prev => prev.map(order =>
        order._id === orderId ? { ...order, status: data.status } : order
      ));

      markOrderAsUpdated(orderId);
      triggerStatusAnimation(orderId, data.status);

      const statusEmoji = {
        pending: '⏳',
        processing: '🔄',
        shipped: '🚚',
        delivered: '✅',
        cancelled: '❌'
      };

      toastService.info(
        `${statusEmoji[data.status] || '📦'} Order status: ${data.status}`,
        { autoClose: 4000 }
      );
    };

    on('order:created', handleOrderCreated);
    on('orderUpdated', handleOrderUpdated);
    on('order:approved', handleOrderApproved);
    on('order:rejected', handleOrderRejected);
    on('order:status-updated', handleOrderStatusUpdated);

    return () => {
      off('order:created', handleOrderCreated);
      off('orderUpdated', handleOrderUpdated);
      off('order:approved', handleOrderApproved);
      off('order:rejected', handleOrderRejected);
      off('order:status-updated', handleOrderStatusUpdated);
    };
  }, [isConnected, on, off, orders, markOrderAsUpdated, triggerStatusAnimation]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    filterOrders();
    calculateStats(orders);
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders();
      const orderList = response.orders || [];
      setOrders(orderList);
      calculateStats(orderList);
    } catch (err) {
      toastService.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orderList) => {
    const stats = {
      total: orderList.length,
      pending: orderList.filter(o => o.status === 'pending').length,
      delivered: orderList.filter(o => o.status === 'delivered').length,
      totalSpent: orderList.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item =>
          getProductName(item).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
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
    const num = Number(price);
    return Number.isFinite(num) ? num.toLocaleString('en-IN') : '0';
  };

  const getProductName = (item) => {
    return item.productId?.name || 'Product';
  };

  const canCancelOrder = (order) => {
    const status = order.status.toLowerCase();
    return status === 'pending' || status === 'processing';
  };

  if (loading && orders.length === 0) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                to="/"
                primary={false}
                className="p-3 bg-white border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all duration-300"
                icon={<ArrowLeft className="w-5 h-5" />}
              />
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black">
                  Order History
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Track and manage your orders</p>
              </div>
            </div>
            {/* Real-time connection indicator */}
            <RealTimeIndicator isConnected={isConnected} />
          </div>

          {/* Stats Cards - Black & White */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={<ShoppingBag className="w-6 h-6" />}
              label="Total Orders"
              value={stats.total}
              delay={0.1}
            />
            <StatsCard
              icon={<Clock className="w-6 h-6" />}
              label="Pending"
              value={stats.pending}
              delay={0.2}
            />
            <StatsCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Delivered"
              value={stats.delivered}
              delay={0.3}
            />
            <StatsCard
              icon={<IndianRupee className="w-6 h-6" />}
              label="Total Spent"
              value={`₹${formatPrice(stats.totalSpent)}`}
              delay={0.4}
            />
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 py-3.5 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-300 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-gray-200"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-black mb-3">
              {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start shopping to see your orders here'}
            </p>
            {!searchQuery && statusFilter === 'all' && <Button to="/">Start Shopping</Button>}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const payment = paymentMethodConfig[order.paymentMethod] || { label: order.paymentMethod, icon: <CreditCard /> };
                const isExpanded = expandedOrder === order._id;
                const currentLevel = status.level;
                const isNew = newOrderIds.has(order._id);
                const isRecentlyUpdated = recentlyUpdatedOrders.has(order._id);
                const hasStatusAnimation = statusChangeAnimation[order._id];

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: isNew ? 0.95 : 1 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      boxShadow: isNew
                        ? ['0 0 0 0 rgba(0,0,0,0)', '0 0 20px 4px rgba(0,0,0,0.2)', '0 0 0 0 rgba(0,0,0,0)']
                        : isRecentlyUpdated
                          ? '0 0 15px 2px rgba(0,0,0,0.15)'
                          : '0 0 0 0 rgba(0,0,0,0)'
                    }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.4,
                      boxShadow: isNew ? { duration: 2, repeat: 2, ease: "easeInOut" } : { duration: 0.5 }
                    }}
                    className={`group bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 relative ${isNew
                        ? 'border-black shadow-lg'
                        : isRecentlyUpdated
                          ? 'border-gray-600 shadow-md'
                          : 'border-gray-200 hover:border-black hover:shadow-xl'
                      }`}
                  >
                    {/* New order sparkle indicator */}
                    {isNew && (
                      <motion.div
                        className="absolute top-3 right-3 z-10"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>NEW</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Recently updated indicator */}
                    {isRecentlyUpdated && !isNew && (
                      <motion.div
                        className="absolute top-3 right-3 z-10"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Package className="w-3.5 h-3.5" />
                          </motion.div>
                          <span>UPDATED</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Status change animation overlay */}
                    <AnimatePresence>
                      {hasStatusAnimation && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm"
                        >
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="text-center"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.5, repeat: 2 }}
                              className="w-16 h-16 mx-auto mb-3 bg-black text-white rounded-full flex items-center justify-center"
                            >
                              {statusConfig[hasStatusAnimation]?.icon || status.icon}
                            </motion.div>
                            <p className="font-bold text-lg">Status Updated</p>
                            <p className="text-gray-600 capitalize">{hasStatusAnimation}</p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="p-6">
                      {/* Order Header */}
                      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            animate={isRecentlyUpdated ? { scale: [1, 1.1, 1] } : {}}
                            transition={isRecentlyUpdated ? { duration: 0.5, repeat: 2 } : {}}
                            className="p-3 rounded-xl bg-black text-white flex-shrink-0"
                          >
                            {status.icon}
                          </motion.div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-black">#{order._id.slice(-8).toUpperCase()}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                {payment.icon}
                                <span>{payment.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="px-4 py-2 rounded-lg font-semibold bg-black text-white border-2 border-black whitespace-nowrap">
                            {status.label}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">
                              ₹{formatPrice(order.totalAmount)}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{order.items.length} items</p>
                          </div>
                        </div>
                      </div>

                      {/* Level Progress Indicator - Black & White */}
                      {order.status !== 'cancelled' && (
                        <div className="mb-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                          <p className="text-sm font-semibold text-black mb-4">Order Progress</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {orderLevels.map((level, idx) => {
                              const isCompleted = idx <= currentLevel;
                              const isCurrent = idx === currentLevel;

                              return (
                                <motion.div
                                  key={level.key}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="relative"
                                >
                                  {/* Level Button */}
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className={`
                                      p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center
                                      ${isCompleted
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-400 border-gray-200'
                                      }
                                      ${isCurrent ? 'ring-4 ring-gray-300' : ''}
                                    `}
                                  >
                                    <div className="mb-2">
                                      {level.icon}
                                    </div>
                                    <p className="text-xs font-bold mb-1">{level.label}</p>
                                    <p className="text-[10px] opacity-75">{level.description}</p>
                                  </motion.div>

                                  {/* Connector Line */}
                                  {idx < orderLevels.length - 1 && (
                                    <div className="hidden sm:block absolute top-10 left-full w-full h-0.5 bg-gray-200 -z-10">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        className="h-full bg-black"
                                      />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cancelled Status */}
                      {order.status === 'cancelled' && (
                        <div className="mb-6 p-4 bg-gray-100 rounded-xl border-2 border-gray-300">
                          <div className="flex items-center gap-3 text-gray-700">
                            <XCircle className="w-5 h-5" />
                            <p className="font-medium">{status.statusLine}</p>
                          </div>
                        </div>
                      )}

                      {/* Expand/Collapse Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                        className="w-full mb-4 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-medium transition-all duration-300 border border-gray-300 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-5 h-5" />
                        {isExpanded ? 'Hide Details' : 'View Details'}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </motion.button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            {/* Order Items */}
                            <div className="mb-5">
                              <p className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Order Items
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {order.items.map((item, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-black transition-all duration-300"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-black">{getProductName(item)}</span>
                                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">× {item.quantity}</span>
                                    </div>
                                    <div className="text-sm text-black font-semibold mt-1">₹{formatPrice(item.unitPrice * item.quantity)}</div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shippingAddress && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 mb-5"
                              >
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-black mb-1">Delivery Address</p>
                                    <p className="text-sm text-gray-700">{order.shippingAddress.street}</p>
                                    <p className="text-sm text-gray-600">
                                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cancel Button */}
                      {canCancelOrder(order) && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setCancellingOrderId(order._id);
                            setShowCancelModal(true);
                          }}
                          className="w-full px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Cancel Order
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full border-2 border-gray-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-black rounded-xl">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-black">Cancel Order?</h2>
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-black rounded-xl font-medium hover:bg-gray-200 transition-all duration-300 border-2 border-gray-200"
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelOrder}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cancelling...' : 'Yes, Cancel'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Stats Card Component - Black & White Theme
const StatsCard = ({ icon, label, value, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-black hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-3">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="p-3 bg-black text-white rounded-lg group-hover:shadow-lg transition-shadow"
        >
          {icon}
        </motion.div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-black">{value}</p>
    </motion.div>
  );
};

export default OrderHistory;