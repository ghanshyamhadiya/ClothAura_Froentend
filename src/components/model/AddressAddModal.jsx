import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Home, Plus, Building } from 'lucide-react';

const AddressAddModal = ({
  isOpen,
  onClose,
  onAdd,
  loading = false
}) => {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e) => {
    setAddress(prev => ({ ...prev, isDefault: e.target.checked }));
  };

  const validateAddress = () => {
    const newErrors = {};
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAddress()) return;

    try {
      await onAdd(address);
      setAddress({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setAddress({
      street: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
    setErrors({});
    onClose();
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 30
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: {
        duration: 0.2
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black p-6 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="p-2 bg-white/20 rounded-xl"
                  >
                    <MapPin className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold">Add New Address</h2>
                    <p className="text-white/70 text-sm">Enter your delivery details</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <motion.div
                custom={0}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Street Address *
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'street' ? 'transform scale-[1.01]' : ''
                  }`}>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('street')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="123 Main Street, Apartment/Floor"
                    className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.street
                        ? 'border-red-300 focus:border-red-500'
                        : focusedField === 'street'
                          ? 'border-black shadow-lg'
                          : 'border-gray-200 focus:border-black'
                      }`}
                  />
                </div>
                {errors.street && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.street}
                  </motion.p>
                )}
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  custom={1}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'city' ? 'transform scale-[1.01]' : ''
                    }`}>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('city')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Mumbai"
                      className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.city
                          ? 'border-red-300 focus:border-red-500'
                          : focusedField === 'city'
                            ? 'border-black shadow-lg'
                            : 'border-gray-200 focus:border-black'
                        }`}
                    />
                  </div>
                  {errors.city && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.city}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  custom={2}
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <div className={`relative transition-all duration-200 ${focusedField === 'state' ? 'transform scale-[1.01]' : ''
                    }`}>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('state')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Maharashtra"
                      className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.state
                          ? 'border-red-300 focus:border-red-500'
                          : focusedField === 'state'
                            ? 'border-black shadow-lg'
                            : 'border-gray-200 focus:border-black'
                        }`}
                    />
                  </div>
                  {errors.state && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.state}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              <motion.div
                custom={3}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Postal Code *
                </label>
                <div className={`relative transition-all duration-200 ${focusedField === 'postalCode' ? 'transform scale-[1.01]' : ''
                  }`}>
                  <input
                    type="text"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('postalCode')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="400001"
                    className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.postalCode
                        ? 'border-red-300 focus:border-red-500'
                        : focusedField === 'postalCode'
                          ? 'border-black shadow-lg'
                          : 'border-gray-200 focus:border-black'
                      }`}
                  />
                </div>
                {errors.postalCode && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.postalCode}
                  </motion.p>
                )}
              </motion.div>

              <motion.label
                custom={4}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={address.isDefault}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black focus:ring-offset-0"
                />
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Set as default address</span>
                </div>
              </motion.label>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Address
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddressAddModal;