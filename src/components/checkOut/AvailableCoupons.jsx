import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Percent, Clock, Sparkles, Gift, ChevronRight, Check } from 'lucide-react';
import { useCoupon } from '../../context/CouponContext';
import { useAuth } from '../../context/AuthContext';

const AvailableCoupons = ({ onApplyCoupon, appliedCouponCode, cartTotal }) => {
    const { userCoupons, fetchUserCoupons, loading } = useCoupon();
    const { isAuthenticated } = useAuth();

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchUserCoupons();
        }
    }, [isAuthenticated, fetchUserCoupons]);

    if (!isAuthenticated || loading) return null;

    const getCouponIcon = (type) => {
        switch (type) {
            case 'welcome': return Gift;
            case 'loyalty': return Sparkles;
            default: return Tag;
        }
    };

    const getDaysLeft = (validUntil) => {
        const days = Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const isApplicable = (coupon) => {
        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
            return false;
        }
        return true;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Tag size={14} className="text-gray-600" />
                    </div>
                    Available Coupons
                </h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {userCoupons?.length || 0} available
                </span>
            </div>

            {(!userCoupons || userCoupons.length === 0) ? (
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 text-center"
                >
                    <Tag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No coupons available</p>
                </motion.div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <AnimatePresence>
                        {userCoupons.map((coupon, index) => {
                            const Icon = getCouponIcon(coupon.type);
                            const daysLeft = getDaysLeft(coupon.validUntil);
                            const isExpiringSoon = daysLeft <= 7;
                            const isApplied = appliedCouponCode === coupon.code;
                            const canApply = isApplicable(coupon);

                            return (
                                <motion.div
                                    key={coupon._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={canApply && !isApplied ? { scale: 1.01 } : {}}
                                    className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${isApplied
                                            ? 'border-black bg-black text-white'
                                            : canApply
                                                ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                                : 'border-gray-100 bg-gray-50 opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 p-3">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isApplied ? 'bg-white/10' : 'bg-gray-100'
                                            }`}>
                                            <Icon size={16} className={isApplied ? 'text-white' : 'text-gray-600'} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                {coupon.discountType === 'percentage' ? (
                                                    <span className="text-lg font-bold">{coupon.discountValue}% OFF</span>
                                                ) : (
                                                    <span className="text-lg font-bold">₹{coupon.discountValue} OFF</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${isApplied ? 'bg-white/20 text-white/80' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {coupon.code}
                                                </code>

                                                {coupon.minOrderAmount > 0 && (
                                                    <span className={`text-xs ${isApplied ? 'text-white/60' : canApply ? 'text-gray-400' : 'text-red-400'
                                                        }`}>
                                                        Min ₹{coupon.minOrderAmount}
                                                    </span>
                                                )}

                                                {isExpiringSoon && (
                                                    <span className={`flex items-center gap-0.5 text-xs ${isApplied ? 'text-red-300' : 'text-red-500'
                                                        }`}>
                                                        <Clock size={10} />
                                                        {daysLeft}d
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Apply Button */}
                                        <motion.button
                                            whileHover={{ scale: canApply && !isApplied ? 1.05 : 1 }}
                                            whileTap={{ scale: canApply && !isApplied ? 0.95 : 1 }}
                                            onClick={() => canApply && !isApplied && onApplyCoupon(coupon.code)}
                                            disabled={!canApply || isApplied}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${isApplied
                                                    ? 'bg-white text-black'
                                                    : canApply
                                                        ? 'bg-black text-white hover:bg-gray-800'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isApplied ? (
                                                <>
                                                    <Check size={12} />
                                                    Applied
                                                </>
                                            ) : (
                                                <>
                                                    Apply
                                                    <ChevronRight size={12} />
                                                </>
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Applied indicator bar */}
                                    {isApplied && (
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            className="h-0.5 bg-white/30 origin-left"
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

export default AvailableCoupons;
