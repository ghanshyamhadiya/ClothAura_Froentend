import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, LogOut, Menu, X, LayoutDashboard, Package, CreditCard, MapPin } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../common/SearchBar';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    searchProducts,
  } = useProducts();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const menuVariants = {
    closed: { opacity: 0, x: '-100%' },
    open: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  const headerVariants = {
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
    hidden: { y: '-100%', opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  };

  return (
    <motion.header
      className="bg-white text-black shadow-md fixed top-0 left-0 w-full z-50 mb-4"
      initial="visible"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={headerVariants}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform duration-200">
          ClothAura
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-6">
          <SearchBar
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/owner/dashboard/products" className="hover:text-gray-600 flex items-center gap-1 transition-colors duration-200">
                <LayoutDashboard className="w-5 h-5" />
                Products
              </Link>

              {(user?.role === 'user') && (
                <>
                  <Link to="/cart" className="hover:text-gray-600 flex items-center gap-1 transition-colors duration-200">
                    <ShoppingCart className="w-5 h-5" />
                    Cart
                  </Link>
                  <Link to="/wishlist" className="hover:text-gray-600 flex items-center gap-1 transition-colors duration-200">
                    <Heart className="w-5 h-5" />
                    Wishlist
                  </Link>
                </>
              )}
              <div className="relative group">
                <button className="hover:text-gray-600 flex items-center gap-1 transition-colors duration-200">
                  <User className="w-5 h-5" />
                  Account
                </button>
                <motion.ul
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 border border-gray-200 hidden group-hover:block"
                >
                  <li>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                      <CreditCard className="w-4 h-4" />
                      Orders
                    </Link>
                  </li>
                  <li>
                    <Link to="/address" className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Link>
                  </li>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <>
                      <li>
                        <Link to="/admin/products" className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                          <Package className="w-4 h-4" />
                          Admin Products
                        </Link>
                      </li>
                      <li>
                        <Link to="/product/create" className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                          <Package className="w-4 h-4" />
                          Create Product
                        </Link>
                      </li>
                      <li>
                        <Link to="/coupon/create" className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                          <CreditCard className="w-4 h-4" />
                          Create Coupon
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 transition-colors duration-200">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </li>
                </motion.ul>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-600 transition-colors duration-200">Login</Link>
              <Link to="/register" className="hover:text-gray-600 transition-colors duration-200">Register</Link>
              <Link to="/register/owner" className="hover:text-gray-600 transition-colors duration-200">Owner Register</Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden hover:scale-110 transition-transform duration-200" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="md:hidden bg-white px-4 py-4 border-t border-gray-200"
          >
            {/* Mobile Search Bar */}
            <div className="mb-4">
              <SearchBar
                onSearch={handleSearch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            <ul className="flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/dashboard" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/cart" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                      <ShoppingCart className="w-5 h-5" />
                      Cart
                    </Link>
                  </li>
                  <li>
                    <Link to="/wishlist" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link to="/orders" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                      <CreditCard className="w-5 h-5" />
                      Orders
                    </Link>
                  </li>
                  <li>
                    <Link to="/address" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                      <MapPin className="w-5 h-5" />
                      Address
                    </Link>
                  </li>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <>
                      <li>
                        <Link to="/admin/products" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                          <Package className="w-5 h-5" />
                          Admin Products
                        </Link>
                      </li>
                      <li>
                        <Link to="/product/create" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                          <Package className="w-5 h-5" />
                          Create Product
                        </Link>
                      </li>
                      <li>
                        <Link to="/coupon/create" className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>
                          <CreditCard className="w-5 h-5" />
                          Create Coupon
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <button onClick={handleLogout} className="flex items-center gap-2 hover:text-gray-600 transition-colors duration-200">
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>Login</Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>Register</Link>
                  </li>
                  <li>
                    <Link to="/register/owner" className="hover:text-gray-600 transition-colors duration-200" onClick={toggleMobileMenu}>Owner Register</Link>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Header;