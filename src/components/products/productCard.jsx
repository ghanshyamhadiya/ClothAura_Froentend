
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const ProductCard = ({ product, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate discount percentage from originalPrice and price
  const discountPercentage = useMemo(() => {
    if (product.originalPrice && product.price) {
      const original = parseFloat(String(product.originalPrice).replace(/[^0-9.-]+/g, ''));
      const current = parseFloat(String(product.price).replace(/[^0-9.-]+/g, ''));
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    }
    return product.discount || 0;
  }, [product.originalPrice, product.price, product.discount]);

  // Format price with rupee symbol
  const formatPrice = (price) => {
    if (!price) return '₹0';
    const numericPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ''));
    return `₹${numericPrice.toLocaleString('en-IN')}`;
  };

  const getProductImage = () => {
    // Handle variants with images
    const variant = product.variants?.[0];
    const firstImage = variant?.images?.[0] || product.images?.[0];

    if (typeof firstImage === 'string') {
      return firstImage;
    }

    if (firstImage && firstImage.url) {
      return firstImage.url;
    }

    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
  };

  // Get average rating from product stats
  const rating = product.averageRating || product.rating || 0;
  const totalReviews = product.totalReviews || product.reviews || 0;

  return (
    <motion.div
      onClick={onClick}
      className="relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm hover:shadow-xl overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      {/* Image Container */}
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

        {/* Badges */}
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

        {/* Out of Stock Overlay */}
        <AnimatePresence>
          {!product.inStock && (
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

        {/* View Details Overlay - Appears on Hover */}
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

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Category */}
        <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1 sm:mb-1.5 truncate">
          {product.category}
        </p>

        {/* Product Name */}
        <h3
          className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 mb-2 sm:mb-3 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}
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

        {/* Price Section */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice !== product.price && (
            <>
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
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

        {/* Stock Status */}
        <div className="mt-auto">
          {product.inStock ? (
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
  );
};

export default ProductCard;