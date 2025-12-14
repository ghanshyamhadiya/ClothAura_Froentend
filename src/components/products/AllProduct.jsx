import React, { useEffect } from 'react';
import { ShoppingBag, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '../Loading';
import ProductCard from './ProductCard';
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useProducts } from '../../context/ProductContext';
import SearchBar from '../common/SearchBar';

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

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (inView && hasMore && !loadingMore && !searchResults) {
      loadMoreProducts();
    }
  }, [inView, hasMore, loadingMore, loadMoreProducts, searchResults]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const getPriceInfo = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return { minPrice: 0, maxPrice: 0, minOriginal: 0, hasStock: false };
    }
    let minPrice = Infinity;
    let maxPrice = 0;
    let minOriginal = Infinity;
    let hasStock = false;
    product.variants.forEach(variant => {
      if (variant.sizes && variant.sizes.length > 0) {
        variant.sizes.forEach(size => {
          if (size.stock > 0) {
            hasStock = true;
            minPrice = Math.min(minPrice, size.price);
            maxPrice = Math.max(maxPrice, size.price);
            minOriginal = Math.min(minOriginal, size.originalPrice);
          }
        });
      }
    });
    return {
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      minOriginal: minOriginal === Infinity ? 0 : minOriginal,
      hasStock
    };
  };

  const displayProducts = searchResults !== null ? searchResults : products;

  if (loading && !searchLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:py-12 max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold text-black">All Products</h1>
          </div>
          <p className="text-gray-600 text-sm">Discover our curated collection</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            <span>{displayProducts.length} items</span>
          </div>
        </div>

        {searchError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
            {searchError}
          </div>
        )}

        {searchLoading ? (
          <Loading />
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Package className="w-16 h-16 text-gray-400 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-700">No Products Found</h3>
            <p className="text-gray-500">Try a different search term.</p>
            <button
              onClick={clearSearch}
              className="text-blue-500 hover:underline text-sm font-medium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {displayProducts.map((product, index) => {
                  const firstVariant = product.variants?.[0] || {};
                  const priceInfo = getPriceInfo(product);
                  const mappedProduct = {
                    id: product._id,
                    name: product.name || 'Unnamed Product',
                    category: product.category || "Uncategorized",
                    description: product.description || "",
                    images: firstVariant.images || [],
                    price: priceInfo.minPrice === priceInfo.maxPrice
                      ? priceInfo.minPrice
                      : priceInfo.minPrice,
                    originalPrice: priceInfo.minOriginal > priceInfo.minPrice ? priceInfo.minOriginal : null,
                    rating: product.rating || 4.2,
                    reviews: product.reviews || Math.floor(Math.random() * 100) + 10,
                    discount: product.discount || 0,
                    isNew: product.isNew || (new Date(product.createdAt) > new Date(Date.now() - 7*24*60*60*1000)),
                    inStock: priceInfo.hasStock,
                    variants: product.variants,
                  };
                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link to={`/product/${product._id}`}>
                        <ProductCard product={mappedProduct} />
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {hasMore && !searchResults && (
              <div ref={ref} className="flex justify-center py-12">
                {loadingMore && <Loader2 className="w-8 h-8 animate-spin text-gray-500" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllProduct;