import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import EmailVerification from './components/EmailVerification';
import Loading from './components/Loading';
import AllProduct from './components/products/AllProduct';
import socket from './utils/socket';
import { useEffect } from 'react';
import ProductDetails from './components/products/ProductDetails';
import WishList from './components/cartWishlist/WishList';
import Cart from './components/cartWishlist/Cart';
import Address from './components/checkOut/Address';
import Checkout from './components/checkOut/Checkout';
import { cartService } from './services/cartService';
import OrderHistory from './components/checkOut/OrderHistory';
import ToastWrapper from './components/common/ToastContainer';
import { toastService } from './services/toastService';
import CreateProduct from './components/products/CreateProduct';
import OwnerRegister from './components/auth/OwnerRegister';
import AllProducts from './components/admin/AllProducts';
import CreateCoupon from './components/admin/CreateCoupon';
import NotFoundPage from './components/common/NotFoundPage';
import UserCoupons from './components/checkOut/UserCoupon';
import Header from './components/header/Header';
import OrderDashboard from './components/Dashboard/OrderDashboard';

const ProtectedRoutes = ({ children, requireCart = false }) => {
  const { isAuthenticated, loading, hasChecked } = useAuth();

  // Show loading only during initial check or auth loading
  if ((loading && !hasChecked)) {
    return <Loading />;
  }


  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireCart && cartService.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return children;
};

const OwnerRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || user.role !== 'owner') {
    toastService.error('Access denied. Owners only.');
    return <Navigate to="/" replace />;
  }

  return children;
}

const AdminRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || user.role !== 'admin') {
    toastService.error('Access denied. Admins only.');
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminOwnerRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    toastService.error('Access denied. Admins or Owners only.');
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, hasChecked } = useAuth();

  if (loading && !hasChecked) {
    return <Loading />;
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {

  return (
    <>
    <Header />
      <ToastWrapper />
      <Routes>
        <Route path="/product/:id" element={
          <ProtectedRoutes>
            <ProductDetails />
          </ProtectedRoutes>}
        />
        <Route path="/dashboard" element={
          <ProtectedRoutes>
            <Dashboard />
          </ProtectedRoutes>}
        />
        <Route path="/" element={
          <ProtectedRoutes>
            <AllProduct />
          </ProtectedRoutes>}
        />

        
        <Route path="/dashboard/orders" element={
          <ProtectedRoutes>
            <OrderDashboard />
          </ProtectedRoutes>}
        />

        {/* cart & wishlist */}
        <Route path="/cart" element={
          <ProtectedRoutes>
            <Cart />
          </ProtectedRoutes>}
        />
        <Route path="/wishlist" element={
          <ProtectedRoutes>
            <WishList />
          </ProtectedRoutes>}
        />
        <Route path="/checkout" element={
          <ProtectedRoutes requireCart={true}>
            <Checkout />
          </ProtectedRoutes>}
        />
        <Route path="/user-coupons" element={
          <ProtectedRoutes requireCart={true}>
            <UserCoupons />
          </ProtectedRoutes>}
        />
        <Route path="/orders" element={
          <ProtectedRoutes>
            <OrderHistory />
          </ProtectedRoutes>}
        />
        <Route path="/address" element={
          <ProtectedRoutes>
            <Address />
          </ProtectedRoutes>}
        />

        {/* authentication */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>}
        />
        <Route path="/owner/register" element={
          <PublicRoute>
            <OwnerRegister />
          </PublicRoute>}
        />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>}
        />
        <Route path="/register/owner" element={
          <PublicRoute>
            <OwnerRegister />
          </PublicRoute>}
        />
        <Route path="/product/update/:id" element={
          <ProtectedRoutes>
            <AdminOwnerRoutes>
              <CreateProduct />
            </AdminOwnerRoutes>
          </ProtectedRoutes>}
        />
        <Route path="/owner/dashboard/products" element={
          <ProtectedRoutes>
            <OwnerRoutes>
              <AllProducts />
            </OwnerRoutes>
          </ProtectedRoutes>}
        />
        <Route path="/product/create" element={
          <ProtectedRoutes>
            <AdminOwnerRoutes>
              <CreateProduct />
            </AdminOwnerRoutes>
          </ProtectedRoutes>}
        />
        <Route path="/coupon/create" element={
          <ProtectedRoutes>
            <AdminOwnerRoutes>
              <CreateCoupon />
            </AdminOwnerRoutes>
          </ProtectedRoutes>}
        />

        <Route path="/email-verification/:token" element={<EmailVerification />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;