import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit3, Trash2, Star, ArrowLeft } from 'lucide-react';
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
    const { street, city, state, postalCode } = address;
    if (!street?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim()) {
      setLocalError('All fields are required');
      return false;
    }
    return true;
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) return;
    setActionLoading(true);
    await addAddress(newAddress);
    setNewAddress({ street: '', city: '', state: '', postalCode: '', isDefault: false });
    setShowAddForm(false);
    setActionLoading(false);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress?._id) return setLocalError('Invalid address');
    if (!validateAddress(editingAddress)) return;
    setActionLoading(true);
    await updateAddress(editingAddress._id, editingAddress);
    setEditingAddress(null);
    setActionLoading(false);
  };

  const handleDeleteAddress = async () => {
    setActionLoading(true);
    await deleteAddress(deleteAddressId);
    setShowDeleteModal(false);
    setDeleteAddressId(null);
    setActionLoading(false);
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
    await setDefaultAddress(addressId);
    setActionLoading(false);
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setShowAddForm(false);
  };

  if (loading) return <Loading />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/')}
            className="p-2 border rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold">Addresses</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Add New Address</h2>
            <div className="space-y-4">
              <input
                placeholder="Street Address"
                name="street"
                value={editingAddress ? editingAddress.street : newAddress.street}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="City"
                name="city"
                value={editingAddress ? editingAddress.city : newAddress.city}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="State"
                name="state"
                value={editingAddress ? editingAddress.state : newAddress.state}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Postal Code"
                name="postalCode"
                value={editingAddress ? editingAddress.postalCode : newAddress.postalCode}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAddress ? editingAddress.isDefault : newAddress.isDefault}
                  onChange={handleCheckboxChange}
                />
                Set as default
              </label>
              <div className="flex gap-4">
                <Button onClick={editingAddress ? handleUpdateAddress : handleAddAddress} className="flex-1 bg-black text-white">
                  {editingAddress ? "Update" : "Add"}
                </Button>
                <Button onClick={cancelEdit} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Saved Addresses</h2>
            {addresses.map((addr) => (
              <div key={addr._id} className="bg-white border rounded-xl p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">{addr.street}</p>
                    <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                    {addr.isDefault && <p className="text-green-600">Default</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditAddress(addr)} icon={<Edit3 />} />
                    <Button onClick={() => openDeleteModal(addr._id)} icon={<Trash2 />} variant="danger" />
                    {!addr.isDefault && (
                      <Button onClick={() => handleSetDefault(addr._id)} icon={<Star />} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmText="Delete"
        cancelText="Cancel"
        loading={actionLoading}
        variant="danger"
      />
    </motion.div>
  );
};

export default Address;