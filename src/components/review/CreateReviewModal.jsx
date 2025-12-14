import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, Video, Send } from 'lucide-react';
import { useReview } from '../../context/ReviewContext';
import { useAuth } from '../../context/AuthContext';

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modal = {
  hidden: { y: '100vh', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: { y: '100vh', opacity: 0 },
};

const CreateReviewModal = ({ productId, isOpen, onClose, initialReview }) => {
  const { user } = useAuth();
  const { addReview, editReview, loading } = useReview();

  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [content, setContent] = useState(initialReview?.content || '');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    if (isOpen && initialReview) {
      setRating(initialReview.rating);
      setContent(initialReview.content);
      // Note: Editing existing media is not supported in this version
    }
  }, [isOpen, initialReview]);

  useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
    const newPreviews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      file,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (i) => {
    URL.revokeObjectURL(previews[i].url);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!content.trim() || rating < 1) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('rating', rating);
    formData.append('productId', productId);
    files.forEach(file => formData.append('media', file));

    if (initialReview) {
      await editReview(initialReview._id, formData);
    } else {
      await addReview(formData);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto"
            variants={modal}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle Bar (Mobile) */}
            <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} className="text-gray-700" />
            </button>

            <div className="p-6 sm:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                {initialReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>

              {/* Rating */}
              <div className="text-center mb-10">
                <p className="text-lg font-medium mb-4">Rate this product</p>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.div
                      key={n}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star
                        size={44}
                        onClick={() => setRating(n)}
                        className="cursor-pointer transition-all"
                        fill={n <= rating ? 'black' : 'none'}
                        stroke={n <= rating ? 'black' : '#9ca3af'}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Text */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience... What did you like or dislike?"
                className="w-full p-5 text-base bg-gray-50 border border-gray-300 rounded-2xl focus:border-black focus:outline-none resize-none transition-colors"
                rows={6}
              />

              {/* Upload */}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current.click()}
                  disabled={files.length >= 5}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-3 text-gray-700 hover:border-black transition disabled:opacity-50"
                >
                  <Upload size={22} />
                  <span className="font-medium">
                    {files.length > 0
                      ? `${files.length}/5 media attached`
                      : 'Add photos or videos (up to 5)'}
                  </span>
                </motion.button>

                {/* Previews */}
                {previews.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 grid grid-cols-5 gap-3"
                  >
                    {previews.map((p, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="relative group aspect-square rounded-lg overflow-hidden border"
                      >
                        {p.type === 'image' ? (
                          <img src={p.url} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Video size={32} className="text-gray-500" />
                          </div>
                        )}
                        <button
                          onClick={() => removePreview(i)}
                          className="absolute top-1 right-1 bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Submit */}
              <div className="mt-10 text-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={submit}
                  disabled={loading || !content.trim()}
                  className="inline-flex items-center gap-3 px-10 py-4 bg-black text-white rounded-full font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  <Send size={22} />
                  {loading ? 'Publishing...' : initialReview ? 'Update Review' : 'Publish Review'}
                </motion.button>
                <p className="text-sm text-gray-500 mt-3">
                  Posting as <span className="font-medium">{user?.username || 'Guest'}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateReviewModal;