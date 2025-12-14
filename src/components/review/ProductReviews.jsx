import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Edit2, Trash2, LogIn } from 'lucide-react';
import { useReview } from '../../context/ReviewContext';
import { useAuth } from '../../context/AuthContext';
import CreateReviewModal from './CreateReviewModal';
import { useAuthModel } from '../../context/AuthModelContext';
import ConfirmationModal from '../model/ConfirmationModel';

const ProductReviews = ({ productId }) => {
  const { openModel } = useAuthModel();
  const { isAuthenticated, user } = useAuth();
  const { reviews, loading, fetchProductReviews, deleteReview } = useReview();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (productId) fetchProductReviews(productId);
  }, [productId, fetchProductReviews]);

  const promptLoginFor = (intent) => {
    openModel('login', { intent, fromPath: `/product/${productId}` });
  };

  const handleCreateReview = () => {
    if (!isAuthenticated) {
      promptLoginFor({ action: 'create-review', productId });
      return;
    }
    setSelectedReview(null);
    setIsCreateModalOpen(true);
  };

  const handleEditReview = (review) => {
    if (!isAuthenticated) {
      promptLoginFor({ action: 'edit-review', productId, reviewId: review._id, review });
      return;
    }
    setSelectedReview(review);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (review) => {
    if (!isAuthenticated) {
      promptLoginFor({ action: 'delete-review', productId, reviewId: review._id });
      return;
    }
    setReviewToDelete(review);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteReview(reviewToDelete._id);
      setIsConfirmOpen(false);
      setReviewToDelete(null);
    } catch (error) {
      // Error handled in context
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto">
      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-black">Customer Reviews</h2>
          <p className="text-gray-600 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateReview}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-black text-white rounded-full font-medium shadow-md hover:shadow-lg transition-all"
        >
          {isAuthenticated ? (
            <>
              <Plus size={20} />
              Write a Review
            </>
          ) : (
            <>
              <LogIn size={20} />
              Login to Review
            </>
          )}
        </motion.button>
      </div>

      {/* Empty State */}
      {reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200"
        >
          <Star size={56} className="mx-auto mb-5 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Be the first to share your experience with this product.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateReview}
            className="px-7 py-3 bg-black text-white rounded-full font-medium shadow hover:shadow-md transition"
          >
            {isAuthenticated ? 'Write the First Review' : 'Login to Review'}
          </motion.button>
        </motion.div>
      ) : (
        /* Reviews List */
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {reviews.map((review, idx) => (
              <motion.article
                key={review._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {review.userId?.username?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="font-semibold text-black">
                        {review.userId?.username || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < review.rating ? 'black' : 'none'}
                            className={i < review.rating ? 'text-black' : 'text-gray-300'}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Actions */}
                  {isAuthenticated && user?._id === review.userId?._id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        aria-label="Edit review"
                      >
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(review)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        aria-label="Delete review"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 leading-relaxed mb-5">{review.content}</p>

                {/* Media Grid */}
                {review.media && review.media.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-5">
                    {review.media.map((media, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={`Review media ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <video
                            src={media.url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Review Modal */}
      <CreateReviewModal
        productId={productId}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedReview(null);
        }}
        initialReview={selectedReview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Review"
        message="This action cannot be undone. Your review will be permanently removed."
        confirmText="Delete Permanently"
        cancelText="Keep Review"
        loading={deleteLoading}
        variant="danger"
      />
    </section>
  );
};

export default ProductReviews;