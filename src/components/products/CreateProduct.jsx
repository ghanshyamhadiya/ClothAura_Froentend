import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { FiPlus, FiTrash2, FiUpload, FiX, FiSave, FiCreditCard } from "react-icons/fi";
import { useProducts } from "../../context/ProductContext";

const CreateProduct = () => {
  const { createProduct, updateProduct, getProduct, loading } = useProducts();
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
          images: [],
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
      const isSelected = methods.includes(methodId);
      
      let newMethods;
      if (isSelected) {
        newMethods = methods.filter(m => m !== methodId);
      } else {
        newMethods = [...methods, methodId];
      }
      
      // Ensure at least one method is selected
      if (newMethods.length === 0) {
        return prev;
      }
      
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
    const updatedVariants = formData.variants.filter(
      (_, idx) => idx !== variantIndex
    );
    setFormData((prev) => ({ ...prev, variants: updatedVariants }));
    const updatedPreviews = imagePreviews.filter(
      (_, idx) => idx !== variantIndex
    );
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
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    
    if (!formData.allowedPaymentMethods || formData.allowedPaymentMethods.length === 0) {
      newErrors.allowedPaymentMethods = "At least one payment method is required";
    }

    formData.variants.forEach((variant, vIdx) => {
      if (!variant.color.trim())
        newErrors[`variant_${vIdx}_color`] = "Color is required";
      if (variant.images.length === 0 && !isEditMode)
        newErrors[`variant_${vIdx}_images`] = "At least one image is required";

      variant.sizes.forEach((size, sIdx) => {
        if (!size.size.trim())
          newErrors[`variant_${vIdx}_size_${sIdx}_size`] =
            "Size name is required";
        if (!size.originalPrice || size.originalPrice < 10)
          newErrors[`variant_${vIdx}_size_${sIdx}_originalPrice`] =
            "Original price must be at least 10";
        if (!size.price || size.price < 0)
          newErrors[`variant_${vIdx}_size_${sIdx}_price`] =
            "Price is required";
        if (!size.stock || size.stock < 0)
          newErrors[`variant_${vIdx}_size_${sIdx}_stock`] =
            "Stock is required";
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditMode) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 mt-[10vh]"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="mb-8">
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-black mb-2"
          >
            {isEditMode ? "Update Product" : "Create New Product"}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 }}
            className="h-1 w-24 bg-black"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">
                1
              </span>
              Basic Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm mt-1 font-medium"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                  placeholder="Enter product description"
                />
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm mt-1 font-medium"
                  >
                    {errors.description}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Sports">Sports</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home</option>
                  <option value="Books">Books</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>

              {/* Payment Methods Section */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-wide flex items-center gap-2">
                  <FiCreditCard />
                  Allowed Payment Methods
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethodOptions.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePaymentMethodToggle(method.id)}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${formData.allowedPaymentMethods?.includes(method.id)
                          ? 'border-black bg-gray-100'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.allowedPaymentMethods?.includes(method.id)}
                          onChange={() => handlePaymentMethodToggle(method.id)}
                          className="h-4 w-4"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-medium text-gray-900">{method.name}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {errors.allowedPaymentMethods && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm mt-2 font-medium"
                  >
                    {errors.allowedPaymentMethods}
                  </motion.p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Select at least one payment method that customers can use to purchase this product
                </p>
              </div>
            </div>
          </motion.div>

          {/* Variants */}
          <AnimatePresence mode="popLayout">
            {formData.variants.map((variant, variantIndex) => (
              <motion.div
                key={variantIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: variantIndex * 0.1 }}
                className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm">
                      {variantIndex + 2}
                    </span>
                    Variant {variantIndex + 1}
                  </h2>
                  {formData.variants.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeVariant(variantIndex)}
                      className="p-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <FiTrash2 size={20} />
                    </motion.button>
                  )}
                </div>

                {/* Color */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                    Color
                  </label>
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) =>
                      handleVariantChange(variantIndex, "color", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black transition-all"
                    placeholder="e.g., Black, White, Red"
                  />
                  {errors[`variant_${variantIndex}_color`] && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm mt-1 font-medium"
                    >
                      {errors[`variant_${variantIndex}_color`]}
                    </motion.p>
                  )}
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wide">
                    Images
                  </label>
                  <div className="border-2 border-dashed border-black p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(variantIndex, e.target.files)
                      }
                      className="hidden"
                      id={`image-upload-${variantIndex}`}
                    />
                    <label
                      htmlFor={`image-upload-${variantIndex}`}
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FiUpload size={32} className="mb-2" />
                      <span className="font-medium">
                        Click to upload images
                      </span>
                      <span className="text-sm text-gray-600 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </span>
                    </label>
                  </div>
                  {errors[`variant_${variantIndex}_images`] && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm mt-1 font-medium"
                    >
                      {errors[`variant_${variantIndex}_images`]}
                    </motion.p>
                  )}

                  {/* Image Previews */}
                  {imagePreviews[variantIndex]?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      <AnimatePresence>
                        {imagePreviews[variantIndex].map((preview, imgIdx) => (
                          <motion.div
                            key={imgIdx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group"
                          >
                            <img
                              src={preview}
                              alt={`Preview ${imgIdx + 1}`}
                              className="w-full h-32 object-cover border-2 border-black"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => removeImage(variantIndex, imgIdx)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX size={16} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Sizes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold uppercase tracking-wide">
                      Sizes & Pricing
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => addSize(variantIndex)}
                      className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <FiPlus /> Add Size
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence>
                      {variant.sizes.map((size, sizeIndex) => (
                        <motion.div
                          key={sizeIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-2 border-gray-300 p-4 relative"
                        >
                          {variant.sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeSize(variantIndex, sizeIndex)
                              }
                              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                            >
                              <FiX size={20} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-1 uppercase">
                                Size
                              </label>
                              <input
                                type="text"
                                value={size.size}
                                onChange={(e) =>
                                  handleSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "size",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="S, M, L"
                              />
                              {errors[
                                `variant_${variantIndex}_size_${sizeIndex}_size`
                              ] && (
                                <p className="text-red-600 text-xs mt-1">
                                  {
                                    errors[
                                      `variant_${variantIndex}_size_${sizeIndex}_size`
                                    ]
                                  }
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 uppercase">
                                Original Price
                              </label>
                              <input
                                type="number"
                                value={size.originalPrice}
                                onChange={(e) =>
                                  handleSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "originalPrice",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="100"
                              />
                              {errors[
                                `variant_${variantIndex}_size_${sizeIndex}_originalPrice`
                              ] && (
                                <p className="text-red-600 text-xs mt-1">
                                  {
                                    errors[
                                      `variant_${variantIndex}_size_${sizeIndex}_originalPrice`
                                    ]
                                  }
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 uppercase">
                                Sale Price
                              </label>
                              <input
                                type="number"
                                value={size.price}
                                onChange={(e) =>
                                  handleSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="80"
                              />
                              {errors[
                                `variant_${variantIndex}_size_${sizeIndex}_price`
                              ] && (
                                <p className="text-red-600 text-xs mt-1">
                                  {
                                    errors[
                                      `variant_${variantIndex}_size_${sizeIndex}_price`
                                    ]
                                  }
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1 uppercase">
                                Stock
                              </label>
                              <input
                                type="number"
                                value={size.stock}
                                onChange={(e) =>
                                  handleSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "stock",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="50"
                              />
                              {errors[
                                `variant_${variantIndex}_size_${sizeIndex}_stock`
                              ] && (
                                <p className="text-red-600 text-xs mt-1">
                                  {
                                    errors[
                                      `variant_${variantIndex}_size_${sizeIndex}_stock`
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Variant Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={addVariant}
            className="w-full py-4 border-2 border-dashed border-black bg-white hover:bg-gray-50 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <FiPlus size={24} />
            Add Another Variant
          </motion.button>

          {/* Submit Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave />
                  {isEditMode ? "Update Product" : "Create Product"}
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 sm:flex-none sm:px-12 py-4 border-2 border-black bg-white text-black font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateProduct;