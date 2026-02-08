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
    AlertCircle,
    ChevronRight,
    BarChart3,
    Users,
    Calendar,
    ChevronDown,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    Mail,
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCartWishlist } from '../context/CartWhislistContext';
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
const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendType, color = 'gray', link }) => {
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

// Mini bar chart for revenue
const MiniBarChart = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.value / maxValue) * 100}%` }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="flex-1 bg-gradient-to-t from-gray-800 to-gray-500 rounded-sm min-h-[4px]"
                    title={`${item.label}: ₹${item.value.toLocaleString()}`}
                />
            ))}
        </div>
    );
};

// User Status Section Component
const UserStatusSection = ({ user, resendVerificationEmail }) => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResend = async () => {
        if (sending || sent) return;
        setSending(true);
        try {
            await resendVerificationEmail();
            setSent(true);
            setTimeout(() => setSent(false), 30000); // Disable for 30s
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border-2 border-gray-100">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">{user?.username}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user?.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {user?.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                            <Mail className="w-4 h-4" />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${user?.isEmailVerified
                    ? 'bg-green-50 border-green-100'
                    : 'bg-yellow-50 border-yellow-100'
                    }`}>
                    {user?.isEmailVerified ? (
                        <>
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-900">Verified Account</p>
                                <p className="text-xs text-green-700 font-medium">Your email is confirmed</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-yellow-900">Email Not Verified</p>
                                <p className="text-xs text-yellow-700 font-medium">Action Required</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {!user?.isEmailVerified && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-yellow-800">
                                <Mail className="w-5 h-5 flex-shrink-0 animate-bounce" />
                                <p className="text-sm font-medium">
                                    Please verify your email address to unlock full account features and enhance security.
                                </p>
                            </div>
                            <button
                                onClick={handleResend}
                                disabled={sending || sent}
                                className={`
                                    px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm
                                    ${sent
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300'
                                    }
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                            >
                                {sending ? 'Sending...' : sent ? 'Verification Sent!' : 'Resend Verification Email'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const DashboardPage = () => {
    const { user, resendVerificationEmail } = useAuth();
    const { cart, wishlist, getCartTotal, getCartItemCount, getWishlistItemCount } = useCartWishlist();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('week');
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

    const { on, off, isConnected } = useSocket();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getUserOrders();
            if (response.success) {
                setOrders(response.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Real-time updates for dashboard
    useEffect(() => {
        if (!isConnected) return;

        const handleOrderCreated = (data) => {
            setOrders(prev => {
                if (prev.some(o => o._id === data.order._id)) return prev;
                return [data.order, ...prev];
            });
        };

        const handleOrderUpdated = (updatedOrder) => {
            setOrders(prev => prev.map(order =>
                order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
            ));
        };

        const handleOrderApproved = (data) => {
            setOrders(prev => prev.map(order =>
                order._id === data.order._id ? { ...order, ...data.order, status: 'processing', approvalStatus: 'approved' } : order
            ));
        };

        const handleOrderRejected = (data) => {
            setOrders(prev => prev.map(order =>
                order._id === data.order._id ? { ...order, ...data.order, status: 'cancelled', approvalStatus: 'rejected' } : order
            ));
        };

        const handleOrderStatusUpdated = (data) => {
            setOrders(prev => prev.map(order =>
                order._id === data.orderId ? { ...order, status: data.status } : order
            ));
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
    }, [isConnected, on, off]);

    // Filter orders by period
    const filteredOrders = useMemo(() => {
        if (period === 'all') return orders;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate;
        switch (period) {
            case 'today':
                startDate = startOfDay;
                break;
            case 'week':
                startDate = new Date(startOfDay);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(startOfDay);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(startOfDay);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                return orders;
        }

        return orders.filter(order => new Date(order.createdAt) >= startDate);
    }, [orders, period]);

    // Calculate statistics based on filtered orders
    const stats = useMemo(() => {
        const totalOrders = filteredOrders.length;
        const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.approvalStatus === 'pending').length;
        const processingOrders = filteredOrders.filter(o => o.status === 'processing').length;
        const completedOrders = filteredOrders.filter(o => o.status === 'delivered').length;
        const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Revenue by day (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                label: date.toLocaleDateString('en', { weekday: 'short' }),
                date: date.toDateString(),
                value: 0
            };
        });

        filteredOrders.forEach(order => {
            const orderDate = new Date(order.createdAt).toDateString();
            const dayData = last7Days.find(d => d.date === orderDate);
            if (dayData) {
                dayData.value += order.totalAmount || 0;
            }
        });

        return {
            totalOrders,
            pendingOrders,
            processingOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue,
            revenueByDay: last7Days,
            cartTotal: getCartTotal(),
            cartCount: getCartItemCount(),
            wishlistCount: getWishlistItemCount()
        };
    }, [filteredOrders, getCartTotal, getCartItemCount, getWishlistItemCount]);

    const recentOrders = filteredOrders.slice(0, 5);

    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
        { value: 'all', label: 'All Time' }
    ];

    const currentPeriod = periodOptions.find(p => p.value === period);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loading />
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
                            Welcome back, {user?.username || 'User'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Here's what's happening with your {isOwnerOrAdmin ? 'store' : 'orders'} today.
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

                {/* User Status Section */}
                <UserStatusSection user={user} resendVerificationEmail={resendVerificationEmail} />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Package}
                        title="Total Orders"
                        value={stats.totalOrders}
                        subtitle={`${stats.pendingOrders} pending`}
                        color="blue"
                        link="/orders"
                    />
                    <StatCard
                        icon={DollarSign}
                        title="Total Spent"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        subtitle="Lifetime purchases"
                        color="green"
                    />
                    <StatCard
                        icon={ShoppingCart}
                        title="Cart Items"
                        value={stats.cartCount}
                        subtitle={`₹${stats.cartTotal.toLocaleString()} total`}
                        color="orange"
                        link="/cart"
                    />
                    <StatCard
                        icon={Heart}
                        title="Wishlist"
                        value={stats.wishlistCount}
                        subtitle="Saved items"
                        color="red"
                        link="/wishlist"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                                <p className="text-sm text-gray-500">Your latest order activity</p>
                            </div>
                            <Link
                                to="/orders"
                                className="text-sm font-medium text-gray-600 hover:text-black flex items-center"
                            >
                                View all <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No orders yet</p>
                                <Link to="/" className="text-sm font-medium text-black hover:underline mt-2 inline-block">
                                    Start shopping →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentOrders.map((order, index) => (
                                    <motion.div
                                        key={order._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                                {order.items?.[0]?.productId?.images?.[0]?.url ? (
                                                    <img
                                                        src={order.items[0].productId.images[0].url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Order #{order._id.slice(-6).toUpperCase()}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold text-gray-900">
                                                ₹{(order.totalAmount || 0).toLocaleString()}
                                            </span>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Revenue Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Spending Trend</h3>
                                    <p className="text-sm text-gray-500">Last 7 days</p>
                                </div>
                                <BarChart3 className="w-5 h-5 text-gray-400" />
                            </div>
                            <MiniBarChart data={stats.revenueByDay} />
                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                                {stats.revenueByDay.filter((_, i) => i % 2 === 0).map((d, i) => (
                                    <span key={i}>{d.label}</span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <span className="text-sm text-gray-600">Pending</span>
                                    </div>
                                    <span className="font-medium">{stats.pendingOrders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-sm text-gray-600">Processing</span>
                                    </div>
                                    <span className="font-medium">{stats.processingOrders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-sm text-gray-600">Delivered</span>
                                    </div>
                                    <span className="font-medium">{stats.completedOrders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm text-gray-600">Cancelled</span>
                                    </div>
                                    <span className="font-medium">{stats.cancelledOrders}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Cart Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Your Cart</h3>
                                <Link to="/cart" className="text-sm text-gray-500 hover:text-black">
                                    View →
                                </Link>
                            </div>
                            {cart.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">Cart is empty</p>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {cart.slice(0, 3).map((item) => (
                                            <div key={item._id} className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.product?.name}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <span className="text-sm font-medium">₹{(item.unitPrice || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {cart.length > 3 && (
                                        <p className="text-xs text-gray-400 mt-2">+{cart.length - 3} more items</p>
                                    )}
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                        <span className="font-medium">Total</span>
                                        <span className="font-bold text-lg">₹{stats.cartTotal.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
