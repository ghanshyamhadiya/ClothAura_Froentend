import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
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
    // show confirmation for remove or move-to-wishlist
    setModalConfig({ isOpen: true, item, action });
  };

  const handleConfirm = async () => {
    // called when user confirms in modal
    if (!modalConfig.item) return;
    try {
      if (modalConfig.action === 'wishlist') {
        // call parent's toggle function to move product to wishlist
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

  // immediate wishlist move (if you want bypass confirmation for wishlist)
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black rounded-2xl">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Cart</h1>
                <p className="text-sm text-gray-600">{getCartItemCount()} items</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-96 px-6 text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-8"
          >
            <ShoppingBag className="w-24 h-24 text-gray-200" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added anything yet</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-900 transition"
          >
            Start Shopping
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="px-4 py-6 md:hidden">
            <div className="space-y-6">
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

              <CartSummary total={total} tax={tax} finalTotal={finalTotal} isMobile />
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block max-w-7xl mx-auto px-6 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
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
              </div>

              <div className="h-fit sticky top-24">
                <CartSummary total={total} tax={tax} finalTotal={finalTotal} />
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, item: null, action: null })}
        onConfirm={handleConfirm}
        title={modalConfig.action === 'wishlist' ? 'Move to Wishlist?' : 'Remove Item?'}
        message={
          modalConfig.action === 'wishlist'
            ? `Move "${modalConfig.item?.product?.name}" to wishlist?`
            : `Remove "${modalConfig.item?.product?.name}" from cart?`
        }
        confirmText={modalConfig.action === 'wishlist' ? 'Move' : 'Remove'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default Cart;
