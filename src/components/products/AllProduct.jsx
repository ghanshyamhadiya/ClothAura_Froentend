import React, { useEffect } from 'react';
import { ShoppingBag, Package } from 'lucide-react';
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
    threshold: 0,
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
      return { minPrice: 0, maxPrice: 0, hasStock: false };
    }
    let minPrice = Infinity;
    let maxPrice = 0;
    let hasStock = false;
    product.variants.forEach(variant => {
      if (variant.sizes && variant.sizes.length > 0) {
        variant.sizes.forEach(size => {
          if (size.stock > 0) {
            hasStock = true;
            minPrice = Math.min(minPrice, size.price);
            maxPrice = Math.max(maxPrice, size.price);
          }
        });
      }
    });
    return {
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice,
      hasStock
    };
  };

  const displayProducts = searchResults !== null ? searchResults : products;

  if (loading && !searchLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 mt-[10vh]">
      <div className="max-w-7xl mx-auto">
        {/* <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div> */}
        {/* <div className="mb-6 flex gap-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            <Link to="/cart">Add to cart</Link>
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            <Link to="/wishlist">Add to wishlist</Link>
          </button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded">
            <Link to="/dashboard">Dashboard</Link>
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('cachedProducts');
              sessionStorage.removeItem('cachedSearch');
              fetchProducts();
              clearSearch();
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div> */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-800">All Products</h1>
          </div>
          <p className="text-slate-600">Browse our complete product catalog</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Package className="w-4 h-4" />
            <span>{displayProducts.length} products available</span>
          </div>
        </div>
        {searchError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {searchError}
          </div>
        )}
        {searchLoading ? (
          <Loading />
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Products Found</h3>
            <p className="text-slate-500">Try a different search term.</p>
            <button
              onClick={clearSearch}
              className="mt-4 text-blue-500 hover:underline text-sm"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayProducts.map((product) => {
                const firstVariant = product.variants?.[0] || {};
                const priceInfo = getPriceInfo(product);
                const mappedProduct = {
                  id: product._id,
                  name: product.name || 'Unnamed Product',
                  category: product.category || "Uncategorized",
                  description: product.description || "",
                  images: firstVariant.images || [],
                  price: priceInfo.minPrice === priceInfo.maxPrice
                    ? `₹${priceInfo.minPrice.toLocaleString()}`
                    : `₹${priceInfo.minPrice.toLocaleString()}`,
                  originalPrice: null,
                  rating: product.rating || 0,
                  reviews: product.reviews || 0,
                  discount: product.discount || 0,
                  isNew: product.isNew || false,
                  inStock: priceInfo.hasStock,
                };
                return (
                  <Link key={product._id} to={`/product/${product._id}`}>
                    <ProductCard
                      product={mappedProduct}
                      onAddToCart={() => console.log("Add to cart:", mappedProduct)}
                    />
                  </Link>
                );
              })}
            </div>
            {hasMore && !searchResults && (
              <div ref={ref} className="flex justify-center py-8">
                {loadingMore && (
                  <Loading />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllProduct;