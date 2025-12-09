import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoHome = () => navigate('/');
  const handleGoBack = () => navigate(-1);

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop',
    },
  };

  // Artistic "404" SVG with subtle float animation
  const LostSvg = (
    <motion.svg
      initial={{ opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={floatingAnimation}
      width="140"
      height="60"
      viewBox="0 0 140 60"
      className="mx-auto mb-9 cursor-default select-none"
    >
      <text
        x="17"
        y="48"
        fontFamily="monospace"
        fontSize="54"
        fill="black"
        opacity="0.12"
      >
        404
      </text>
      <circle
        cx="70"
        cy="30"
        r="22"
        stroke="black"
        strokeWidth="2"
        fill="none"
        opacity="0.18"
      />
      <line
        x1="35"
        y1="15"
        x2="105"
        y2="45"
        stroke="black"
        strokeWidth="2"
        opacity="0.12"
      />
    </motion.svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center w-full bg-white px-4"
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
    >
      {LostSvg}
      <motion.h1
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-black text-3xl font-bold mb-4 text-center"
      >
        Page Not Found
      </motion.h1>
      <motion.p
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-black text-md mb-10 max-w-xs text-center"
      >
        Sorry, the page you're looking for doesn't exist or has moved.
      </motion.p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-xs">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleGoBack}
          className="flex items-center gap-2 border-2 border-black px-6 py-3 rounded-full text-black font-semibold bg-white hover:bg-black hover:text-white transition w-full"
        >
          <ArrowLeft className="w-5 h-5" /> Go Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleGoHome}
          className="flex items-center gap-2 border-2 border-black px-6 py-3 rounded-full text-black font-semibold bg-white hover:bg-black hover:text-white transition w-full"
        >
          <Home className="w-5 h-5" /> Home
        </motion.button>
      </div>
    </motion.div>
  );
}

export default NotFoundPage;
