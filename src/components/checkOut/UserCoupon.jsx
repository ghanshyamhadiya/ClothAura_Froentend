import React, { useEffect, useState } from 'react';
import { useCoupon } from '../../context/CouponContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Calendar, DollarSign, Percent, Copy, Check, Gift, Sparkles, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { toastService } from '../../services/toastService';

const UserCoupons = () => {
  const navigate = useNavigate();
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
      case 'welcome': return Gift;
      case 'loyalty': return Sparkles;
      case 'universal': return Tag;
      default: return Tag;
    }
  };

  const getDaysLeft = (validUntil) => {
    const days = Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 bg-black rounded-2xl">
              <Tag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Coupons</h1>
              <p className="text-gray-500 mt-1">
                {userCoupons.length} coupon{userCoupons.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Empty State */}
        {userCoupons.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-8"
            >
              <Tag className="w-32 h-32 text-gray-200 mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">No Coupons Yet</h2>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              Keep shopping to unlock exciting offers and discounts!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-900 transition-colors shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Coupons Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {userCoupons.map((coupon, index) => {
                  const Icon = getCouponIcon(coupon.type);
                  const daysLeft = getDaysLeft(coupon.validUntil);
                  const isExpiringSoon = daysLeft <= 7;
                  const isCopied = copiedCode === coupon.code;

                  return (
                    <motion.div
                      key={coupon._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="group relative"
                    >
                      {/* Coupon Card */}
                      <div className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-xl transition-all duration-300">
                        {/* Header */}
                        <div className="bg-black p-6 text-white relative overflow-hidden">
                          {/* Decorative circles */}
                          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full" />
                          <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/10 rounded-full" />

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <span className="flex items-center gap-2 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                                <Icon className="w-4 h-4" />
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

                            <div className="flex items-baseline gap-2">
                              {coupon.discountType === 'percentage' ? (
                                <>
                                  <span className="text-5xl font-bold">{coupon.discountValue}%</span>
                                  <span className="text-lg opacity-80">OFF</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-5xl font-bold">₹{coupon.discountValue}</span>
                                  <span className="text-lg opacity-80">OFF</span>
                                </>
                              )}
                            </div>

                            <p className="mt-2 text-white/80 text-sm line-clamp-1">{coupon.name}</p>
                          </div>
                        </div>

                        {/* Perforated Line */}
                        <div className="relative h-4 bg-gray-50">
                          <div className="absolute -top-3 left-0 w-6 h-6 bg-white rounded-full border-r-2 border-gray-100" />
                          <div className="absolute -top-3 right-0 w-6 h-6 bg-white rounded-full border-l-2 border-gray-100" />
                          <div className="absolute top-1/2 left-8 right-8 border-t-2 border-dashed border-gray-200" />
                        </div>

                        {/* Body */}
                        <div className="p-6">
                          {/* Coupon Code */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCopy(coupon.code)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all group/code"
                          >
                            <span className="font-mono font-bold text-gray-900 tracking-wider text-lg">
                              {coupon.code}
                            </span>
                            <div className={`p-2 rounded-lg transition-colors ${isCopied ? 'bg-green-100' : 'bg-gray-100 group-hover/code:bg-gray-200'
                              }`}>
                              {isCopied ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                          </motion.button>

                          {/* Details */}
                          <div className="mt-4 space-y-3 text-sm">
                            {coupon.minimumOrderValue > 0 && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <DollarSign className="w-4 h-4" />
                                <span>Min. order: <strong>₹{coupon.minimumOrderValue}</strong></span>
                              </div>
                            )}

                            {coupon.maximumDiscount && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Percent className="w-4 h-4" />
                                <span>Max. discount: <strong>₹{coupon.maximumDiscount}</strong></span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Valid until <strong>{formatDate(coupon.validUntil)}</strong></span>
                            </div>
                          </div>

                          {/* Shop Now Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              handleCopy(coupon.code);
                              navigate('/');
                            }}
                            className="w-full mt-5 py-4 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
                          >
                            Shop Now
                            <ArrowRight className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 bg-gray-50 rounded-3xl p-8 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <Gift className="w-8 h-8 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">How to use your coupons</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { step: 1, text: 'Click on any coupon to copy the code' },
                      { step: 2, text: 'Add products to your cart' },
                      { step: 3, text: 'Apply the coupon code at checkout' },
                      { step: 4, text: 'Enjoy your discount!' }
                    ].map((item) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + item.step * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </span>
                        <span className="text-gray-600">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default UserCoupons;