import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

function ErrorPage({ onRetry }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-screen w-full bg-white"
    >
      <motion.h1
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-black text-4xl font-extrabold tracking-tight mb-4"
        style={{ letterSpacing: '-1px' }}
      >
        Connection Error
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-black text-lg mb-8 max-w-xs text-center"
      >
        We're having trouble connecting to the server.<br />
        Please check your connection or try again.
      </motion.p>
      <motion.button
        onClick={handleRetry}
        disabled={isRetrying}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-black bg-transparent text-black font-semibold transition-colors duration-200 disabled:opacity-60"
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
        <motion.span
          animate={isRetrying ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="inline-block"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.span>
      </motion.button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 25%, black 0%, transparent 80%)'
        }}
      />
    </motion.div>
  );
}

export default ErrorPage;
