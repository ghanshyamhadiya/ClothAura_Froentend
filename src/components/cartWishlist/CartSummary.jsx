import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Truck, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ total = 0, tax = 0, finalTotal = 0, isMobile = false }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-3xl p-6 border border-gray-100"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

      <div className="space-y-4">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">₹{Number(total).toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </span>
          <span className="font-medium text-green-600">Free</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>GST (18%)</span>
          <span className="font-medium text-gray-900">₹{Number(tax).toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <motion.span
              key={finalTotal}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-gray-900"
            >
              ₹{Number(finalTotal).toFixed(2)}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Promo Code Hint */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="mt-6 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3 text-gray-600">
          <Tag className="w-5 h-5" />
          <span className="text-sm">Have a coupon? Apply at checkout</span>
        </div>
      </motion.div>

      {/* Checkout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/checkout')}
        className="w-full mt-6 py-4 bg-black text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors shadow-lg"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </motion.button>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Shield className="w-4 h-4" />
        <span>Secure checkout</span>
      </div>

      {/* Features */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Truck, text: 'Free Delivery' },
            { icon: Shield, text: 'Secure Payment' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2 text-gray-500 text-sm"
            >
              <feature.icon className="w-4 h-4" />
              <span>{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CartSummary;
