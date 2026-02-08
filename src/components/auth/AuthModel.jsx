import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModel } from "../../context/AuthModelContext";
import { useAuth } from "../../context/AuthContext";

const AuthModal = () => {
    const { isOpen, view, closeModal, switchView, openModal } = useAuthModel();
    const { login, register, loading: authLoading, error: authError } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    // Listen for custom event to open modal
    useEffect(() => {
        const handleOpenAuthModal = (event) => {
            const { mode } = event.detail || {};
            if (mode === 'login' || mode === 'signup') {
                openModal();
                switchView(mode === 'signup' ? 'register' : 'login');
            }
        };

        window.addEventListener('openAuthModal', handleOpenAuthModal);
        return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
    }, [openModal, switchView]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setLocalError(''); // Clear error on input
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');

        if (!formData.username || !formData.password) {
            setLocalError('Please fill in all fields');
            return;
        }

        try {
            await login({
                username: formData.username,
                password: formData.password,
            });

            // On success (no error thrown), show success and close
            setLocalSuccess('Login successful!');
            setTimeout(() => {
                closeModal();
                resetForm();
            }, 800);
        } catch (err) {
            // Error is already handled in context and toasted
            setLocalError(authError || 'Login failed. Please try again.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');

        if (!formData.username || !formData.email || !formData.password) {
            setLocalError('Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });

            setLocalSuccess('Registration successful! Please check your email.');
            setTimeout(() => {
                closeModal();
                resetForm();
            }, 1200);
        } catch (err) {
            setLocalError(authError || 'Registration failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({ username: '', email: '', password: '' });
        setLocalError('');
        setLocalSuccess('');
        setShowPassword(false);
    };

    const handleClose = () => {
        closeModal();
        resetForm();
    };

    const loading = authLoading;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-2xl border border-black w-full max-w-md relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute right-4 top-4 text-gray-400 hover:text-black transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Modal Content */}
                            <div className="p-8">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-bold text-black mb-2">
                                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        {view === 'login'
                                            ? 'Sign in to continue shopping'
                                            : 'Join us for exclusive deals'}
                                    </p>
                                </div>

                                {/* Error / Success Messages */}
                                {(localError || localSuccess) && (
                                    <div className={`text-center text-sm p-3 rounded-lg mb-4 ${localError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                        {localError || localSuccess}
                                    </div>
                                )}

                                {/* Forms */}
                                <AnimatePresence mode="wait">
                                    {view === 'login' ? (
                                        <motion.form
                                            key="login"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleLogin}
                                            className="space-y-4"
                                        >
                                            {/* Username */}
                                            <div>
                                                <label htmlFor="username" className="block text-sm font-medium text-black mb-1">
                                                    Username
                                                </label>
                                                <input
                                                    id="username"
                                                    name="username"
                                                    type="text"
                                                    required
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition disabled:bg-gray-100"
                                                    placeholder="Enter your username"
                                                />
                                            </div>

                                            {/* Password */}
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="password"
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        disabled={loading}
                                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition disabled:bg-gray-100"
                                                        placeholder="Enter your password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        disabled={loading}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition disabled:opacity-50"
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
                                            </div>

                                            {/* Submit Button */}
                                            <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                                className="w-full bg-black text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Signing in...' : 'Sign in'}
                                            </motion.button>

                                            {/* Switch to Register */}
                                            <div className="text-center text-sm text-gray-600 mt-4">
                                                Don't have an account?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => switchView('register')}
                                                    disabled={loading}
                                                    className="text-black font-medium underline underline-offset-2 hover:text-gray-700 transition disabled:opacity-50"
                                                >
                                                    Sign up
                                                </button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="register"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onSubmit={handleRegister}
                                            className="space-y-4"
                                        >
                                            {/* Username */}
                                            <div>
                                                <label htmlFor="reg-username" className="block text-sm font-medium text-black mb-1">
                                                    Username
                                                </label>
                                                <input
                                                    id="reg-username"
                                                    name="username"
                                                    type="text"
                                                    required
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition disabled:bg-gray-100"
                                                    placeholder="Choose a username"
                                                />
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition disabled:bg-gray-100"
                                                    placeholder="Enter your email"
                                                />
                                            </div>

                                            {/* Password */}
                                            <div>
                                                <label htmlFor="reg-password" className="block text-sm font-medium text-black mb-1">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="reg-password"
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        required
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        disabled={loading}
                                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition disabled:bg-gray-100"
                                                        placeholder="Create a password (min 6 characters)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        disabled={loading}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition disabled:opacity-50"
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
                                            </div>

                                            {/* Submit Button */}
                                            <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                                className="w-full bg-black text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Creating account...' : 'Sign up'}
                                            </motion.button>

                                            {/* Switch to Login */}
                                            <div className="text-center text-sm text-gray-600 mt-4">
                                                Already have an account?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => switchView('login')}
                                                    disabled={loading}
                                                    className="text-black font-medium underline underline-offset-2 hover:text-gray-700 transition disabled:opacity-50"
                                                >
                                                    Sign in
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;