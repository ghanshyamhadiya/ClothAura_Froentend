import api from '../utils/api';

class NotificationService {
    async getNotifications(params = {}) {
        try {
            const response = await api.get('/notifications', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    async getUnreadCount() {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }

    async markAsRead(notificationIds) {
        try {
            const response = await api.put('/notifications/read', {
                notificationIds
            });
            return response.data;
        } catch (error) {
            console.error('Error marking as read:', error);
            throw error;
        }
    }

    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    async respondToOrderApproval(notificationId, response, reason = '') {
        try {
            const result = await api.post(
                `/notifications/${notificationId}/respond`,
                { response, reason }
            );
            return result.data;
        } catch (error) {
            console.error('Error responding to approval:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

export default new NotificationService();
