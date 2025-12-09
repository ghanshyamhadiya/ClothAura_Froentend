import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPaginatedProducts } from '../services/productService'; // Adjust path if needed
import { toastService } from '../services/toastService'; // Adjust path if needed

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const response = await getPaginatedProducts(page, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    currentPage: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    error: null,
    searchQuery: '',
    searchResults: null,
    searchLoading: false,
    searchError: null,
  },
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    addProduct: (state, action) => {
      const newProduct = action.payload;
      const exists = state.products.some(p => p._id === newProduct._id);
      if (!exists) {
        state.products = [newProduct, ...state.products];
      }
    },
    updateProduct: (state, action) => {
      const updatedProduct = action.payload;
      state.products = state.products.map(p => p._id === updatedProduct._id ? updatedProduct : p);
    },
    deleteProduct: (state, action) => {
      const deletedId = action.payload;
      state.products = state.products.filter(p => p._id !== deletedId);
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSearchLoading: (state, action) => {
      state.searchLoading = action.payload;
    },
    setSearchError: (state, action) => {
      state.searchError = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = null;
      state.searchError = null;
      state.searchLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { products: newProducts, hasNext } = action.payload;
        if (action.meta.arg.page === 1) {
          state.products = newProducts || [];
          state.loading = false;
        } else {
          const existingIds = new Set(state.products.map(p => p._id));
          const filteredNewProducts = newProducts.filter(p => !existingIds.has(p._id));
          state.products = [...state.products, ...filteredNewProducts];
          state.loadingMore = false;
        }
        state.currentPage = action.meta.arg.page;
        state.hasMore = hasNext || false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
        toastService.error(action.payload);
      });
  },
});

export const {
  clearProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  setSearchQuery,
  setSearchResults,
  setSearchLoading,
  setSearchError,
  clearSearch,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;