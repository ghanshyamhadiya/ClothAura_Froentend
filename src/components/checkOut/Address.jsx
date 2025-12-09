import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit3, Trash2, Star, Home, ArrowLeft, Save } from 'lucide-react';
import Button from '../Button';
import ConfirmationModal from '../model/ConfirmationModel';
import Loading from '../Loading';

const Address = () => {
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

  useEffect(() => {
    if (user?.id) {
      getAddresses();
    }
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingAddress) {
      setEditingAddress((prev) => ({
        ...prev,
        [name]: value || ''
      }));
    } else {
      setNewAddress((prev) => ({
        ...prev,
        [name]: value || ''
      }));
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
    const { street, city, state, postalCode } = address;
    if (!street?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim()) {
      setLocalError('All address fields are required');
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) return;
    try {
      setActionLoading(true);
      setLocalError(null);
      await addAddress(newAddress);
      setNewAddress({ street: '', city: '', state: '', postalCode: '', isDefault: false });
      setShowAddForm(false);
    } catch (err) {
      setLocalError(err.message || 'Failed to add address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress?._id) {
      setLocalError('Address ID is missing or invalid');
      return;
    }
    if (!validateAddress(editingAddress)) return;
    try {
      setActionLoading(true);
      setLocalError(null);
      await updateAddress(editingAddress._id, editingAddress);
      setEditingAddress(null);
    } catch (err) {
      setLocalError(err.message || 'Failed to update address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddressId) return;
    try {
      setActionLoading(true);
      setLocalError(null);
      await deleteAddress(deleteAddressId);
      setShowDeleteModal(false);
      setDeleteAddressId(null);
    } catch (err) {
      setLocalError(err.message || 'Failed to delete address');
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
    if (!addressId || typeof addressId !== 'string') {
      setLocalError('Invalid address ID');
      return;
    }
    try {
      setActionLoading(true);
      setLocalError(null);
      await setDefaultAddress(addressId);
    } catch (err) {
      setLocalError(err.message || 'Failed to set default address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress({
      _id: addr._id?.toString() || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault || false
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setNewAddress({ street: '', city: '', state: '', postalCode: '', isDefault: false });
    setShowAddForm(false);
    setLocalError(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 mt-[10vh]"
    >
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
          <Button
            to="/checkout"
            primary={false}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all hover:scale-105"
            icon={<ArrowLeft className="w-5 h-5" />}
          >
            <span className="hidden sm:inline">Back to Checkout</span>
          </Button>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="p-3 bg-black rounded-2xl shadow-lg"
          >
            <Home className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Manage Addresses
          </h1>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-sm"
            >
              <p className="text-sm font-medium">{error || localError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Address Form */}
          <motion.div 
            variants={itemVariants} 
            className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-lg border border-gray-100 h-fit sticky top-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              {!editingAddress && !showAddForm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="p-2 bg-black hover:bg-gray-800 text-white rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {(editingAddress || showAddForm) ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      name="street"
                      placeholder="123 Main Street, Apartment/Floor"
                      value={(editingAddress ? editingAddress.street : newAddress.street) || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-gray-400 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        name="city"
                        placeholder="Mumbai"
                        value={(editingAddress ? editingAddress.city : newAddress.city) || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-gray-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <input
                        name="state"
                        placeholder="Maharashtra"
                        value={(editingAddress ? editingAddress.state : newAddress.state) || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-gray-400 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                    <input
                      name="postalCode"
                      placeholder="400001"
                      value={(editingAddress ? editingAddress.postalCode : newAddress.postalCode) || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-gray-400 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={!!(editingAddress ? editingAddress.isDefault : newAddress.isDefault)}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Set as default address
                    </label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      disabled={actionLoading || loading}
                      className="flex-1 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {(actionLoading || loading) ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {editingAddress ? 'Update' : 'Add'} Address
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelEdit}
                      disabled={actionLoading || loading}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    </motion.div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to add an address?</h4>
                  <p className="text-gray-600 mb-6">Click the + button to get started</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Address
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Saved Addresses */}
          <motion.div variants={itemVariants} className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Saved Addresses ({Array.isArray(addresses) ? addresses.length : 0})
              </h3>
            </div>

            {!Array.isArray(addresses) || addresses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 text-center"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Home className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No addresses saved yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Add your first address to start managing your delivery locations and make checkout faster
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Address
                </motion.button>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {addresses.map((addr, index) => (
                    <motion.div
                      key={addr._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      whileHover={{ scale: 1.01, y: -2 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.3 }}
                              className="p-2 bg-gray-50 rounded-xl border border-gray-200"
                            >
                              <Home className="w-5 h-5 text-gray-700" />
                            </motion.div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-900">Address {index + 1}</h4>
                              {addr.isDefault && (
                                <motion.span
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200"
                                >
                                  <Star className="w-3 h-3 fill-current" />
                                  Default
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-700 space-y-1 pl-11">
                            <p className="font-medium">{addr.street || 'N/A'}</p>
                            <p className="text-gray-600">{addr.city || 'N/A'}, {addr.state || 'N/A'}</p>
                            <p className="text-gray-500 text-sm">PIN: {addr.postalCode || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <motion.button
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditAddress(addr)}
                            disabled={actionLoading || loading}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors disabled:opacity-50"
                            title="Edit Address"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openDeleteModal(addr._id)}
                            disabled={actionLoading || loading}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-50"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                          
                          {!addr.isDefault && addr._id && (
                            <motion.button
                              whileHover={{ scale: 1.05, rotate: 360 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSetDefault(addr._id)}
                              disabled={actionLoading || loading}
                              className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors disabled:opacity-50"
                              title="Set as Default"
                            >
                              <Star className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete Address"
        cancelText="Keep Address"
        loading={actionLoading || loading}
        variant="danger"a
      />
    </motion.div>
  );
};

export default Address;