import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
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
  Search,
  ChevronRight,
  BarChart3
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useAuthModel } from '../../context/AuthModelContext';
import { useCartWishlist } from '../../context/CartWhislistContext';
import { useProducts } from '../../context/ProductContext';
import SearchBar from '../common/SearchBar';
import ConfirmationModal from '../model/ConfirmationModel';
import NotificationBell from '../common/NotificationBell';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cart, wishlist } = useCartWishlist();
  const { isAuthenticated, user, logout } = useAuth();
  const { openModel } = useAuthModel();
  const { searchQuery, setSearchQuery, searchProducts, clearSearch } = useProducts();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(p => !p);

  const handleSearch = (query) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }
    searchProducts(query);
    navigate('/');
    setIsSearchOpen(false);
  };

  const performLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    setIsLogoutModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Scroll hide effect with backdrop blur
  useEffect(() => {
    const control = () => {
      const current = window.scrollY;
      setIsVisible(!(current > lastScrollY && current > 80));
      setLastScrollY(current);
    };
    window.addEventListener('scroll', control, { passive: true });
    return () => window.removeEventListener('scroll', control);
  }, [lastScrollY]);

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.length;

  // Paths where search should be shown
  const searchAllowedPaths = ['/', '/products', '/categories'];
  const showSearchIcon = searchAllowedPaths.some(path =>
    location.pathname === path || location.pathname.startsWith('/products')
  );

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm font-medium tracking-wide transition-all duration-200 hover:text-black hover:scale-105 ${isActive ? 'text-black' : 'text-gray-500'}`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-100 transition-all duration-300 ${lastScrollY > 10 ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-white'
          }`}
        animate={isVisible ? { y: 0 } : { y: '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">

          {/* Logo & Mobile Toggle */}
          <div className="flex items-center gap-4 z-20">
            <button
              onClick={toggleMobileMenu}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition md:hidden"
            >
              <Menu className="w-6 h-6 text-black" />
            </button>
            <Link to="/" className="text-2xl font-black tracking-tighter text-black uppercase">
              CLOTHAURA<span className="text-black">.</span>
            </Link>
          </div>

          {/* Desktop: Navigation OR Search Bar (Inline) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-12 absolute inset-0 z-10 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl flex justify-center">
              <AnimatePresence mode="wait">
                {!isSearchOpen ? (
                  <motion.nav
                    key="nav"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-10"
                  >
                    <NavItem to="/">Home</NavItem>
                    <NavItem to="/products">Shop</NavItem>
                    <NavItem to="/products?sort=new">New Arrivals</NavItem>
                    <NavItem to="/categories">Collections</NavItem>
                  </motion.nav>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <SearchBar
                      onSearch={handleSearch}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      autoFocus
                      placeholder="Search products..."
                      minimal={true}
                      className="w-full border-b-2 border-gray-100 focus-within:border-black transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-4 z-20 bg-white pl-4">
            {/* Notification Bell - For authenticated users (owners and admin) */}
            {isAuthenticated && (user?.role === 'owner' || user?.role === 'admin') && (
              <NotificationBell />
            )}

            {/* Search Trigger - Only on allowed paths */}
            {showSearchIcon && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-800 relative"
                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              >
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="search" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                      <Search className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}

            {isAuthenticated && (user?.role === 'user') && (
              <>
                <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition text-gray-800 hidden sm:block">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-0.5 w-2 h-2 bg-black rounded-full" />
                  )}
                </Link>
                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition text-gray-800">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <div className="relative group hidden sm:block">
                <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-800 block">
                  <User className="w-5 h-5" />
                </Link>

                {/* User Dropdown */}
                <div className="absolute right-0 top-full pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden p-2">
                    <div className="px-3 py-2 border-b border-gray-100 mb-2">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="font-semibold text-sm truncate">{user?.username}</p>
                    </div>

                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <Link to="/user-coupons" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                      <CreditCard className="w-4 h-4" /> My Coupons
                    </Link>

                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <div className="my-1 border-t border-gray-100 pt-1">
                        <p className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400">Management</p>
                        <Link to="/owner/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                          <LayoutDashboard className="w-4 h-4" /> Analytics Dashboard
                        </Link>
                        <Link to="/dashboard/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                          <Package className="w-4 h-4" /> Manage Orders
                        </Link>
                        <Link to="/manage/dashboard/products" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-black transition">
                          <Package className="w-4 h-4" /> Manage Products
                        </Link>
                      </div>
                    )}

                    <button
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => openModel('login')}
                  className="text-sm font-semibold text-gray-600 hover:text-black transition"
                >
                  Log in
                </button>
                <button
                  onClick={() => openModel('register')}
                  className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-black/20"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search - Slide down just below header */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden shadow-lg"
            >
              <div className="px-4 py-4">
                <SearchBar
                  onSearch={handleSearch}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  autoFocus
                  placeholder="Search products..."
                  minimal={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-black tracking-tighter uppercase">CLOTHAURA.</span>
                  <button onClick={toggleMobileMenu} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-6 h-6 text-black" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shop</p>
                    <Link to="/" onClick={toggleMobileMenu} className="block py-2 text-lg font-medium text-gray-900 border-b border-gray-100 flex justify-between">
                      Home <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                    <Link to="/products" onClick={toggleMobileMenu} className="block py-2 text-lg font-medium text-gray-900 border-b border-gray-100 flex justify-between">
                      Shop All <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                    <Link to="/products?sort=new" onClick={toggleMobileMenu} className="block py-2 text-lg font-medium text-gray-900 border-b border-gray-100 flex justify-between">
                      New Arrivals <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                    <Link to="/categories" onClick={toggleMobileMenu} className="block py-2 text-lg font-medium text-gray-900 border-b border-gray-100 flex justify-between">
                      Collections <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                      <Link to="/dashboard" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                        <User size={18} /> Dashboard
                      </Link>
                      <Link to="/orders" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                        <Package size={18} /> Orders
                      </Link>
                      <Link to="/user-coupons" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                        <CreditCard size={18} /> My Coupons
                      </Link>

                      {(user?.role === 'admin' || user?.role === 'owner') && (
                        <>
                          <div className="my-2 border-t border-gray-200" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-3">Management</p>
                          <Link to="/owner/dashboard" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                            <BarChart3 size={18} /> Analytics
                          </Link>
                          <Link to="/dashboard/orders" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                            <Package size={18} /> Manage Orders
                          </Link>
                          <Link to="/manage/dashboard/products" onClick={toggleMobileMenu} className="flex items-center gap-3 py-2 text-gray-600">
                            <LayoutDashboard size={18} /> Manage Products
                          </Link>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setIsLogoutModalOpen(true);
                          toggleMobileMenu();
                        }}
                        className="flex items-center gap-3 py-2 text-red-500 w-full text-left mt-2"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <button
                        onClick={() => { openModel('login'); toggleMobileMenu(); }}
                        className="py-3 border border-gray-200 rounded-xl font-semibold hover:border-black transition text-sm"
                      >
                        Log in
                      </button>
                      <button
                        onClick={() => { openModel('register'); toggleMobileMenu(); }}
                        className="py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition text-sm shadow-lg"
                      >
                        Sign up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={performLogout}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmText="Sign Out"
        loading={logoutLoading}
      />
    </>
  );
}

export default Header;