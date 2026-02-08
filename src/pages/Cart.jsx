import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Package, Sparkles, ArrowRight } from 'lucide-react';
import { useCartWishlist } from '../context/CartWhislistContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/model/ConfirmationModel';
import Button from '../components/Button';
import Loading from '../components/Loading';
import CartItem from '../components/cartWishlist/CartItem';
import CartSummary from '../components/cartWishlist/CartSummary';

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
  const [modalConfig, setModalConfig] = useState({ isOpen: false, item: null, action: null });

  const handleAction = (item, action) => {
    setModalConfig({ isOpen: true, item, action });
  };

  const handleConfirm = async () => {
    if (!modalConfig.item) return;
    try {
      if (modalConfig.action === 'wishlist') {
        await toggleCartWishlist(modalConfig.item.product._id, 'cart');
      } else if (modalConfig.action === 'remove') {
        await removeFromCart(modalConfig.item._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalConfig({ isOpen: false, item: null, action: null });
    }
  };

  const handleMoveToWishlistImmediate = async (productId) => {
    try {
      await toggleCartWishlist(productId, 'cart');
    } catch (err) {
      console.error('move to wishlist failed', err);
    }
  };

  const handleQuantity = async (id, qty) => {
    if (qty < 1) return;
    await updateCartQuantity(id, qty);
  };

  if (loading) return <Loading />;

  const total = getCartTotal();
  const tax = total * 0.18;
  const finalTotal = total + tax;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black rounded-2xl">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-gray-500 mt-1">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 px-6 text-center"
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8 relative"
          >
            <ShoppingBag className="w-32 h-32 text-gray-200" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-gray-300" />
            </motion.div>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-md">
            Looks like you haven't added anything yet. Start exploring our amazing products!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-900 transition-colors shadow-lg"
          >
            <Package className="w-5 h-5" />
            Start Shopping
          </motion.button>
        </motion.div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {cart.map((item, i) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    index={i}
                    onQuantity={handleQuantity}
                    onAction={handleAction}
                    onMoveToWishlist={handleMoveToWishlistImmediate}
                  />
                ))}
              </AnimatePresence>

              {/* Mobile Summary */}
              <div className="lg:hidden">
                <CartSummary total={total} tax={tax} finalTotal={finalTotal} isMobile />
              </div>
            </div>

            {/* Desktop Summary */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <CartSummary total={total} tax={tax} finalTotal={finalTotal} />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, item: null, action: null })}
        onConfirm={handleConfirm}
        title={modalConfig.action === 'wishlist' ? 'Move to Wishlist' : 'Remove Item'}
        message={
          modalConfig.action === 'wishlist'
            ? `Move "${modalConfig.item?.product?.name}" to your wishlist?`
            : `Remove "${modalConfig.item?.product?.name}" from your cart?`
        }
        confirmText={modalConfig.action === 'wishlist' ? 'Move' : 'Remove'}
        cancelText="Keep in Cart"
        variant={modalConfig.action === 'wishlist' ? 'info' : 'danger'}
      />
    </motion.div>
  );
};

export default Cart;
