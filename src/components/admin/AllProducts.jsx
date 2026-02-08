import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Search, Filter, Grid3X3, List, RefreshCw } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';
import ProductCard from './ProductCard';
import { Link, useNavigate } from 'react-router-dom';

function AllProducts() {
  const {
    ownerProducts = [],
    products = [],
    fetchOwnerProducts,
    fetchAllProducts,
    loading,
    error,
    deleteProduct
  } = useProducts();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllProducts();
    } else if (user?.role === 'owner') {
      fetchOwnerProducts();
    }
  }, [user, fetchOwnerProducts, fetchAllProducts]);

  const handleEdit = (productId) => {
    navigate(`/product/update/${productId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.role === 'admin') {
      await fetchAllProducts();
    } else if (user?.role === 'owner') {
      await fetchOwnerProducts();
    }
    setRefreshing(false);
  };

  const displayProducts = user?.role === 'admin' ? products : ownerProducts;
  const pageTitle = user?.role === 'admin' ? 'All Products' : 'My Products';

  // Filter products by search term
  const filteredProducts = displayProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !refreshing) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {pageTitle}
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} total
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5, repeat: refreshing ? Infinity : 0 }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>

              {(user?.role === 'owner' || user?.role === 'admin') && (
                <Link
                  to="/product/create"
                  className="flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm sm:text-base shadow-lg shadow-black/20"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition text-sm sm:text-base"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {searchTerm ? 'No products found' : 'No products yet'}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm
                ? `No products match "${searchTerm}". Try a different search term.`
                : user?.role === 'admin'
                  ? 'No products have been created yet.'
                  : 'Start by adding your first product!'}
            </p>
            {!searchTerm && user?.role === 'owner' && (
              <Link
                to="/product/create"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-medium shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Your First Product
              </Link>
            )}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}

        {/* Products Grid/List */}
        {filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                : 'space-y-4'
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ProductCard
                    product={product}
                    onEdit={() => handleEdit(product._id)}
                    onDelete={() => deleteProduct(product._id)}
                    showOwnerActions={true}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AllProducts;