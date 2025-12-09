import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReview } from '../../context/ReviewContext';
import ReviewList from './ReviewList';
import CreateReviewModal from './CreateReviewModal';

const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const { reviews } = useReview();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if the user is authenticated and verified to be able to review
  const canReview = isAuthenticated && user?.isEmailVerified;

  return (
    <>
      <div className="py-16">
        {/* Header - Simplified as it's within a collapsible section now */}
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold">Customer Reviews</h2>
          <p className="text-gray-600 mt-3 text-lg">Real experiences from verified buyers.</p>
        </div>
        
        {/* Review List & Write Review Button */}
        <ReviewList
            reviews={reviews}
            onWriteReviewClick={() => {
                if(canReview) {
                    setIsModalOpen(true);
                } else {
                    alert("Please log in and verify your email to write a review.");
                }
            }}
            canReview={canReview}
            productId={productId}
            user={user} // Pass user to display "(you)" next to their review
        />

      </div>

      {/* Review Creation Modal */}
      <CreateReviewModal
        productId={productId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ProductReviews;