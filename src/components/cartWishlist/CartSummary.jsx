import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';

const CartSummary = ({ total = 0, tax = 0, finalTotal = 0, isMobile = false }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h2 className="text-xl font-bold mb-5">Order Summary</h2>
      <div className="space-y-3 text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{Number(total).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span>₹{Number(tax).toFixed(2)}</span>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>₹{Number(finalTotal).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate('/checkout')}
        className="w-full mt-6 py-4 rounded-xl bg-black text-white font-semibold text-lg hover:bg-gray-900 transition flex items-center justify-center gap-3"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </Button>
    </motion.div>
  );
};

export default CartSummary;
