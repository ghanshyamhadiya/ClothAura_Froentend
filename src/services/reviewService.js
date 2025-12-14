import api from "../utils/api";

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
    if (reviewData instanceof FormData) {
      console.log("Sending FormData with entries:");
      for (let [key, value] of reviewData.entries()) {
        console.log(key, value);
      }
    }
    
    const timeout = hasMediaFiles(reviewData) ? 120000 : 50000;
    
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
    if (reviewData instanceof FormData) {
      const hasMedia = reviewData.has('media');
      
      if (!hasMedia) {
        reviewData.append('keepExistingMedia', 'true');
      }
      
      console.log("Updating review with FormData:");
      for (let [key, value] of reviewData.entries()) {
        console.log(key, value);
      }
    }
    
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