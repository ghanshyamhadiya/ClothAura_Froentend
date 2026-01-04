import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useCartWishlist } from "../../context/CartWhislistContext";
import ConfirmationModal from "../model/ConfirmationModel";
import Button from "../Button";
import Loading from "../Loading";
import AddCartModal from "../common/AddCartModal";
import { useNavigate } from "react-router-dom";

const WishList = () => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, addToCart, loading } = useCartWishlist();

  const [confirm, setConfirm] = useState({ isOpen: false, item: null });
  const [addCart, setAddCart] = useState({ isOpen: false, productId: null });

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
    await addToCart(productId, variantId, sizeId, qty);
    // remove from wishlist after successful add
    try {
      await removeFromWishlist(productId);
    } catch (err) {
      // ignore removal errors here
      console.error("Failed to remove from wishlist after adding to cart", err);
    }
    closeAddCart();
  };

  if (loading) return <Loading />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {wishlist.length === 0 ? (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-center py-24">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save items you love</p>
            <Button onClick={() => navigate("/")} className="bg-black text-white px-8 py-3 rounded-lg">
              Browse Products
            </Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {wishlist.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white border rounded-xl p-4 flex flex-col"
                >
                  <img
                    src={item.images?.[0]?.url || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.category}</p>
                  <div className="flex gap-2 mt-auto">
                    <Button onClick={() => openAddCart(item._id)} className="flex-1" icon={<ShoppingBag className="w-4 h-4" />}>
                      Add to Cart
                    </Button>
                    <Button onClick={() => handleConfirmOpen(item)} variant="outline" icon={<Trash2 className="w-4 h-4" />} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmRemove}
        title="Remove from Wishlist"
        message="Remove this item from your wishlist?"
        confirmText="Remove"
        cancelText="Cancel"
      />

      <AddCartModal
        isOpen={addCart.isOpen}
        onClose={closeAddCart}
        productId={addCart.productId}
        onAddToCart={handleAddToCartFromModal}
        onSuccess={() => {
          /* handled inside handleAddToCartFromModal */
        }}
      />
    </motion.div>
  );
};

export default WishList;
