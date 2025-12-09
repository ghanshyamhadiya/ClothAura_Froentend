import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { useCartWishlist } from '../../context/CartWhislistContext';
import ConfirmationModal from '../model/ConfirmationModel';
import Button from '../Button';
import Card from '../Card';

const WishList = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCartWishlist();
  const [removingItem, setRemovingItem] = useState(null);
  const [movingToCart, setMovingToCart] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  // Open confirmation modal
  const handleRemoveClick = (item) => {
    setModalConfig({
      isOpen: true,
      item,
      loading: false,
    });
  };

  // Confirm remove action
  const handleConfirmRemove = async () => {
    if (!modalConfig.item) return;
    setRemovingItem(modalConfig.item._id);
    setModalConfig((prev) => ({ ...prev, loading: true }));

    try {
      await removeFromWishlist(modalConfig.item._id);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      setRemovingItem(null);
      setModalConfig({ isOpen: false, item: null, loading: false });
    }
  };

  // Close modal
  const handleModalClose = () => {
    if (!modalConfig.loading) {
      setModalConfig({ isOpen: false, item: null, loading: false });
    }
  };

  // Move to cart
  const handleMoveToCart = async (productId) => {
    setMovingToCart(productId);
    try {
      await addToCart(productId);
      await removeFromWishlist(productId);
    } catch (error) {
      console.error('Error moving to cart:', error);
    } finally {
      setMovingToCart(null);
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

  if (wishlist.length === 0) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-white p-4 mt-[10vh]"
      >
        <div className="max-w-4xl mx-auto pt-8">
          <motion.div variants={headerVariants} className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-black rounded-2xl shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black">My Wishlist</h1>
          </motion.div>

          <motion.div variants={emptyStateVariants} className="text-center py-16">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
                className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-200 rounded-full flex items-center justify-center shadow-lg"
              >
                <Heart className="w-16 h-16 text-gray-400" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save items you love for later</p>
            <Button to="/products" className="shadow-lg hover:shadow-xl">
              Explore Products
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
      className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4"
    >
      <div className="max-w-7xl mx-auto pt-8">
        {/* Header */}
        <motion.div 
          variants={headerVariants}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button to="/" primary={false} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black rounded-2xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">My Wishlist</h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 flex items-center gap-2 mt-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wishlist Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {wishlist.map((item, index) => (
              <Card
                key={item._id}
                item={item}
                type="wishlist"
                index={index}
                onRemove={handleRemoveClick}
                onMoveToCart={handleMoveToCart}
                isRemoving={removingItem === item._id}
                isMoving={movingToCart === item._id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirmRemove}
        title="Remove from Wishlist"
        message={`Remove "${modalConfig.item?.name}" from your wishlist?`}
        confirmText="Remove"
        cancelText="Keep Item"
        loading={modalConfig.loading}
      />
    </motion.div>
  );
};

export default WishList;