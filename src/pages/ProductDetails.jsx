import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  ChevronDown,
  Info,
  Star,
  Minus,
  Plus,
  CreditCard,
  Wallet,
} from "lucide-react";

import ProductImageScroller from "../components/products/ProductImageScroller";
import ProductReviewsLazy from "../components/products/ProductReviewsLazy";
import HorizontalProductCarousel from "../components/products/HorizontalProductCarousel";
import Loading from "../components/Loading";
import Button from "../components/Button";

import { getProductById } from "../services/productService";
import { useCartWishlist } from "../context/CartWhislistContext";
import { useReview } from "../context/ReviewContext";
import { useAuth } from "../context/AuthContext";
import { useAuthModel } from "../context/AuthModelContext";
import { useProducts } from "../context/ProductContext";
import { toastService } from "../services/toastService";

const paymentMethodIcons = {
  cod: { icon: Truck, label: "Cash on Delivery" },
  card: { icon: CreditCard, label: "Card Payment" },
  upi: { icon: Wallet, label: "UPI" },
  wallet: { icon: Wallet, label: "Digital Wallet" },
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openModel } = useAuthModel();
  const { isAuthenticated } = useAuth();
  const { products } = useProducts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const { productStats, fetchProductReviews } = useReview();
  const {
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    isInCart,
    isInWishlist,
    getCartItem,
    loading: cartLoading,
  } = useCartWishlist();

  const selectedVariant = product?.variants?.[selectedColorIndex];
  const selectedSize = selectedVariant?.sizes?.[selectedSizeIndex];
  const images = selectedVariant?.images?.map((img) => img.url) || [];
  const inStock = selectedSize?.stock > 0;
  const maxQty = selectedSize?.stock || 1;

  const inCart = isAuthenticated && isInCart(id, selectedVariant?._id, selectedSize?._id);
  const cartItem = isAuthenticated && getCartItem(id, selectedVariant?._id, selectedSize?._id);

  const rating = productStats?.averageRating || 0;
  const totalReviews = productStats?.totalReviews || 0;

  const discount =
    selectedSize?.originalPrice > selectedSize?.price
      ? Math.round(((selectedSize.originalPrice - selectedSize.price) / selectedSize.originalPrice) * 100)
      : 0;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
        if (isAuthenticated) setIsWishlisted(isInWishlist(id));
      } catch {
        toastService.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    // Fetch reviews for this product
    fetchProductReviews(id);
  }, [id, isAuthenticated, isInWishlist, navigate, fetchProductReviews]);

  // Get related products (same category, different product)
  useEffect(() => {
    if (product && products.length > 0) {
      const related = products
        .filter(p => p._id !== product._id && p.category === product.category)
        .slice(0, 6);
      setRelatedProducts(related);
    }
  }, [product, products]);

  useEffect(() => {
    if (selectedVariant?.sizes) {
      const firstInStock = selectedVariant.sizes.findIndex((s) => s.stock > 0);
      setSelectedSizeIndex(firstInStock >= 0 ? firstInStock : null);
    }
  }, [selectedColorIndex, selectedVariant]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return openModel("login", { intent: { action: "add-to-cart" } });
    if (!selectedSize) {
      setShowSizeError(true);
      setTimeout(() => setShowSizeError(false), 3000);
      return;
    }
    try {
      inCart
        ? await removeFromCart(cartItem._id)
        : await addToCart(id, selectedVariant._id, selectedSize._id, quantity);
    } catch {
      toastService.error("Failed to update cart");
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) return openModel("login", { intent: { action: "wishlist" } });
    try {
      isWishlisted ? await removeFromWishlist(id) : await addToWishlist(id);
      setIsWishlisted(!isWishlisted);
    } catch {
      toastService.error("Wishlist update failed");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toastService.success("Link copied!");
    }
  };

  const handleRelatedProductClick = (relatedProduct) => {
    navigate(`/product/${relatedProduct._id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <Loading />;
  if (!product) return null;

  return (
    <>
      <style jsx global>{`html { scroll-behavior: smooth; }`}</style>

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile: Image First | Desktop: Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* IMAGE GALLERY */}
            <div className="order-1 md:order-none">
              <ProductImageScroller images={images.length ? images : ["/placeholder.jpg"]} />
            </div>

            {/* PRODUCT INFO */}
            <div className="order-2 md:order-none space-y-8">
              {/* Title & Rating */}
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {product.category}
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-black">{product.name}</h1>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.round(rating) ? "fill-black text-black" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => setIsReviewsOpen(true)}
                    className="text-sm font-medium hover:underline"
                  >
                    {totalReviews} reviews
                  </button>
                </div>
              </div>

              {/* PRICE */}
              <div className="py-5 border-y border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">
                    ₹{selectedSize?.price?.toLocaleString() || "0"}
                  </span>
                  {discount > 0 && (
                    <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded-full">
                      −{discount}%
                    </span>
                  )}
                </div>
                {selectedSize?.originalPrice > selectedSize?.price && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="line-through">
                      ₹{selectedSize.originalPrice.toLocaleString()}
                    </span>
                    <span className="ml-2 text-green-600 font-medium">
                      Save ₹{(selectedSize.originalPrice - selectedSize.price).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              {/* COLOR */}
              {product.variants.length > 1 && (
                <div>
                  <p className="font-semibold mb-3">Color</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedColorIndex(i);
                          setSelectedSizeIndex(null);
                          setQuantity(1);
                        }}
                        className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedColorIndex === i
                            ? "bg-black text-white border-black"
                            : "border-gray-300 hover:border-black"
                          }`}
                      >
                        {v.color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SIZE */}
              {selectedVariant?.sizes?.length > 0 && (
                <div>
                  <p className="font-semibold mb-3">Size</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedVariant.sizes.map((size, i) => {
                      const outOfStock = size.stock === 0;
                      return (
                        <button
                          key={i}
                          onClick={() => !outOfStock && setSelectedSizeIndex(i)}
                          disabled={outOfStock}
                          className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${selectedSizeIndex === i
                              ? "bg-black text-white border-black"
                              : outOfStock
                                ? "border-gray-200 text-gray-400 opacity-60"
                                : "border-gray-300 hover:border-black"
                            }`}
                        >
                          {size.size}
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
                        className="text-red-600 text-sm font-medium mt-2"
                      >
                        Please select a size
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* QUANTITY */}
              {inStock && selectedSize && (
                <div>
                  <p className="font-semibold mb-3">Quantity</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-3 hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-16 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                        className="p-3 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">{maxQty} left</span>
                  </div>
                </div>
              )}

              {/* CTA BUTTONS */}
              <div className="pt-6 flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={cartLoading || !inStock || !selectedSize}
                  className="flex-1 h-14 text-lg font-bold rounded-2xl bg-black text-white hover:bg-gray-900 transition shadow-lg"
                >
                  {inCart ? "Remove from Cart" : "Add to Cart"}
                </Button>

                <button
                  onClick={toggleWishlist}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all shadow-lg ${isWishlisted
                      ? "bg-red-50 border-red-300"
                      : "bg-white border-gray-300 hover:border-black"
                    }`}
                >
                  <Heart size={24} className={isWishlisted ? "fill-red-600 text-red-600" : "text-gray-700"} />
                </button>

                <button
                  onClick={handleShare}
                  className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg hover:border-black transition"
                >
                  <Share2 size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Payment Methods */}
              {product.allowedPaymentMethods && product.allowedPaymentMethods.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border">
                  <p className="text-sm font-semibold mb-3">Payment Options</p>
                  <div className="grid grid-cols-2 gap-3">
                    {product.allowedPaymentMethods.map((method) => {
                      const Icon = paymentMethodIcons[method];
                      return Icon ? (
                        <div key={method} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                          <Icon.icon size={18} />
                          <span className="text-xs font-medium">{Icon.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="py-6 border-t space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${inStock ? "bg-green-600" : "bg-red-600"}`} />
                  <span className={`font-semibold ${inStock ? "text-green-600" : "text-red-600"}`}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Truck, text: "Free Delivery" },
                    { icon: RotateCcw, text: "7-Day Returns" },
                    { icon: Shield, text: "1-Year Warranty" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
                      <item.icon size={20} className="text-gray-700" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Info size={20} /> Product Details
                </h3>
                <div className="bg-gray-50 rounded-xl p-6 border">
                  <p className={`text-gray-700 leading-relaxed ${!showFullDesc ? "line-clamp-4" : ""}`}>
                    {product.description}
                  </p>
                  {product.description?.length > 200 && (
                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="mt-4 text-sm font-medium flex items-center gap-1 hover:text-black"
                    >
                      {showFullDesc ? "Show Less" : "Read More"}
                      <ChevronDown size={16} className={`transition ${showFullDesc ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-16 border-t pt-8">
            <button
              onClick={() => setIsReviewsOpen(!isReviewsOpen)}
              className="w-full flex items-center justify-between py-5 text-left hover:bg-gray-50 rounded-xl px-2 transition"
            >
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      className={i < Math.round(rating) ? "fill-black text-black" : "text-gray-300"}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold">Customer Reviews ({totalReviews})</span>
              </div>
              <motion.div animate={{ rotate: isReviewsOpen ? 180 : 0 }}>
                <ChevronDown size={28} className="text-gray-600" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isReviewsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-8">
                    <ProductReviewsLazy productId={id} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <HorizontalProductCarousel
            products={relatedProducts}
            title="You May Also Like"
            onProductClick={handleRelatedProductClick}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetails;