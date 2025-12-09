import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Trash2, Plus, Minus, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Card = ({
  item,
  type = 'wishlist', // 'wishlist' or 'cart'
  onRemove,
  onMoveToCart,
  onMoveToWishlist,
  onQuantityChange,
  isRemoving = false,
  isMoving = false,
  index = 0,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Helper functions
  const getProductImage = (item) => {
    try {
      if (type === 'cart') {
        // Cart item structure: item.variant.images or item.product.variants[0].images
        if (item.variant?.images?.length > 0 && item.variant.images[0]?.url) {
          return item.variant.images[0].url;
        }
        if (item.product?.variants?.length > 0 && item.product.variants[0]?.images?.length > 0) {
          const variantImage = item.product.variants[0].images[0];
          return typeof variantImage === 'object' && variantImage.url ? variantImage.url : variantImage;
        }
        if (item.product?.images?.length > 0) {
          const productImage = item.product.images[0];
          return typeof productImage === 'object' && productImage.url ? productImage.url : productImage;
        }
      } else {
        // Wishlist item structure: direct product object
        if (item.variants?.length > 0 && item.variants[0]?.images?.length > 0) {
          const variantImage = item.variants[0].images[0];
          return typeof variantImage === 'object' && variantImage.url ? variantImage.url : variantImage;
        }
        if (item.images?.length > 0) {
          const productImage = item.images[0];
          return typeof productImage === 'object' && productImage.url ? productImage.url : productImage;
        }
      }
    } catch (error) {
      console.error('Error getting product image:', error);
    }
    return '/api/placeholder/400/400';
  };

  const getProductColor = (item) => {
    if (type === 'cart') {
      return item.variant?.color || item.product?.variants?.[0]?.color || '#000000';
    }
    return item.variants?.[0]?.color || item.color || '#000000';
  };

  const getProductName = (item) => {
    if (type === 'cart') {
      return item.product?.name || 'Unnamed Product';
    }
    return item.name || 'Unnamed Product';
  };

  const getProductId = (item) => {
    if (type === 'cart') {
      return item.product?._id || item._id;
    }
    return item._id;
  };

  const getSizeName = (item) => {
    if (type === 'cart') {
      if (item.size?.size) return item.size.size;
      if (item.size && typeof item.size === 'string') return item.size;
    }
    return 'N/A';
  };

  // Animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.25, 0, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.2 }
    }
  };

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = (e) => {
    console.warn('Image failed to load:', e.target.src);
    setImageError(true);
    e.target.src = '/api/placeholder/400/400';
  };

  // Reset image state when item changes (for cart quantity updates)
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [item._id, item.quantity, JSON.stringify(item.product)]);

  // Wishlist Card Layout
  if (type === 'wishlist') {
    return (
      <AnimatePresence>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate={isRemoving || isMoving ? "exit" : "visible"}
          exit="exit"
          whileHover={{ 
            y: -8, 
            transition: { duration: 0.3, ease: 'easeOut' }
          }}
          className={`group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-shadow duration-500 ${className}`}
        >
          <Link to={`/product/${getProductId(item)}`} className="block">
            {/* Image Container */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="aspect-square relative">
                {/* Image Skeleton */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Loading...</div>
                  </div>
                )}
                
                <motion.img
                  key={`${item._id}-${getProductImage(item)}`} // Add key for re-render
                  variants={imageVariants}
                  initial="hidden"
                  animate={imageLoaded ? "visible" : "hidden"}
                  src={getProductImage(item)}
                  alt={getProductName(item)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />

                {/* Overlay Actions */}
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  whileHover="visible"
                  className="absolute inset-0"
                >
                  {/* Remove Button */}
                  <motion.div
                    variants={buttonVariants}
                    className="absolute top-4 right-4"
                  >
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove?.(item);
                      }}
                      primary={false}
                      className="p-3 rounded-full shadow-lg bg-white hover:bg-red-50 border border-gray-100"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </Button>
                  </motion.div>

                  {/* Category Badge */}
                  {item.category && (
                    <motion.div
                      variants={buttonVariants}
                      className="absolute top-4 left-4"
                    >
                      <div className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full shadow-lg">
                        {item.category}
                      </div>
                    </motion.div>
                  )}

                  {/* Quick View Button */}
                  <motion.div
                    variants={buttonVariants}
                    className="absolute bottom-4 right-4"
                  >
                    <Button
                      primary={false}
                      className="p-3 rounded-full shadow-lg bg-white hover:bg-gray-50 border border-gray-100"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[48px] group-hover:text-black transition-colors">
                {getProductName(item)}
              </h3>

              {/* Rating */}
              {item.rating && (
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(item.rating)
                            ? 'text-black fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">({item.rating})</span>
                </div>
              )}

              {/* Price */}
              <div className="mb-4">
                <p className="text-2xl font-bold text-black">${item.price}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveToCart?.(getProductId(item));
                  }}
                  disabled={isMoving}
                  icon={isMoving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShoppingBag className="w-4 h-4" />
                  )}
                  className="w-full"
                >
                  {isMoving ? 'Adding...' : 'Add to Cart'}
                </Button>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove?.(item);
                  }}
                  primary={false}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="w-full hover:text-red-600 hover:bg-gray-50"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Cart Card Layout
  return (
    <AnimatePresence>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isRemoving ? "exit" : "visible"}
        exit="exit"
        whileHover={{ 
          y: -2, 
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 ${className}`}
      >
        <div className="flex gap-4">
          {/* Image */}
          <Link to={`/product/${getProductId(item)}`} className="relative group flex-shrink-0">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400 text-xs">Loading...</div>
                </div>
              )}
              
              <motion.img
                key={`${item._id}-${item.quantity}-${getProductImage(item)}`} // Add quantity to key
                variants={imageVariants}
                initial="hidden"
                animate={imageLoaded ? "visible" : "hidden"}
                src={getProductImage(item)}
                alt={getProductName(item)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <Link to={`/product/${getProductId(item)}`} className="flex-1 no-underline">
                <h3 className="font-semibold text-gray-900 text-lg hover:text-gray-700 transition-colors">
                  {getProductName(item)}
                </h3>
                <div className="flex gap-2 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: getProductColor(item) }}
                    />
                    Color
                  </span>
                  <span>• {getSizeName(item)}</span>
                </div>
              </Link>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMoveToWishlist?.(item, 'wishlist');
                    }}
                    primary={false}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                    icon={<Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />}
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove?.(item, 'remove');
                    }}
                    primary={false}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                    icon={<X className="w-4 h-4 text-gray-400 hover:text-red-500" />}
                  />
                </motion.div>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="flex items-center justify-between">
              {/* Quantity Controls */}
              <div className="flex items-center bg-gray-100 rounded-xl">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onQuantityChange?.(item._id, item.quantity - 1);
                    }}
                    primary={false}
                    className="p-2 hover:bg-gray-200 rounded-l-xl transition-colors duration-200"
                    icon={<Minus className="w-4 h-4" />}
                  />
                </motion.div>
                
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                  {item.quantity || 1}
                </span>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onQuantityChange?.(item._id, item.quantity + 1);
                    }}
                    primary={false}
                    className="p-2 hover:bg-gray-200 rounded-r-xl transition-colors duration-200"
                    icon={<Plus className="w-4 h-4" />}
                  />
                </motion.div>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">${(item.unitPrice || 0).toFixed(2)} each</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Card;