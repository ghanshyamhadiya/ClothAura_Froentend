import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  Package,
  BarChart3,
  TrendingUp,
  Star,
  Calendar
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';

const OwnerRevenueAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOwnerAnalytics();
    }
  }, [isAuthenticated]);

  const fetchOwnerAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/owner/analytics');
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching owner analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (loading) return <Loading />;
  if (error) return <div className="text-center py-20 text-red-600 text-xl">{error}</div>;
  if (!analytics) return null;

  const overviewStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.totalRevenue),
      subtitle: 'From delivered orders',
      icon: DollarSign,
      delay: 0,
    },
    {
      title: 'Total Orders',
      value: analytics.totalOrders,
      subtitle: 'All time',
      icon: ShoppingBag,
      delay: 0.1,
    },
    {
      title: 'Total Products',
      value: analytics.totalProducts,
      subtitle: 'Listed',
      icon: Package,
      delay: 0.2,
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(analytics.averageOrderValue),
      subtitle: 'Per delivered order',
      icon: BarChart3,
      delay: 0.3,
    },
  ];

  return (
    <div className="space-y-12 py-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay, duration: 0.6, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-black rounded-xl">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
      >
        <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
          <DollarSign className="w-7 h-7" />
          Revenue Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-600">
            <p className="text-sm font-medium text-gray-700">Delivered Revenue</p>
            <p className="text-3xl font-bold text-green-700 mt-3">
              {formatCurrency(analytics.deliveredRevenue)}
            </p>
            <p className="text-sm text-gray-600 mt-2">{analytics.deliveredOrders} orders</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-600">
            <p className="text-sm font-medium text-gray-700">Pending Revenue</p>
            <p className="text-3xl font-bold text-blue-700 mt-3">
              {formatCurrency(analytics.pendingRevenue)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.pendingOrders + analytics.processingOrders + analytics.shippedOrders} orders
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border-l-4 border-red-600">
            <p className="text-sm font-medium text-gray-700">Lost Revenue</p>
            <p className="text-3xl font-bold text-red-700 mt-3">
              {formatCurrency(analytics.cancelledRevenue)}
            </p>
            <p className="text-sm text-gray-600 mt-2">{analytics.cancelledOrders} cancelled</p>
          </div>
        </div>
      </motion.div>

      {/* Order Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
      >
        <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
          <BarChart3 className="w-7 h-7" />
          Order Status Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: 'Pending', count: analytics.pendingOrders, color: 'yellow' },
            { label: 'Processing', count: analytics.processingOrders, color: 'blue' },
            { label: 'Shipped', count: analytics.shippedOrders, color: 'purple' },
            { label: 'Delivered', count: analytics.deliveredOrders, color: 'green' },
            { label: 'Cancelled', count: analytics.cancelledOrders, color: 'red' },
          ].map((status) => (
            <div
              key={status.label}
              className={`bg-gray-50 rounded-xl p-6 text-center border border-gray-200 hover:shadow-md transition-shadow`}
            >
              <p className={`text-4xl font-bold text-${status.color}-600 mb-2`}>
                {status.count || 0}
              </p>
              <p className="text-sm font-medium text-gray-700">{status.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Performing Products */}
      {analytics.topProducts?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
            <Star className="w-7 h-7 text-yellow-600" />
            Top Performing Products
          </h3>
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-black">{product.name}</p>
                    <p className="text-sm text-gray-600 capitalize mt-1">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{product.orderCount} orders</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      {analytics.recentOrders?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
            <Calendar className="w-7 h-7" />
            Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-gray-300">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Items</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentOrders.map((order, i) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-sm text-black">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{formatDate(order.createdAt)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{order.itemCount} item(s)</td>
                    <td className="py-4 px-6 text-sm font-bold text-green-600">
                      {formatCurrency(order.ownerRevenue)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-semibold ${
                          order.status === 'delivered'
                            ? 'bg-black text-white'
                            : order.status === 'pending'
                            ? 'bg-gray-200 text-gray-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Monthly Performance */}
      {analytics.monthlyData?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-3">
            <Calendar className="w-7 h-7" />
            Monthly Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
            {analytics.monthlyData.map((month, i) => (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-xl p-5 text-center border border-gray-200 hover:shadow-md transition-shadow"
              >
                <p className="text-sm font-medium text-gray-700 mb-2">{month.month}</p>
                <p className="text-xl font-bold text-black mb-1">
                  {formatCurrency(month.revenue)}
                </p>
                <p className="text-xs text-gray-600">{month.orders} orders</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OwnerRevenueAnalytics;