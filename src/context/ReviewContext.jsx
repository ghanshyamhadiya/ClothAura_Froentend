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

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const accessToken = localStorage.getItem('accessToken');
      
      const newSocket = io(conf.baseUrl, {
        withCredentials: true,
        auth: { token: accessToken },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✓ Socket connected for reviews');
      });

      // Listen for new reviews
      newSocket.on('newReview', (newReview) => {
        console.log('New review received:', newReview);
        
        // Only add if it's for the current product
        if (currentProductId && newReview.productId === currentProductId) {
          setReviews((prev) => {
            // Check if review already exists
            const exists = prev.some(r => r._id === newReview._id);
            if (exists) return prev;
            
            const updated = [newReview, ...prev];
            updateStats(updated);
            return updated;
          });
        }
      });

      // Listen for updated reviews
      newSocket.on('updateReview', (updatedReview) => {
        console.log('Review updated:', updatedReview);
        
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

      // Listen for deleted reviews
      newSocket.on('deleteReview', (deletedReview) => {
        console.log('Review deleted:', deletedReview);
        
        setReviews((prev) => {
          const updated = prev.filter((r) => r._id !== deletedReview._id);
          updateStats(updated);
          return updated;
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user, currentProductId]);

  // Helper function to update stats
  const updateStats = (reviewsList) => {
    if (reviewsList && reviewsList.length > 0) {
      const total = reviewsList.length;
      const sum = reviewsList.reduce((acc, review) => acc + (review.rating || 0), 0);
      const average = (sum / total).toFixed(1);
      setProductStats({ averageRating: parseFloat(average), totalReviews: total });
    } else {
      setProductStats({ averageRating: 0, totalReviews: 0 });
    }
  };

  // Fetch logged-in user reviews
  const fetchUserReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviewsByUser();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      setError("Failed to fetch user reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reviews for a specific product
  const fetchProductReviews = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentProductId(productId); // Track current product
      
      const data = await getReviewsByProduct(productId);
      console.log(`reviews from context`, data);
      
      let reviewsData = data;
      if (data && typeof data === 'object' && !Array.isArray(data) && data.reviews) {
        reviewsData = data.reviews;
      } else if (!Array.isArray(reviewsData)) {
        console.warn('Unexpected data format for reviews:', data);
        reviewsData = [];
      }
      
      setReviews(reviewsData);
      updateStats(reviewsData);
      
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      setError("Failed to fetch product reviews");
      setProductStats({ averageRating: 0, totalReviews: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new review
  const addReview = useCallback(async (reviewData) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log("Adding review with data:", reviewData);
      
      const newReview = await createReviewService(reviewData);
      
      // Immediately update local state
      setReviews((prev) => {
        const updated = [newReview, ...prev];
        updateStats(updated);
        return updated;
      });
      
      toastService.success('Review added successfully');
      return newReview;
    } catch (error) {
      console.error("Error creating review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update review
  const editReview = useCallback(async (reviewId, reviewData) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log("Updating review:", reviewId, reviewData);
      
      const updated = await updateReviewService(reviewId, reviewData);
      
      // Immediately update local state
      setReviews((prev) => {
        const updatedList = prev.map((r) => (r._id === reviewId ? updated : r));
        updateStats(updatedList);
        return updatedList;
      });
      
      toastService.success('Review updated successfully');
      return updated;
    } catch (error) {
      console.error("Error updating review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete review
  const deleteReview = useCallback(async (reviewId) => {
    try {
      setError(null);
      await deleteReviewService(reviewId);
      
      // Immediately update local state
      setReviews((prev) => {
        const updated = prev.filter((r) => r._id !== reviewId);
        updateStats(updated);
        return updated;
      });
      
      toastService.success('Review deleted successfully');
    } catch (error) {
      console.error("Error deleting review:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete review";
      setError(errorMessage);
      toastService.error(errorMessage);
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset product stats
  const resetProductStats = useCallback(() => {
    setProductStats({ averageRating: 0, totalReviews: 0 });
    setCurrentProductId(null);
  }, []);

  return (
    <ReviewContext.Provider
      value={{
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
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};