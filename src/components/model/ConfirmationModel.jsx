import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, AlertTriangle, Info, CheckCircle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger" // danger, warning, info, success
}) => {
  const variants = {
    danger: {
      icon: <Trash2 className="w-6 h-6" />,
      bgGradient: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBg: "bg-red-500 hover:bg-red-600",
      confirmText: "text-white"
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      bgGradient: "bg-gradient-to-br from-amber-500 to-orange-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmBg: "bg-amber-500 hover:bg-amber-600",
      confirmText: "text-white"
    },
    info: {
      icon: <Info className="w-6 h-6" />,
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBg: "bg-blue-500 hover:bg-blue-600",
      confirmText: "text-white"
    },
    success: {
      icon: <CheckCircle className="w-6 h-6" />,
      bgGradient: "bg-gradient-to-br from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      confirmBg: "bg-green-500 hover:bg-green-600",
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
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 350
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.1,
        type: "spring",
        damping: 15
      }
    }
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
          onClick={handleBackdropClick}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with icon */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    className={`p-3 rounded-2xl ${currentVariant.iconBg}`}
                  >
                    <div className={currentVariant.iconColor}>
                      {currentVariant.icon}
                    </div>
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-6 pb-6"
            >
              <p className="text-gray-600 leading-relaxed">
                {message}
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 pt-0 flex gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-3.5 px-4 ${currentVariant.confirmBg} ${currentVariant.confirmText} rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg`}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    {currentVariant.icon}
                    {confirmText}
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-all disabled:opacity-50"
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