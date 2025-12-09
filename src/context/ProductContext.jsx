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
  const saveProductsToCache = (productsData) => {
    sessionStorage.setItem('cachedProducts', JSON.stringify({
      data: productsData,
      timestamp: Date.now()
    }));
  };

  // ✅ Initial load from cache with validation
  useEffect(() => {
    const cachedProducts = sessionStorage.getItem('cachedProducts');
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
          // Cache expired, remove it
          sessionStorage.removeItem('cachedProducts');
        }
      } catch (e) {
        sessionStorage.removeItem('cachedProducts');
      }
    }

    if (cachedSearch) {
      const { query, results, error, options } = JSON.parse(cachedSearch);
      setSearchQuery(query || '');
      setSearchResults(results || null);
      setSearchError(error || null);
      setSearchOptions(options || { fuzzy: true, category: null });
    }
  }, []);

  // ✅ Update cache when products change
  useEffect(() => {
    if (products.length > 0) {
      saveProductsToCache(products);
    }
  }, [products]);

  useEffect(() => {
    sessionStorage.setItem('cachedSearch', JSON.stringify({
      query: searchQuery,
      results: searchResults,
      error: searchError,
      options: searchOptions
    }));
  }, [searchQuery, searchResults, searchError, searchOptions]);

  // const isOwner = useCallback((product) => {
  //   const currentUserId = user?.id;
  //   if (!product || !currentUserId) return false;

  //   const ownerId = typeof product.owner === 'object' ? product.owner._id : product.owner;

  //   return ownerId.toString() === currentUserId.toString();
  // }, [currentUserId])

  // const canEditProduct = useCallback((product, userRole) => {
  //   const userRole = user.role;
  //   if(userRole === 'admin') return true;
  //   return isOwner(product);
  // }, [isOwner])

  const fetchProducts = useCallback(async () => {
    if (fetchInProgress.current) return;

    // ✅ Check cache validity before using
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
  }, [LIMIT]);

  useEffect(() => {
    if (!hasChecked || authLoading) return;
    if (isAuthenticated && !initialFetchDone.current && products.length === 0) {
      fetchProducts();
    } else if (!isAuthenticated) {
      setProducts([]);
      setSearchQuery('');
      setSearchResults(null);
      setSearchError(null);
      sessionStorage.removeItem('cachedProducts');
      sessionStorage.removeItem('cachedSearch');
      initialFetchDone.current = false;
    }
  }, [isAuthenticated, hasChecked, authLoading, fetchProducts, products.length]);

  // ✅ Socket listeners with immediate cache update
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleProductCreated = (newProduct) => {
      setProducts((prev) => {
        const exists = prev.some(p => p._id === newProduct._id);
        if (exists) return prev;
        const newProducts = [newProduct, ...prev];
        saveProductsToCache(newProducts);
        return newProducts;
      });
      toastService.success('New product added!');
    };

    const handleProductUpdated = (updatedProduct) => {
      setProducts((prev) => {
        const newProducts = prev.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        saveProductsToCache(newProducts);
        return newProducts;
      });
      toastService.success('Product updated!');
    };

    const handleProductDeleted = (deletedId) => {
      setProducts((prev) => {
        const newProducts = prev.filter((p) => p._id !== deletedId);
        saveProductsToCache(newProducts);
        return newProducts;
      });
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
  }, [isAuthenticated]);

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
  }, [hasMore, loadingMore, currentPage, LIMIT]);

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
      return products;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load your products";
      setError(msg);
      toastService.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await createProducts(productData);
      toastService.success('Product created successfully!');
      return response;
    } catch (err) {
      setError(err.message || "Failed to create product");
      toastService.error(err.message || "Failed to create product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateProducts(id, productData);
      toastService.success('Product updated successfully!');
      return response;
    } catch (err) {
      setError(err.message || "Failed to update product");
      toastService.error(err.message || "Failed to update product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteProducts(id);
      toastService.success('Product deleted successfully!');
    } catch (err) {
      setError(err.message || "Failed to delete product");
      toastService.error(err.message || "Failed to delete product");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    products,
    loading,
    error,
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
    ownerProducts
    // canEditProduct
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};