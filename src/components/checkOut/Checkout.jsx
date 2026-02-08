import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Wallet,
  Minus,
  Plus,
  MapPin,
  Tag,
  Shield,
  ChevronRight,
  Check,
  Sparkles,
  Package
} from 'lucide-react';
import { useCartWishlist } from '../../context/CartWhislistContext';
import { useCoupon } from '../../context/CouponContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import socketManager from '../../utils/socket';
import Button from '../Button';
import AddressAddModal from '../model/AddressAddModal';
import { toastService } from '../../services/toastService';
import Loading from '../Loading';
import AvailableCoupons from './AvailableCoupons';
import CouponSuccessAnimation from './CouponSuccessAnimation';

const Checkout = () => {
  const {
    cart: ctxCart = [],
    updateCartQuantity,
    clearCart,
    loading: cartLoading,
    getCartTotal
  } = useCartWishlist();

  const {
    user,
    addresses: ctxAddresses = [],
    loading: authLoading,
    addAddress,
    getAddresses
  } = useAuth();

  const { validateCoupon } = useCoupon();

  // local state
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [updatedQuantities, setUpdatedQuantities] = useState({});
  const [isDiscountAnimating, setIsDiscountAnimating] = useState(false);
  const [showCouponSuccess, setShowCouponSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showCouponSection, setShowCouponSection] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const cart = Array.isArray(ctxCart) ? ctxCart : [];
  const addresses = Array.isArray(ctxAddresses) ? ctxAddresses : [];

  const availablePaymentMethods = cart.reduce((acc, item) => {
    const productMethods = (item.product && item.product.allowedPaymentMethods) || ['cod', 'card', 'upi', 'wallet'];
    return acc.filter((method) => productMethods.includes(method));
  }, ['cod', 'card', 'upi', 'wallet']);

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0]);
    }
  }, [availablePaymentMethods.join(','), paymentMethod]);

  useEffect(() => {
    if (discountAmount > 0) {
      setIsDiscountAnimating(true);
      const timer = setTimeout(() => setIsDiscountAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [discountAmount]);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

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
      navigate('/');
      return;
    }

    if (!selectedAddress) {
      toastService.error('Please select a delivery address');
      setActiveStep(2);
      return;
    }

    if (!paymentMethod) {
      toastService.error('Please select a payment method');
      setActiveStep(3);
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
        quantities: Object.keys(updatedQuantities).length > 0 ? updatedQuantities : undefined
      };

      if (appliedCouponCode && discountAmount > 0) {
        orderData.couponCode = appliedCouponCode;
      }

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        setOrderSuccess(true);
        toastService.success('Order placed successfully!');
        await clearCart();
        navigate('/orders');
        return;
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
        } catch (e) {
          // ignore
        }
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
        setShowCouponSuccess(true);
        setIsDiscountAnimating(true);
        setTimeout(() => setIsDiscountAnimating(false), 500);
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

  const paymentOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when delivered' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Secure card payment' },
    { id: 'upi', name: 'UPI', icon: Wallet, description: 'Quick UPI payment' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Pay with wallet' }
  ];

  const steps = [
    { id: 1, name: 'Cart', icon: ShoppingBag },
    { id: 2, name: 'Address', icon: MapPin },
    { id: 3, name: 'Payment', icon: CreditCard },
    { id: 4, name: 'Review', icon: Check }
  ];

  const subtotal = getCartTotal();
  const gst = subtotal * 0.18;
  const finalTotal = subtotal + gst - discountAmount;

  if (cartLoading || authLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
    >
      {/* Progress Steps */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = activeStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive
                        ? 'bg-black text-white shadow-lg'
                        : isCompleted
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-white text-gray-400 border border-gray-200'
                      }`}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isCompleted ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
                  </motion.button>

                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-black' : 'bg-gray-200'
                      }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Cart Items */}
              {activeStep === 1 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-black rounded-xl">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      Order Items
                      <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {cart.length} items
                      </span>
                    </h2>
                  </div>

                  {cart.length === 0 ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200"
                    >
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Your cart is empty</p>
                      <Button
                        onClick={() => navigate('/')}
                        className="mt-4 bg-black text-white px-6 py-2 rounded-xl"
                      >
                        Continue Shopping
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          className="bg-white border-2 border-gray-100 rounded-2xl p-4 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex gap-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="relative overflow-hidden rounded-xl"
                            >
                              <img
                                src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                                alt={item.product?.name || 'product'}
                                className="w-24 h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </motion.div>

                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900">{item.product?.name}</h3>
                              <p className="text-gray-500 text-sm mt-1">
                                {item.variant?.color || '-'} • Size: {item.size?.size || '-'}
                              </p>

                              <div className="flex items-center justify-between mt-4">
                                <p className="text-xl font-bold">₹{(item.unitPrice ?? 0).toFixed(2)}</p>

                                <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                                  <motion.button
                                    whileHover={{ backgroundColor: '#e5e7eb' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleQuantityChange(item._id, (updatedQuantities[item._id] ?? item.quantity) - 1)}
                                    className="p-2 transition-colors"
                                    disabled={(updatedQuantities[item._id] ?? item.quantity) <= 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </motion.button>
                                  <span className="px-4 py-2 font-medium min-w-[40px] text-center">
                                    {updatedQuantities[item._id] ?? item.quantity}
                                  </span>
                                  <motion.button
                                    whileHover={{ backgroundColor: '#e5e7eb' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleQuantityChange(item._id, (updatedQuantities[item._id] ?? item.quantity) + 1)}
                                    className="p-2 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(2)}
                      className="w-full py-4 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
                    >
                      Continue to Address
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Step 2: Address */}
              {activeStep === 2 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <div className="p-2 bg-black rounded-xl">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      Delivery Address
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New
                    </motion.button>
                  </div>

                  {addresses.length === 0 ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200"
                    >
                      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-4">No saved addresses</p>
                      <Button
                        onClick={() => setShowAddressModal(true)}
                        className="bg-black text-white px-6 py-2 rounded-xl"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Add Address
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addresses.map((addr, index) => (
                        <motion.div
                          key={addr._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleAddressSelect(addr)}
                          className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedAddress?._id === addr._id
                              ? 'border-black bg-gray-50 shadow-lg'
                              : 'border-gray-100 hover:border-gray-200 hover:shadow-md bg-white'
                            }`}
                        >
                          {selectedAddress?._id === addr._id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}

                          {addr.isDefault && (
                            <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-md mb-2">
                              Default
                            </span>
                          )}

                          <p className="font-semibold text-gray-900">{addr.street}</p>
                          <p className="text-gray-500 mt-1">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(1)}
                      className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectedAddress && setActiveStep(3)}
                      disabled={!selectedAddress}
                      className="flex-1 py-4 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      Continue to Payment
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {activeStep === 3 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-black rounded-xl">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    Payment Method
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {paymentOptions.map((option, index) => {
                      const IconComp = option.icon;
                      const isAvailable = availablePaymentMethods.includes(option.id);
                      const isSelected = paymentMethod === option.id;

                      return (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={isAvailable ? { scale: 1.02 } : {}}
                          onClick={() => isAvailable && handlePaymentMethodChange(option.id)}
                          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${!isAvailable
                              ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
                              : isSelected
                                ? 'border-black bg-gray-50 cursor-pointer shadow-lg'
                                : 'border-gray-100 hover:border-gray-200 hover:shadow-md cursor-pointer bg-white'
                            }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}

                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${isSelected ? 'bg-black' : 'bg-gray-100'}`}>
                              <IconComp className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{option.name}</p>
                              <p className="text-sm text-gray-500">{option.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(2)}
                      className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(4)}
                      className="flex-1 py-4 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
                    >
                      Review Order
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {activeStep === 4 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-black rounded-xl">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    Review Order
                  </h2>

                  {/* Order Summary Cards */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Delivery Address Card */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-5 bg-gray-50 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold">Delivery Address</span>
                      </div>
                      {selectedAddress && (
                        <div className="text-gray-600">
                          <p className="font-medium text-gray-900">{selectedAddress.street}</p>
                          <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                        </div>
                      )}
                    </motion.div>

                    {/* Payment Method Card */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-5 bg-gray-50 rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold">Payment Method</span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {paymentOptions.find(p => p.id === paymentMethod)?.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {paymentOptions.find(p => p.id === paymentMethod)?.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Items List */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Items ({cart.length})
                    </h3>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item._id} className="flex items-center gap-3">
                          <img
                            src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                            alt={item.product?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{item.product?.name}</p>
                            <p className="text-xs text-gray-500">Qty: {updatedQuantities[item._id] ?? item.quantity}</p>
                          </div>
                          <p className="font-semibold">₹{(item.unitPrice * (updatedQuantities[item._id] ?? item.quantity)).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Shield className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">Secure Checkout</p>
                      <p className="text-xs text-gray-500">Your information is protected</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(3)}
                      className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 py-4 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-gray-50 rounded-3xl p-6 border border-gray-100"
            >
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>

                <AnimatePresence>
                  {discountAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between text-green-600"
                    >
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Discount
                      </span>
                      <motion.span
                        animate={isDiscountAnimating ? { scale: [1, 1.2, 1] } : {}}
                        className="font-bold"
                      >
                        -₹{discountAmount.toFixed(2)}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <motion.span
                      key={finalTotal}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      ₹{finalTotal.toFixed(2)}
                    </motion.span>
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCouponSection(!showCouponSection)}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span className="flex items-center gap-2 text-gray-700 font-medium">
                    <Tag className="w-4 h-4" />
                    {appliedCouponCode ? `Applied: ${appliedCouponCode}` : 'Apply Coupon'}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showCouponSection ? 'rotate-90' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showCouponSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4 overflow-hidden"
                    >
                      <AvailableCoupons
                        onApplyCoupon={(code) => {
                          setCouponCode(code);
                          setApplyingCoupon(true);
                          setCouponError('');
                          validateCoupon(code, getCartTotal())
                            .then((result) => {
                              if (result.success) {
                                setDiscountAmount(result.discountAmount);
                                setAppliedCouponCode(code);
                                setShowCouponSuccess(true);
                                setIsDiscountAnimating(true);
                                setTimeout(() => setIsDiscountAnimating(false), 500);
                              } else {
                                setDiscountAmount(0);
                                setAppliedCouponCode('');
                                setCouponError(result.message || 'Invalid coupon code');
                                toastService.error(result.message || 'Invalid coupon code');
                              }
                            })
                            .catch((error) => {
                              setDiscountAmount(0);
                              setAppliedCouponCode('');
                              setCouponError(error?.message || 'Invalid coupon code');
                              toastService.error(error?.message || 'Invalid coupon code');
                            })
                            .finally(() => setApplyingCoupon(false));
                        }}
                        appliedCouponCode={appliedCouponCode}
                        cartTotal={subtotal}
                      />

                      <div className="flex gap-2">
                        <input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none transition-colors uppercase font-mono"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={appliedCouponCode ? handleRemoveCoupon : handleCouponApply}
                          disabled={applyingCoupon}
                          className={`px-4 rounded-xl font-medium transition-colors ${appliedCouponCode
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-black text-white hover:bg-gray-900'
                            }`}
                        >
                          {applyingCoupon ? '...' : appliedCouponCode ? 'Remove' : 'Apply'}
                        </motion.button>
                      </div>

                      {couponError && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500"
                        >
                          {couponError}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AddressAddModal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} onAdd={handleAddAddress} />

      <CouponSuccessAnimation
        show={showCouponSuccess}
        discountAmount={discountAmount}
        onComplete={() => setShowCouponSuccess(false)}
      />
    </motion.div>
  );
};

export default Checkout;