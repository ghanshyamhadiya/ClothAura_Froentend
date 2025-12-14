// src/components/checkout/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Wallet,
  Minus,
  Plus
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

const Checkout = () => {
  // contexts
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

  const location = useLocation();
  const navigate = useNavigate();

  const cart = Array.isArray(ctxCart) ? ctxCart : [];
  const addresses = Array.isArray(ctxAddresses) ? ctxAddresses : [];

  // Determine available payment methods across all products in cart.
  // Start with the full set and filter down based on each product's allowedPaymentMethods.
  const availablePaymentMethods = cart.reduce((acc, item) => {
    const productMethods = (item.product && item.product.allowedPaymentMethods) || ['cod', 'card', 'upi', 'wallet'];
    return acc.filter((method) => productMethods.includes(method));
  }, ['cod', 'card', 'upi', 'wallet']);

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePaymentMethods.join(','), paymentMethod]); // join to avoid object/array identity issues

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
        quantities: Object.keys(updatedQuantities).length > 0 ? updatedQuantities : undefined
      };

      if (appliedCouponCode && discountAmount > 0) {
        orderData.couponCode = appliedCouponCode;
      }

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        toastService.success('Order placed successfully!');
        setOrderSuccess(true);
        // Optionally: socketManager emit or other flows
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
      navigate(orderSuccess ? '/' : '/checkout');
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

  // Payment option config: store component references (not JSX elements)
  const paymentOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when delivered' },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Secure card payment' },
    { id: 'upi', name: 'UPI', icon: Wallet, description: 'Quick UPI payment' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Pay with wallet' }
  ];

  const subtotal = getCartTotal();
  const gst = subtotal * 0.18;
  const finalTotal = subtotal + gst - discountAmount;

  if (cartLoading || authLoading) return <Loading />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate('/cart')} className="p-2 border rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Items, Address, Payment */}
          <div className="space-y-8">
            {/* Cart Items */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Order Items</h2>
              {cart.length === 0 ? (
                <p className="text-gray-600">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex gap-4 border-b pb-4">
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.product?.name || 'product'}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{item.product?.name}</h3>
                        <p className="text-gray-600 text-sm">
                          Variant: {item.variant?.color || '-'} • Size: {item.size?.size || '-'}
                        </p>
                        <p className="font-bold mt-2">${(item.unitPrice ?? 0).toFixed(2)}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex border rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item._id, (updatedQuantities[item._id] ?? item.quantity) - 1)}
                              className="p-2 hover:bg-gray-100"
                              disabled={(updatedQuantities[item._id] ?? item.quantity) <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2">{updatedQuantities[item._id] ?? item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item._id, (updatedQuantities[item._id] ?? item.quantity) + 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-gray-600">No saved addresses</p>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr._id} className="flex gap-4 border p-4 rounded-lg">
                      <input type="radio" checked={selectedAddress?._id === addr._id} onChange={() => handleAddressSelect(addr)} />
                      <div>
                        <p className="font-bold">{addr.street}</p>
                        <p className="text-gray-600">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <Button onClick={() => setShowAddressModal(true)} icon={<Plus />} className="w-full mt-4">
                  Add New Address
                </Button>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
              <div className="space-y-4">
                {paymentOptions.map((option) => {
                  const IconComp = option.icon;
                  return (
                    <div key={option.id} className="flex gap-4 border p-4 rounded-lg items-center">
                      <input
                        type="radio"
                        checked={paymentMethod === option.id}
                        onChange={() => handlePaymentMethodChange(option.id)}
                        disabled={!availablePaymentMethods.includes(option.id)}
                      />
                      <IconComp className="w-6 h-6" />
                      <div>
                        <p className="font-bold">{option.name}</p>
                        <p className="text-gray-600 text-sm">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-4 sticky top-20">
            <h2 className="text-2xl font-bold">Summary</h2>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span>${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <input
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full p-3 border rounded-lg mb-2"
              />
              <Button onClick={handleCouponApply} className="w-full" disabled={applyingCoupon}>
                Apply Coupon
              </Button>
            </div>

            <Button onClick={handlePlaceOrder} className="w-full" disabled={loading}>
              Place Order
            </Button>
          </div>
        </div>
      </div>

      <AddressAddModal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} onAdd={handleAddAddress} />
    </motion.div>
  );
};

export default Checkout;
