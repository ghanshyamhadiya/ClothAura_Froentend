import api from "../utils/api";

export const wishlistService = {

    addToWishlist: async (productId) => {
        try {
            const response = await api.post(`/wishlist/add/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    removeFromWishlist: async (productId) => {
        try {
            const response = await api.delete(`/wishlist/remove/${productId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getWishlist: async () => {
        try {
            const response = await api.get(`/wishlist`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

};
