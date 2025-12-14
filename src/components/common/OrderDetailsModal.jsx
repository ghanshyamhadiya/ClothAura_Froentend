import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  MapPin,
  CreditCard,
  Tag,
  ShoppingBag,
  Package,
  DollarSign,
  Calendar
} from 'lucide-react';

const OrderDetailsModal = ({
  order,
  isOpen,
  onClose,
  userRole,
  calculateOwnerOrderTotal,
  formatCurrency,
  formatDate
}) => {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-8 py-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-black">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-sm font-medium text-gray-600">Subtotal</p>
                  <p className="text-2xl font-bold text-black mt-2">
                    {formatCurrency(order.subtotal)}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-sm font-medium text-gray-600">Discount</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {order.coupon ? formatCurrency(order.coupon.discountAmount) : '₹0'}
                  </p>
                </div>

                <div className="bg-black text-white rounded-xl p-6 shadow-lg">
                  <p className="text-sm font-medium opacity-90">
                    {userRole === 'owner' ? 'Your Earnings' : 'Final Amount'}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(calculateOwnerOrderTotal(order))}
                  </p>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Customer */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                    <User className="w-5 h-5" />
                    Customer Details
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
                    <p className="font-medium text-black text-lg">
                      {order.userId?.username || 'Guest User'}
                    </p>
                    <p className="text-gray-600">
                      {order.userId?.email || '—'}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <p className="text-gray-800 leading-relaxed">
                      {order.shippingAddress?.street || '—'}<br />
                      {order.shippingAddress?.city && (
                        <>
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                          <br />
                        </>
                      )}
                      {order.shippingAddress?.country || 'India'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment & Coupon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <p className="font-semibold text-lg capitalize">
                      {order.paymentMethod === 'cod'
                        ? 'Cash on Delivery'
                        : order.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Coupon Applied */}
                {order.coupon && (
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-3 mb-4">
                      <Tag className="w-5 h-5" />
                      Coupon Applied
                    </h3>
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl p-6">
                      <p className="font-bold text-xl text-black">{order.coupon.code}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Discount: <span className="font-bold text-green-600">
                          {formatCurrency(order.coupon.discountAmount)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-6 h-6" />
                  Order Items ({order.items.length})
                </h3>

                <div className="space-y-5">
                  {order.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex justify-between items-center hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-5">
                        {/* Placeholder Image */}
                        <div className="w-20 h-20 bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-500" />
                        </div>

                        <div>
                          <h4 className="font-semibold text-lg text-black">
                            {item.productId?.name || 'Product Name Unavailable'}
                          </h4>
                          <p className="text-gray-600 mt-1">
                            Quantity: <strong>{item.quantity}</strong> × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-black">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 px-8 py-6 bg-white">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-10 py-4 bg-black text-white font-semibold text-lg rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;