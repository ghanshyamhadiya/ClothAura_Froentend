import React, { useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';
import ProductCard from './ProductCard';
import { Link, useNavigate } from 'react-router-dom';

function AllProducts() {
  const {
    ownerProducts = [],
    fetchOwnerProducts,
    loading,
    error,
    deleteProduct
  } = useProducts();

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      fetchOwnerProducts();
    }
  }, [user, fetchOwnerProducts]);

  const handleEdit = (productId) => {
    navigate(`/product/update/${productId}`);
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;

  // ✅ Safe check with optional chaining and default
  if (!ownerProducts || ownerProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No products yet</h2>
        <p className="text-gray-600 mt-2">Start by adding your first product!</p>
        <Link to="/product/create" className="btn btn-primary mt-6">
          Add Product
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Products ({ownerProducts.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ownerProducts.map(product => (
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