import api from "../utils/api";

// Helper function to convert product data to FormData
const createProductFormData = (productData) => {
  const formData = new FormData();
  
  // Add basic fields
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('category', productData.category);
  
  // ✅ FIXED: Include allowedPaymentMethods
  if (productData.allowedPaymentMethods && productData.allowedPaymentMethods.length > 0) {
    formData.append('allowedPaymentMethods', JSON.stringify(productData.allowedPaymentMethods));
  }
  
  // Process variants
  const variantsForSubmission = productData.variants.map((variant, index) => {
    // Extract images as actual File objects
    const images = variant.images || [];
    
    // Append each image file with the correct fieldname
    images.forEach((imageFile) => {
      if (imageFile instanceof File) {
        formData.append(`variant_${index}_images`, imageFile);
      }
    });
    
    // Return variant data without images (sent separately as files)
    return {
      color: variant.color,
      sizes: variant.sizes
    };
  });
  
  // Add variants as JSON string
  formData.append('variants', JSON.stringify(variantsForSubmission));
  
  return formData;
};

// Create product
export const createProducts = async (productData) => {
  try {
    console.log('=== FRONTEND: Creating Product ===');
    console.log('Product data:', {
      name: productData.name,
      category: productData.category,
      variantsCount: productData.variants?.length,
      imagesPerVariant: productData.variants?.map(v => v.images?.length || 0),
      allowedPaymentMethods: productData.allowedPaymentMethods
    });
    
    const formData = createProductFormData(productData);
    
    // Log FormData contents for debugging
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, value.name, `(${(value.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`${key}:`, value);
      }
    }
    
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✓ Product created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create product:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw error.response?.data || error;
  }
};

// Update product
export const updateProducts = async (id, productData) => {
  try {
    console.log('=== FRONTEND: Updating Product ===');
    console.log('Product ID:', id);
    console.log('Payment methods:', productData.allowedPaymentMethods);
    
    const formData = createProductFormData(productData);
    
    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✓ Product updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error.response?.data || error;
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data.products || [];
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

export const getOwnerProducts = async () => {
  try {
    const response = await api.get('/products/owner/products');
    return response.data.products || [];
  } catch (error) {
    console.error('Error fetching owner products:', error);
    throw error;
  }
};

// Get paginated products
export const getPaginatedProducts = async (page = 1, limit = 8) => {
  try {
    const response = await api.get(`/products/page?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

// Delete product
export const deleteProducts = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const searchProducts = async (query, options = {}) => {
  const { category, fuzzy = true } = options;
  
  const params = new URLSearchParams({
    q: query,
    fuzzy: fuzzy.toString()
  });
  
  if (category) {
    params.append('category', category);
  }
  
  const response = await api.get(`/products/search?${params.toString()}`);
  return response.data.products;
};

export const getAutocomplete = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }
  
  const response = await api.get(`/products/autocomplete`, {
    params: { q: query }
  });
  return response.data.suggestions;
};

// Socket event listeners
export const onProductCreated = (callback) => {
  window.socket?.on('product:created', callback);
};

export const offProductCreated = (callback) => {
  window.socket?.off('product:created', callback);
};

export const onProductUpdate = (callback) => {
  window.socket?.on('product:updated', callback);
};

export const offProductUpdate = (callback) => {
  window.socket?.off('product:updated', callback);
};

export const onProductDelete = (callback) => {
  window.socket?.on('product:deleted', callback);
};

export const offProductDelete = (callback) => {
  window.socket?.off('product:deleted', callback);
};