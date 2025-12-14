import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Store,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import api from '../../utils/api';
import Loading from '../Loading';
import { useAuth } from '../../context/AuthContext';

const AdminOwnerAnalytics = () => {
  const [owners, setOwners] = useState([]);
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOwner, setExpandedOwner] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOwnerAnalytics();
    }
  }, [isAuthenticated]);

  const fetchOwnerAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/admin/owner-analytics');
      setOwners(response.data.owners || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching owner analytics:', err);
      setError('Failed to load owner analytics');
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

  const toggleExpand = (ownerId) => {
    setExpandedOwner(expandedOwner === ownerId ? null : ownerId);
  };

  // Summary calculations
  const totalRevenue = owners.reduce((sum, o) => sum + o.totalRevenue, 0);
  const totalOrders = owners.reduce((sum, o) => sum + o.totalOrders, 0);
  const totalProducts = owners.reduce((sum, o) => sum + o.totalProducts, 0);

  if (loading) return <Loading />;
  if (error) return <div className="text-center py-20 text-red-600 text-lg">{error}</div>;

  return (
    <div className="space-y-10 py-4">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Owners', value: owners.length, icon: Users, color: 'border-gray-800' },
          { label: 'Platform Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'border-black' },
          { label: 'Total Products', value: totalProducts, icon: Package, color: 'border-gray-700' },
          { label: 'Total Orders', value: totalOrders, icon: TrendingUp, color: 'border-gray-900' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg border-l-4 p-6 hover:shadow-xl transition-shadow"
            style={{ borderLeftColor: stat.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold text-black mt-2">{stat.value}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <stat.icon className="w-7 h-7 text-gray-800" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Owners List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-black flex items-center gap-3">
            <Store className="w-7 h-7" />
            Owner Analytics
          </h2>
        </div>

        {owners.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-5" />
            <p className="text-xl font-medium text-gray-600">No owners found</p>
            <p className="text-gray-400 mt-2">Owner analytics will appear here once registered</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {owners.map((owner, index) => (
              <motion.div
                key={owner._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="px-6 py-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Owner Info */}
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-2xl font-bold">
                          {owner.username?.charAt(0).toUpperCase() || 'O'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-black">{owner.username}</h3>
                        <p className="text-gray-600 text-sm mt-1">{owner.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 text-center lg:text-right">
                      <div>
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-xl font-bold text-black mt-1">
                          {formatCurrency(owner.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Products</p>
                        <p className="text-xl font-bold text-black mt-1">{owner.totalProducts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Orders</p>
                        <p className="text-xl font-bold text-black mt-1">{owner.totalOrders}</p>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleExpand(owner._id)}
                      className="p-3 hover:bg-gray-200 rounded-full transition-colors self-start lg:self-center"
                      aria-label="Toggle details"
                    >
                      {expandedOwner === owner._id ? (
                        <ChevronUp className="w-6 h-6 text-gray-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-700" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedOwner === owner._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t-2 border-gray-200 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Products */}
                          <div className="bg-gray-50 rounded-xl p-6">
                            <h4 className="font-semibold text-lg text-black mb-4">
                              Products ({owner.products?.length || 0})
                            </h4>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {owner.products?.length > 0 ? (
                                owner.products.map((product) => (
                                  <div
                                    key={product._id}
                                    className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow transition-shadow"
                                  >
                                    <div>
                                      <p className="font-medium text-black">{product.name}</p>
                                      <p className="text-sm text-gray-500 capitalize mt-1">
                                        {product.category}
                                      </p>
                                    </div>
                                    <Eye className="w-5 h-5 text-gray-600" />
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 text-center py-8">No products listed</p>
                              )}
                            </div>
                          </div>

                          {/* Order Stats */}
                          <div className="bg-gray-50 rounded-xl p-6">
                            <h4 className="font-semibold text-lg text-black mb-4">Order Statistics</h4>
                            <div className="space-y-4">
                              {[
                                { label: 'Pending', value: owner.orderStats?.pending || 0, color: 'text-yellow-600' },
                                { label: 'Processing', value: owner.orderStats?.processing || 0, color: 'text-blue-600' },
                                { label: 'Shipped', value: owner.orderStats?.shipped || 0, color: 'text-purple-600' },
                                { label: 'Delivered', value: owner.orderStats?.delivered || 0, color: 'text-green-600' },
                                { label: 'Cancelled', value: owner.orderStats?.cancelled || 0, color: 'text-red-600' },
                              ].map((stat) => (
                                <div
                                  key={stat.label}
                                  className="bg-white rounded-lg px-5 py-4 flex justify-between items-center shadow-sm"
                                >
                                  <span className="text-gray-700 font-medium">{stat.label}</span>
                                  <span className={`text-xl font-bold ${stat.color}`}>
                                    {stat.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOwnerAnalytics;