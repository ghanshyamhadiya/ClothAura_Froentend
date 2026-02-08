import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingCart,
    DollarSign,
    Users,
    Calendar,
    ChevronDown,
    BarChart3,
    PieChart as PieIcon,
    Activity
} from 'lucide-react';
import { orderService } from '../services/orderService';

// Simple chart components (no external library needed)
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 30;
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
            {prefix}{displayValue.toFixed(decimals)}{suffix}
        </span>
    );
};

const BarChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="flex items-end justify-between gap-2 h-full" style={{ height }}>
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.value / maxValue) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                        className="w-full bg-gradient-to-t from-gray-900 to-gray-600 rounded-t-lg min-h-[4px] relative group cursor-pointer"
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ₹{item.value.toLocaleString()}
                        </div>
                    </motion.div>
                    <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

const DonutChart = ({ data, size = 180 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;

    const colors = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

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
                            style={{ transformOrigin: 'center' }}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-xs text-gray-500">Total</span>
            </div>
        </div>
    );
};

const LineChart = ({ data, height = 120 }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((item.value - minValue) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
        <div className="relative" style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {/* Gradient area */}
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#111827" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#111827" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.polygon
                    points={areaPoints}
                    fill="url(#areaGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
                {/* Line */}
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#111827"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ vectorEffect: 'non-scaling-stroke' }}
                />
                {/* Points */}
                {data.map((item, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - ((item.value - minValue) / range) * 80 - 10;
                    return (
                        <motion.circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#111827"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                            style={{ vectorEffect: 'non-scaling-stroke' }}
                        />
                    );
                })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
                {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((item, i) => (
                    <span key={i}>{item.label}</span>
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, title, value, change, changeType, prefix = '', suffix = '' }) => {
    const isPositive = changeType === 'positive';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                    <Icon className="w-6 h-6 text-gray-800" />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {change}%
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </p>
        </motion.div>
    );
};

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('week');
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);
    const [analytics, setAnalytics] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        processingOrders: 0,
        averageOrderValue: 0,
        revenueByDay: [],
        ordersByStatus: [],
        recentActivity: []
    });

    const periodOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' }
    ];

    const currentPeriod = periodOptions.find(p => p.value === period);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const response = await orderService.getAnalytics(period);
                if (response.success) {
                    setAnalytics(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
                // Use mock data for demo
                setAnalytics({
                    totalOrders: 156,
                    totalRevenue: 245689,
                    pendingOrders: 12,
                    completedOrders: 128,
                    cancelledOrders: 6,
                    processingOrders: 10,
                    averageOrderValue: 1575,
                    revenueByDay: [
                        { label: 'Mon', value: 32500 },
                        { label: 'Tue', value: 41200 },
                        { label: 'Wed', value: 28900 },
                        { label: 'Thu', value: 55600 },
                        { label: 'Fri', value: 48200 },
                        { label: 'Sat', value: 62100 },
                        { label: 'Sun', value: 45800 }
                    ],
                    ordersByStatus: [
                        { label: 'Completed', value: 128 },
                        { label: 'Processing', value: 10 },
                        { label: 'Pending', value: 12 },
                        { label: 'Cancelled', value: 6 }
                    ],
                    recentActivity: [
                        { label: 'Week 1', value: 35 },
                        { label: 'Week 2', value: 42 },
                        { label: 'Week 3', value: 38 },
                        { label: 'Week 4', value: 41 }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Activity className="w-8 h-8 text-gray-400" />
                </motion.div>
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
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-600 mt-1">Track your store performance and insights</p>
                    </div>

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
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={DollarSign}
                        title="Total Revenue"
                        value={analytics.totalRevenue}
                        prefix="₹"
                        change={12.5}
                        changeType="positive"
                    />
                    <StatCard
                        icon={ShoppingCart}
                        title="Total Orders"
                        value={analytics.totalOrders}
                        change={8.2}
                        changeType="positive"
                    />
                    <StatCard
                        icon={Package}
                        title="Pending Orders"
                        value={analytics.pendingOrders}
                        change={-3.1}
                        changeType="negative"
                    />
                    <StatCard
                        icon={Users}
                        title="Avg. Order Value"
                        value={analytics.averageOrderValue}
                        prefix="₹"
                        change={5.7}
                        changeType="positive"
                    />
                </div>

                {/* Charts Grid */}
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
                                <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                                <p className="text-sm text-gray-500">Daily revenue breakdown</p>
                            </div>
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                        <BarChart data={analytics.revenueByDay} height={220} />
                    </motion.div>

                    {/* Orders by Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Orders by Status</h2>
                                <p className="text-sm text-gray-500">Distribution overview</p>
                            </div>
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <PieIcon className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <DonutChart data={analytics.ordersByStatus} />
                            <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                                {analytics.ordersByStatus.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: ['#111827', '#374151', '#6B7280', '#9CA3AF'][index] }}
                                        />
                                        <span className="text-sm text-gray-600">{item.label}</span>
                                        <span className="text-sm font-medium ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Activity Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Activity Trend</h2>
                            <p className="text-sm text-gray-500">Orders over time</p>
                        </div>
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Activity className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <LineChart data={analytics.recentActivity} height={150} />
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
