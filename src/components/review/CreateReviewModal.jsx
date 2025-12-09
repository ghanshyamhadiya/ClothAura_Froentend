import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, Video, Send } from 'lucide-react';
import { useReview } from '../../context/ReviewContext';
import { useAuth } from '../../context/AuthContext'; // Added useAuth for context in the modal

// Modal Backdrop Variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Modal Variants (Scale-up from center)
const modalVariants = {
  hidden: { y: "100vh", opacity: 0, scale: 0.8 },
  visible: {
    y: "0",
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 300 }
  },
  exit: { y: "100vh", opacity: 0, scale: 0.8 }
};

const CreateReviewModal = ({ productId, isOpen, onClose }) => {
  const { user } = useAuth(); // Get user for display/context
  const { addReview, loading } = useReview();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up object URLs when modal is closed
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setRating(5);
      setContent('');
      setFiles([]);
      setPreviews([]);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5 - files.length);
    const newPreviews = selected.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      file
    }));
    setFiles(prev => [...prev, ...selected]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i].url);
    setFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.append('content', content);
    formData.append('rating', rating);
    formData.append('productId', productId);
    files.forEach(f => formData.append('media', f));

    await addReview(formData);
    onClose(); // Close on successful submission
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          // 🛑 CRITICAL CHANGE: Removed onClick={onClose} here
        >
          {/* Backdrop Blur - Now just visual, no click handler */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative"
            variants={modalVariants}
            onClick={e => e.stopPropagation()} // Keep this to prevent event propagation to the (now passive) backdrop
          >
            {/* Close Button - This is the ONLY element that calls onClose */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
              aria-label="Close review form"
            >
              <X size={24} className="text-gray-600" />
            </button>

            <h3 className="text-3xl font-bold mb-8 text-center">Share Your Experience</h3>
            
            {/* Rating Section */}
            <div className="text-center mb-8">
              <p className="text-lg font-medium mb-3">Your Rating:</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={36}
                    className={`cursor-pointer transition-all duration-200 ${
                      n <= rating 
                        ? 'fill-yellow-500 text-yellow-500 scale-110' 
                        : 'text-gray-300'
                    }`}
                    onClick={() => setRating(n)}
                    // whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            </div>

            {/* Review Text Area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What did you love (or didn’t)? Be detailed and helpful..."
              className="w-full p-4 text-base bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl outline-none resize-none transition-colors"
              rows={5}
            />

            {/* Upload Area */}
            <div className="mt-6">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <motion.button
                onClick={() => fileInputRef.current.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={files.length >= 5}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={20} />
                <span className="font-medium">
                  {files.length > 0 
                    ? `Upload Media (${files.length} / 5 attached)` 
                    : 'Add up to 5 photos or videos'
                  }
                </span>
              </motion.button>

              {/* Preview Grid */}
              <AnimatePresence>
                {previews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex flex-wrap gap-3 justify-center"
                  >
                    {previews.map((p, i) => (
                      <motion.div
                        key={p.url}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative group"
                      >
                        {p.type === 'image' ? (
                          <img
                            src={p.url}
                            alt="preview"
                            className="w-24 h-24 object-cover rounded-lg shadow-md border"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border">
                            <Video size={28} className="text-gray-500" />
                            <span className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1 rounded">Video</span>
                          </div>
                        )}
                        <motion.button
                          onClick={() => removeFile(i)}
                          whileHover={{ scale: 1.1 }}
                          className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-lg transition"
                        >
                          <X size={14} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <div className="text-center mt-8">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={loading || !content.trim() || !rating}
                className="w-full inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={20} />
                {loading ? 'Publishing...' : 'Publish Review'}
              </motion.button>
              <p className="text-xs text-gray-500 mt-2">
                  You are posting as {user?.username || 'Guest'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateReviewModal;