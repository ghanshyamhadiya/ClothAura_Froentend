// src/components/common/ToastWrapper.jsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const ToastWrapper = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={6000}
      hideProgressBar
      newestOnTop
      closeOnClick={false}
      pauseOnHover
      pauseOnFocusLoss={false}
      draggable={false}
      theme="light"
      limit={3}

      closeButton={({ closeToast }) => (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={closeToast}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg transition-all"
        >
          <X className="w-4 h-4 text-gray-600" />
        </motion.button>
      )}

      icon={({ type }) => {
        const icons = {
          success: <CheckCircle2 className="w-7 h-7 text-green-600" />,
          error: <AlertCircle className="w-7 h-7 text-red-600" />,
          warning: <AlertCircle className="w-7 h-7 text-amber-600" />,
          info: <Info className="w-7 h-7 text-blue-600" />,
        };

        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            {icons[type] || <Loader2 className="w-7 h-7 text-gray-600 animate-spin" />}
          </motion.div>
        );
      }}

      toastStyle={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.18)',
        padding: '20px 24px',
        fontSize: '15px',
        fontWeight: '500',
        color: '#1a1a1a',
        minHeight: '80px',
      }}

      bodyClassName={() => "flex items-center gap-4 pr-12"}

      style={{ top: '90px', right: '16px' }}
      className="md:max-w-md w-full space-y-4"
    />
  );
};

export default ToastWrapper;