import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, ShoppingBag, Trash2, X, Plus, Minus, Check } from 'lucide-react';
import { useCartWishlist } from '../../context/CartWhislistContext';
import { useNavigate } from 'react-router-dom';
import { getProductById } from '../../services/productService';
import Button from '../Button';
import Loading from '../Loading';

const AddCartModal = ({ isOpen, onClose, productId, onAddToCart, onSuccess }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeError, setShowSizeError] = useState(false);

  const selectedVariant = product?.variants?.[selectedVariantIndex];
  const selectedSize = selectedVariant?.sizes?.[selectedSizeIndex];
  const maxQty = selectedSize?.stock || 1;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && productId) {
      fetchProduct();
    }
  }, [productId, isOpen]);

  useEffect(() => {
    if (selectedVariant?.sizes) {
      const firstInStock = selectedVariant.sizes.findIndex(s => s.stock > 0);
      setSelectedSizeIndex(firstInStock >= 0 ? firstInStock : null);
    }
  }, [selectedVariantIndex, selectedVariant]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 2000);
      return;
    }
    await onAddToCart(productId, selectedVariant._id, selectedSize._id, quantity);
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold">Add to Cart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loading />
            </div>
          ) : product ? (
            <>
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Product Info */}
                <div className="flex gap-4">
                  <img
                    src={selectedVariant?.images?.[0]?.url || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{product.category}</p>
                    <p className="text-2xl font-bold mt-2">
                      ₹{selectedSize?.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                {/* Color Selection */}
                {product.variants.length > 1 && (
                  <div>
                    <label className="font-semibold mb-3 block">Color</label>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant, index) => (
                        <button
                          key={variant._id}
                          onClick={() => {
                            setSelectedVariantIndex(index);
                            setSelectedSizeIndex(null);
                            setQuantity(1);
                          }}
                          className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            selectedVariantIndex === index
                              ? 'bg-black text-white border-black scale-105'
                              : 'border-gray-300 hover:border-black'
                          }`}
                        >
                          {variant.color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {selectedVariant?.sizes?.length > 0 && (
                  <div>
                    <label className="font-semibold mb-3 block">Size</label>
                    <div className="grid grid-cols-4 gap-3">
                      {selectedVariant.sizes.map((size, index) => {
                        const outOfStock = size.stock === 0;
                        return (
                          <button
                            key={size._id}
                            onClick={() => !outOfStock && setSelectedSizeIndex(index)}
                            disabled={outOfStock}
                            className={`py-3 rounded-xl border-2 text-sm font-medium transition-all relative ${
                              selectedSizeIndex === index
                                ? 'bg-black text-white border-black scale-105'
                                : outOfStock
                                ? 'border-gray-200 text-gray-400 opacity-50 line-through'
                                : 'border-gray-300 hover:border-black'
                            }`}
                          >
                            {size.size}
                            {selectedSizeIndex === index && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <AnimatePresence>
                      {showSizeError && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-red-600 text-sm font-medium mt-3 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                          Please select a size
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Quantity Selection */}
                {selectedSize && selectedSize.stock > 0 && (
                  <div>
                    <label className="font-semibold mb-3 block">Quantity</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 hover:bg-gray-50 transition"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                          disabled={quantity >= maxQty}
                          className="p-3 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-600">
                        {maxQty} available
                      </span>
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                {selectedSize && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${selectedSize.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`font-semibold ${selectedSize.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {selectedSize.stock > 0 ? `${selectedSize.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || selectedSize.stock === 0}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 border-2 border-gray-300 rounded-2xl font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddCartModal;