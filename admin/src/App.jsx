import React, { useContext } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import BookingsAndTransaction from "./pages/BookingsAndTransaction";
import Analytics from "./pages/Analytics";
import Home from "./pages/Home";
import NotFound from "../../client/src/sharedcomponent/NotFound";
import ServiceCategories from "./pages/ServiceCategories";
import ServiceProvider from "./pages/ServiceProvider";
import UserManagement from "./pages/UserManagement";

const App = () => {
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
        {/* Home route with nested routes for sidebar/navbar layout */}
        <Route path="/" element={<Home />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payment" element={<BookingsAndTransaction />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="service-categories" element={<ServiceCategories />} />
          <Route path="service-providers" element={<ServiceProvider />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>

        {/* Global catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;