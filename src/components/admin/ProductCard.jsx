import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Star } from 'lucide-react';

const ProductCard = ({ product, onEdit, onDelete, showOwnerActions = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sanitizeNumber = (val) => {
    if (val === null || val === undefined) return null;
    const n = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return Number.isNaN(n) ? null : n;
  };

  const displayPrice = useMemo(() => {
    const p = sanitizeNumber(product.price);
    if (p) return p;
    const firstVariant = product.variants?.[0];
    const firstSize = firstVariant?.sizes?.[0];
    return sanitizeNumber(firstSize?.price) || 0;
  }, [product]);

  const displayOriginalPrice = useMemo(() => {
    const op = sanitizeNumber(product.originalPrice);
    if (op) return op;
    const firstVariant = product.variants?.[0];
    const firstSize = firstVariant?.sizes?.[0];
    return sanitizeNumber(firstSize?.originalPrice) || null;
  }, [product]);

  const discountPercentage = useMemo(() => {
    const original = displayOriginalPrice;
    const current = displayPrice;
    if (original && current && original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return product.discount || 0;
  }, [displayOriginalPrice, displayPrice, product.discount]);

  const isInStock = useMemo(() => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.some(variant => {
        if (typeof variant.stock === 'number' && variant.stock > 0) return true;
        if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
          return variant.sizes.some(size => typeof size.stock === 'number' && size.stock > 0);
        }
        return false;
      });
    }
    if (typeof product.inStock === 'boolean') return product.inStock;
    if (typeof product.stock === 'number') return product.stock > 0;
    return true;
  }, [product]);

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '₹0';
    const numericPrice = typeof price === 'number' ? price : sanitizeNumber(price) || 0;
    return `₹${numericPrice.toLocaleString('en-IN')}`;
  };

  const getProductImage = () => {
    const variant = product.variants?.[0];
    const firstImage = variant?.images?.[0] || product.images?.[0];
    if (!firstImage) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
    if (typeof firstImage === 'string') return firstImage;
    if (firstImage.url) return firstImage.url;
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
  };

  const rating = product.averageRating || product.rating || 0;
  const totalReviews = product.totalReviews || product.reviews || 0;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) await onDelete(product._id);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        className="relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm hover:shadow-xl overflow-hidden cursor-pointer group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            {!imageLoaded && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
              setImageLoaded(true);
            }}
          />

          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            {product.isNew && (
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-lg"
              >
                NEW
              </motion.span>
            )}
            {discountPercentage > 0 && (
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-lg"
              >
                -{discountPercentage}% OFF
              </motion.span>
            )}
          </div>

          <AnimatePresence>
            {!isInStock && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
              >
                <span className="bg-red-500 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold shadow-lg">
                  Out of Stock
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {showOwnerActions && (
            <motion.div
              className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(product._id);
                }}
                className="p-2 sm:p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl"
                title="Edit Product"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                }}
                className="p-2 sm:p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </motion.button>
            </motion.div>
          )}

          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 sm:pb-6"
          >
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
              className="text-white font-semibold text-xs sm:text-sm bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 rounded-lg"
            >
              View Details
            </motion.span>
          </motion.div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1 sm:mb-1.5 truncate">
            {product.category || 'Clothing'}
          </p>

          <h3
            className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 mb-2 sm:mb-3 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {rating > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-700">
                {rating.toFixed(1)}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400">
                ({totalReviews})
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {formatPrice(displayPrice)}
            </span>
            {displayOriginalPrice && displayOriginalPrice !== displayPrice && (
              <>
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {formatPrice(displayOriginalPrice)}
                </span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded"
                >
                  {discountPercentage}% OFF
                </motion.span>
              </>
            )}
          </div>

          <div className="mt-auto">
            {isInStock ? (
              <span className="text-[10px] sm:text-xs text-green-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
                In Stock
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs text-red-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{product.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Forever'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
