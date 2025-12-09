import { cartService } from "./cartService";
import { wishlistService } from "./whislistService";

export const cartWishlistService = {
     toggleCartWishlist: async (productId, currentLocation) => {
        try {
            if (currentLocation === 'cart') {
                await cartService.removeFromCart(productId);
                await wishlistService.addToWishlist(productId);
                return { message: "Moved to wishlist", newLocation: 'wishlist' };
            } else {
                await wishlistService.removeFromWishlist(productId);
                await cartService.addToCart(productId);
                return { message: "Moved to cart", newLocation: 'cart' };
            }
        } catch (error) {
            throw error;
        }
    },


    getBothData: async () => {
        try {
            const [cartData, wishlistData] = await Promise.all([
                cartService.getCart(),
                wishlistService.getWishlist()
            ]);
            return {
                cart: cartData.cart || [],
                wishlist: wishlistData.wishlist || []
            };
        } catch (error) {
            throw error;
        }
    }
};
