// components/chat/ChatSidebar.jsx
import React, { useContext, useState } from "react";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets.js";

const ChatSidebar = ({ 
  selectedUser, 
  setSelectedUser, 
  services, 
  onRemoveService,
  onClearAll 
}) => {
  const { user, socket, onlineUsers, unreadBySender, markAsRead } = useContext(ShareContext);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!services || services.length === 0) return null;

  const handleSelectUser = (service) => {
    const { serviceProvider } = service;
    setSelectedUser(serviceProvider);

    const roomId = [user._id, serviceProvider._id].sort().join("_");

    if (socket.current) {
      socket.current.emit("joinUserRoom", {
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        roomProvider: serviceProvider.name,
        serviceName: service.serviceName,
        roomId,
      });
    }

    // ✅ Mark messages as read when selecting the user
    markAsRead(serviceProvider._id);
  };

  const handleRemoveService = (e, serviceId) => {
    e.stopPropagation(); // Prevent triggering the select user
    onRemoveService(serviceId);
  };

  const handleClearAll = () => {
    if (services.length > 0) {
      setShowConfirmClear(true);
    }
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowConfirmClear(false);
  };

  return (
    <div
      className={`bg-white h-full border-r border-gray-200 p-5 overflow-y-auto rounded-tl-2xl rounded-bl-2xl transition-all duration-300 
        ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <img src={assets.logo} alt="logo" className="w-28" />
          <div className="flex items-center gap-2">
            {services.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
              >
                Clear All
              </button>
            )}
            <img src={assets.menu_icon} alt="Menu" className="w-5 cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
          <img src={assets.search_icon} alt="search" className="w-4 opacity-60" />
          <input
            type="text"
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 flex-1"
            placeholder="Search services..."
          />
        </div>
      </div>

      {/* Services Count */}
      <div className="flex justify-between items-center mt-4 mb-2">
        <span className="text-sm text-gray-600 font-medium">
          Conversations ({services.length})
        </span>
      </div>

      {/* Services List */}
      <div className="mt-2 space-y-2">
        {services.map((service) => {
          const { serviceProvider } = service;
          const isOnline = onlineUsers.includes(serviceProvider._id);
          const unread = unreadBySender[serviceProvider._id] || 0;
          
          // ✅ KEY CHANGE: Only show unread count if this is NOT the selected user
          const showUnreadBadge = unread > 0 && selectedUser?._id !== serviceProvider._id;

          return (
            <div
              key={service._id}
              onClick={() => handleSelectUser(service)}
              className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group
                ${
                  selectedUser?._id === serviceProvider._id
                    ? "bg-yellow-500/10 border border-yellow-400/30"
                    : "hover:bg-gray-100"
                }`}
            >
              <img
                src={serviceProvider?.image || assets.avatar_icon}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-gray-800 text-sm font-medium truncate">
                    {serviceProvider.name}
                  </p>
                  <button
                    onClick={(e) => handleRemoveService(e, service._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200 ml-2 p-1 rounded-full hover:bg-red-50"
                  >
                    ×
                  </button>
                </div>
                <span className="text-xs text-gray-500 truncate">{serviceProvider.email}</span>
                <span className="text-xs text-gray-500">Service: {service.serviceName}</span>
                <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* 🔴 Unread Badge - Only show when NOT the selected user */}
              {showUnreadBadge && (
                <span className="absolute right-3 top-3 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-5 text-center">
                  {unread}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear All Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear All Conversations?</h3>
            <p className="text-gray-600 mb-4">
              This will remove all service providers from your chat list. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;