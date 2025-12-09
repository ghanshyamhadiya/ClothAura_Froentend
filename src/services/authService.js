import api from "../utils/api";

export const authService = {
  // Login service
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      const { accessToken } = response.data;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Register service
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      const { accessToken } = response.data;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout service
  logout: async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('accessToken');
      return { success: true };
    } catch (error) {
      // Always clear token even if logout fails
      localStorage.removeItem('accessToken');
      console.error('Logout error:', error);
      return { success: true }; // Return success anyway
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/refresh-token');
      const { accessToken } = response.data;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/verify-email/${token}`);
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Verification failed';
      throw {
        success: false,
        message: errMsg,
        status: error.response?.status || 500
      };
    }
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    try {
      const response = await api.post('/resend-verifiaction');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },

  // Get current user token
  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Get current user data
  getUserByApi: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error("No access token found");
    }
    
    try {
      const response = await api.get('/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.user) {
        return response.data.user;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      // Throw the full error for proper handling
      throw error;
    }
  },

  // Get user addresses
  getAddresses: async () => {
    try {
      const response = await api.get('/address');
      return response.data.addresses || [];
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch addresses';
      throw new Error(message);
    }
  },

  // Add a new address
  addAddress: async (addressData) => {
    try {
      const response = await api.post('/address', addressData);
      return response.data.address;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add address';
      throw new Error(message);
    }
  },

  // Update an address
  updateAddress: async (addressId, addressData) => {
    if (!addressId) {
      throw new Error('Address ID is required');
    }

    // Validate addressId format
    if (typeof addressId !== 'string' || addressId.length !== 24) {
      throw new Error('Invalid address ID format');
    }

    try {
      const response = await api.put(`/address/${addressId}`, addressData);
      return response.data.address;
    } catch (error) {
      console.error('Update address error:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to update address';
      throw new Error(message);
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    if (!addressId) {
      throw new Error('Address ID is required');
    }

    // Validate addressId format
    if (typeof addressId !== 'string' || addressId.length !== 24) {
      throw new Error('Invalid address ID format');
    }

    try {
      const response = await api.delete(`/address/${addressId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete address';
      throw new Error(message);
    }
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    // Validate addressId
    if (!addressId || typeof addressId !== 'string' || addressId.length !== 24) {
      throw new Error('Invalid address ID format');
    }

    try {
      const response = await api.put(`/address/default/${addressId}`);
      return response.data.address;
    } catch (error) {
      console.error('Set default address error:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to set default address';
      throw new Error(message);
    }
  },

checkStatus: async () => {
  try {
    const response = await api.get('/health', {
      timeout: 5000,
      validateStatus: (status) => status === 200,
    });
    
    if (response.status === 200 && response.data.status === 'OK') {
      console.log('✓ Backend is UP:', response.data.timestamp);
      return { status: 'UP', timestamp: response.data.timestamp };
    } else {
      console.warn('Backend responded but status is not OK:', response.data);
      return { status: 'DOWN' };
    }
  } catch (error) {
    // Network error, timeout, or server down
    if (!error.response) {
      console.error('Backend is DOWN - Network error or timeout:', error.message);
    } else {
      console.error('Backend status check error:', error.response?.status);
    }
    return { status: 'DOWN', error: error.message };
  }
}
};