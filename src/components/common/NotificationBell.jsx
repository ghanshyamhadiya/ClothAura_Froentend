import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Package, CreditCard, AlertCircle, Sparkles } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from '../../utils/dateUtils';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const prevUnreadCountRef = useRef(0);

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        respondToApproval,
        newNotificationIds
    } = useNotifications();

    // Detect new notifications and trigger shake animation
    useEffect(() => {
        if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
            setHasNewNotification(true);
            // Reset after animation duration
            const timer = setTimeout(() => setHasNewNotification(false), 2000);
            return () => clearTimeout(timer);
        }
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead([notification._id]);
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
        }
    };

    const handleApprovalResponse = async (e, notificationId, response) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            await respondToApproval(notificationId, response);
            setIsOpen(false);
        } catch (error) {
            console.error('Approval response failed:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_approval_request':
                return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'order_approved':
            case 'order_status_update':
                return <Package className="w-5 h-5 text-green-500" />;
            case 'order_rejected':
                return <X className="w-5 h-5 text-red-500" />;
            case 'coupon_assigned':
                return <CreditCard className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const recentNotifications = notifications.slice(0, 5);

    // Bell shake animation variants
    const bellShakeVariants = {
        idle: { rotate: 0 },
        shake: {
            rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
            transition: {
                duration: 0.8,
                repeat: 2,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <motion.button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors touch-target"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    variants={bellShakeVariants}
                    animate={hasNewNotification ? "shake" : "idle"}
                >
                    <Bell className="w-5 h-5 text-gray-800" />
                </motion.div>

                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="notification-badge"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Pulse animation for new notifications */}
                {hasNewNotification && (
                    <motion.span
                        className="absolute inset-0 rounded-full bg-black"
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{
                            scale: [1, 2, 2.5],
                            opacity: [0.4, 0.2, 0]
                        }}
                        transition={{
                            duration: 1,
                            repeat: 2,
                            ease: "easeOut"
                        }}
                    />
                )}

                {/* Subtle pulse when there are unread notifications */}
                {unreadCount > 0 && !hasNewNotification && (
                    <motion.span
                        className="absolute inset-0 rounded-full bg-black opacity-20"
                        animate={{
                            scale: [1, 1.3],
                            opacity: [0.2, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    />
                )}
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[var(--z-dropdown)]"
                        style={{ maxHeight: '500px' }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="inline-block"
                                    >
                                        <Bell className="w-8 h-8 text-gray-300" />
                                    </motion.div>
                                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                                </div>
                            ) : recentNotifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 mx-auto" />
                                    <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {recentNotifications.map((notification, index) => {
                                        const isNew = newNotificationIds?.has(notification._id);

                                        return (
                                            <motion.div
                                                key={notification._id}
                                                initial={{ opacity: 0, x: -20, scale: isNew ? 0.95 : 1 }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: 1,
                                                    backgroundColor: isNew
                                                        ? ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)']
                                                        : 'transparent'
                                                }}
                                                transition={{
                                                    delay: index * 0.05,
                                                    backgroundColor: isNew ? { duration: 1.5, repeat: 2 } : {}
                                                }}
                                                className="relative"
                                            >
                                                {/* New notification indicator */}
                                                {isNew && (
                                                    <motion.div
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="absolute top-2 right-2 z-10"
                                                    >
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">
                                                            <Sparkles className="w-3 h-3" />
                                                            NEW
                                                        </div>
                                                    </motion.div>
                                                )}

                                                <div
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={`block p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isNew
                                                        ? 'bg-gray-100 border-l-4 border-black'
                                                        : !notification.isRead
                                                            ? 'bg-blue-50/30'
                                                            : ''
                                                        }`}
                                                >
                                                    <NotificationContent
                                                        notification={notification}
                                                        getNotificationIcon={getNotificationIcon}
                                                        handleApprovalResponse={handleApprovalResponse}
                                                        isNew={isNew}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {recentNotifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                <Link
                                    to="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm font-medium text-black hover:text-gray-700 transition-colors"
                                >
                                    View all notifications →
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const NotificationContent = ({ notification, getNotificationIcon, handleApprovalResponse, isNew = false }) => {
    return (
        <div className="flex gap-3">
            <motion.div
                className="flex-shrink-0 mt-1"
                animate={isNew ? { scale: [1, 1.2, 1] } : {}}
                transition={isNew ? { duration: 0.5, repeat: 2 } : {}}
            >
                {getNotificationIcon(notification.type)}
            </motion.div>

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium mb-0.5 ${isNew ? 'text-black font-semibold' : 'text-gray-900'}`}>
                    {notification.title}
                </p>
                <p className={`text-sm line-clamp-2 ${isNew ? 'text-gray-800' : 'text-gray-600'}`}>
                    {notification.message}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                    {isNew && <span className="text-black font-medium mr-1">Just now •</span>}
                    {formatDistanceToNow(new Date(notification.createdAt))} ago
                </p>

                {/* Action Buttons for Approval */}
                {notification.requiresAction && !notification.actionTaken && (
                    <div className="flex gap-2 mt-3">
                        <motion.button
                            onClick={(e) => handleApprovalResponse(e, notification._id, 'approved')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Check className="w-3 h-3 inline mr-1" />
                            Accept
                        </motion.button>
                        <motion.button
                            onClick={(e) => handleApprovalResponse(e, notification._id, 'rejected')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <X className="w-3 h-3 inline mr-1" />
                            Reject
                        </motion.button>
                    </div>
                )}

                {notification.actionTaken && (
                    <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${notification.actionResponse === 'approved'
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
            </div>

            {!notification.isRead && (
                <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
