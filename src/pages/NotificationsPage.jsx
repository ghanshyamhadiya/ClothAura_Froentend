import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Check,
    X,
    Package,
    CreditCard,
    AlertCircle,
    CheckCheck,
    ChevronDown,
    Inbox,
    Mail,
    MailOpen,
    Sparkles,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from '../utils/dateUtils';

const NotificationsPage = () => {
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'approval'
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        markAsRead,
        markAllAsRead,
        respondToApproval,
        loadMore,
        refreshNotifications,
        newNotificationIds
    } = useNotifications();

    const { isConnected } = useSocket();

    // Filter notifications based on current filter
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'approval') return notification.type === 'order_approval_request' && !notification.actionTaken;
        return true;
    });

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_approval_request':
                return <AlertCircle className="w-6 h-6 text-orange-500" />;
            case 'order_approved':
            case 'order_status_update':
                return <Package className="w-6 h-6 text-green-500" />;
            case 'order_rejected':
                return <X className="w-6 h-6 text-red-500" />;
            case 'coupon_assigned':
                return <CreditCard className="w-6 h-6 text-blue-500" />;
            default:
                return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    const handleApprovalResponse = async (notificationId, response) => {
        try {
            await respondToApproval(notificationId, response);
        } catch (error) {
            console.error('Approval response failed:', error);
        }
    };

    const handleSelectAll = () => {
        if (selectedNotifications.length === filteredNotifications.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(filteredNotifications.map(n => n._id));
        }
    };

    const handleMarkSelectedAsRead = async () => {
        if (selectedNotifications.length > 0) {
            await markAsRead(selectedNotifications);
            setSelectedNotifications([]);
        }
    };



    const filterOptions = [
        { value: 'all', label: 'All Notifications', icon: Inbox },
        { value: 'unread', label: 'Unread', icon: Mail },
        { value: 'approval', label: 'Pending Approval', icon: AlertCircle }
    ];

    const currentFilter = filterOptions.find(f => f.value === filter);

    return (
        <div className="min-h-screen bg-gray-50 py-8 pt-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                        <div className="flex items-center gap-3">
                            {/* Real-time connection indicator */}
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
                                        <span className="hidden sm:inline">Live</span>
                                        <motion.div
                                            className="w-2 h-2 bg-green-500 rounded-full"
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-4 h-4" />
                                        <span className="hidden sm:inline">Offline</span>
                                    </>
                                )}
                            </motion.div>

                            {unreadCount > 0 && (
                                <span className="px-3 py-1 text-sm font-medium bg-black text-white rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600">
                        Stay updated with your orders, approvals, and more.
                    </p>
                </motion.div>

                {/* Toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left side - Filter & Select */}
                        <div className="flex items-center gap-3">
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    <currentFilter.icon className="w-4 h-4" />
                                    <span className="font-medium">{currentFilter.label}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10"
                                        >
                                            {filterOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setFilter(option.value);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${filter === option.value ? 'bg-gray-50 font-medium' : ''
                                                        }`}
                                                >
                                                    <option.icon className="w-4 h-4 text-gray-500" />
                                                    {option.label}
                                                    {filter === option.value && (
                                                        <Check className="w-4 h-4 ml-auto text-black" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Select All */}
                            <button
                                onClick={handleSelectAll}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0
                                    ? 'bg-black border-black'
                                    : 'border-gray-300'
                                    }`}>
                                    {selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0 && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="text-sm">Select All</span>
                            </button>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">
                            {selectedNotifications.length > 0 ? (
                                <button
                                    onClick={handleMarkSelectedAsRead}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <MailOpen className="w-4 h-4" />
                                    Mark as Read
                                </button>
                            ) : (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={unreadCount === 0}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark All as Read
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Notifications List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading && notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="inline-block mb-4"
                            >
                                <Bell className="w-12 h-12 text-gray-300" />
                            </motion.div>
                            <p className="text-gray-500">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                            <p className="text-gray-500">
                                {filter === 'unread'
                                    ? "You're all caught up!"
                                    : filter === 'approval'
                                        ? 'No pending approvals'
                                        : 'You have no notifications yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification, index) => {
                                const isNew = newNotificationIds?.has(notification._id);

                                return (
                                    <NotificationItem
                                        key={notification._id}
                                        notification={notification}
                                        index={index}
                                        isNew={isNew}
                                        isSelected={selectedNotifications.includes(notification._id)}
                                        onSelect={(id) => {
                                            setSelectedNotifications(prev =>
                                                prev.includes(id)
                                                    ? prev.filter(n => n !== id)
                                                    : [...prev, id]
                                            );
                                        }}
                                        onMarkAsRead={markAsRead}
                                        onApprovalResponse={handleApprovalResponse}
                                        getNotificationIcon={getNotificationIcon}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Load More */}
                    {hasMore && !loading && (
                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={loadMore}
                                className="w-full py-3 text-center text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Load more notifications
                            </button>
                        </div>
                    )}

                    {loading && notifications.length > 0 && (
                        <div className="p-4 text-center">
                            <div className="inline-block animate-spin w-5 h-5 border-2 border-gray-300 border-t-black rounded-full" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotificationItem = ({
    notification,
    index,
    isNew = false,
    isSelected,
    onSelect,
    onMarkAsRead,
    onApprovalResponse,
    getNotificationIcon
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isActioning, setIsActioning] = useState(false);

    const handleClick = async () => {
        if (!notification.isRead) {
            await onMarkAsRead([notification._id]);
        }
        setIsExpanded(!isExpanded);
    };

    const handleApproval = async (response) => {
        setIsActioning(true);
        try {
            await onApprovalResponse(notification._id, response);
        } finally {
            setIsActioning(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: isNew ? 0.95 : 1 }}
            animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                backgroundColor: isNew
                    ? ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.02)']
                    : undefined
            }}
            transition={{
                delay: index * 0.03,
                backgroundColor: isNew ? { duration: 1.5, repeat: 2 } : undefined
            }}
            className={`group relative transition-colors ${isNew
                    ? 'bg-gray-100 border-l-4 border-black'
                    : !notification.isRead
                        ? 'bg-blue-50/40'
                        : 'hover:bg-gray-50'
                }`}
        >
            {/* New notification badge */}
            {isNew && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 z-10"
                >
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">
                        <Sparkles className="w-3 h-3" />
                        NEW
                    </div>
                </motion.div>
            )}

            <div className="flex items-start p-5 gap-4">
                {/* Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(notification._id);
                    }}
                    className="flex-shrink-0 mt-1"
                >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-black border-black'
                        : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                </button>

                {/* Icon with animation for new notifications */}
                <motion.div
                    className="flex-shrink-0 mt-0.5"
                    animate={isNew ? { scale: [1, 1.2, 1] } : {}}
                    transition={isNew ? { duration: 0.5, repeat: 3 } : {}}
                >
                    {getNotificationIcon(notification.type)}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className={`text-base mb-1 ${isNew ? 'font-bold text-black' : !notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notification.title}
                            </h3>
                            <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'} ${isNew ? 'text-gray-800' : !notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                                {notification.message}
                            </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-400">
                                {isNew && <span className="text-black font-medium">Just now • </span>}
                                {formatDistanceToNow(new Date(notification.createdAt))} ago
                            </p>
                            {!notification.isRead && !isNew && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-auto" />
                            )}
                            {isNew && (
                                <motion.div
                                    className="w-2 h-2 bg-black rounded-full mt-2 ml-auto"
                                    animate={{ scale: [1, 1.5, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Action Status */}
                    {notification.actionTaken && (
                        <div className="mt-3">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${notification.actionResponse === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {notification.actionResponse === 'approved' ? (
                                    <>
                                        <Check className="w-3 h-3 mr-1" /> Approved
                                    </>
                                ) : (
                                    <>
                                        <X className="w-3 h-3 mr-1" /> Rejected
                                    </>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Approval Buttons */}
                    {notification.requiresAction && !notification.actionTaken && (
                        <div className="flex gap-3 mt-4">
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproval('approved');
                                }}
                                disabled={isActioning}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Check className="w-4 h-4" />
                                Accept Order
                            </motion.button>
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproval('rejected');
                                }}
                                disabled={isActioning}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <X className="w-4 h-4" />
                                Reject
                            </motion.button>
                        </div>
                    )}

                    {/* View Order Link */}
                    {notification.actionUrl && (
                        <Link
                            to={notification.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block mt-3 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                        >
                            View Details →
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default NotificationsPage;
