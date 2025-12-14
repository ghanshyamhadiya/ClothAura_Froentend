import React, { useEffect } from 'react';
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

  // Determine which products to display based on role
  const displayProducts = user?.role === 'admin' ? products : ownerProducts;
  const pageTitle = user?.role === 'admin' ? 'All Products' : 'My Products';

  if (loading) return <Loading />;

  if (!displayProducts || displayProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No products yet</h2>
        <p className="text-gray-600 mt-2">
          {user?.role === 'admin' 
            ? 'No products have been created yet.' 
            : 'Start by adding your first product!'}
        </p>
        {user?.role === 'owner' && (
          <Link to="/product/create" className="btn btn-primary mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Add Product
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {pageTitle} ({displayProducts.length})
        </h1>
        {(user?.role === 'owner' || user?.role === 'admin') && (
          <Link 
            to="/product/create" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Product
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayProducts.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            onEdit={() => handleEdit(product._id)}
            onDelete={() => deleteProduct(product._id)}
            showOwnerActions={true}
          />
        ))}
      </div>
    </div>
  );
}

export default AllProducts;