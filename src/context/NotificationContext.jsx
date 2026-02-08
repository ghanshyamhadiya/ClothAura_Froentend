import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { toastService } from '../services/toastService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Real-time animation tracking
    const [newNotificationIds, setNewNotificationIds] = useState(new Set());
    const notificationTimeoutsRef = useRef({});

    const { on, off, isConnected } = useSocket();
    const { isAuthenticated, user } = useAuth();

    // Mark notification as new for animations
    const markAsNew = useCallback((notificationId) => {
        setNewNotificationIds(prev => new Set([...prev, notificationId]));

        // Clear the "new" status after animation completes
        if (notificationTimeoutsRef.current[notificationId]) {
            clearTimeout(notificationTimeoutsRef.current[notificationId]);
        }

        notificationTimeoutsRef.current[notificationId] = setTimeout(() => {
            setNewNotificationIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }, 5000); // 5 seconds animation duration
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(notificationTimeoutsRef.current).forEach(clearTimeout);
        };
    }, []);

    // Fetch notifications with pagination
    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const data = await notificationService.getNotifications({
                page: pageNum,
                limit: 20
            });

            if (append) {
                setNotifications(prev => [...prev, ...data.notifications]);
            } else {
                setNotifications(data.notifications);
            }

            setUnreadCount(data.unreadCount);
            setHasMore(data.pagination.hasNext);
            setPage(pageNum);
        } catch (error) {
            toastService.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const data = await notificationService.getUnreadCount();
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [isAuthenticated]);

    // Mark notifications as read
    const markAsRead = useCallback(async (notificationIds) => {
        try {
            const data = await notificationService.markAsRead(notificationIds);

            setNotifications(prev =>
                prev.map(notification =>
                    notificationIds.includes(notification._id)
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount(data.unreadCount);
        } catch (error) {
            toastService.error('Failed to mark as read');
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );

            setUnreadCount(0);
            toastService.success('All notifications marked as read');
        } catch (error) {
            toastService.error('Failed to mark all as read');
        }
    }, []);

    // Respond to order approval
    const respondToApproval = useCallback(async (notificationId, response, reason = '') => {
        try {
            const data = await notificationService.respondToOrderApproval(
                notificationId,
                response,
                reason
            );

            // Update the notification in the list
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, actionTaken: true, actionResponse: response, isRead: true }
                        : notification
                )
            );

            fetchUnreadCount();

            toastService.success(`Order ${response} successfully`);
            return data;
        } catch (error) {
            toastService.error(`Failed to ${response} order`);
            throw error;
        }
    }, [fetchUnreadCount]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const data = await notificationService.deleteNotification(notificationId);

            setNotifications(prev =>
                prev.filter(notification => notification._id !== notificationId)
            );

            setUnreadCount(data.unreadCount);
        } catch (error) {
            toastService.error('Failed to delete notification');
        }
    }, []);

    // Load more notifications (for infinite scroll)
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    }, [loading, hasMore, page, fetchNotifications]);

    // Socket.io event listeners for real-time notifications
    useEffect(() => {
        if (!isAuthenticated || !isConnected) return;

        console.log('🔔 Setting up notification listeners for authenticated user');

        const handleNewNotification = (notification) => {
            console.log('📬 New notification received:', notification);
            const notificationId = notification._id || notification.id;

            setNotifications(prev => {
                // Avoid duplicates
                if (prev.some(n => n._id === notificationId)) return prev;
                return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);

            // Mark for animation
            if (notificationId) {
                markAsNew(notificationId);
            }

            // Show toast for important notifications
            if (notification.requiresAction) {
                toastService.info(`🔔 ${notification.title}`, {
                    autoClose: 5000
                });

                // Play notification sound (optional)
                try {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.log('Could not play sound:', e));
                } catch (e) {
                    // Ignore audio errors
                }
            } else {
                toastService.info(`📬 ${notification.title || 'New notification'}`, {
                    autoClose: 3000
                });
            }
        };

        const handleOrderApprovalRequired = (data) => {
            console.log('🛒 Order approval required:', data);
            const notification = data.notification;
            const notificationId = notification?._id || notification?.id;

            setNotifications(prev => {
                if (notificationId && prev.some(n => n._id === notificationId)) return prev;
                return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);

            if (notificationId) {
                markAsNew(notificationId);
            }

            toastService.info('🛒 New order requires your approval!', {
                autoClose: 7000
            });
        };

        const handleOrderApproved = (data) => {
            console.log('✅ Order approved:', data);
            const notification = data.notification;
            const notificationId = notification?._id || notification?.id;

            setNotifications(prev => {
                if (notificationId && prev.some(n => n._id === notificationId)) return prev;
                return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);

            if (notificationId) {
                markAsNew(notificationId);
            }

            toastService.success('✅ Your order has been approved!', {
                autoClose: 5000
            });
        };

        const handleOrderRejected = (data) => {
            console.log('❌ Order rejected:', data);
            const notification = data.notification;
            const notificationId = notification?._id || notification?.id;

            setNotifications(prev => {
                if (notificationId && prev.some(n => n._id === notificationId)) return prev;
                return [notification, ...prev];
            });
            setUnreadCount(prev => prev + 1);

            if (notificationId) {
                markAsNew(notificationId);
            }

            toastService.error('❌ Your order was rejected', {
                autoClose: 5000
            });
        };

        const handleNotificationsUpdated = (data) => {
            console.log('🔄 Notifications updated:', data);
            setUnreadCount(data.unreadCount);

            if (data.markAllRead) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } else if (data.readIds && Array.isArray(data.readIds)) {
                setNotifications(prev => prev.map(n =>
                    data.readIds.includes(n._id) ? { ...n, isRead: true } : n
                ));
            }
        };

        on('notification:new', handleNewNotification);
        on('order:approval-required', handleOrderApprovalRequired);
        on('order:approved', handleOrderApproved);
        on('order:rejected', handleOrderRejected);
        on('notifications:updated', handleNotificationsUpdated);

        return () => {
            console.log('🔕 Cleaning up notification listeners');
            off('notification:new', handleNewNotification);
            off('order:approval-required', handleOrderApprovalRequired);
            off('order:approved', handleOrderApproved);
            off('order:rejected', handleOrderRejected);
            off('notifications:updated', handleNotificationsUpdated);
        };
    }, [isAuthenticated, isConnected, on, off, markAsNew]);

    // Initial fetch
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            fetchUnreadCount();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        hasMore,
        newNotificationIds, // For real-time animation tracking
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        respondToApproval,
        deleteNotification,
        loadMore,
        refreshNotifications: () => fetchNotifications(1, false)
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
