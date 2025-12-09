import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartWishlist } from '../../context/CartWhislistContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../model/ConfirmationModel';
import Button from '../Button';
import Card from '../Card';

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    getCartItemCount,
    toggleCartWishlist,
    loading,
  } = useCartWishlist();
  const navigate = useNavigate();
  const [removingItem, setRemovingItem] = useState(null);
  const [updatingQuantity, setUpdatingQuantity] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    item: null,
    loadingAction: null,
    action: null,
  });

  const handleRemoveClick = (item, action = 'remove') => {
    setModalConfig({
      isOpen: true,
      item,
      loadingAction: null,
      action,
    });
  };

  const handleModalClose = () => {
    if (!modalConfig.loadingAction) {
      setModalConfig({ isOpen: false, item: null, loadingAction: null, action: null });
    }
  };

  const handleConfirmAction = async () => {
    if (!modalConfig.item) return;
    setRemovingItem(modalConfig.item._id);
    setModalConfig((prev) => ({ ...prev, loadingAction: modalConfig.action }));

    try {
      if (modalConfig.action === 'wishlist') {
        await toggleCartWishlist(modalConfig.item.product._id, 'cart');
      } else {
        await removeFromCart(modalConfig.item._id);
      }
    } catch (error) {
      console.error(`Error ${modalConfig.action === 'wishlist' ? 'moving to wishlist' : 'removing from cart'}:`, error);
    } finally {
      setModalConfig({ isOpen: false, item: null, loadingAction: null, action: null });
      setRemovingItem(null);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      const item = cart.find((item) => item._id === itemId);
      handleRemoveClick(item);
      return;
    }
    
    // Set loading state for this specific item
    setUpdatingQuantity(itemId);
    
    try {
      await updateCartQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingQuantity(null);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  const summaryVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.3 }
    }
  };

  if (cart.length === 0) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4"
      >
        <div className="max-w-4xl mx-auto pt-8">
          <motion.div variants={headerVariants} className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-black rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </motion.div>

          <motion.div variants={emptyStateVariants} className="text-center py-16">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center shadow-lg"
            >
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to get started</p>
            <Button to="/" className="shadow-lg hover:shadow-xl">
              Continue Shopping
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 mt-[10vh]"
    >
      <div className="max-w-6xl mx-auto pt-8">
        <motion.div variants={headerVariants} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/')}
              primary={false}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black rounded-2xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600"
                >
                  {getCartItemCount()} items in your cart
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={item._id}
                  layout
                  className="relative"
                >
                  {/* Loading overlay for quantity updates */}
                  {updatingQuantity === item._id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center"
                    >
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <span>Updating...</span>
                      </div>
                    </motion.div>
                  )}
                  
                  <Card
                    key={`${item._id}-${item.quantity}`} // Include quantity in key for proper re-rendering
                    item={item}
                    type="cart"
                    index={index}
                    onRemove={handleRemoveClick}
                    onMoveToWishlist={handleRemoveClick}
                    onQuantityChange={handleQuantityChange}
                    isRemoving={removingItem === item._id}
                    className={updatingQuantity === item._id ? "opacity-50" : ""}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div variants={summaryVariants} className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-between text-gray-600"
                >
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-between text-gray-600"
                >
                  <span>Shipping</span>
                  <span>Free</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-between text-gray-600"
                >
                  <span>Tax</span>
                  <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
                </motion.div>
                <div className="border-t border-gray-200 pt-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-between text-xl font-bold text-gray-900"
                  >
                    <span>Total</span>
                    <span>${(getCartTotal() * 1.08).toFixed(2)}</span>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  to="/checkout"
                  className="w-full flex items-center justify-center gap-2 group"
                  disabled={loading}
                  icon={loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  )}
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Free shipping on orders over $50
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirmAction}
        title={modalConfig.action === 'wishlist' ? 'Move to Wishlist' : 'Remove from Cart'}
        message={
          modalConfig.action === 'wishlist'
            ? `Move "${modalConfig.item?.product?.name || 'item'}" to your wishlist?`
            : `Remove "${modalConfig.item?.product?.name || 'item'}" from your cart?`
        }
        confirmText={modalConfig.action === 'wishlist' ? 'Move to Wishlist' : 'Remove'}
        cancelText="Keep Item"
        loading={!!modalConfig.loadingAction}
      />
    </motion.div>
  );
};

export default Cart;