// serviceprovider/Notification.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { fetchCustomerDetails } from "../../services/landingPageService";
import {
  FaBell,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUser,
  FaClock,
} from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const Notification = () => {
  const { 
    backendUrl, 
    bookingNotifications, 
    unreadBookingCount,
    markBookingNotificationAsRead,
    markAllBookingNotificationsAsRead,
    fetchBookingNotifications,
    user
  } = useContext(ShareContext);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'customer' or 'schedule'
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  
  const buttonRefs = useRef({});

  useEffect(() => {
    fetchBookingNotifications();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalOpen && !event.target.closest(".notification-modal")) {
        setModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalOpen]);

  // Format date with time (for received timestamp)
  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  // Format date only (for service date) - UPDATED
  const formatDateOnly = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const formatScheduleDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const handleMarkAsRead = async (notificationId) => {
    await markBookingNotificationAsRead(notificationId);
  };

  const handleViewCustomer = async (notification, index) => {
    try {
      if (!notification?.customerId) {
        // No customer ID available
        return;
      }

      const data = await fetchCustomerDetails(backendUrl, notification.customerId);

      if (data.success) {
        setSelectedCustomer(data.customer);
        setModalType('customer');
        
        // Improved positioning logic for mobile
        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Calculate modal position with mobile consideration
          let top = rect.top + scrollTop - 10;
          let right = viewportWidth - rect.right;
          
          // Ensure modal stays within viewport on mobile
          if (viewportWidth < 768) { // Mobile screens
            // Center the modal horizontally on mobile
            right = Math.max(10, (viewportWidth - 320) / 2); // 320 is modal width
            // Adjust top position to ensure modal is visible
            top = Math.min(top, viewportHeight - 300); // Prevent modal from going off bottom
          }
          
          setModalPosition({ top, right });
        }

        setModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
    }
  };

  const handleViewSchedule = (notification, index) => {
    setSelectedSchedule(notification);
    setModalType('schedule');
    
    // Improved positioning logic for mobile
    const button = buttonRefs.current[`schedule-${index}`];
    if (button) {
      const rect = button.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate modal position with mobile consideration
      let top = rect.top + scrollTop - 10;
      let right = viewportWidth - rect.right;
      
      // Ensure modal stays within viewport on mobile
      if (viewportWidth < 768) { // Mobile screens
        // Center the modal horizontally on mobile
        right = Math.max(10, (viewportWidth - 320) / 2); // 320 is modal width
        // Adjust top position to ensure modal is visible
        top = Math.min(top, viewportHeight - 300); // Prevent modal from going off bottom
      }
      
      setModalPosition({ top, right });
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
    setSelectedSchedule(null);
    setModalType('');
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      "Pending": { color: "bg-yellow-100 text-yellow-800", icon: FaTimesCircle },
      "Waiting for Work": { color: "bg-green-100 text-green-800", icon: FaCheckCircle },
      "Payment Failed": { color: "bg-red-100 text-red-800", icon: FaTimesCircle },
      "Completed": { color: "bg-blue-100 text-blue-800", icon: FaCheckCircle },
      "In Progress": { color: "bg-purple-100 text-purple-800", icon: FaCheckCircle }
    };
  
    const config = statusConfig[status] || statusConfig["Pending"];
    const IconComponent = config.icon;
  
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="mr-1 h-3 w-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="py-12 px-4 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* Fixed Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Booking Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadBookingCount > 0 
              ? `${unreadBookingCount} unread notification${unreadBookingCount !== 1 ? 's' : ''}`
              : "All caught up!"
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">
            User: {user?.name} | Role: {user?.role} | Total Notifications: {bookingNotifications.length}
          </p>
        </div>
        
        {unreadBookingCount > 0 && (
          <button
            onClick={markAllBookingNotificationsAsRead}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        {bookingNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FaBell className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
            <p className="text-gray-400">New bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {bookingNotifications.map((notification, index) => (
              <div
                key={notification._id || index}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  notification.read ? "border-gray-300" : "border-yellow-500 bg-blue-50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">
                        New Booking: {notification.serviceName}
                      </h3>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <FaEye className="mr-1" />
                          Mark as read
                        </button>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mt-1">
                      From: <span className="font-medium">{notification.customerName}</span>
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      {/* UPDATED: Show only date for service date */}
                      Service Date: {formatDateOnly(notification.delivery_date)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" />
                      Location: {notification.city}, {notification.address}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Amount: KES {notification.amount}
                    </p>
                    <StatusBadge status={notification.status} />
                    {/* Keep time for received timestamp */}
                    <p className="text-xs text-gray-500">
                      Received: {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    ref={el => buttonRefs.current[index] = el}
                    onClick={() => handleViewCustomer(notification, index)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <FaUser className="text-sm" />
                    View Customer
                  </button>
                  <button
                    ref={el => buttonRefs.current[`schedule-${index}`] = el}
                    onClick={() => handleViewSchedule(notification, index)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <FaClock className="text-sm" />
                    View Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Modal - IMPROVED FOR MOBILE */}
      {modalOpen && modalType === 'customer' && selectedCustomer && (
        <div
          className="notification-modal fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 w-80 max-w-[90vw] p-4 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: "translateY(-100%)",
          }}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
            Customer Details
          </h2>

          {/* Customer info */}
          <div className="space-y-2 text-gray-700 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Name:</span>
              <span>{selectedCustomer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Email:</span>
              <span className="text-right break-all ml-2">
                {selectedCustomer.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Phone:</span>
              <span>{selectedCustomer.phone || 'Not provided'}</span>
            </div>
          </div>

          {/* Close button at bottom */}
          <div className="flex justify-end mt-3 pt-2 border-t">
            <button
              onClick={closeModal}
              className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal - IMPROVED FOR MOBILE */}
      {modalOpen && modalType === 'schedule' && selectedSchedule && (
        <div
          className="notification-modal fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 w-80 max-w-[90vw] p-4 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: "translateY(-100%)",
          }}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
            Schedule Details
          </h2>

          {/* Schedule info */}
          <div className="space-y-3 text-gray-700 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-blue-600 text-lg" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Service Date</p>
                <p className="font-semibold text-gray-800">
                  {formatScheduleDate(selectedSchedule.delivery_date)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Service:</span>
                <span>{selectedSchedule.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Customer:</span>
                <span>{selectedSchedule.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Location:</span>
                <span className="text-right">
                  {selectedSchedule.city}, {selectedSchedule.address}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Amount:</span>
                <span>KES {selectedSchedule.amount}</span>
              </div>
            </div>

            <div className="pt-2">
              <StatusBadge status={selectedSchedule.status} />
            </div>
          </div>

          {/* Close button at bottom */}
          <div className="flex justify-end mt-3 pt-2 border-t">
            <button
              onClick={closeModal}
              className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom Scrollbar and Animation Styless */}
      <style>
        {`
          /* Custom scrollbar styling */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          
          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #c1c1c1 #f1f1f1;
          }
          
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px) translateY(-100%);
            }
            to {
              opacity: 1;
              transform: translateY(0) translateY(-100%);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default Notification;