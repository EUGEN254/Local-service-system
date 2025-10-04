// src/App.jsx
import React, { useContext } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Context
import { ShareContext } from "./sharedcontext/SharedContext";

// Components
import LandingPage from "./sharedcomponent/LandingPage";
import LoginSignUp from "./sharedcomponent/LoginSignUp";
import NotFound from "./sharedcomponent/NotFound";

// Service Provider
import SPDashboard from "./service-provider/pages/Dashboard";
import SPMyServices from "./service-provider/pages/Myservices";
import SPHelp from "./service-provider/pages/Help";
import SPInbox from "./service-provider/pages/Inbox";
import SPSettings from "./service-provider/pages/Settings";
import SPAnalytics from "./service-provider/pages/Analytics";
import SPEarnings from "./service-provider/pages/Earnings";
import SPHomeLayout from "./service-provider/pages/Home";

// User
import UserDashboard from "./user/pages/Dashboard";
import UserProfile from "./user/pages/Profile";
import UserSettings from "./user/pages/Settings";
import UserHelp from "./user/pages/Help";
import MyBookings from "./user/pages/MyBookings";
import Payments from "./user/pages/Payments";
import Notification from "./user/pages/Notification";
import BrowseServices from "./user/pages/BrowseServices";
import UserHomeLayout from "./user/pages/Home";

const App = () => {
  const { user, authLoading } = useContext(ShareContext);
  const location = useLocation();
  const role = user?.role;


  // Control preloader visibility based on auth loading state
  React.useEffect(() => {
    const preloader = document.getElementById("preloader");
    
    if (authLoading) {
      if (preloader) {
        preloader.style.display = "flex";
        preloader.style.opacity = "1";
        preloader.style.visibility = "visible";
      }
    } else {
      if (preloader) {
        preloader.style.opacity = "0";
        setTimeout(() => {
          preloader.style.display = "none";
          preloader.style.visibility = "hidden";
        }, 500);
      }
    }
  }, [authLoading]);

  // Show nothing while loading OR while user state is undefined (during transitions)
  if (authLoading || user === undefined) {
    return null;
  }


  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        {/* Public routes - exact paths */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/auth" 
          element={
            user ? ( // user is truthy object (logged in)
              <Navigate 
                to={role === "service-provider" ? "/sp/dashboard" : "/user/dashboard"} 
                replace 
              />
            ) : ( // user is null (not logged in)
              <LoginSignUp />
            )
          } 
        />

        {/* Protected routes - Service Provider */}
        <Route 
          path="/sp" 
          element={
            user && role === "service-provider" ? (
              <SPHomeLayout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route index element={<SPDashboard />} />
          <Route path="dashboard" element={<SPDashboard />} />
          <Route path="my-services" element={<SPMyServices />} />
          <Route path="help" element={<SPHelp />} />
          <Route path="inbox" element={<SPInbox />} />
          <Route path="settings" element={<SPSettings />} />
          <Route path="analytics" element={<SPAnalytics />} />
          <Route path="earnings" element={<SPEarnings />} />
        </Route>

        {/* Protected routes - Customer */}
        <Route 
          path="/user" 
          element={
            user && role === "customer" ? (
              <UserHomeLayout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="help" element={<UserHelp />} />
          <Route path="browse-services" element={<BrowseServices />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="payment" element={<Payments />} />
          <Route path="notifications" element={<Notification />} />
        </Route>

        {/* Catch-all for nested protected routes */}
        <Route path="/sp/*" element={<Navigate to="/" replace />} />
        <Route path="/user/*" element={<Navigate to="/" replace />} />

        {/* Global catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;