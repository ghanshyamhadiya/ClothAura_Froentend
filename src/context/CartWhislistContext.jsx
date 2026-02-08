import React, { createContext, useContext, useState, useEffect } from "react";
import { cartService } from "../services/cartService";
import { useAuth } from "./AuthContext";
import { cartWishlistService } from "../services/cartWhislistServices";
import { wishlistService } from "../services/whislistService";
import { useSocket } from "./SocketContext";
import { toastService } from "../services/toastService";

const CartWishlistContext = createContext();

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error("useCartWishlist must be used within a CartWishlistProvider");
  }
  return context;
};

export const CartWishlistProvider = ({ children }) => {
  const { on, off } = useSocket();
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to check if user is verified
  const checkUserVerification = () => {
    if (!isAuthenticated) {
      toastService.error('Please login to continue');
      return false;
    }

    if (!user?.isEmailVerified) {
      toastService.error('Please verify your email to add items to cart or wishlist');
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBothData();
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [isAuthenticated]);

  // Socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOrderCreated = (order) => {
      console.log('Order created, clearing cart:', order);
      setCart([]);
      setError(null);
    };

    const handleOrderUpdated = (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
    };

    const handleOrderDeleted = (data) => {
      console.log('Order deleted:', data);
    };

    const handleCartUpdate = (data) => {
      console.log('Cart updated via socket:', data);
      if (data.cart) {
        setCart(data.cart);
      } else {
        loadBothData();
      }
    };

    const handleWishlistUpdate = (data) => {
      console.log('Wishlist updated via socket:', data);
      if (data.wishlist) {
        setWishlist(data.wishlist);
      } else {
        loadBothData();
      }
    };

    on('orderCreated', handleOrderCreated);
    on('orderUpdated', handleOrderUpdated);
    on('orderDeleted', handleOrderDeleted);
    on('cart:updated', handleCartUpdate);
    on('wishlist:updated', handleWishlistUpdate);

    return () => {
      off('orderCreated', handleOrderCreated);
      off('orderUpdated', handleOrderUpdated);
      off('orderDeleted', handleOrderDeleted);
      off('cart:updated', handleCartUpdate);
      off('wishlist:updated', handleWishlistUpdate);
    };
  }, [isAuthenticated, on, off]);

  const loadBothData = async () => {
    try {
      setLoading(true);
      const data = await cartWishlistService.getBothData();
      setCart(data.cart || []);
      setWishlist(data.wishlist || []);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, variantId = null, sizeId = null, quantity = 1) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setError(null);
      const response = await cartService.addToCart(productId, variantId, sizeId, quantity);
      // Use response if it contains cart data, otherwise optimistic update
      if (response.cart) {
        setCart(response.cart);
      } else {
        // Fetch fresh cart data
        const cartData = await cartService.getCart();
        setCart(cartData.cart || []);
      }
      toastService.success('Item added to cart');
      return response;
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError(err.response?.data?.message || "Failed to add to cart");
      toastService.error(err.response?.data?.message || "Failed to add to cart");
      throw err;
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setError(null);
      await cartService.removeFromCart(itemId);
      setCart((prev) => prev.filter((item) => item._id !== itemId));
      toastService.success('Item removed from cart');
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError(err.response?.data?.message || "Failed to remove from cart");
      toastService.error(err.response?.data?.message || "Failed to remove from cart");
      throw err;
    } finally {
      setCartLoading(false);
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setError(null);

      const response = await cartService.updateCartQuantity(itemId, quantity);
      if (response.cart) {
        setCart(response.cart);
      } else {
        const cartData = await cartService.getCart();
        setCart(cartData.cart || []);
      }

    } catch (err) {
      console.error("Error updating cart quantity:", err);
      setError(err.response?.data?.message || "Failed to update quantity");
      try {
        const cartData = await cartService.getCart();
        setCart(cartData.cart || []);
      } catch (reloadErr) {
        console.error("Error reloading cart:", reloadErr);
      }
      throw err;
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setError(null);
      await cartService.clearCart();
      setCart([]);
      toastService.success('Cart cleared successfully');
    } catch (err) {
      console.error("Error clearing cart:", err);
      setError(err.response?.data?.message || "Failed to clear cart");
      toastService.error(err.response?.data?.message || "Failed to clear cart");
      throw err;
    } finally {
      setCartLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setWishlistLoading(true);
      setError(null);
      const response = await wishlistService.addToWishlist(productId);
      if (response.wishlist) {
        setWishlist(response.wishlist);
      } else {
        const wishlistData = await wishlistService.getWishlist();
        setWishlist(wishlistData.wishlist || []);
      }
      toastService.success('Item added to wishlist');
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      setError(err.response?.data?.message || "Failed to add to wishlist");
      toastService.error(err.response?.data?.message || "Failed to add to wishlist");
      throw err;
    } finally {
      setWishlistLoading(false);
    }
  };

  const removeFromWishlist = async (productId, showToast = true) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setWishlistLoading(true);
      setError(null);
      await wishlistService.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((item) => item._id !== productId && item !== productId));
      if (showToast) {
        toastService.success('Item removed from wishlist');
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      setError(err.response?.data?.message || "Failed to remove from wishlist");
      toastService.error(err.response?.data?.message || "Failed to remove from wishlist");
      throw err;
    } finally {
      setWishlistLoading(false);
    }
  };

  // Move item from wishlist to cart in one smooth operation
  const moveFromWishlistToCart = async (productId, variantId, sizeId, quantity = 1) => {
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setError(null);

      // Add to cart first
      const response = await cartService.addToCart(productId, variantId, sizeId, quantity);
      if (response.cart) {
        setCart(response.cart);
      } else {
        const cartData = await cartService.getCart();
        setCart(cartData.cart || []);
      }

      // Remove from wishlist (optimistically)
      setWishlist((prev) => prev.filter((item) => item._id !== productId && item !== productId));

      // Background remove from wishlist API (don't wait)
      wishlistService.removeFromWishlist(productId).catch(console.error);

      toastService.success('Item moved to cart');
      return response;
    } catch (err) {
      console.error("Error moving to cart:", err);
      setError(err.response?.data?.message || "Failed to add to cart");
      toastService.error(err.response?.data?.message || "Failed to add to cart");
      throw err;
    } finally {
      setCartLoading(false);
    }
  };

  const toggleCartWishlist = async (productId, currentLocation) => {
    // Check verification before proceeding
    if (!checkUserVerification()) {
      return;
    }

    try {
      setCartLoading(true);
      setWishlistLoading(true);
      setError(null);
      const response = await cartWishlistService.toggleCartWishlist(productId, currentLocation);
      await loadBothData();
      return response;
    } catch (err) {
      console.error("Error toggling cart/wishlist:", err);
      setError(err.response?.data?.message || "Failed to move item");
      throw err;
    } finally {
      setCartLoading(false);
      setWishlistLoading(false);
    }
  };

  const isInCart = (productId, variantId = null, sizeId = null) => {
    if (!variantId || !sizeId) {
      return cart.some((item) => item.product?._id === productId || item.product === productId);
    }
    return cart.some(
      (item) =>
        (item.product?._id === productId || item.product === productId) &&
        (item.variant?._id === variantId || item.variant === variantId) &&
        (item.size?._id === sizeId || item.size === sizeId)
    );
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId || item === productId);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getWishlistItemCount = () => {
    return wishlist.length;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.unitPrice || 0) * (item.quantity || 0), 0);
  };

  const getCartItem = (productId, variantId = null, sizeId = null) => {
    return cart.find(
      (item) =>
        (item.product?._id === productId || item.product === productId) &&
        (!variantId || item.variant?._id === variantId || item.variant === variantId) &&
        (!sizeId || item.size?._id === sizeId || item.size === sizeId)
    );
  };

  const clearError = () => setError(null);

  const value = {
    cart,
    wishlist,
    loading,
    cartLoading,
    wishlistLoading,
    error,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    moveFromWishlistToCart,
    toggleCartWishlist,
    isInCart,
    isInWishlist,
    getCartItemCount,
    getWishlistItemCount,
    getCartTotal,
    getCartItem,
    clearError,
    loadBothData,
  };

  return (
    <CartWishlistContext.Provider value={value}>
      {children}
    </CartWishlistContext.Provider>
  );
};