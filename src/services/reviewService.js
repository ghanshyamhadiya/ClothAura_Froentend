import api from "../utils/api";

// Helper function to check if FormData contains media files
const hasMediaFiles = (formData) => {
  if (!(formData instanceof FormData)) return false;
  
  for (let pair of formData.entries()) {
    if (pair[0] === 'media' && (pair[1] instanceof File || pair[1] instanceof Blob)) {
      return true;
    }
  }
  return false;
};

export const createReview = async (reviewData) => {
    try {
        // Log FormData contents for debugging
        if (reviewData instanceof FormData) {
            console.log("Sending FormData with entries:");
            for (let [key, value] of reviewData.entries()) {
                console.log(key, value);
            }
        }
        
        // ✅ Extended timeout for media uploads (120 seconds)
        const timeout = hasMediaFiles(reviewData) ? 120000 : 50000;
        
        // Send FormData directly with proper headers
        const response = await api.post("/review", reviewData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: timeout,
        });
        return response.data;
    } catch (error) {
        console.error("Review creation error:", error.response?.data || error);
        throw error;
    }
};

export const updateReview = async (reviewId, reviewData) => {
    try {
        // FIXED: Logic was backwards - check if media exists before adding keepExistingMedia
        if (reviewData instanceof FormData) {
            // Check if media files are being uploaded
            const hasMedia = reviewData.has('media');
            
            // If no new media is being uploaded, keep existing media
            if (!hasMedia) {
                reviewData.append('keepExistingMedia', 'true');
            }
            
            console.log("Updating review with FormData:");
            for (let [key, value] of reviewData.entries()) {
                console.log(key, value);
            }
        }
        
        // ✅ Extended timeout for media uploads
        const timeout = hasMediaFiles(reviewData) ? 120000 : 50000;
        
        const response = await api.put(`/review/${reviewId}`, reviewData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: timeout,
        });
        return response.data;
    } catch (error) {
        console.error("Review update error:", error.response?.data || error);
        throw error;
    }
};

export const getReviewsByProduct = async (productId) => {
    try {
        const response = await api.get(`/review/product/${productId}`);
        return response.data;
    } catch (error) {
        console.error("Get product reviews error:", error.response?.data || error);
        throw error;
    }
};

export const getReviewsByUser = async () => {
    try {
        const response = await api.get("/review/user");
        return response.data;
    } catch (error) {
        console.error("Get user reviews error:", error.response?.data || error);
        throw error;
    }
};

export const deleteReview = async (reviewId) => {
    try {
        await api.delete(`/review/${reviewId}`);
    } catch (error) {
        console.error("Review deletion error:", error.response?.data || error);
        throw error;
    }
};