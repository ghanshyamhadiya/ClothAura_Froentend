import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, AlertTriangle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Remove Item",
  message = "Are you sure you want to remove this item from your cart?",
  confirmText = "Remove",
  cancelText = "Keep Item",
  loading = false,
  variant = "danger" // danger, warning, info
}) => {
  const variants = {
    danger: {
      icon: <Trash2 className="w-5 h-5" />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBg: "bg-red-500 hover:bg-red-600",
      confirmText: "text-white"
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      confirmBg: "bg-yellow-500 hover:bg-yellow-600",
      confirmText: "text-white"
    },
    info: {
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBg: "bg-blue-500 hover:bg-blue-600",
      confirmText: "text-white"
    }
  };

  const currentVariant = variants[variant] || variants.danger;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15, ease: "easeIn" }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.85,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.85,
      y: 20,
      transition: { 
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className={`p-2 rounded-full ${currentVariant.iconBg}`}
                >
                  <div className={currentVariant.iconColor}>
                    {currentVariant.icon}
                  </div>
                </motion.div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={loading}
                className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </motion.button>
            </div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 mb-6 leading-relaxed"
            >
              {message}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-3 px-4 ${currentVariant.confirmBg} ${currentVariant.confirmText} rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm`}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    {currentVariant.icon}
                    {confirmText}
                  </>
                )}
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {cancelText}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;