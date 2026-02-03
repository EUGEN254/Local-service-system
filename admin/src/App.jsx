import React, { useContext, useEffect, useState } from "react";
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
import NotFound from "./components/NotFound";
import { Toaster } from "./components/Sonner";
import { useAdmin } from "./context/AdminContext";

// Enhanced Protected Route Wrapper — uses in-memory `admin` state
const ProtectedRoute = ({ children, admin }) => {
  if (!admin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Public Route (redirect to admin if already logged in)
const PublicRoute = ({ children, admin }) => {
  if (admin) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const App = () => {
  const { admin, authLoading } = useAdmin();

  if (authLoading) {
    return null;
  }

  return (
    <>
      <Toaster />

      <Routes>
        {/* Public route - redirects to admin if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute admin={admin}>
              <AdminLogin />
            </PublicRoute>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute admin={admin}>
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
