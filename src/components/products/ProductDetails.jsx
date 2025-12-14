import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Share2, Truck, Shield, RotateCcw, ChevronDown, Info,
  Star, Minus, Plus, Check, CreditCard, Wallet
} from 'lucide-react';
import {
  getProductById, onProductUpdate, offProductUpdate,
  onProductDelete, offProductDelete
} from '../../services/productService';
import Loading from '../Loading';
import Button from '../Button';
import ProductImageScroller from './ProductImageScroller';
import { useCartWishlist } from '../../context/CartWhislistContext';
import ProductReviews from '../review/ProductReviews';
import { useAuth } from '../../context/AuthContext';
import { useReview } from '../../context/ReviewContext';
import { toastService } from '../../services/toastService';
import { useAuthModel } from '../../context/AuthModelContext';

const paymentMethodIcons = {
  cod: { icon: Truck, label: 'Cash on Delivery' },
  card: { icon: CreditCard, label: 'Card Payment' },
  upi: { icon: Wallet, label: 'UPI' },
  wallet: { icon: Wallet, label: 'Digital Wallet' }
};

function ProductDetails() {
  const { id } = useParams();
  const { openModel } = useAuthModel();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const { productStats, fetchProductReviews, resetProductStats } = useReview();
  const {
    addToCart, removeFromCart, addToWishlist, removeFromWishlist,
    isInCart, isInWishlist, getCartItem, loading: ctxLoading
  } = useCartWishlist();

  const selectedVariant = product?.variants?.[selectedColorIndex];
  const selectedSize = selectedVariant?.sizes?.[selectedSizeIndex];
  const images = selectedVariant?.images?.map(img => img.url) || [];
  const inStock = selectedSize?.stock > 0;
  const maxQty = selectedSize?.stock || 1;

  // Check cart/wishlist only if authenticated
  const inCart = isAuthenticated ? isInCart(id, selectedVariant?._id, selectedSize?._id) : false;
  const cartItem = isAuthenticated ? getCartItem(id, selectedVariant?._id, selectedSize?._id) : null;

  const rating = productStats?.averageRating || 0;
  const totalReviews = productStats?.totalReviews || 0;

  const allowedPaymentMethods = product?.allowedPaymentMethods || ['cod', 'card', 'upi', 'wallet'];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        console.log(data);
        setProduct(data);
        // Only check wishlist if authenticated
        if (isAuthenticated) {
          setIsWishlisted(isInWishlist(id));
        }
      } catch (err) {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (id) {
      fetchProductReviews(id);
    }

    return () => {
      resetProductStats();
    };
  }, [id, fetchProductReviews, resetProductStats]);

  useEffect(() => {
    const handleUpdate = (updated) => {
      if (updated._id === id) {
        setProduct(updated);
        if (isAuthenticated) {
          setIsWishlisted(isInWishlist(id));
        }
      }
    };
    const handleDelete = (deletedId) => {
      if (deletedId === id) navigate('/', { replace: true });
    };
    onProductUpdate(handleUpdate);
    onProductDelete(handleDelete);
    return () => {
      offProductUpdate(handleUpdate);
      offProductDelete(handleDelete);
    };
  }, [id, navigate, isAuthenticated]);

  useEffect(() => {
    if (selectedVariant?.sizes) {
      const available = selectedVariant.sizes.findIndex(s => s.stock > 0);
      setSelectedSizeIndex(available >= 0 ? available : null);
    }
  }, [selectedColorIndex, selectedVariant]);


  const promptLoginFor = (intent, productId) => {
    openModel('login', { intent, fromPath: `/product/${productId}` });
  };


  const handleAddToCart = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      promptLoginFor({ action: 'add-to-cart', productId: id });
      return;
    }

    if (!selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 3000);
      return;
    }
    try {
      if (inCart && cartItem?._id) {
        await removeFromCart(cartItem._id);
      } else {
        await addToCart(id, selectedVariant._id, selectedSize._id, quantity);
      }
    } catch (err) {
      setError("Failed to update cart");
    }
  };

  const toggleWishlist = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      promptLoginFor({ action: 'add-to-wishlist', productId: id });
      return;
    }

    try {
      if (isWishlisted) await removeFromWishlist(id);
      else await addToWishlist(id);
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toastService.success("Link copied to clipboard!");
    }
  };

  if (loading) return <Loading />;
  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-gray-600 mb-4">{error || "Product not found"}</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    </div>
  );

  const discount = selectedSize?.originalPrice > selectedSize?.price
    ? Math.round(((selectedSize.originalPrice - selectedSize.price) / selectedSize.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white mt-[10vh]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-24 self-start">
            <ProductImageScroller images={images.length ? images : ['/placeholder.jpg']} />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 mt-8 lg:mt-0"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm uppercase tracking-wider text-gray-500">
                  {product.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleWishlist}
                  className="p-3 rounded-full hover:bg-gray-100"
                >
                  <Heart size={22} className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-3 rounded-full hover:bg-gray-100"
                >
                  <Share2 size={22} className="text-gray-600" />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className={i < Math.round(rating) ? "fill-black text-black" : "text-gray-300"} />
                ))}
              </div>
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => setIsReviewsOpen(true)}
                className="text-sm hover:underline font-medium"
              >
                {totalReviews.toLocaleString()} reviews
              </button>
            </div>

            <div className="space-y-2 py-4 border-y border-gray-200">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  ₹{selectedSize?.price?.toLocaleString() || '0'}
                </span>
                {discount > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              {selectedSize?.originalPrice > selectedSize?.price && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-sm line-through">
                    ₹{selectedSize.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    Save ₹{(selectedSize.originalPrice - selectedSize.price).toLocaleString()}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500">Inclusive of all taxes</p>
            </div>

            {/* Payment Methods */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Payment Methods</h4>
              <div className="grid grid-cols-2 gap-2">
                {allowedPaymentMethods.map((method) => {
                  const PaymentIcon = paymentMethodIcons[method];
                  return (
                    <div
                      key={method}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                    >
                      <PaymentIcon.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        {PaymentIcon.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {product.variants.length > 1 && (
              <div>
                <p className="font-semibold mb-3">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => (
                    <motion.button
                      key={i}
                      onClick={() => {
                        setSelectedColorIndex(i);
                        setSelectedSizeIndex(null);
                        setQuantity(1);
                      }}
                      className={`px-5 py-2 rounded-lg border-2 text-sm font-medium transition-all
                        ${selectedColorIndex === i
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-black'
                        }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {v.color}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant?.sizes?.length > 0 && (
              <div>
                <p className="font-semibold mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.sizes.map((size, i) => {
                    const outOfStock = size.stock === 0;
                    return (
                      <motion.button
                        key={i}
                        onClick={() => !outOfStock && setSelectedSizeIndex(i)}
                        disabled={outOfStock}
                        className={`px-5 py-2 rounded-lg border-2 text-sm font-medium transition-all
                          ${selectedSizeIndex === i
                            ? 'bg-black text-white border-black'
                            : outOfStock
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                              : 'border-gray-300 hover:border-black'
                          }`}
                        whileHover={{ scale: outOfStock ? 1 : 1.05 }}
                        whileTap={{ scale: outOfStock ? 1 : 0.95 }}
                      >
                        {size.size}
                      </motion.button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {showSizeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-sm mt-2 font-medium"
                    >
                      Please select a size
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {inStock && selectedSize && (
              <div>
                <p className="font-semibold mb-3">Quantity</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-16 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="p-3 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {maxQty} left
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={ctxLoading || !inStock || !selectedSize}
                className={`flex-1 py-4 text-lg font-semibold rounded-xl
                  ${(inStock && selectedSize)
                    ? inCart ? 'bg-gray-800 hover:bg-black' : 'bg-black hover:bg-gray-800'
                    : 'bg-gray-300 cursor-not-allowed'
                  } text-white`}
                icon={inCart ? <Check size={20} /> : null}
              >
                {inCart ? 'Remove from Cart' : inStock && selectedSize ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleWishlist}
                className={`p-4 rounded-xl border-2 ${isWishlisted ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-black'}`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
              </motion.button>
            </div>

            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <button
                    onClick={() => openModel('login', { state: { from: `/product/${id}` } })}
                    className="font-semibold underline hover:text-blue-900"
                  >
                    Login
                  </button>
                  {' '}to add items to cart and wishlist
                </p>
              </div>
            )}

            <div className="space-y-4 py-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Truck, text: 'Free Delivery' },
                  { icon: RotateCcw, text: '7-Day Returns' },
                  { icon: Shield, text: '1-Year Warranty' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <item.icon size={18} className="text-gray-600" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold">Product Details</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border">
                <p className={`text-gray-700 leading-relaxed ${!showFullDesc ? 'line-clamp-4' : ''}`}>
                  {product.description}
                </p>
                {product.description?.length > 200 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="flex items-center gap-1 mt-4 text-sm font-medium hover:text-black"
                  >
                    {showFullDesc ? 'Show Less' : 'Read More'}
                    <ChevronDown size={16} className={`transition-transform ${showFullDesc ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ height: 80 }}
          animate={{ height: isReviewsOpen ? 'auto' : 80 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 overflow-hidden bg-gray-50 rounded-3xl"
        >
          <button
            onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            className="w-full flex items-center justify-between px-8 py-6 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className={i < Math.round(rating) ? "fill-black text-black" : "text-gray-300"} />
                ))}
              </div>
              <span className="text-2xl font-bold">
                Reviews ({totalReviews.toLocaleString()})
              </span>
            </div>
            <motion.div
              animate={{ rotate: isReviewsOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={28} className="text-gray-600" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isReviewsOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="px-4 sm:px-8 pb-12"
              >
                <ProductReviews productId={id} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style jsx>{`
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}

export default ProductDetails;