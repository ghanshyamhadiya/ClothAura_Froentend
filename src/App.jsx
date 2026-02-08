// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import AuthModal from "./components/auth/AuthModel";
import ToastWrapper from "./components/common/ToastWrapper";

// Pages & Components
import ProductDetails from "./pages/ProductDetails";
import WishList from "./components/cartWishlist/WishList";
import OrderDashboard from "./pages/OrderDashboard";
import Checkout from "./components/checkOut/Checkout";
import UserCoupons from "./components/checkOut/UserCoupon";
import OrderHistory from "./components/checkOut/OrderHistory";
import Address from "./components/checkOut/Address";

import CreateProduct from "./pages/CreateProduct";
import AllProducts from "./components/admin/AllProducts";
import CreateCoupon from "./components/admin/CreateCoupon";

import EmailVerification from "./components/EmailVerification";
import NotFoundPage from "./components/common/NotFoundPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DashboardPage from "./pages/DashboardPage";
import OwnerDashboard from "./pages/OwnerDashboard";

// Route Guards
import { useAuth } from "./context/AuthContext";
import { toastService } from "./services/toastService";
import { cartService } from "./services/cartService";
import Loading from "./components/Loading";
import AllProduct from "./pages/AllProducts";
import Cart from "./pages/Cart";

const ProtectedRoutes = ({ children, requireCart = false }) => {
  const { isAuthenticated, loading, hasChecked } = useAuth();

  if (loading && !hasChecked) return <Loading />;

  if (!isAuthenticated) {
    // Open login modal instead of navigating to /login
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
    }, 100);
    return <Navigate to="/" replace />;
  }

  if (requireCart && cartService.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return children;
};

const OwnerRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
    }, 100);
    return <Navigate to="/" replace />;
  }

  if (!user || user.role !== "owner") {
    toastService.error("Access denied. Owners only.");
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
    }, 100);
    return <Navigate to="/" replace />;
  }

  if (!user || user.role !== "admin") {
    toastService.error("Access denied. Admins only.");
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminOwnerRoutes = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
    }, 100);
    return <Navigate to="/" replace />;
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    toastService.error("Access denied. Admins or Owners only.");
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, hasChecked } = useAuth();
  if (loading && !hasChecked) return <Loading />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <AuthModal />
      <ToastWrapper />

      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AllProduct />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoutes>
                <Cart />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoutes>
                <WishList />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoutes requireCart={true}>
                <Checkout />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/user-coupons"
            element={
              <ProtectedRoutes>
                <UserCoupons />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoutes>
                <OrderHistory />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/address"
            element={
              <ProtectedRoutes>
                <Address />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoutes>
                <NotificationsPage />
              </ProtectedRoutes>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <AnalyticsPage />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <DashboardPage />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <OrderDashboard />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <OwnerDashboard />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />

          {/* Admin / Owner */}
          <Route
            path="/manage/dashboard/products"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <AllProducts />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />
          <Route
            path="/product/create"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <CreateProduct />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />
          <Route
            path="/product/update/:id"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <CreateProduct />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />
          <Route
            path="/coupon/create"
            element={
              <ProtectedRoutes>
                <AdminOwnerRoutes>
                  <CreateCoupon />
                </AdminOwnerRoutes>
              </ProtectedRoutes>
            }
          />
        </Route>

        <Route path="/email-verification/:token" element={<EmailVerification />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;