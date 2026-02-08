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
  const refreshTimerRef = useRef(null);

  const { authenticate: socketAuthenticate, isConnected } = useSocket();

  useEffect(() => {
    const handleTokenRefreshFailed = () => {
      console.log('Token refresh failed, logging out');
      handleLogout();
    };

    window.addEventListener('auth:tokenRefreshFailed', handleTokenRefreshFailed);
    return () => window.removeEventListener('auth:tokenRefreshFailed', handleTokenRefreshFailed);
  }, []);

  const setupTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const token = authService.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const refreshTime = Math.max(timeUntilExpiry - 2 * 60 * 1000, 0);

      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)}s`);

      refreshTimerRef.current = setTimeout(async () => {
        console.log('Proactively refreshing token...');
        try {
          await authService.refreshToken();
          const newToken = authService.getToken();

          if (newToken && isConnected) {
            socketAuthenticate(newToken);
          }

          setupTokenRefresh();
        } catch (error) {
          console.error('Proactive token refresh failed:', error);
          handleLogout();
        }
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }, [isConnected, socketAuthenticate]);

  useEffect(() => {
    checkAuthStatus();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (token && isConnected && isAuthenticated) {
      socketAuthenticate(token);
    }
  }, [isConnected, isAuthenticated, socketAuthenticate]);

  useEffect(() => {
    const handleSocketAuthError = (event) => {
      const { code } = event.detail || {};
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
        console.log('Socket auth failed, attempting refresh');
        setupTokenRefresh();
      }
    };

    const handleSocketLogout = () => {
      console.log('Server initiated logout');
      handleLogout();
    };

    window.addEventListener('socket:authError', handleSocketAuthError);
    window.addEventListener('socket:serverLogout', handleSocketLogout);

    return () => {
      window.removeEventListener('socket:authError', handleSocketAuthError);
      window.removeEventListener('socket:serverLogout', handleSocketLogout);
    };
  }, [isConnected, socketAuthenticate, setupTokenRefresh]);

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
          localStorage.setItem('wasLoggedIn', 'true');

          setupTokenRefresh();

          if (isConnected) {
            socketAuthenticate(token);
          }
        } catch (fetchError) {
          console.error("Failed to fetch user data:", fetchError);

          if (fetchError.response?.status === 401) {
            try {
              console.log('Access token expired, attempting refresh...');
              await authService.refreshToken();
              const newToken = authService.getToken();

              if (newToken) {
                const userData = await authService.getUserByApi();
                setUser(userData);
                setAddresses(userData.addresses || []);
                setIsAuthenticated(true);
                localStorage.setItem('wasLoggedIn', 'true');

                setupTokenRefresh();

                if (isConnected) {
                  socketAuthenticate(newToken);
                }
                return;
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }

          localStorage.removeItem("accessToken");
          localStorage.removeItem("wasLoggedIn");
          setIsAuthenticated(false);
          setUser(null);
          setAddresses([]);

          if (fetchError.response?.status !== 401) {
            setError("Failed to load user data. Please try again.");
          }
        }
      } else {
        // No token in localStorage - check if user was previously logged in
        const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';

        if (wasLoggedIn) {
          // User was logged in before - attempt silent token refresh using httpOnly refresh cookie
          console.log('No access token but was logged in, attempting silent refresh...');
          try {
            await authService.refreshToken();
            const newToken = authService.getToken();

            if (newToken) {
              const userData = await authService.getUserByApi();
              setUser(userData);
              setAddresses(userData.addresses || []);
              setIsAuthenticated(true);

              setupTokenRefresh();

              if (isConnected) {
                socketAuthenticate(newToken);
              }
              return; // Successfully refreshed
            }
          } catch (refreshError) {
            console.log('Silent refresh failed, user will need to login again:', refreshError);
            // Refresh failed - clear the flag so we don't keep trying
            localStorage.removeItem('wasLoggedIn');
          }
        }

        // Not logged in or refresh failed
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

  const handleLogout = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("wasLoggedIn");
      setLoading(false);
      setHasChecked(true);
    }
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      const userData = await authService.getUserByApi();
      setUser(userData);
      setAddresses(userData.addresses || []);
      setIsAuthenticated(true);
      localStorage.setItem('wasLoggedIn', 'true');

      setupTokenRefresh();

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
      localStorage.setItem('wasLoggedIn', 'true');

      setupTokenRefresh();

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
          localStorage.setItem('wasLoggedIn', 'true');

          setupTokenRefresh();

          const authToken = authService.getToken();
          if (authToken && isConnected) {
            socketAuthenticate(authToken);
          }
        }
        toastService.success('Email verified successfully');
      }

      return response;
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
      toastService.info('Please check your inbox and spam folder');
      return response;
    } catch (error) {
      setError(error.message);
      toastService.error(error.message || 'Failed to resend verification email');
      throw error;
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  const fetchAndSetUser = async () => {
    try {
      const userData = await authService.getUserByApi();
      setUser(userData);
      setAddresses(userData.addresses || []);
      setIsAuthenticated(true);
      setError(null);
      localStorage.setItem('wasLoggedIn', 'true');

      setupTokenRefresh();

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
        localStorage.removeItem("wasLoggedIn");
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
    logout: handleLogout,
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