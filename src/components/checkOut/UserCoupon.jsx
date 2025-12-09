import React, { useEffect, useState } from 'react';
import { useCoupon } from '../../context/CouponContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Calendar, DollarSign, Percent, Copy, Check, Gift, Sparkles, Clock } from 'lucide-react';
import { toastService } from '../../services/toastService';

const UserCoupons = () => {
  const { userCoupons, fetchUserCoupons, loading } = useCoupon();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserCoupons();
    }
  }, [user, fetchUserCoupons]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toastService.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCouponIcon = (type) => {
    switch (type) {
      case 'welcome': return <Gift className="w-5 h-5" />;
      case 'loyalty': return <Sparkles className="w-5 h-5" />;
      case 'universal': return <Tag className="w-5 h-5" />;
      default: return <Tag className="w-5 h-5" />;
    }
  };

  const getCouponColor = (type) => {
    switch (type) {
      case 'welcome': return 'from-blue-500 to-purple-600';
      case 'loyalty': return 'from-amber-500 to-orange-600';
      case 'universal': return 'from-green-500 to-teal-600';
      case 'user': return 'from-pink-500 to-rose-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDaysLeft = (validUntil) => {
    const days = Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <Tag className="w-8 h-8 text-white" />
            </div>
            My Coupons
          </h1>
          <p className="text-gray-600">
            {userCoupons.length} coupon{userCoupons.length !== 1 ? 's' : ''} available
          </p>
        </motion.div>

        {/* Coupons Grid */}
        {userCoupons.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center"
          >
            <Tag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Coupons Yet</h2>
            <p className="text-gray-600 mb-6">
              Keep shopping to unlock exciting offers and discounts!
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {userCoupons.map((coupon, index) => {
                const daysLeft = getDaysLeft(coupon.validUntil);
                const isExpiringSoon = daysLeft <= 7;

                return (
                  <motion.div
                    key={coupon._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    {/* Coupon Card */}
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Header with gradient */}
                      <div className={`bg-gradient-to-br ${getCouponColor(coupon.type)} p-6 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-2 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                              {getCouponIcon(coupon.type)}
                              {coupon.type.charAt(0).toUpperCase() + coupon.type.slice(1)}
                            </span>
                            {isExpiringSoon && (
                              <motion.span
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="flex items-center gap-1 text-xs bg-red-500 px-2 py-1 rounded-full"
                              >
                                <Clock className="w-3 h-3" />
                                {daysLeft}d left
                              </motion.span>
                            )}
                          </div>
                          
                          <h3 className="text-2xl font-bold mb-2">{coupon.name}</h3>
                          
                          <div className="flex items-baseline gap-2">
                            {coupon.discountType === 'percentage' ? (
                              <>
                                <span className="text-4xl font-bold">{coupon.discountValue}%</span>
                                <span className="text-sm opacity-90">OFF</span>
                              </>
                            ) : (
                              <>
                                <span className="text-4xl font-bold">₹{coupon.discountValue}</span>
                                <span className="text-sm opacity-90">OFF</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-6">
                        {/* Description */}
                        {coupon.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {coupon.description}
                          </p>
                        )}

                        {/* Coupon Code */}
                        <div className="mb-4">
                          <label className="text-xs text-gray-500 mb-1 block">COUPON CODE</label>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCopy(coupon.code)}
                            className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors group"
                          >
                            <span className="font-mono font-bold text-gray-900 tracking-wider">
                              {coupon.code}
                            </span>
                            {copiedCode === coupon.code ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            )}
                          </motion.button>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          {coupon.minimumOrderValue > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>Min. order: ₹{coupon.minimumOrderValue}</span>
                            </div>
                          )}
                          
                          {coupon.maximumDiscount && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Percent className="w-4 h-4" />
                              <span>Max. discount: ₹{coupon.maximumDiscount}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Valid until {formatDate(coupon.validUntil)}</span>
                          </div>
                        </div>

                        {/* Apply Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleCopy(coupon.code);
                            window.location.href = '/products';
                          }}
                          className={`w-full mt-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${getCouponColor(coupon.type)} hover:shadow-lg transition-all`}
                        >
                          Shop Now
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-100"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">How to use coupons?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. Click on any coupon to copy the code</li>
                <li>2. Add products to your cart</li>
                <li>3. Apply the coupon code at checkout</li>
                <li>4. Enjoy your discount!</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserCoupons;