import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

import { useAuth } from '../../context/AuthContext';
import { useAuthModel } from '../../context/AuthModelContext';
import { useCartWishlist } from '../../context/CartWhislistContext';
import { useProducts } from '../../context/ProductContext';

import SearchBar from '../common/SearchBar';
import ConfirmationModal from '../model/ConfirmationModel';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cart, wishlist } = useCartWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const { openModel } = useAuthModel();
  const {
    searchQuery,
    setSearchQuery,
    searchProducts,
    clearSearch,
  } = useProducts();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Search visibility
  const showSearchBar =
    location.pathname === '/' ||
    location.pathname === '/products' ||
    location.pathname === '/search' 

  const toggleMobileMenu = () => setIsMobileMenuOpen(p => !p);

  const handleSearch = (query) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }
    searchProducts(query);
    navigate('/');
  };

  const performLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setIsLogoutModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Scroll hide effect
  useEffect(() => {
    const control = () => {
      const current = window.scrollY;
      setIsVisible(!(current > lastScrollY && current > 80));
      setLastScrollY(current);
    };
    window.addEventListener('scroll', control, { passive: true });
    return () => window.removeEventListener('scroll', control);
  }, [lastScrollY]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.length;

  // Badge component
  const Badge = ({ count }) => count > 0 && (
    <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50"
        animate={isVisible ? { y: 0 } : { y: '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-3xl font-black tracking-tight text-black hover:opacity-80 transition">
            ClothAura
          </Link>

          {/* Desktop Search */}
          {showSearchBar && (
            <div className="hidden md:flex flex-1 mx-8 max-w-2xl">
              <SearchBar
                onSearch={handleSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          )}

          {/* Desktop Right Nav */}
          <nav className="flex items-center gap-6">
            {isAuthenticated && (user?.role === 'user') && (
              <>
                <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition">
                  <Heart className="w-6 h-6 text-gray-800" />
                  <Badge count={wishlistCount} />
                </Link>
                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition">
                  <ShoppingCart className="w-6 h-6 text-gray-800" />
                  <Badge count={cartCount} />
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition">
                  <User className="w-6 h-6 text-gray-800" />
                </button>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block z-50"
                >
                  <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {user?.name || 'Account'}
                  </div>

                  <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                    <CreditCard className="w-4 h-4" /> Orders
                  </Link>
                  <Link to="/address" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                    <MapPin className="w-4 h-4" /> Addresses
                  </Link>
                  <Link to="/user-coupons" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                    <CreditCard className="w-4 h-4" /> Coupons
                  </Link>

                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <>
                      <div className="h-px bg-gray-200 my-1" />
                      <Link to="/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                        <LayoutDashboard className="w-4 h-4" /> Order Dashboard
                      </Link>
                      <Link to="/manage/dashboard/products" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                        <Package className="w-4 h-4" /> Manage Products
                      </Link>
                      <Link to="/product/create" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                        <Package className="w-4 h-4" /> Create Product
                      </Link>
                      <Link to="/coupon/create" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition">
                        <Package className="w-4 h-4" /> Create Coupon
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-gray-200 my-1" />
                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => openModel('login')}
                  className="px-5 py-2 border border-black rounded-md hover:bg-gray-100 transition text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => openModel('register')}
                  className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition text-sm font-medium"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
            </button>
          </nav>
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
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-xl font-bold text-gray-800">Menu</span>
                <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              {/* Mobile Search */}
              {showSearchBar && (
                <div className="p-4 border-b border-gray-200">
                  <SearchBar
                    onSearch={handleSearch}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </div>
              )}

              <div className="flex-1 p-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200">
                      {user?.name || 'Account'}
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                    >
                      <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link
                      to="/orders"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                    >
                      <CreditCard className="w-5 h-5" /> Orders
                    </Link>
                    <Link
                      to="/address"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                    >
                      <MapPin className="w-5 h-5" /> Addresses
                    </Link>
                    <Link
                      to="/user-coupons"
                      onClick={toggleMobileMenu}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                    >
                      <CreditCard className="w-5 h-5" /> Coupons
                    </Link>

                    {user?.role === 'user' && (
                      <>
                        <Link
                          to="/wishlist"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <Heart className="w-5 h-5" /> Wishlist ({wishlistCount})
                        </Link>
                        <Link
                          to="/cart"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <ShoppingCart className="w-5 h-5" /> Cart ({cartCount})
                        </Link>
                      </>
                    )}

                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <>
                        <div className="h-px bg-gray-200 my-2" />
                        <Link
                          to="/dashboard/orders"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <LayoutDashboard className="w-5 h-5" /> Order Dashboard
                        </Link>
                        <Link
                          to="/manage/dashboard/products"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <Package className="w-5 h-5" /> Manage Products
                        </Link>
                        <Link
                          to="/product/create"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <Package className="w-5 h-5" /> Create Product
                        </Link>
                        <Link
                          to="/coupon/create"
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-md text-sm text-gray-800 transition"
                        >
                          <Package className="w-5 h-5" /> Create Coupon
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-gray-200 my-2" />
                    <button
                      onClick={() => {
                        setIsLogoutModalOpen(true);
                        toggleMobileMenu();
                      }}
                      className="w-full flex items-center gap-3 p-3 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                    >
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        openModel('login');
                        toggleMobileMenu();
                      }}
                      className="w-full px-5 py-3 border border-black rounded-md hover:bg-gray-100 transition text-sm font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        openModel('register');
                        toggleMobileMenu();
                      }}
                      className="w-full px-5 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition text-sm font-medium"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={performLogout}
        title="Logout Confirmation"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        loading={logoutLoading}
      />
    </>
  );
}

export default Header;