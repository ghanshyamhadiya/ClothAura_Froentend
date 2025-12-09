import api from "../utils/api";

export const cartService = {

    addToCart: async (productId, variantId, sizeId, quantity = 1) => {
        try {
            const response = await api.post('/cart/add', {
                productId,
                variantId,
                sizeId,
                quantity
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    removeFromCart: async (itemId) => {
        try {
            const response = await api.delete(`/cart/remove/${itemId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getCart: async () => {
        try {
            const response = await api.get('/cart');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    clearCart: async () => {
        try {
            const response = await api.delete('/cart/clear');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCartQuantity: async (itemId, quantity) => {
        try {
            const response = await api.put(`/cart/update/${itemId}`, { quantity });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

}