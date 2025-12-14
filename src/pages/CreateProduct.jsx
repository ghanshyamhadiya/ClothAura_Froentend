import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiCreditCard, FiArrowLeft } from "react-icons/fi";
import { useProducts } from "../context/ProductContext";
import Loading from "../components/Loading";
import Button from "../components/Button";
import ConfirmationModal from "../components/model/ConfirmationModel";

const CreateProduct = () => {
  const { createProduct, updateProduct, getProduct, loading: ctxLoading } = useProducts();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Electronics",
    variants: [
      {
        color: "",
        sizes: [{ size: "", originalPrice: "", price: "", stock: "" }],
        images: [],
      },
    ],
    allowedPaymentMethods: ['cod', 'card', 'upi', 'wallet'],
  });

  const [imagePreviews, setImagePreviews] = useState([[]]);
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethodOptions = [
    { id: 'cod', name: 'Cash on Delivery', icon: '🚚' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'upi', name: 'UPI Payment', icon: '📱' },
    { id: 'wallet', name: 'Digital Wallet', icon: '💰' }
  ];

  useEffect(() => {
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const product = await getProduct(id);
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        variants: product.variants.map((v) => ({
          color: v.color,
          sizes: v.sizes,
          images: [], // Images will be handled separately in previews
        })),
        allowedPaymentMethods: product.allowedPaymentMethods || ['cod', 'card', 'upi', 'wallet'],
      });
      setImagePreviews(
        product.variants.map((v) => v.images.map((img) => img.url))
      );
    } catch (error) {
      console.error("Failed to load product:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePaymentMethodToggle = (methodId) => {
    setFormData((prev) => {
      const methods = prev.allowedPaymentMethods || [];
      const newMethods = methods.includes(methodId)
        ? methods.filter(m => m !== methodId)
        : [...methods, methodId];
      if (newMethods.length === 0) return prev;
      return { ...prev, allowedPaymentMethods: newMethods };
    });
    setErrors((prev) => ({ ...prev, allowedPaymentMethods: "" }));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex][field] = value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].sizes[sizeIndex][field] = value;
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleImageUpload = (variantIndex, files) => {
    const updatedVariants = [...formData.variants];
    const newImages = Array.from(files);
    updatedVariants[variantIndex].images = [
      ...updatedVariants[variantIndex].images,
      ...newImages,
    ];
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));

    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    const updatedPreviews = [...imagePreviews];
    updatedPreviews[variantIndex] = [
      ...(updatedPreviews[variantIndex] || []),
      ...newPreviews,
    ];
    setImagePreviews(updatedPreviews);
  };

  const removeImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));

    const updatedPreviews = [...imagePreviews];
    updatedPreviews[variantIndex].splice(imageIndex, 1);
    setImagePreviews(updatedPreviews);
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          color: "",
          sizes: [{ size: "", originalPrice: "", price: "", stock: "" }],
          images: [],
        },
      ],
    }));
    setImagePreviews((prev) => [...prev, []]);
  };

  const removeVariant = (variantIndex) => {
    if (formData.variants.length === 1) return;
    const updatedVariants = formData.variants.filter((_, idx) => idx !== variantIndex);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== variantIndex);
    setImagePreviews(updatedPreviews);
  };

  const addSize = (variantIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].sizes.push({
      size: "",
      originalPrice: "",
      price: "",
      stock: "",
    });
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeSize = (variantIndex, sizeIndex) => {
    if (formData.variants[variantIndex].sizes.length === 1) return;
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].sizes.splice(sizeIndex, 1);
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    
    if (!formData.allowedPaymentMethods || formData.allowedPaymentMethods.length === 0) {
      newErrors.allowedPaymentMethods = "At least one payment method is required";
    }

    formData.variants.forEach((variant, vIdx) => {
      if (!variant.color.trim()) newErrors[`variant_${vIdx}_color`] = "Color is required";
      if (variant.images.length === 0 && !isEditMode) newErrors[`variant_${vIdx}_images`] = "At least one image is required";

      variant.sizes.forEach((size, sIdx) => {
        if (!size.size.trim()) newErrors[`variant_${vIdx}_size_${sIdx}_size`] = "Size name is required";
        if (!size.originalPrice || size.originalPrice < 10) newErrors[`variant_${vIdx}_size_${sIdx}_originalPrice`] = "Original price must be at least 10";
        if (!size.price || size.price < 0) newErrors[`variant_${vIdx}_size_${sIdx}_price`] = "Price is required";
        if (!size.stock || size.stock < 0) newErrors[`variant_${vIdx}_size_${sIdx}_stock`] = "Stock is required";
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmation(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white py-4 px-2 sm:px-4 lg:px-6"
    >
      {isSubmitting && <Loading />}

      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="mb-8 flex items-center gap-4">
          <Button
            onClick={() => navigate('/')}
            className="p-3 rounded-full bg-black text-white hover:bg-gray-800 transition"
          >
            <FiArrowLeft size={20} />
          </Button>
          <h1 className="text-4xl font-bold text-black">
            {isEditMode ? "Edit Product" : "New Product"}
          </h1>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-12">
          {/* Basic Info Section */}
          <motion.section
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full text-lg font-bold">
                1
              </span>
              Product Basics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-4 border-2 border-black rounded-2xl focus:outline-none focus:border-gray-800 transition-all bg-white/50"
                  placeholder="Premium Wireless Headphones"
                />
                {errors.name && <p className="text-red-600 text-xs font-medium">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-4 border-2 border-black rounded-2xl focus:outline-none focus:border-gray-800 transition-all bg-white/50 appearance-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Sports">Sports</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home</option>
                  <option value="Books">Books</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full p-4 border-2 border-black rounded-2xl focus:outline-none focus:border-gray-800 transition-all bg-white/50 resize-none"
                placeholder="Describe your product in detail..."
              />
              {errors.description && <p className="text-red-600 text-xs font-medium">{errors.description}</p>}
            </div>
          </motion.section>

          {/* Variants Section */}
          <motion.section
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full text-lg font-bold">
                2
              </span>
              Variants
            </h2>

            <AnimatePresence mode="popLayout">
              {formData.variants.map((variant, variantIndex) => (
                <motion.div
                  key={variantIndex}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 relative"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Variant {variantIndex + 1}</h3>
                    {formData.variants.length > 1 && (
                      <Button
                        onClick={() => removeVariant(variantIndex)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-full transition"
                      >
                        <FiTrash2 size={20} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                        Color
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) =>
                          handleVariantChange(variantIndex, "color", e.target.value)
                        }
                        className="w-full p-4 border-2 border-black rounded-2xl focus:outline-none focus:border-gray-800 transition-all bg-white"
                        placeholder="e.g., Midnight Black"
                      />
                      {errors[`variant_${variantIndex}_color`] && <p className="text-red-600 text-xs font-medium">{errors[`variant_${variantIndex}_color`]}</p>}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                        Images
                      </label>
                      <div className="border-2 border-dashed border-black rounded-2xl p-6 text-center hover:bg-gray-50 transition relative">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(variantIndex, e.target.files)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id={`image-upload-${variantIndex}`}
                        />
                        <label htmlFor={`image-upload-${variantIndex}`} className="cursor-pointer">
                          <FiUpload size={32} className="mx-auto mb-2 text-gray-600" />
                          <span className="block font-medium text-gray-800">Upload Images</span>
                          <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                        </label>
                      </div>
                      {errors[`variant_${variantIndex}_images`] && <p className="text-red-600 text-xs font-medium mt-1">{errors[`variant_${variantIndex}_images`]}</p>}

                      {/* Previews */}
                      {imagePreviews[variantIndex]?.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                          <AnimatePresence>
                            {imagePreviews[variantIndex].map((preview, imgIdx) => (
                              <motion.div
                                key={imgIdx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative rounded-xl overflow-hidden border-2 border-black group"
                              >
                                <img
                                  src={preview}
                                  alt={`Preview ${imgIdx + 1}`}
                                  className="w-full h-24 object-cover"
                                />
                                <button
                                  onClick={() => removeImage(variantIndex, imgIdx)}
                                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FiX size={12} />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Sizes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold uppercase tracking-wide text-gray-800">
                          Sizes
                        </label>
                        <Button
                          onClick={() => addSize(variantIndex)}
                          className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition flex items-center gap-2 rounded-full"
                        >
                          <FiPlus size={16} /> Add Size
                        </Button>
                      </div>

                      <AnimatePresence>
                        {variant.sizes.map((size, sizeIndex) => (
                          <motion.div
                            key={sizeIndex}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 relative"
                          >
                            {variant.sizes.length > 1 && (
                              <button
                                onClick={() => removeSize(variantIndex, sizeIndex)}
                                className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}

                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-800">Size</label>
                              <input
                                type="text"
                                value={size.size}
                                onChange={(e) =>
                                  handleSizeChange(variantIndex, sizeIndex, "size", e.target.value)
                                }
                                className="w-full p-3 border-2 border-black rounded-xl focus:outline-none focus:border-gray-800 bg-white"
                                placeholder="M"
                              />
                              {errors[`variant_${variantIndex}_size_${sizeIndex}_size`] && <p className="text-red-600 text-xs">{errors[`variant_${variantIndex}_size_${sizeIndex}_size`]}</p>}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-800">Original Price</label>
                              <input
                                type="number"
                                value={size.originalPrice}
                                onChange={(e) =>
                                  handleSizeChange(variantIndex, sizeIndex, "originalPrice", e.target.value)
                                }
                                className="w-full p-3 border-2 border-black rounded-xl focus:outline-none focus:border-gray-800 bg-white"
                                placeholder="1500"
                              />
                              {errors[`variant_${variantIndex}_size_${sizeIndex}_originalPrice`] && <p className="text-red-600 text-xs">{errors[`variant_${variantIndex}_size_${sizeIndex}_originalPrice`]}</p>}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-800">Sale Price</label>
                              <input
                                type="number"
                                value={size.price}
                                onChange={(e) =>
                                  handleSizeChange(variantIndex, sizeIndex, "price", e.target.value)
                                }
                                className="w-full p-3 border-2 border-black rounded-xl focus:outline-none focus:border-gray-800 bg-white"
                                placeholder="1200"
                              />
                              {errors[`variant_${variantIndex}_size_${sizeIndex}_price`] && <p className="text-red-600 text-xs">{errors[`variant_${variantIndex}_size_${sizeIndex}_price`]}</p>}
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-800">Stock</label>
                              <input
                                type="number"
                                value={size.stock}
                                onChange={(e) =>
                                  handleSizeChange(variantIndex, sizeIndex, "stock", e.target.value)
                                }
                                className="w-full p-3 border-2 border-black rounded-xl focus:outline-none focus:border-gray-800 bg-white"
                                placeholder="100"
                              />
                              {errors[`variant_${variantIndex}_size_${sizeIndex}_stock`] && <p className="text-red-600 text-xs">{errors[`variant_${variantIndex}_size_${sizeIndex}_stock`]}</p>}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Variant */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={addVariant}
              className="w-full py-6 border-2 border-dashed border-black bg-white/50 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition"
            >
              <FiPlus size={28} />
              Add New Variant
            </motion.button>
          </motion.section>

          {/* Payment Methods Section */}
          <motion.section
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full text-lg font-bold">
                3
              </span>
              Payment Options
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethodOptions.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePaymentMethodToggle(method.id)}
                  className={`
                    p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4
                    ${formData.allowedPaymentMethods?.includes(method.id)
                      ? 'border-black bg-gray-50 shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                      : 'border-gray-300 hover:border-gray-500'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedPaymentMethods?.includes(method.id)}
                    onChange={() => handlePaymentMethodToggle(method.id)}
                    className="h-5 w-5"
                  />
                  <span className="text-3xl">{method.icon}</span>
                  <span className="font-medium text-gray-900">{method.name}</span>
                </motion.div>
              ))}
            </div>
            {errors.allowedPaymentMethods && <p className="text-red-600 text-xs font-medium mt-4">{errors.allowedPaymentMethods}</p>}
          </motion.section>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 pt-6"
          >
            <Button
              onClick={handleConfirmSubmit}
              disabled={ctxLoading}
              className="flex-1 py-5 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-3 text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
            >
              <FiSave size={24} />
              {isEditMode ? "Update Product" : "Create Product"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="flex-1 py-5 bg-white border-2 border-black text-black font-bold rounded-full hover:bg-gray-50 transition text-lg"
            >
              Cancel
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleSubmit}
        title={isEditMode ? "Update Product?" : "Create Product?"}
        message={isEditMode ? "Are you sure you want to update this product?" : "Are you sure you want to create this product?"}
        confirmText={isEditMode ? "Update" : "Create"}
        cancelText="Cancel"
        loading={isSubmitting}
        variant="info"
      />
    </motion.div>
  );
};

export default CreateProduct;