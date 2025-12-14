import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { authService } from "../services/authService";
import { useSocket } from "./SocketContext";
import { toastService } from "../services/toastService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState(null);
  const isCheckingAuth = useRef(false);

  // Get socket context
  const { authenticate: socketAuthenticate, isConnected } = useSocket();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle socket authentication when token or connection changes
  useEffect(() => {
    const token = authService.getToken();
    if (token && isConnected && isAuthenticated) {
      socketAuthenticate(token);
    }
  }, [isConnected, isAuthenticated, socketAuthenticate]);

  // Listen to socket auth events
  useEffect(() => {
    const handleSocketAuthError = (event) => {
      const { code } = event.detail || {};
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
        console.log('Socket auth failed, logging out');
        logout();
      }
    };

    const handleSocketLogout = () => {
      console.log('Server initiated logout');
      logout();
    };

    const handleSocketRefreshRequired = () => {
      console.log('Token refresh required');
      
      const token = authService.getToken();
      if (token && isConnected) {
        socketAuthenticate(token);
      }
    };

    window.addEventListener('socket:authError', handleSocketAuthError);
    window.addEventListener('socket:serverLogout', handleSocketLogout);
    window.addEventListener('socket:refreshRequired', handleSocketRefreshRequired);

    return () => {
      window.removeEventListener('socket:authError', handleSocketAuthError);
      window.removeEventListener('socket:serverLogout', handleSocketLogout);
      window.removeEventListener('socket:refreshRequired', handleSocketRefreshRequired);
    };
  }, [isConnected, socketAuthenticate]);

  const checkAuthStatus = async () => {
    if (isCheckingAuth.current) return;
    try {
      isCheckingAuth.current = true;
      setLoading(true);
      setError(null);
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getUserByApi();
          setUser(userData);
          setAddresses(userData.addresses || []);
          setIsAuthenticated(true);
          
          // ✅ Mark that user was logged in
          localStorage.setItem('wasLoggedIn', 'true');

          // Authenticate socket if connected
          if (isConnected) {
            socketAuthenticate(token);
          }
        } catch (fetchError) {
          console.error("Failed to fetch user data:", fetchError);
          if (fetchError.response?.status === 401 || fetchError.response?.status === 403) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("wasLoggedIn"); // Clear flag
            setIsAuthenticated(false);
            setUser(null);
            setAddresses([]);
          } else {
            setError("Failed to load user data. Please try again.");
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setAddresses([]);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setError(error.message);
      setIsAuthenticated(false);
      setUser(null);
      setAddresses([]);
    } finally {
      setLoading(false);
      setHasChecked(true);
      isCheckingAuth.current = false;
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      const userData = await authService.getUserByApi();
      setUser(userData);
      setAddresses(userData.addresses || []);
      setIsAuthenticated(true);
      
      // ✅ Mark that user has logged in successfully
      localStorage.setItem('wasLoggedIn', 'true');

      // Authenticate socket with new token
      const token = authService.getToken();
      if (token && isConnected) {
        socketAuthenticate(token);
      }
      toastService.success('Login successful');
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message);
      setIsAuthenticated(false);
      setUser(null);
      setAddresses([]);
      toastService.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      const user = await authService.getUserByApi();
      setUser(user);
      setAddresses(user.addresses || []);
      setIsAuthenticated(true);
      
      // ✅ Mark that user has registered successfully
      localStorage.setItem('wasLoggedIn', 'true');

      // Authenticate socket with new token
      const token = authService.getToken();
      if (token && isConnected) {
        socketAuthenticate(token);
      }
      toastService.success('Registration successful');
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.message);
      setIsAuthenticated(false);
      setUser(null);
      setAddresses([]);
      toastService.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      toastService.success('Logout successful');
    } catch (error) {
      console.error("Logout failed:", error);
      toastService.error(error.message || 'Logout failed');
    } finally {
      setUser(null);
      setAddresses([]);
      setIsAuthenticated(false);
      
      // ✅ Clear both tokens and the login flag
      localStorage.removeItem("accessToken");
      localStorage.removeItem("wasLoggedIn");
      
      setLoading(false);
      setHasChecked(true);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verifyEmail(token);

      if (response.success) {
        if (authService.getToken()) {
          const userData = await authService.getUserByApi();
          setUser(userData);
          setAddresses(userData.addresses || []);
          setIsAuthenticated(true);
          
          // ✅ Mark that user is now authenticated
          localStorage.setItem('wasLoggedIn', 'true');

          const authToken = authService.getToken();
          if (authToken && isConnected) {
            socketAuthenticate(authToken);
          }
        }
        toastService.success('Email verified successfully');
      }

      return (await response);
    } catch (error) {
      console.error("Email verification failed:", error);
      setError(error.message);
      toastService.error(error.message || 'Verification failed');
      throw error;
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resendVerificationEmail();
      toastService.success('Verification email resent successfully');
      toastService.info('Please check your inbox and spam folder before 15 minutes');
      return response;
    } catch (error) {
      setError(error.message);
      toastService.error(error.message || 'Failed to resend verification email');
      throw error;
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  }
  
  const fetchAndSetUser = async () => {
    try {
      const userData = await authService.getUserByApi();
      setUser(userData);
      setAddresses(userData.addresses || []);
      setIsAuthenticated(true);
      setError(null);
      
      // ✅ Mark that user is authenticated
      localStorage.setItem('wasLoggedIn', 'true');

      // Authenticate socket if connected
      const token = authService.getToken();
      if (token && isConnected) {
        socketAuthenticate(token);
      }

      return userData;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setUser(null);
        setAddresses([]);
        setIsAuthenticated(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("wasLoggedIn"); // Clear flag
      }
      setError(error.message);
      throw error;
    } finally {
      setHasChecked(true);
    }
  };

  const getAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const addresses = await authService.getAddresses();
      setAddresses(addresses);
      return addresses;
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addAddress = useCallback(async (addressData) => {
    try {
      setLoading(true);
      setError(null);
      const address = await authService.addAddress(addressData);
      setAddresses((prev) => [...prev, address]);
      return address;
    } catch (error) {
      console.error("Failed to add address:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (addressId, addressData) => {
    try {
      setLoading(true);
      setError(null);
      const address = await authService.updateAddress(addressId, addressData);
      setAddresses((prev) =>
        prev.map((addr) => (addr._id === addressId ? address : addr))
      );
      toastService.success('Address updated successfully');
      return address;
    } catch (error) {
      console.error("Failed to update address:", error);
      setError(error.message);
      toastService.error(error.message || 'Failed to update address');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (addressId) => {
    try {
      setLoading(true);
      setError(null);
      await authService.deleteAddress(addressId);
      setAddresses((prev) => prev.filter((addr) => addr._id !== addressId));
      toastService.success('Address deleted successfully');
    } catch (error) {
      console.error("Failed to delete address:", error);
      setError(error.message);
      toastService.error(error.message || 'Failed to delete address');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultAddress = useCallback(async (addressId) => {
    try {
      setLoading(true);
      setError(null);
      const address = await authService.setDefaultAddress(addressId);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId
        }))
      );
      toastService.success('Default address set successfully');
      return address;
    } catch (error) {
      console.error("Failed to set default address:", error);
      setError(error.message);
      toastService.error(error.message || 'Failed to set default address');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  const value = {
    user,
    addresses,
    loading,
    isAuthenticated,
    hasChecked,
    error,
    login,
    logout,
    register,
    verifyEmail,
    fetchAndSetUser,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearError,
    checkAuthStatus,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};