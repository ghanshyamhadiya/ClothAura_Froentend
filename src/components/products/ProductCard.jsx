import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

const ProductCard = ({ product, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const formatPrice = (price) => {
    if (!price) return '₹0';
    const numericPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ''));
    return `₹${numericPrice.toLocaleString('en-IN')}`;
  };

  const getProductImage = () => {
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

  const rating = product.averageRating || product.rating || 0;
  const totalReviews = product.totalReviews || product.reviews || 0;

  return (
    <motion.div
      onClick={onClick}
      className="relative flex flex-col w-full h-full bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden cursor-pointer group border border-gray-200 hover:border-gray-300 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          {!imageLoaded && (
            <motion.div
              className="absolute inset-0 bg-gray-200 animate-pulse"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        <motion.img
          src={getProductImage()}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
            setImageLoaded(true);
          }}
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black text-white text-xs px-3 py-1 rounded-full font-medium shadow-md"
            >
              NEW
            </motion.span>
          )}
          {discountPercentage > 0 && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md"
            >
              -{discountPercentage}%
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          {!product.inStock && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <span className="bg-white text-black text-sm px-4 py-2 rounded-md font-semibold shadow-lg">
                Out of Stock
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4"
          initial={false}
        >
          <motion.span
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-white text-sm font-medium bg-white/10 backdrop-blur-md px-6 py-2 rounded-full"
          >
            View Details
          </motion.span>
        </motion.div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1 truncate">
          {product.category}
        </p>

        <h3
          className="font-semibold text-base text-gray-900 mb-3 leading-tight line-clamp-2"
          title={product.name}
        >
          {product.name}
        </h3>

        {rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(rating) ? 'text-black' : 'text-gray-300'}
                  fill="currentColor"
                />
              ))}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({totalReviews})
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-green-600">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice !== product.price && (
            <span className="text-sm text-gray-700 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto">
          {product.inStock ? (
            <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              In Stock
            </span>
          ) : (
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
