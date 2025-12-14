import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  getAllProducts,
  getOwnerProducts,
  getProductById,
  offProductCreated,
  offProductDelete,
  offProductUpdate,
  onProductCreated,
  onProductDelete,
  onProductUpdate,
  createProducts,
  updateProducts,
  deleteProducts,
  getPaginatedProducts,
  searchProducts as searchProductsService
} from "../services/productService";
import { toastService } from "../services/toastService";
import { useAuth } from "./AuthContext";

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
};

// ✅ Cache expiration time (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const ProductProvider = ({ children }) => {
  const { isAuthenticated, user, hasChecked, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchOptions, setSearchOptions] = useState({ fuzzy: true, category: null });

  const [ownerProducts, setOwnerProducts] = useState([]);

  const initialFetchDone = useRef(false);
  const fetchInProgress = useRef(false);
  const loadMoreInProgress = useRef(false);
  const LIMIT = 8;

  // ✅ Helper to check if cache is valid
  const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // ✅ Helper to save products with timestamp
  const saveProductsToCache = useCallback((productsData) => {
    sessionStorage.setItem('cachedProducts', JSON.stringify({
      data: productsData,
      timestamp: Date.now()
    }));
  }, []);

  // ✅ Helper to save owner products to cache
  const saveOwnerProductsToCache = useCallback((ownerProductsData) => {
    sessionStorage.setItem('cachedOwnerProducts', JSON.stringify({
      data: ownerProductsData,
      timestamp: Date.now()
    }));
  }, []);

  // ✅ Helper to invalidate all caches
  const invalidateAllCaches = useCallback(() => {
    sessionStorage.removeItem('cachedProducts');
    sessionStorage.removeItem('cachedOwnerProducts');
    sessionStorage.removeItem('cachedSearch');
  }, []);

  // ✅ Helper to refresh products from server
  const refreshProductsFromServer = useCallback(async () => {
    try {
      console.log('🔄 Refreshing products from server...');
      const data = await getPaginatedProducts(1, LIMIT);
      setProducts(data.products || []);
      setCurrentPage(1);
      setHasMore(data.hasNext || false);
      saveProductsToCache(data.products || []);
      console.log('✅ Products refreshed successfully');
      return data.products;
    } catch (err) {
      console.error('❌ Failed to refresh products:', err);
      throw err;
    }
  }, [LIMIT, saveProductsToCache]);

  // ✅ Helper to refresh owner products from server
  const refreshOwnerProductsFromServer = useCallback(async () => {
    if (!isAuthenticated || !user || (user.role !== 'owner' && user.role !== 'admin')) {
      return;
    }

    try {
      console.log('🔄 Refreshing owner products from server...');
      const products = await getOwnerProducts();
      setOwnerProducts(products);
      saveOwnerProductsToCache(products);
      console.log('✅ Owner products refreshed successfully');
      return products;
    } catch (err) {
      console.error('❌ Failed to refresh owner products:', err);
      throw err;
    }
  }, [isAuthenticated, user, saveOwnerProductsToCache]);

  // ✅ Initial load from cache with validation
  useEffect(() => {
    const cachedProducts = sessionStorage.getItem('cachedProducts');
    const cachedOwnerProducts = sessionStorage.getItem('cachedOwnerProducts');
    const cachedSearch = sessionStorage.getItem('cachedSearch');

    if (cachedProducts) {
      try {
        const { data, timestamp } = JSON.parse(cachedProducts);
        if (isCacheValid(timestamp)) {
          setProducts(data);
          setCurrentPage(1);
          setHasMore(true);
          initialFetchDone.current = true;
        } else {
          sessionStorage.removeItem('cachedProducts');
        }
      } catch (e) {
        sessionStorage.removeItem('cachedProducts');
      }
    }

    if (cachedOwnerProducts) {
      try {
        const { data, timestamp } = JSON.parse(cachedOwnerProducts);
        if (isCacheValid(timestamp)) {
          setOwnerProducts(data);
        } else {
          sessionStorage.removeItem('cachedOwnerProducts');
        }
      } catch (e) {
        sessionStorage.removeItem('cachedOwnerProducts');
      }
    }

    if (cachedSearch) {
      try {
        const { query, results, error, options } = JSON.parse(cachedSearch);
        setSearchQuery(query || '');
        setSearchResults(results || null);
        setSearchError(error || null);
        setSearchOptions(options || { fuzzy: true, category: null });
      } catch (e) {
        sessionStorage.removeItem('cachedSearch');
      }
    }
  }, []);

  // ✅ Update cache when products change
  useEffect(() => {
    if (products.length > 0) {
      saveProductsToCache(products);
    }
  }, [products, saveProductsToCache]);

  // ✅ Update cache when owner products change
  useEffect(() => {
    if (ownerProducts.length > 0) {
      saveOwnerProductsToCache(ownerProducts);
    }
  }, [ownerProducts, saveOwnerProductsToCache]);

  useEffect(() => {
    sessionStorage.setItem('cachedSearch', JSON.stringify({
      query: searchQuery,
      results: searchResults,
      error: searchError,
      options: searchOptions
    }));
  }, [searchQuery, searchResults, searchError, searchOptions]);

  const fetchProducts = useCallback(async () => {
    if (fetchInProgress.current) return;

    const cachedProducts = sessionStorage.getItem('cachedProducts');
    if (cachedProducts) {
      try {
        const { data, timestamp } = JSON.parse(cachedProducts);
        if (isCacheValid(timestamp) && data.length > 0) {
          setProducts(data);
          setCurrentPage(1);
          setHasMore(true);
          initialFetchDone.current = true;
          setLoading(false);
          return;
        }
      } catch (e) {
        sessionStorage.removeItem('cachedProducts');
      }
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      const data = await getPaginatedProducts(1, LIMIT);
      setProducts(data.products || []);
      setHasMore(data.hasNext || false);
      saveProductsToCache(data.products || []);
      initialFetchDone.current = true;
    } catch (err) {
      setError(err.message || "Failed to fetch products");
      toastService.error(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [LIMIT, saveProductsToCache]);

  useEffect(() => {
    if (!hasChecked || authLoading) return;
    
    if (!initialFetchDone.current && products.length === 0) {
      fetchProducts();
    }
    
    if (!isAuthenticated && initialFetchDone.current) {
      setOwnerProducts([]);
      sessionStorage.removeItem('cachedOwnerProducts');
    }
  }, [hasChecked, authLoading, fetchProducts, products.length, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleProductCreated = async (newProduct) => {
      console.log('🆕 Product created event received');
      
      // Update main products list
      setProducts((prev) => {
        const exists = prev.some(p => p._id === newProduct._id);
        if (exists) return prev;
        const newProducts = [newProduct, ...prev];
        saveProductsToCache(newProducts);
        return newProducts;
      });

      // Refresh owner products if user is owner/admin
      if (user?.role === 'owner' || user?.role === 'admin') {
        await refreshOwnerProductsFromServer();
      }

      // Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('New product added!');
    };

    const handleProductUpdated = async (updatedProduct) => {
      console.log('✏️ Product updated event received');
      
      // Update main products list
      setProducts((prev) => {
        const newProducts = prev.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        saveProductsToCache(newProducts);
        return newProducts;
      });

      // Refresh owner products if user is owner/admin
      if (user?.role === 'owner' || user?.role === 'admin') {
        await refreshOwnerProductsFromServer();
      }

      // Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('Product updated!');
    };

    const handleProductDeleted = async (deletedId) => {
      console.log('🗑️ Product deleted event received');
      
      // Update main products list
      setProducts((prev) => {
        const newProducts = prev.filter((p) => p._id !== deletedId);
        saveProductsToCache(newProducts);
        return newProducts;
      });

      // Refresh owner products if user is owner/admin
      if (user?.role === 'owner' || user?.role === 'admin') {
        await refreshOwnerProductsFromServer();
      }

      // Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('Product deleted!');
    };

    onProductCreated(handleProductCreated);
    onProductUpdate(handleProductUpdated);
    onProductDelete(handleProductDeleted);

    return () => {
      offProductCreated(handleProductCreated);
      offProductUpdate(handleProductUpdated);
      offProductDelete(handleProductDeleted);
    };
  }, [isAuthenticated, user, saveProductsToCache, refreshOwnerProductsFromServer]);

  const fetchAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProducts();
      setProducts(data);
      saveProductsToCache(data);
    } catch (err) {
      setError(err.message || "Failed to fetch all products");
      toastService.error(err.message || "Failed to fetch all products");
    } finally {
      setLoading(false);
    }
  }, [saveProductsToCache]);

  const searchProducts = useCallback(async (query, options = {}) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchError(null);
      setSearchQuery('');
      setSearchOptions({ fuzzy: true, category: null });
      sessionStorage.removeItem('cachedSearch');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchQuery(query);
    setSearchOptions(options);

    try {
      const products = await searchProductsService(query, options);
      setSearchResults(products);
      sessionStorage.setItem('cachedSearch', JSON.stringify({
        query,
        results: products,
        error: null,
        options
      }));
    } catch (err) {
      const errorMsg = 'Failed to search products';
      setSearchError(errorMsg);
      setSearchResults([]);
      sessionStorage.setItem('cachedSearch', JSON.stringify({
        query,
        results: [],
        error: errorMsg,
        options
      }));
      toastService.error(errorMsg);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    setSearchLoading(false);
    setSearchOptions({ fuzzy: true, category: null });
    sessionStorage.setItem('cachedSearch', JSON.stringify({
      query: '',
      results: null,
      error: null,
      options: { fuzzy: true, category: null }
    }));
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (!hasMore || loadingMore || loadMoreInProgress.current) return;
    try {
      loadMoreInProgress.current = true;
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const data = await getPaginatedProducts(nextPage, LIMIT);
      if (data.products && data.products.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p._id));
          const newProducts = data.products.filter(p => !existingIds.has(p._id));
          const updatedProducts = [...prev, ...newProducts];
          saveProductsToCache(updatedProducts);
          return updatedProducts;
        });
        setCurrentPage(nextPage);
        setHasMore(data.hasNext || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setError(error.message || "Failed to load more products");
      toastService.error(error.message || "Failed to load more products");
    } finally {
      setLoadingMore(false);
      loadMoreInProgress.current = false;
    }
  }, [hasMore, loadingMore, currentPage, LIMIT, saveProductsToCache]);

  const getProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const product = await getProductById(id);
      return product;
    } catch (err) {
      setError(err.message || "Failed to fetch product");
      toastService.error(err.message || "Failed to fetch product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwnerProducts = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      const products = await getOwnerProducts();
      console.log('Owner products fetched:', products);
      setOwnerProducts(products);
      saveOwnerProductsToCache(products);
      return products;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load your products";
      setError(msg);
      toastService.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, saveOwnerProductsToCache]);

  const createProduct = useCallback(async (productData) => {
    if (!isAuthenticated) {
      toastService.error('Please login to create products');
      throw new Error('Authentication required');
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await createProducts(productData);
      
      // ✅ Refresh all products and owner products from server
      await Promise.all([
        refreshProductsFromServer(),
        refreshOwnerProductsFromServer()
      ]);
      
      // ✅ Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('Product created successfully!');
      return response;
    } catch (err) {
      setError(err.message || "Failed to create product");
      toastService.error(err.message || "Failed to create product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProductsFromServer, refreshOwnerProductsFromServer]);

  const updateProduct = useCallback(async (id, productData) => {
    if (!isAuthenticated) {
      toastService.error('Please login to update products');
      throw new Error('Authentication required');
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await updateProducts(id, productData);
      
      // ✅ Refresh all products and owner products from server
      await Promise.all([
        refreshProductsFromServer(),
        refreshOwnerProductsFromServer()
      ]);
      
      // ✅ Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('Product updated successfully!');
      return response;
    } catch (err) {
      setError(err.message || "Failed to update product");
      toastService.error(err.message || "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProductsFromServer, refreshOwnerProductsFromServer]);

  const deleteProduct = useCallback(async (id) => {
    if (!isAuthenticated) {
      toastService.error('Please login to delete products');
      throw new Error('Authentication required');
    }
    
    try {
      setLoading(true);
      setError(null);
      await deleteProducts(id);
      
      // ✅ Refresh all products and owner products from server
      await Promise.all([
        refreshProductsFromServer(),
        refreshOwnerProductsFromServer()
      ]);
      
      // ✅ Invalidate search cache
      sessionStorage.removeItem('cachedSearch');
      setSearchResults(null);
      
      toastService.success('Product deleted successfully!');
    } catch (err) {
      setError(err.message || "Failed to delete product");
      toastService.error(err.message || "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshProductsFromServer, refreshOwnerProductsFromServer]);

  const clearError = useCallback(() => setError(null), []);

  // ✅ Expose cache management functions
  const refreshCache = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        refreshProductsFromServer(),
        refreshOwnerProductsFromServer()
      ]);
      toastService.success('Cache refreshed successfully!');
    } catch (err) {
      toastService.error('Failed to refresh cache');
    } finally {
      setLoading(false);
    }
  }, [refreshProductsFromServer, refreshOwnerProductsFromServer]);

  const value = {
    products,
    loading,
    error,
    fetchAllProducts,
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
    loadMoreProducts,
    hasMore,
    loadingMore,
    searchLoading,
    searchError,
    searchQuery,
    searchResults,
    searchProducts,
    setSearchQuery,
    clearSearch,
    searchOptions,
    setSearchOptions,
    fetchOwnerProducts,
    ownerProducts,
    //cache management functions
    refreshCache,
    invalidateAllCaches,
    refreshProductsFromServer,
    refreshOwnerProductsFromServer
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};