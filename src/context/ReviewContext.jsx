import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  createReview as createReviewService,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
  getReviewsByUser,
  getReviewsByProduct,
} from "../services/reviewService";
import { useAuth } from "./AuthContext";
import { toastService } from "../services/toastService";
import { io } from "socket.io-client";
import conf from "../config/config";

const ReviewContext = createContext();

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
};

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);
  const [productStats, setProductStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(null);
  const { isAuthenticated, user } = useAuth();

  /**
   * Calculate review statistics (average rating and total count)
   */
  const updateStats = useCallback((reviewsList) => {
    if (reviewsList && reviewsList.length > 0) {
      const total = reviewsList.length;
      const sum = reviewsList.reduce((acc, review) => acc + (review.rating || 0), 0);
      const average = (sum / total).toFixed(1);
      setProductStats({ averageRating: parseFloat(average), totalReviews: total });
    } else {
      setProductStats({ averageRating: 0, totalReviews: 0 });
    }
  }, []);

  /**
   * Socket.IO connection - ONLY for authenticated users
   * Handles real-time review updates
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        console.log('⚠️ No access token found, skipping socket connection');
        return;
      }

      console.log('🔌 Connecting review socket...');
      
      const newSocket = io(conf.baseUrl, {
        withCredentials: true,
        auth: { token: accessToken },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Review socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });

      // Listen for new reviews
      newSocket.on('newReview', (newReview) => {
        console.log('📨 New review received:', newReview._id);
        
        // Only update if it's for the current product
        if (currentProductId && newReview.productId === currentProductId) {
          setReviews((prev) => {
            const exists = prev.some(r => r._id === newReview._id);
            if (exists) return prev;
            
            const updated = [newReview, ...prev];
            updateStats(updated);
            return updated;
          });
        }
      });

      // Listen for review updates
      newSocket.on('updateReview', (updatedReview) => {
        console.log('📝 Review updated:', updatedReview._id);
        
        if (currentProductId && updatedReview.productId === currentProductId) {
          setReviews((prev) => {
            const updated = prev.map((r) => 
              r._id === updatedReview._id ? updatedReview : r
            );
            updateStats(updated);
            return updated;
          });
        }
      });

      // Listen for review deletions
      newSocket.on('deleteReview', (deletedReview) => {
        console.log('🗑️ Review deleted:', deletedReview._id);
        
        setReviews((prev) => {
          const updated = prev.filter((r) => r._id !== deletedReview._id);
          updateStats(updated);
          return updated;
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔴 Review socket disconnected:', reason);
      });

      setSocket(newSocket);

      // Cleanup on unmount or when auth changes
      return () => {
        console.log('🔌 Closing review socket');
        newSocket.close();
      };
    } else {
      // Not authenticated - close socket if it exists
      if (socket) {
        console.log('🔌 Closing review socket (user logged out)');
        socket.close();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user, currentProductId, updateStats]);

  /**
   * Fetch reviews created by the current user
   * @requires Authentication
   */
  const fetchUserReviews = useCallback(async () => {
    if (!isAuthenticated) {
      toastService.error('Please login to view your reviews');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Fetching user reviews...');
      const data = await getReviewsByUser();
      
      setReviews(data);
      console.log(`✅ Loaded ${data.length} user reviews`);
    } catch (error) {
      console.error("❌ Error fetching user reviews:", error);
      setError("Failed to fetch user reviews");
      toastService.error("Failed to load your reviews");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Fetch all reviews for a specific product
   * @public Works without authentication
   * @param {string} productId - Product ID
   */
  const fetchProductReviews = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentProductId(productId);
      
      console.log(`📥 Fetching reviews for product: ${productId}`);
      const data = await getReviewsByProduct(productId);
      
      // Handle different response formats
      let reviewsData = [];
      
      if (Array.isArray(data)) {
        reviewsData = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.reviews)) {
        reviewsData = data.reviews;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.warn('⚠️ Unexpected data format for reviews:', data);
        reviewsData = [];
      }
      
      console.log(`✅ Loaded ${reviewsData.length} product reviews`);
      setReviews(reviewsData);
      updateStats(reviewsData);
      
    } catch (error) {
      console.error("⚠️ Error fetching product reviews:", error);
      // ✅ For public endpoint, don't show error toasts
      // Just set empty reviews
      setReviews([]);
      setProductStats({ averageRating: 0, totalReviews: 0 });
    } finally {
      setLoading(false);
    }
  }, [updateStats]);

  /**
   * Add a new review
   * @requires Authentication
   * @param {FormData} reviewData - Review data including content, rating, and media
   */
  const addReview = useCallback(async (reviewData) => {
    if (!isAuthenticated) {
      toastService.error('Please login to add a review');
      throw new Error('Authentication required');
    }
    
    try {
      setError(null);
      setLoading(true);
      
      console.log("📤 Creating new review...");
      const newReview = await createReviewService(reviewData);
      
      // Add to local state
      setReviews((prev) => {
        const updated = [newReview, ...prev];
        updateStats(updated);
        return updated;
      });
      
      toastService.success('Review added successfully');
      console.log("✅ Review created:", newReview._id);
      
      return newReview;
    } catch (error) {
      console.error("❌ Error creating review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, updateStats]);

  /**
   * Update an existing review
   * @requires Authentication
   * @param {string} reviewId - Review ID
   * @param {FormData} reviewData - Updated review data
   */
  const editReview = useCallback(async (reviewId, reviewData) => {
    if (!isAuthenticated) {
      toastService.error('Please login to update reviews');
      throw new Error('Authentication required');
    }
    
    try {
      setError(null);
      setLoading(true);
      
      console.log("📝 Updating review:", reviewId);
      const updated = await updateReviewService(reviewId, reviewData);
      
      // Update local state
      setReviews((prev) => {
        const updatedList = prev.map((r) => (r._id === reviewId ? updated : r));
        updateStats(updatedList);
        return updatedList;
      });
      
      toastService.success('Review updated successfully');
      console.log("✅ Review updated:", reviewId);
      
      return updated;
    } catch (error) {
      console.error("❌ Error updating review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, updateStats]);

  /**
   * Delete a review
   * @requires Authentication
   * @param {string} reviewId - Review ID
   */
  const deleteReview = useCallback(async (reviewId) => {
    if (!isAuthenticated) {
      toastService.error('Please login to delete reviews');
      throw new Error('Authentication required');
    }
    
    try {
      setError(null);
      
      console.log("🗑️ Deleting review:", reviewId);
      await deleteReviewService(reviewId);
      
      // Remove from local state
      setReviews((prev) => {
        const updated = prev.filter((r) => r._id !== reviewId);
        updateStats(updated);
        return updated;
      });
      
      toastService.success('Review deleted successfully');
      console.log("✅ Review deleted:", reviewId);
      
    } catch (error) {
      console.error("❌ Error deleting review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    }
  }, [isAuthenticated, updateStats]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset product stats and clear current product
   */
  const resetProductStats = useCallback(() => {
    setProductStats({ averageRating: 0, totalReviews: 0 });
    setCurrentProductId(null);
  }, []);

  const value = {
    reviews,
    productStats,
    loading,
    error,
    addReview,
    editReview,
    deleteReview,
    fetchUserReviews,
    fetchProductReviews,
    resetProductStats,
    clearError,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};