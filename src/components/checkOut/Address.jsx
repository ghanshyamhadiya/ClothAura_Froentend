import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit3, Trash2, Star, ArrowLeft, Home, Building, Check, X } from 'lucide-react';
import Button from '../Button';
import ConfirmationModal from '../model/ConfirmationModel';
import Loading from '../Loading';

const Address = () => {
  const navigate = useNavigate();
  const { user, addresses, loading, error, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();

  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  });
  const [editingAddress, setEditingAddress] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.id) {
      getAddresses();
    }
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (editingAddress) {
      setEditingAddress((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewAddress((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const isDefault = e.target.checked;
    if (editingAddress) {
      setEditingAddress((prev) => ({ ...prev, isDefault }));
    } else {
      setNewAddress((prev) => ({ ...prev, isDefault }));
    }
  };

  const validateAddress = (address) => {
    const newErrors = {};
    if (!address.street?.trim()) newErrors.street = 'Street is required';
    if (!address.city?.trim()) newErrors.city = 'City is required';
    if (!address.state?.trim()) newErrors.state = 'State is required';
    if (!address.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setLocalError('Please fill all required fields');
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) return;
    setActionLoading(true);
    try {
      await addAddress(newAddress);
      setNewAddress({ street: '', city: '', state: '', postalCode: '', isDefault: false });
      setShowAddForm(false);
      setLocalError(null);
    } catch (err) {
      setLocalError(err?.message || 'Failed to add address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress?._id) return setLocalError('Invalid address');
    if (!validateAddress(editingAddress)) return;
    setActionLoading(true);
    try {
      await updateAddress(editingAddress._id, editingAddress);
      setEditingAddress(null);
      setLocalError(null);
    } catch (err) {
      setLocalError(err?.message || 'Failed to update address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    setActionLoading(true);
    try {
      await deleteAddress(deleteAddressId);
      setShowDeleteModal(false);
      setDeleteAddressId(null);
    } catch (err) {
      setLocalError(err?.message || 'Failed to delete address');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (addressId) => {
    setDeleteAddressId(addressId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteAddressId(null);
  };

  const handleSetDefault = async (addressId) => {
    setActionLoading(true);
    try {
      await setDefaultAddress(addressId);
    } catch (err) {
      setLocalError(err?.message || 'Failed to set default address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress({ ...addr });
    setShowAddForm(false);
    setErrors({});
    setLocalError(null);
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setShowAddForm(false);
    setNewAddress({ street: '', city: '', state: '', postalCode: '', isDefault: false });
    setErrors({});
    setLocalError(null);
  };

  if (loading) return <Loading />;

  const formData = editingAddress || newAddress;
  const isEditing = !!editingAddress;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-xl">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
                <p className="text-sm text-gray-500">Manage your delivery addresses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Address Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {(showAddForm || isEditing) ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-50 rounded-3xl p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Edit3 className="w-5 h-5" />
                          Edit Address
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add New Address
                        </>
                      )}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={cancelEdit}
                      className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>

                  {localError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                    >
                      {localError}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        placeholder="123 Main Street, Apartment/Floor"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.street
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-black'
                          }`}
                      />
                      {errors.street && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-xs mt-1"
                        >
                          {errors.street}
                        </motion.p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          placeholder="Mumbai"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.city
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 focus:border-black'
                            }`}
                        />
                        {errors.city && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-xs mt-1"
                          >
                            {errors.city}
                          </motion.p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          placeholder="Maharashtra"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.state
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 focus:border-black'
                            }`}
                        />
                        {errors.state && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-xs mt-1"
                          >
                            {errors.state}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <input
                        placeholder="400001"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none ${errors.postalCode
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-black'
                          }`}
                      />
                      {errors.postalCode && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-xs mt-1"
                        >
                          {errors.postalCode}
                        </motion.p>
                      )}
                    </div>

                    <motion.label
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={handleCheckboxChange}
                        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Set as default address</span>
                      </div>
                    </motion.label>

                    <div className="flex gap-4 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={isEditing ? handleUpdateAddress : handleAddAddress}
                        disabled={actionLoading}
                        className="flex-1 py-4 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 shadow-lg"
                      >
                        {actionLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            {isEditing ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {isEditing ? 'Update Address' : 'Add Address'}
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={cancelEdit}
                        className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl hover:border-gray-300 hover:bg-gray-100 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Plus className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                    <span className="text-lg font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">
                      Add New Address
                    </span>
                    <span className="text-sm text-gray-400">
                      Click to add a delivery address
                    </span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Saved Addresses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building className="w-5 h-5" />
              Saved Addresses
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {addresses.length}
              </span>
            </h2>

            {addresses.length === 0 ? (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100"
              >
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No addresses saved yet</p>
                <p className="text-gray-400 text-sm mt-1">Add your first address above</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {addresses.map((addr, index) => (
                    <motion.div
                      key={addr._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className={`relative bg-white border-2 rounded-2xl p-5 transition-all duration-300 ${addr.isDefault
                          ? 'border-black shadow-lg'
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                    >
                      {addr.isDefault && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 px-3 py-1 bg-black text-white text-xs font-bold rounded-full flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Default
                        </motion.div>
                      )}

                      <div className="flex justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${addr.isDefault ? 'bg-black' : 'bg-gray-100'
                              }`}>
                              <Home className={`w-4 h-4 ${addr.isDefault ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{addr.street}</p>
                              <p className="text-gray-500 mt-1">
                                {addr.city}, {addr.state} {addr.postalCode}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditAddress(addr)}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-gray-600" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openDeleteModal(addr._id)}
                            className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </motion.button>
                          {!addr.isDefault && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleSetDefault(addr._id)}
                              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Set as default"
                            >
                              <Star className="w-4 h-4 text-gray-600" />
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={actionLoading}
        variant="danger"
      />
    </motion.div>
  );
};

export default Address;