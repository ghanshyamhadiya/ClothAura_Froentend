import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export const toastService = {
  success: (message, options = {}) =>
    toast.success(message, {
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
      ...options,
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      ...options,
    }),

  warning: (message, options = {}) =>
    toast.warning(message, {
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      ...options,
    }),

  info: (message, options = {}) =>
    toast.info(message, {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      ...options,
    }),

  loading: (message = 'Loading...') =>
    toast.loading(message, {
      icon: (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="w-6 h-6 text-gray-600" />
        </motion.div>
      ),
    }),

  promise: (promise, messages, options = {}) =>
    toast.promise(promise, {
      pending: { render: () => <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" />{messages.pending || 'Processing...'}</div> },
      success: { render: () => <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-600" />{messages.success || 'Success!'}</div> },
      error: { render: ({ data }) => <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-600" />{messages.error || data?.message || 'Error'}</div> },
    }, {
      autoClose: 4000,
      hideProgressBar: true,
      ...options,
    }),
};