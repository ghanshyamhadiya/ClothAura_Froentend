import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, Eye, Sparkles, Package } from "lucide-react";
import { useCartWishlist } from "../../context/CartWhislistContext";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../model/ConfirmationModel";
import Button from "../Button";
import Loading from "../Loading";
import AddCartModal from "../common/AddCartModal";

const WishList = () => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, moveFromWishlistToCart, loading, cartLoading, wishlistLoading } = useCartWishlist();

  const [confirm, setConfirm] = useState({ isOpen: false, item: null });
  const [addCart, setAddCart] = useState({ isOpen: false, productId: null });
  const [hoveredItem, setHoveredItem] = useState(null);

  const openAddCart = (productId) => setAddCart({ isOpen: true, productId });
  const closeAddCart = () => setAddCart({ isOpen: false, productId: null });

  const handleConfirmOpen = (item) => setConfirm({ isOpen: true, item });
  const handleConfirmClose = () => setConfirm({ isOpen: false, item: null });

  const handleConfirmRemove = async () => {
    if (!confirm.item) return;
    await removeFromWishlist(confirm.item._id);
    handleConfirmClose();
  };

  const handleAddToCartFromModal = async (productId, variantId, sizeId, qty) => {
    await moveFromWishlistToCart(productId, variantId, sizeId, qty);
    closeAddCart();
  };

  if (loading && wishlist.length === 0) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 bg-black rounded-2xl">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-500 mt-1">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <Heart className="w-32 h-32 text-gray-200" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-gray-300" />
                </motion.div>
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              Save items you love by clicking the heart icon on any product
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-900 transition-colors shadow-lg"
            >
              <Package className="w-5 h-5" />
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlist.map((item, index) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05 }}
                  onHoverStart={() => setHoveredItem(item._id)}
                  onHoverEnd={() => setHoveredItem(null)}
                  className="group relative bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <motion.img
                      src={item.images?.[0]?.url || "/placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: hoveredItem === item._id ? 1.05 : 1
                      }}
                      transition={{ duration: 0.4 }}
                    />

                    {/* Overlay on hover */}
                    <AnimatePresence>
                      {hoveredItem === item._id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
                        >
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/product/${item._id}`)}
                            className="p-3 bg-white rounded-full shadow-lg"
                          >
                            <Eye className="w-6 h-6 text-gray-900" />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Wishlist badge */}
                    <div className="absolute top-3 left-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className="p-2 bg-white rounded-xl shadow-md"
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      </motion.div>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredItem === item._id ? 1 : 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleConfirmOpen(item)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-xl shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 group-hover:text-black transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{item.category}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{item.variants?.[0]?.sizes?.[0]?.price?.toFixed(2) || 'N/A'}
                      </span>
                      {item.variants?.[0]?.sizes?.[0]?.mrp > item.variants?.[0]?.sizes?.[0]?.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{item.variants?.[0]?.sizes?.[0]?.mrp?.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openAddCart(item._id)}
                      className="w-full py-3 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick action section */}
        {wishlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-gray-50 rounded-3xl p-8 border border-gray-100"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Sparkles className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Ready to shop?</h3>
                  <p className="text-gray-500 text-sm">Your wishlist items are waiting for you</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/")}
                  className="px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Continue Shopping
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmRemove}
        title="Remove from Wishlist"
        message={`Remove "${confirm.item?.name}" from your wishlist?`}
        confirmText="Remove"
        cancelText="Keep"
        variant="danger"
      />

      {/* Add to Cart Modal */}
      <AddCartModal
        isOpen={addCart.isOpen}
        onClose={closeAddCart}
        productId={addCart.productId}
        onAddToCart={handleAddToCartFromModal}
        onSuccess={() => { }}
      />
    </motion.div>
  );
};

export default WishList;
