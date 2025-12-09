import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Home, Plus } from 'lucide-react';

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
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { 
        duration: 0.2
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="p-2 bg-gray-100 rounded-xl"
                >
                  <MapPin className="w-5 h-5 text-gray-700" />
                </motion.div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Address</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <motion.div
                custom={0}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street, Apartment/Floor"
                  className={`w-full p-3 border-2 rounded-xl transition-all focus:outline-none ${
                    errors.street 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    placeholder="Mumbai"
                    className={`w-full p-3 border-2 rounded-xl transition-all focus:outline-none ${
                      errors.city 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    placeholder="Maharashtra"
                    className={`w-full p-3 border-2 rounded-xl transition-all focus:outline-none ${
                      errors.state 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-gray-400'
                    }`}
                  />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={address.postalCode}
                  onChange={handleInputChange}
                  placeholder="400001"
                  className={`w-full p-3 border-2 rounded-xl transition-all focus:outline-none ${
                    errors.postalCode 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-gray-400'
                  }`}
                />
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

              <motion.div
                custom={4}
                variants={inputVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={address.isDefault}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Set as default address
                </label>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Address
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddressAddModal;