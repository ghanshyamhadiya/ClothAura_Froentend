import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Package,
    ShoppingCart,
    Heart,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    ChevronRight,
    BarChart3,
    Users,
    Calendar,
    ChevronDown,
    RefreshCw,
    Eye,
    Box,
    PieChart as PieIcon,
    Activity,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { orderService } from '../services/orderService';
import Loading from '../components/Loading';

// Animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 800;
        const steps = 20;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span>
            {prefix}{displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{suffix}
        </span>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendType, color = 'gray', link, delay = 0 }) => {
    const colorClasses = {
        gray: 'bg-gray-100 text-gray-800',
        green: 'bg-green-100 text-green-800',
        blue: 'bg-blue-100 text-blue-800',
        orange: 'bg-orange-100 text-orange-800',
        red: 'bg-red-100 text-red-800',
        purple: 'bg-purple-100 text-purple-800'
    };

    const content = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-pointer transition-all"
        >
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trendType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        {trendType === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {trend}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                    {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
                </p>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {link && (
                <div className="mt-4 flex items-center text-sm font-medium text-gray-600 hover:text-black">
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            )}
        </motion.div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
};

// Order Status Badge
const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
        shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
        delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
        cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// Bar Chart Component
const BarChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.revenue || d.value || 0), 1);

    return (
        <div className="flex items-end justify-between gap-2 h-full" style={{ height }}>
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${((item.revenue || item.value || 0) / maxValue) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                        className="w-full bg-gradient-to-t from-gray-900 to-gray-600 rounded-t-lg min-h-[4px] relative group cursor-pointer"
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ₹{(item.revenue || item.value || 0).toLocaleString()}
                        </div>
                    </motion.div>
                    <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                        {item.month || item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Donut Chart
const DonutChart = ({ data, size = 160 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {data.map((item, index) => {
                    const percent = total > 0 ? (item.value / total) * 100 : 0;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -cumulativePercent;
                    cumulativePercent += percent;

                    return (
                        <motion.circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={colors[index % colors.length]}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-xs text-gray-500">Orders</span>
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('all');
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const [analytics, setAnalytics] = useState(null);
    const [productInterest, setProductInterest] = useState(null);
    const [error, setError] = useState(null);

    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
        { value: 'all', label: 'All Time' }
    ];

    const currentPeriod = periodOptions.find(p => p.value === period);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [analyticsRes, interestRes] = await Promise.all([
                orderService.getOwnerAnalyticsDetailed(),
                orderService.getOwnerProductInterest()
            ]);

            if (analyticsRes.success) {
                setAnalytics(analyticsRes);
            }
            if (interestRes.success) {
                setProductInterest(interestRes);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Real-time analytics updates
    const { on, off, isConnected } = useSocket();

    useEffect(() => {
        if (!isConnected) return;

        const handleNewOrder = (data) => {
            const newOrder = data.order || data;
            setAnalytics(prev => {
                if (!prev) return prev;
                // Avoid duplicates
                if (prev.recentOrders?.some(o => o._id === newOrder._id)) return prev;

                const newRecent = [newOrder, ...prev.recentOrders].slice(0, 5);
                return {
                    ...prev,
                    totalOrders: (prev.totalOrders || 0) + 1,
                    pendingOrders: (prev.pendingOrders || 0) + 1,
                    recentOrders: newRecent
                };
            });
        };

        const handleOrderApproved = (data) => {
            setAnalytics(prev => {
                if (!prev) return prev;
                const updatedRecent = prev.recentOrders.map(o =>
                    o._id === data.order._id ? { ...o, status: 'processing', approvalStatus: 'approved' } : o
                );
                return {
                    ...prev,
                    pendingOrders: Math.max((prev.pendingOrders || 0) - 1, 0),
                    processingOrders: (prev.processingOrders || 0) + 1,
                    recentOrders: updatedRecent
                };
            });
        };

        const handleOrderRejected = (data) => {
            setAnalytics(prev => {
                if (!prev) return prev;
                const updatedRecent = prev.recentOrders.map(o =>
                    o._id === data.order._id ? { ...o, status: 'cancelled', approvalStatus: 'rejected' } : o
                );
                return {
                    ...prev,
                    pendingOrders: Math.max((prev.pendingOrders || 0) - 1, 0),
                    cancelledOrders: (prev.cancelledOrders || 0) + 1,
                    recentOrders: updatedRecent
                };
            });
        };

        on('order:approval-required', handleNewOrder);
        on('order:approved', handleOrderApproved);
        on('order:rejected', handleOrderRejected);

        return () => {
            off('order:approval-required', handleNewOrder);
            off('order:approved', handleOrderApproved);
            off('order:rejected', handleOrderRejected);
        };
    }, [isConnected, on, off]);

    // Order status data for chart
    const orderStatusData = useMemo(() => {
        if (!analytics) return [];
        return [
            { label: 'Delivered', value: analytics.deliveredOrders || 0 },
            { label: 'Processing', value: analytics.processingOrders || 0 },
            { label: 'Pending', value: analytics.pendingOrders || 0 },
            { label: 'Cancelled', value: analytics.cancelledOrders || 0 }
        ];
    }, [analytics]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-start justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Owner Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Complete analytics for your store at a glance
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Refresh Button */}
                        <motion.button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 0.5, repeat: refreshing ? Infinity : 0 }}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </motion.button>

                        {/* Period Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{currentPeriod?.label}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isPeriodOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10"
                                    >
                                        {periodOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setPeriod(option.value);
                                                    setIsPeriodOpen(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${period === option.value ? 'bg-gray-50 font-medium' : ''}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'orders', label: 'Orders', icon: Package },
                        { id: 'interest', label: 'Customer Interest', icon: Heart }
                    ].map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </motion.button>
                    ))}
                </div>

                {/* Overview Tab */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    icon={DollarSign}
                                    title="Total Revenue"
                                    value={`₹${(analytics?.totalRevenue || 0).toLocaleString()}`}
                                    subtitle="From delivered orders"
                                    color="green"
                                    delay={0}
                                />
                                <StatCard
                                    icon={Package}
                                    title="Total Orders"
                                    value={analytics?.totalOrders || 0}
                                    subtitle={`${analytics?.pendingOrders || 0} pending approval`}
                                    color="blue"
                                    delay={0.1}
                                    link="/dashboard/orders"
                                />
                                <StatCard
                                    icon={Box}
                                    title="Products"
                                    value={analytics?.totalProducts || 0}
                                    subtitle="Active listings"
                                    color="purple"
                                    delay={0.2}
                                />
                                <StatCard
                                    icon={Users}
                                    title="Interested Users"
                                    value={(productInterest?.totalCartUsers || 0) + (productInterest?.totalWishlistUsers || 0)}
                                    subtitle={`${productInterest?.totalCartUsers || 0} in cart`}
                                    color="orange"
                                    delay={0.3}
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Revenue Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
                                            <p className="text-sm text-gray-500">Last 6 months performance</p>
                                        </div>
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <BarChart3 className="w-5 h-5 text-gray-600" />
                                        </div>
                                    </div>
                                    {analytics?.monthlyData?.length > 0 ? (
                                        <BarChart data={analytics.monthlyData} height={220} />
                                    ) : (
                                        <div className="h-[220px] flex items-center justify-center text-gray-400">
                                            No revenue data yet
                                        </div>
                                    )}
                                </motion.div>

                                {/* Order Status Donut */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                                            <p className="text-sm text-gray-500">Distribution</p>
                                        </div>
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <PieIcon className="w-5 h-5 text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <DonutChart data={orderStatusData} />
                                        <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                                            {orderStatusData.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index] }}
                                                    />
                                                    <span className="text-xs text-gray-600">{item.label}</span>
                                                    <span className="text-xs font-medium ml-auto">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Top Products */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Top Performing Products</h2>
                                        <p className="text-sm text-gray-500">By revenue generated</p>
                                    </div>
                                </div>
                                {analytics?.topProducts?.length > 0 ? (
                                    <div className="space-y-4">
                                        {analytics.topProducts.slice(0, 5).map((product, index) => (
                                            <div key={product._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-600">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-sm text-gray-500">{product.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">₹{product.revenue.toLocaleString()}</p>
                                                    <p className="text-sm text-gray-500">{product.orderCount} orders</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No product sales yet
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Order Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                {[
                                    { label: 'Pending', value: analytics?.pendingOrders || 0, color: 'yellow' },
                                    { label: 'Processing', value: analytics?.processingOrders || 0, color: 'blue' },
                                    { label: 'Shipped', value: analytics?.shippedOrders || 0, color: 'purple' },
                                    { label: 'Delivered', value: analytics?.deliveredOrders || 0, color: 'green' },
                                    { label: 'Cancelled', value: analytics?.cancelledOrders || 0, color: 'red' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-xl p-4 border border-gray-100"
                                    >
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Recent Orders */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                                        <p className="text-sm text-gray-500">Latest orders for your products</p>
                                    </div>
                                    <Link
                                        to="/dashboard/orders"
                                        className="text-sm font-medium text-gray-600 hover:text-black flex items-center"
                                    >
                                        View all <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>

                                {analytics?.recentOrders?.length > 0 ? (
                                    <div className="space-y-4">
                                        {analytics.recentOrders.map((order, index) => (
                                            <motion.div
                                                key={order._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        Order #{order._id.slice(-6).toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-gray-900">
                                                        ₹{(order.ownerRevenue || 0).toLocaleString()}
                                                    </span>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No orders yet</p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Customer Interest Tab */}
                    {activeTab === 'interest' && (
                        <motion.div
                            key="interest"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Interest Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatCard
                                    icon={ShoppingCart}
                                    title="Users with Cart Items"
                                    value={productInterest?.totalCartUsers || 0}
                                    subtitle={`₹${(productInterest?.totalPotentialRevenue || 0).toLocaleString()} potential revenue`}
                                    color="orange"
                                />
                                <StatCard
                                    icon={Heart}
                                    title="Users with Wishlist Items"
                                    value={productInterest?.totalWishlistUsers || 0}
                                    subtitle="Users interested in your products"
                                    color="red"
                                />
                                <StatCard
                                    icon={Eye}
                                    title="Products with Interest"
                                    value={productInterest?.productInterest?.length || 0}
                                    subtitle="Products in carts or wishlists"
                                    color="blue"
                                />
                            </div>

                            {/* Product Interest Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Product Interest</h2>
                                        <p className="text-sm text-gray-500">Which products users are interested in</p>
                                    </div>
                                </div>

                                {productInterest?.productInterest?.length > 0 ? (
                                    <div className="space-y-4">
                                        {productInterest.productInterest.map((product, index) => (
                                            <motion.div
                                                key={product.productId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {product.productImage ? (
                                                        <img
                                                            src={product.productImage}
                                                            alt={product.productName}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <Box className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <p className="font-medium text-gray-900">{product.productName}</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 text-orange-600">
                                                        <ShoppingCart className="w-4 h-4" />
                                                        <span className="font-medium">{product.inCartCount}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <Heart className="w-4 h-4" />
                                                        <span className="font-medium">{product.inWishlistCount}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No customer interest data yet</p>
                                    </div>
                                )}
                            </motion.div>

                            {/* Users Lists */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Cart Users */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">Users with Cart Items</h3>
                                        <ShoppingCart className="w-5 h-5 text-orange-500" />
                                    </div>
                                    {productInterest?.cartUsers?.length > 0 ? (
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {productInterest.cartUsers.map((user) => (
                                                <div key={user.userId} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{user.username}</p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-600">₹{user.totalValue.toLocaleString()}</p>
                                                            <p className="text-xs text-gray-500">{user.itemCount} items</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-4">No users with cart items</p>
                                    )}
                                </motion.div>

                                {/* Wishlist Users */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">Users with Wishlist Items</h3>
                                        <Heart className="w-5 h-5 text-red-500" />
                                    </div>
                                    {productInterest?.wishlistUsers?.length > 0 ? (
                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                            {productInterest.wishlistUsers.map((user) => (
                                                <div key={user.userId} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{user.username}</p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">{user.productCount} products</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 text-center py-4">No users with wishlist items</p>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OwnerDashboard;
