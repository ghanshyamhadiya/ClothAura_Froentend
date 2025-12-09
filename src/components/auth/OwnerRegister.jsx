import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const OwnerRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'owner'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(formData);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-white px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-md bg-white border border-black p-8 rounded-2xl shadow-xl space-y-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-black">Create your account</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <motion.div whileFocus={{ scale: 1.01 }}>
            <label htmlFor="username" className="block text-sm font-medium text-black mb-1">
              Username
            </label>
            <motion.input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-black rounded-md bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your username"
            />
          </motion.div>

          {/* Email */}
          <motion.div whileFocus={{ scale: 1.01 }}>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
              Email address
            </label>
            <motion.input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-black rounded-md bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter your email"
            />
          </motion.div>

          {/* Password */}
          <motion.div whileFocus={{ scale: 1.01 }}>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
              Password
            </label>
            <div className="relative">
              <motion.input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 border border-black rounded-md bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {success}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-black text-white py-3 rounded-md font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </motion.button>

          {/* Redirect */}
          <div className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-black underline underline-offset-2 hover:text-gray-800 transition"
            >
              Sign in
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OwnerRegister;