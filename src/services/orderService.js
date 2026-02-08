import api from "../utils/api";

export const orderService = {
    // Create a new order
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    // ✅ NEW: Get dashboard orders with pagination and filtering
    getDashboardOrders: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.status) queryParams.append('status', params.status);
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.order) queryParams.append('order', params.order);

            const queryString = queryParams.toString();
            const url = `/orders/dashboard${queryString ? `?${queryString}` : ''}`;

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard orders:', error);
            throw error;
        }
    },

    getOwnerAnalytics: async () => {
        try {
            const response = await api.get('/orders/admin/owner-analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching owner analytics:', error);
            throw error;
        }
    },

    // Get all orders (with optional userId filter)
    getAllOrders: async (userId = null) => {
        try {
            const params = userId ? `?userId=${userId}` : '';
            const response = await api.get(`/orders${params}`);
            return response.data.orders || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Get current user's orders
    getUserOrders: async () => {
        try {
            const response = await api.get('/orders/user/me');
            return response.data;
        } catch (error) {
            console.error('Error fetching user orders:', error);
            throw error;
        }
    },

    // Get order by ID
    getOrderById: async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data.order;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Update order status
    updateOrder: async (orderId, updateData) => {
        try {
            const response = await api.put(`/orders/${orderId}`, updateData);
            return response.data.order;
        } catch (error) {
            console.error('Error updating order:', error);
            throw error.response?.data || error;
        }
    },

    // Cancel order
    cancelOrder: async (orderId) => {
        try {
            const response = await api.delete(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    },

    // Track order status
    trackOrder: async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}/track`);
            return response.data;
        } catch (error) {
            console.error('Error tracking order:', error);
            throw error;
        }
    },

    // Get owner's detailed analytics
    getOwnerAnalyticsDetailed: async () => {
        try {
            const response = await api.get('/orders/owner/analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching owner analytics:', error);
            throw error;
        }
    },

    // Get users who have owner's products in cart/wishlist
    getOwnerProductInterest: async () => {
        try {
            const response = await api.get('/orders/owner/product-interest');
            return response.data;
        } catch (error) {
            console.error('Error fetching product interest:', error);
            throw error;
        }
    }
};