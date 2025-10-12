import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import BookingsAndTransaction from "./pages/BookingsAndTransaction";
import Analytics from "./pages/Analytics";
import Home from "./pages/Home";
import ServiceCategories from "./pages/ServiceCategories";
import ServiceProvider from "./pages/ServiceProvider";
import UserManagement from "./pages/UserManagement";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./componets/NotFound";

// ✅ Enhanced Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const adminUser = localStorage.getItem("adminUser");
  
  // Check both localStorage and if admin user data exists
  if (!isLoggedIn || !adminUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ✅ Public Route (redirect to admin if already logged in)
const PublicRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const adminUser = localStorage.getItem("adminUser");
  
  if (isLoggedIn && adminUser) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        {/* Public route - redirects to admin if already logged in */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          } 
        />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payment" element={<BookingsAndTransaction />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="service-categories" element={<ServiceCategories />} />
          <Route path="service-providers" element={<ServiceProvider />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;