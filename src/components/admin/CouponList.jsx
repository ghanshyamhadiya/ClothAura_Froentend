import React, { useEffect } from 'react';
import { useCoupon } from '../../context/CouponContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Tag, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const CouponList = () => {
  const { fetchCoupons, coupons, deleteCoupon, loading } = useCoupon();
  const { user } = useAuth();

  useEffect(() => {
    fetchCoupons(); // Fetch all (admin view)
  }, [fetchCoupons]);

  const handleDelete = async (id) => {
    if (confirm('Delete this coupon?')) {
      try {
        await deleteCoupon(id);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="w-6 h-6" /> All Coupons
        </h1>
        <Link to="/admin/create-coupon" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          Create New
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <motion.div
              key={coupon._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 rounded-lg border shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{coupon.name}</h3>
                  <p className="text-sm text-gray-600">Code: {coupon.code}</p>
                  <p className="text-sm text-gray-600">Type: {coupon.type}</p>
                  <p className="text-sm text-gray-600">
                    Discount: {coupon.discountValue}% {coupon.discountType === 'percentage' ? '(%)' : '(Fixed)'} 
                    {coupon.minOrderAmount && ` | Min: ₹${coupon.minOrderAmount}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Valid: {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                  </p>
                  {coupon.usageLimit && <p className="text-xs">Usage Limit: {coupon.usageCount}/{coupon.usageLimit}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <Link to={`/admin/coupon/${coupon._id}`} title="View">
                    <Eye className="w-5 h-5 text-gray-500" />
                  </Link>
                  <Link to={`/admin/edit-coupon/${coupon._id}`} title="Edit">
                    <Edit className="w-5 h-5 text-blue-500" />
                  </Link>
                  <button onClick={() => handleDelete(coupon._id)} title="Delete">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {coupons.length === 0 && <p>No coupons found.</p>}
    </motion.div>
  );
};

export default CouponList;