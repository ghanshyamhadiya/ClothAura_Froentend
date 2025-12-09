import api from "../utils/api";

export const couponService = {
    // Get coupons available for current user
    getUserCoupons: async () => {
        try {
            const response = await api.get("/coupons/user-coupons");
            return response.data;
        } catch (error) {
            console.error(`Coupon error: ${error}`);
            throw error;
        }
    },

    // Get all available coupons
    getAvailableCoupons: async () => {
        try {
            const response = await api.get("/coupons/available");
            return response.data;
        } catch (error) {
            console.error(`Coupon error: ${error}`);
            throw error;
        }
    },

    // Get all coupons (admin/owner)
    getAllCoupons: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await api.get(`/coupons/all${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            console.error(`Coupon error: ${error}`);
            throw error;
        }
    },

    // Create coupon
    createCoupon: async (couponData) => {
        try {
            const response = await api.post("/coupons/create", couponData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update coupon
    updateCoupon: async (id, couponData) => {
        try {
            const response = await api.put(`/coupons/${id}`, couponData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete coupon
    deleteCoupon: async (id) => {
        try {
            const response = await api.delete(`/coupons/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Validate coupon
    validateCoupon: async (couponCode, orderAmount) => {
        try {
            const response = await api.post("/coupons/validate", {
                couponCode,
                orderAmount
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Assign coupon to user
    assignCouponToUser: async (couponId, userId) => {
        try {
            const response = await api.post("/coupons/assign", {
                couponId,
                userId
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get coupon analytics
    getCouponAnalytics: async (couponId) => {
        try {
            const response = await api.get(`/coupons/analytics/${couponId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};