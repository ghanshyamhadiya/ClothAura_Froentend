import React, { useState } from 'react';
import { useCoupon } from '../../context/CouponContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Tag, Calendar, DollarSign, Percent, Check } from 'lucide-react';

const CreateCoupon = () => {
  const { createCoupon, loading } = useCoupon();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'universal', // universal, welcome, user-specific, loyalty
    discountValue: '',
    discountType: 'percentage', // percentage or fixed
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    applicableProducts: [] // Array of product IDs
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCoupon(formData);
      // Reset form or navigate
      setFormData({ ...formData, code: '', name: '', /* etc. */ });
    } catch (err) {
      console.error('Failed to create coupon:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Tag className="w-6 h-6" /> Create Coupon
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium mb-1">Code *</label>
          <input name="code" value={formData.code} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border rounded">
            <option value="universal">Universal</option>
            <option value="welcome">Welcome</option>
            <option value="user-specific">User-Specific</option>
            <option value="loyalty">Loyalty</option>
          </select>
        </div>
        {/* Discount Value & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Value *</label>
            <input name="discountValue" type="number" value={formData.discountValue} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select name="discountType" value={formData.discountType} onChange={handleChange} required className="w-full p-2 border rounded">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
        </div>
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Valid From *
            </label>
            <input name="validFrom" type="date" value={formData.validFrom} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Valid Until *
            </label>
            <input name="validUntil" type="date" value={formData.validUntil} onChange={handleChange} required className="w-full p-2 border rounded" />
          </div>
        </div>
        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Order Amount</label>
            <input name="minOrderAmount" type="number" value={formData.minOrderAmount} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount Amount</label>
            <input name="maxDiscountAmount" type="number" value={formData.maxDiscountAmount} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Usage Limit</label>
          <input name="usageLimit" type="number" value={formData.usageLimit} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Coupon'}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateCoupon;