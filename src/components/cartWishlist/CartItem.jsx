import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Heart, Minus, Plus } from 'lucide-react';

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
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        <img
          src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
          alt={item.product.name}
          className="w-28 h-28 object-cover rounded-xl"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-2">{item.product.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {item.variant?.color || 'N/A'} • Size {item.size?.size || 'N/A'}
          </p>
          <p className="text-xl font-bold mt-3">₹{item.unitPrice?.toFixed(2) || '0.00'}</p>

          <div className="flex items-center justify-between mt-6 flex-col md:flex-row gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantity(item._id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => onQuantity(item._id, item.quantity + 1)}
                className="p-2 rounded-lg border hover:bg-gray-50 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleWishlistClick}
                className="p-2 rounded-lg hover:bg-gray-50 transition"
                aria-label="Move to wishlist"
              >
                <Heart className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => onAction && onAction(item, 'remove')}
                className="p-2 rounded-lg hover:bg-red-50 transition"
                aria-label="Remove from cart"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
