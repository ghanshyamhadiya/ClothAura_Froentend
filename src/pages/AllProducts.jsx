import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Package, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';

import { useProducts } from '../context/ProductContext';
import Loading from '../components/Loading';
import ProductCard from '../components/products/ProductCard';

function AllProduct() {
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    fetchProducts,
    loadMoreProducts,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchProducts,
    searchLoading,
    searchError,
    clearSearch,
  } = useProducts();

  const { ref, inView } = useInView({ threshold: 0.1 });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !searchResults) {
      loadMoreProducts();
    }
  }, [inView, hasMore, loadingMore, loadMoreProducts, searchResults]);


  const displayProducts = searchResults !== null ? searchResults : products;

  // Loading state: show full page loader only on first load
  if (loading && !searchLoading) {
    return <Loading />;
  }

  return (
    <div className="">

      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-5">
        {/* Search Loading State */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <Loading />
              <p className="mt-6 text-lg text-gray-600 font-medium">Searching for "{searchQuery}"...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Error */}
        {searchError && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-red-600 font-medium">{searchError}</p>
            <button
              onClick={clearSearch}
              className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Search Loading (after delay) */}
        {searchLoading && !isSearching && (
          <Loading />
        )}

        {/* Empty State */}
        {!searchLoading && !isSearching && displayProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Try searching with different keywords or browse our full collection.
            </p>
            <button
              onClick={clearSearch}
              className="mt-6 px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
            >
              View All Products
            </button>
          </motion.div>
        )}

        {/* Products Grid */}
        {!searchLoading && !isSearching && displayProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {displayProducts.map((product, index) => {
                  const firstVariant = product.variants?.[0] || {};
                  const priceInfo = (() => {
                    let minPrice = Infinity;
                    let originalPrice = null;
                    let hasStock = false;

                    product.variants?.forEach(v => {
                      v.sizes?.forEach(s => {
                        if (s.stock > 0) {
                          hasStock = true;
                          if (s.price < minPrice) {
                            minPrice = s.price;
                            originalPrice = s.originalPrice;
                          }
                        }
                      });
                    });

                    return {
                      minPrice: minPrice === Infinity ? 0 : minPrice,
                      originalPrice: originalPrice || minPrice,
                      hasStock,
                    };
                  })();

                  const mappedProduct = {
                    id: product._id,
                    name: product.name,
                    category: product.category,
                    price: priceInfo.minPrice,
                    originalPrice: priceInfo.originalPrice,
                    images: firstVariant.images || [],
                    inStock: priceInfo.hasStock,
                    isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    rating: product.averageRating || 4.5,
                    totalReviews: product.totalReviews || 0,
                  };

                  return (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Link to={`/product/${product._id}`}>
                        <ProductCard product={mappedProduct} />
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Infinite Scroll Loader */}
            {hasMore && !searchResults && (
              <div ref={ref} className="flex justify-center py-12">
                {loadingMore && <Loading />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllProduct;