import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Heart, Minus, Plus, Package } from 'lucide-react';

const CartItem = ({ item, index = 0, onQuantity, onAction, onMoveToWishlist }) => {
  if (!item || !item.product) return null;

  const handleWishlistClick = () => {
    if (onAction) {
      onAction(item, 'wishlist');
    } else if (onMoveToWishlist) {
      onMoveToWishlist(item.product._id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Product Image */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative flex-shrink-0"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </motion.div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 hover:text-black transition-colors">
                {item.product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                  {item.variant?.color || 'N/A'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                  Size {item.size?.size || 'N/A'}
                </span>
              </div>
            </div>

            {/* Desktop: Price on right */}
            <div className="hidden sm:block text-right">
              <p className="text-xl font-bold text-gray-900">
                ₹{((item.unitPrice || 0) * item.quantity).toFixed(2)}
              </p>
              {item.quantity > 1 && (
                <p className="text-sm text-gray-400">
                  ₹{(item.unitPrice || 0).toFixed(2)} each
                </p>
              )}
            </div>
          </div>

          {/* Mobile: Price */}
          <p className="sm:hidden text-xl font-bold text-gray-900 mt-3">
            ₹{((item.unitPrice || 0) * item.quantity).toFixed(2)}
          </p>

          {/* Actions Row */}
          <div className="flex items-center justify-between mt-4 sm:mt-6 gap-4 flex-wrap">
            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
              <motion.button
                whileHover={{ backgroundColor: '#e5e7eb' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onQuantity(item._id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="p-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </motion.button>
              <motion.span
                key={item.quantity}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-12 text-center font-semibold text-gray-900"
              >
                {item.quantity}
              </motion.span>
              <motion.button
                whileHover={{ backgroundColor: '#e5e7eb' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onQuantity(item._id, item.quantity + 1)}
                className="p-3 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </motion.button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlistClick}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors group"
                aria-label="Move to wishlist"
              >
                <Heart className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAction && onAction(item, 'remove')}
                className="p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                aria-label="Remove from cart"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
