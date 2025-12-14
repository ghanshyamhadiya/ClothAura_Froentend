import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Package,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { useAuthModel } from '../../context/AuthModelContext';
import ConfirmationModal from '../model/ConfirmationModel';
import { useCartWishlist } from '../../context/CartWhislistContext';

function Header() {
  const navigate = useNavigate();
  const { cart, wishlist } = useCartWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const { searchQuery, setSearchQuery, searchProducts } = useProducts();
  const { openModel } = useAuthModel();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Logout modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => !logoutLoading && setIsLogoutModalOpen(false);

  const performLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setIsMobileMenuOpen(false);
      setIsLogoutModalOpen(false);
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Hide header on scroll down
  useEffect(() => {
    const controlNavbar = () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 80) {
        setIsVisible(false);
      } else if (current < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(current);
    };
    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Badge component
  const Badge = ({ count, className = "" }) =>
    count > 0 ? (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold text-white bg-red-600 shadow-lg ${className}`}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    ) : null;

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm"
        initial={{ y: 0 }}
        animate={isVisible ? { y: 0 } : { y: '-100%' }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-extrabold tracking-tighter hover:opacity-70 transition"
            >
              ClothAura
            </Link>

            {/* Desktop: Account / Auth Buttons */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  {/* Owner/Admin Dashboard Link */}
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Link
                      to="/manage/dashboard/products"
                      className="flex items-center gap-2 text-sm font-medium hover:text-gray-600 transition"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                  )}

                  {/* Account Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition">
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">Account</span>
                    </button>

                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden hidden group-hover:block"
                    >
                      <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b">
                        {user?.name || 'My Account'}
                      </div>
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                        <CreditCard className="w-4 h-4" /> Orders
                      </Link>
                      <Link to="/address" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                        <MapPin className="w-4 h-4" /> Addresses
                      </Link>

                      {(user?.role === 'admin' || user?.role === 'owner') && (
                        <>
                          <div className="h-px bg-gray-200 my-2" />
                          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                            <Package className="w-4 h-4" /> Manage Products
                          </Link>
                          <Link to="/product/create" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                            <Package className="w-4 h-4" /> Add Product
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-gray-200 my-2" />
                      <button
                        onClick={openLogoutModal}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-medium text-sm"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openModel('login')}
                    className="px-5 py-2 border border-black rounded-lg hover:bg-black hover:text-white transition text-sm font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => openModel('register')}
                    className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                  >
                    Register
                  </button>
                </>
              )}
            </nav>

            {/* Right Side Icons - Always Visible (Mobile + Desktop) */}
            <div className="flex items-center gap-4">
              {/* Wishlist Icon */}
              {isAuthenticated && user?.role !== 'admin' && user?.role !== 'owner' && (
                <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <Heart className="w-6 h-6" />
                  <Badge count={wishlistCount} />
                </Link>
              )}

              {/* Cart Icon */}
              {isAuthenticated && user?.role !== 'admin' && user?.role !== 'owner' && (
                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                  <ShoppingCart className="w-6 h-6" />
                  <Badge count={cartCount} />
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition md:hidden"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-1">
                {isAuthenticated ? (
                  <>
                    <div className="pb-3 border-b text-sm font-semibold text-gray-600">
                      {user?.name || 'My Account'}
                    </div>

                    {(user?.role === 'admin' || user?.role === 'owner') ? (
                      <Link to="/manage/dashboard/products" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/cart" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                          <ShoppingCart className="w-5 h-5" /> Cart ({cartCount})
                        </Link>
                        <Link to="/wishlist" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                          <Heart className="w-5 h-5" /> Wishlist ({wishlistCount})
                        </Link>
                      </>
                    )}

                    <Link to="/orders" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                      <CreditCard className="w-5 h-5" /> Orders
                    </Link>
                    <Link to="/address" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                      <MapPin className="w-5 h-5" /> Addresses
                    </Link>

                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <>
                        <div className="h-px bg-gray-200 my-4" />
                        <Link to="/admin/products" onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                          <Package className="w-5 h-5" /> Manage Products
                        </Link>
                        <Link to="/product/create" menus onClick={toggleMobileMenu} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3">
                          <Package className="w-5 h-5" /> Add Product
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-gray-200 my-4" />
                    <button
                      onClick={openLogoutModal}
                      className="w-full flex items-center gap-3 py-3 text-red-600 hover:bg-red-50 rounded-lg px-3 font-medium"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { openModel('login'); toggleMobileMenu(); }}
                      className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { openModel('register'); toggleMobileMenu(); }}
                      className="w-full py-3 border border-black rounded-lg hover:bg-black hover:text-white transition font-medium mt-3"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={performLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        loading={logoutLoading}
        variant="warning"
      />
    </>
  );
}

export default Header;