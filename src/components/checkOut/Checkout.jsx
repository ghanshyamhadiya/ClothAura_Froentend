import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { useCoupon } from '../../context/CouponContext';
import socketManager from '../../utils/socket';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, ArrowLeft, CreditCard, Truck, Wallet, MapPin, Plus, Edit, Home, Tag, AlertCircle } from 'lucide-react';
import Button from '../Button';
import { useCartWishlist } from '../../context/CartWhislistContext';
import AddressAddModal from '../model/AddressAddModal';
import { toastService } from '../../services/toastService';

const Checkout = () => {
  const { cart, updateCartQuantity, clearCart, loading: cartLoading, getCartTotal } = useCartWishlist();
  const { user, addresses, loading: authLoading, addAddress, updateAddress, getAddresses } = useAuth();
  const { validateCoupon } = useCoupon();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [updatedQuantities, setUpdatedQuantities] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  // ✅ Calculate available payment methods based on ALL products in cart
  const availablePaymentMethods = useMemo(() => {
    if (!cart || cart.length === 0) {
      return ['cod', 'card', 'upi', 'wallet'];
    }

    const allPaymentMethods = ['cod', 'card', 'upi', 'wallet'];
    
    // Find common payment methods across ALL products
    return allPaymentMethods.filter(method => {
      return cart.every(item => {
        const product = item.product;
        if (!product) return false;
        
        const allowedMethods = product.allowedPaymentMethods || ['cod', 'card', 'upi', 'wallet'];
        return allowedMethods.includes(method);
      });
    });
  }, [cart]);

  // ✅ Automatically select first available payment method
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0]);
    }
  }, [availablePaymentMethods, paymentMethod]);

  const paymentOptions = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      description: 'Pay using UPI apps',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'PayTM, PhonePe, Google Pay',
      icon: <Wallet className="w-5 h-5" />,
    }
  ];

  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setApplyingCoupon(true);
    setCouponError('');
    
    try {
      const result = await validateCoupon(couponCode.trim(), getCartTotal());
      if (result.success) {
        setDiscountAmount(result.discountAmount);
        setAppliedCouponCode(couponCode.trim());
        toastService.success(`Coupon applied! Save ₹${result.discountAmount.toFixed(2)}`);
      } else {
        setDiscountAmount(0);
        setAppliedCouponCode('');
        setCouponError(result.message || 'Invalid coupon code');
        toastService.error(result.message || 'Invalid coupon code');
      }
    } catch (error) {
      setDiscountAmount(0);
      setAppliedCouponCode('');
      setCouponError(error?.message || 'Invalid coupon code');
      toastService.error(error?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCouponCode('');
    setDiscountAmount(0);
    setCouponError('');
    toastService.info('Coupon removed');
  };

  const subtotal = getCartTotal() || 0;
  const gst = subtotal * 0.18;
  const finalTotal = Math.max(0, subtotal + gst - discountAmount);

  const formatValue = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
    if (typeof v === 'object') {
      return v.name ?? v.label ?? v.size ?? v.title ?? v.type ?? JSON.stringify(v);
    }
    return String(v);
  };

  const formatPrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  const addressesList = Array.isArray(addresses) ? addresses : [];

  useEffect(() => {
    if (addressesList.length > 0 && !selectedAddress) {
      const defaultAddress = addressesList.find(addr => addr.isDefault);
      if (defaultAddress) setSelectedAddress(defaultAddress);
    }
    
    if (location.state?.error) {
      toastService.error(location.state.error);
    }

    const onOrderCreated = (order) => {
      setOrderSuccess(true);
      clearCart();
      setUpdatedQuantities({});
      setSelectedAddress(addressesList.find(addr => addr.isDefault) || null);
      setPaymentMethod(availablePaymentMethods[0] || 'cod');
      setCouponCode('');
      setAppliedCouponCode('');
      setDiscountAmount(0);

      setTimeout(() => {
        navigate('/orders', {
          state: {
            message: `Order #${order._id.slice(-8)} placed successfully!`,
            orderId: order._id
          }
        });
      }, 2000);
    };

    socketManager.on('orderCreated', onOrderCreated);

    return () => {
      socketManager.off('orderCreated', onOrderCreated);
    };
  }, [addresses, navigate, clearCart, selectedAddress, availablePaymentMethods, addressesList]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatedQuantities((prev) => ({ ...prev, [itemId]: newQuantity }));
    try {
      await updateCartQuantity(itemId, newQuantity);
      if (appliedCouponCode) {
        const result = await validateCoupon(appliedCouponCode, getCartTotal());
        if (result.success) {
          setDiscountAmount(result.discountAmount);
        } else {
          handleRemoveCoupon();
        }
      }
    } catch (err) {
      toastService.error(err?.message ?? String(err));
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
  };

  const handlePaymentMethodChange = (methodId) => {
    if (availablePaymentMethods.includes(methodId)) {
      setPaymentMethod(methodId);
    } else {
      toastService.error('This payment method is not available for products in your cart');
    }
  };

  const handleAddAddress = async (addressData) => {
    try {
      const address = await addAddress(addressData);
      setSelectedAddress(address);
      await getAddresses();
    } catch (err) {
      toastService.error(err?.message ?? 'Failed to add address');
      throw err;
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toastService.error('Please log in to place an order');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (!user.isEmailVerified) {
      toastService.error('Please verify your email before placing an order');
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      toastService.error('Your cart is empty');
      navigate('/products');
      return;
    }

    if (!selectedAddress) {
      toastService.error('Please select a delivery address');
      return;
    }

    if (!paymentMethod) {
      toastService.error('Please select a payment method');
      return;
    }

    if (!availablePaymentMethods.includes(paymentMethod)) {
      toastService.error('Selected payment method is not available for products in your cart');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user._id,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        quantities: Object.keys(updatedQuantities).length > 0 ? updatedQuantities : undefined,
      };

      if (appliedCouponCode && discountAmount > 0) {
        orderData.couponCode = appliedCouponCode;
      }

      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        toastService.success('Order placed successfully!');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to place order';
      const errorCode = err?.response?.data?.code;
      
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        toastService.error('Please verify your email before placing an order');
      } else if (errorCode === 'INSUFFICIENT_STOCK') {
        toastService.error(errorMessage);
        try {
          await clearCart();
          navigate('/cart');
        } catch {}
      } else if (errorCode === 'INVALID_COUPON') {
        toastService.error(errorMessage);
        handleRemoveCoupon();
      } else if (errorCode === 'PAYMENT_METHOD_NOT_ALLOWED') {
        toastService.error(errorMessage);
        const availableMethods = err?.response?.data?.availablePaymentMethods || [];
        if (availableMethods.length > 0) {
          setPaymentMethod(availableMethods[0]);
        }
      } else {
        toastService.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut', delay: 0.3 } }
  };

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    }
  };

  if (orderSuccess) {
    return (
      <motion.div
        variants={successVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4 mt-[10vh]"
      >
        <div className="text-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-white text-2xl font-bold"
            >
              ✓
            </motion.div>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">Redirecting to your order history...</p>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"
          />
        </div>
      </motion.div>
    );
  }

  if (user && !user.isEmailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email address before placing an order.
          </p>
          <Button
            to="/profile"
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4"
      >
        <div className="max-w-4xl mx-auto pt-8">
          <motion.div variants={headerVariants} className="flex items-center gap-3 mb-8">
            <Button
              to="/cart"
              primary={false}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Back to Cart
            </Button>
            <div className="p-3 bg-black rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </motion.div>

          {(cartLoading || authLoading || loading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-600 mb-4 p-4 bg-gray-50 rounded-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full"
              />
              Processing...
            </motion.div>
          )}

          {/* Cart Items Section */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Cart Items (Subtotal: ₹{subtotal.toFixed(2)})
            </h3>
            {(!Array.isArray(cart) || cart.length === 0) ? (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <Button to="/products" className="bg-black text-white px-6 py-2 rounded-xl">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {formatValue(item.product?.name) || 'Product'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Variant: {formatValue(item.variant)} • Size: {formatValue(item.size)}
                        </p>
                        <p className="text-sm text-gray-600">₹{formatPrice(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <motion.input
                          whileFocus={{ scale: 1.05 }}
                          type="number"
                          min="1"
                          value={updatedQuantities[item._id] ?? (Number(item.quantity) || 1)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleQuantityChange(item._id, Number.isNaN(val) ? 1 : val);
                          }}
                          className="w-16 p-2 border border-gray-200 rounded-lg text-center focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Shipping Address Section */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              {addressesList.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h4>
                  <p className="text-gray-600 mb-6">Add your first address to continue</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Select Address</h4>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddressModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New
                    </motion.button>
                  </div>

                  <div className="grid gap-3">
                    {addressesList.map((addr) => (
                      <motion.div
                        key={addr._id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAddressSelect(addr)}
                        className={`
                          p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${selectedAddress?._id === addr._id
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddress?._id === addr._id}
                              onChange={() => handleAddressSelect(addr)}
                              className="mt-1 h-4 w-4"
                            />
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">{addr.street}</p>
                                <p className="text-sm text-gray-600">
                                  {addr.city}, {addr.state} - {addr.postalCode}
                                </p>
                                {addr.isDefault && (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mt-1">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link
                            to="/address"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Manage Addresses"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Method Section */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h3>

            {/* Show warning if some payment methods are unavailable */}
            {availablePaymentMethods.length < 4 && cart && cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Limited Payment Options</p>
                    <p>Some payment methods are unavailable based on the products in your cart. Only {availablePaymentMethods.length} method{availablePaymentMethods.length !== 1 ? 's' : ''} available.</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="grid gap-4">
                {paymentOptions.map((option) => {
                  const isAvailable = availablePaymentMethods.includes(option.id);
                  
                  return (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: isAvailable ? 1.01 : 1 }}
                      whileTap={{ scale: isAvailable ? 0.99 : 1 }}
                      className={`
                        p-4 border-2 rounded-xl transition-all duration-300
                        ${paymentMethod === option.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onClick={() => isAvailable && handlePaymentMethodChange(option.id)}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={paymentMethod === option.id}
                          onChange={() => isAvailable && handlePaymentMethodChange(option.id)}
                          disabled={!isAvailable}
                          className="h-4 w-4"
                        />
                        <div className={`p-2 rounded-lg ${paymentMethod === option.id ? 'bg-black text-white' : 'bg-gray-100'}`}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600">{option.description}</p>
                          {!isAvailable && (
                            <p className="text-xs text-red-500 mt-1">Not available for products in your cart</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div variants={sectionVariants}>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>

              {/* Coupon Input */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Have a coupon?</span>
                </div>
                
                {appliedCouponCode ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-700">
                        {appliedCouponCode}
                      </span>
                      <span className="text-sm text-green-600">
                        (-₹{discountAmount.toFixed(2)})
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleCouponApply()}
                        disabled={applyingCoupon}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 uppercase"
                      />
                      <Button
                        onClick={handleCouponApply}
                        disabled={!couponCode.trim() || applyingCoupon}
                        loading={applyingCoupon}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {couponError}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (18%):</span>
                  <span className="text-gray-900 font-medium">₹{gst.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-gray-900">₹{finalTotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-sm text-green-600 text-right mt-1">
                      You saved ₹{discountAmount.toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Place Order Button */}
          <motion.div
            variants={sectionVariants}
            className="flex justify-end"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlaceOrder}
              disabled={
                loading ||
                cartLoading ||
                authLoading ||
                !Array.isArray(cart) ||
                cart.length === 0 ||
                !selectedAddress ||
                !paymentMethod ||
                !availablePaymentMethods.includes(paymentMethod)
              }
              className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-all group min-w-[200px]"
            >
              {loading || cartLoading || authLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Address Add Modal */}
      <AddressAddModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAdd={handleAddAddress}
        loading={loading || authLoading}
      />
    </>
  );
};

export default Checkout;