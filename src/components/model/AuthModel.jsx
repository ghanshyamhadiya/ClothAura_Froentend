import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModel } from '../../context/AuthModelContext';
import { useNavigate } from 'react-router-dom';

const AuthModel = () => {
  const { isOpen, intent, fromPath, closeModal } = useAuthModel();
  const navigate = useNavigate();

  const messageMap = {
    cart: 'Login to add items to cart',
    wishlist: 'Login to add items to wishlist',
    review: 'Login to write or manage reviews',
  };

  const title = messageMap[intent] || 'Login required';

  const goTo = (path) => {
    closeModal();
    navigate(path, { state: fromPath ? { from: fromPath } : undefined });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-6">
              Continue to login or create an account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => goTo('/login')}
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium"
              >
                Login
              </button>
              <button
                onClick={() => goTo('/register')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-medium"
              >
                Sign up
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModel;
