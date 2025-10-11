// components/chat/ChatSidebar.jsx
import React, { useContext } from "react";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets.js";

const ChatSidebar = ({ selectedUser, setSelectedUser, services }) => {
  const { user, socket, onlineUsers, unreadBySender, markAsRead } = useContext(ShareContext);

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

  return (
    <div
      className={`bg-white h-full border-r border-gray-200 p-5 overflow-y-auto rounded-tl-2xl rounded-bl-2xl transition-all duration-300 
        ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <img src={assets.logo} alt="logo" className="w-28" />
          <img src={assets.menu_icon} alt="Menu" className="w-5 cursor-pointer" />
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

      {/* Services List */}
      <div className="mt-4 space-y-2">
        {services.map((service) => {
          const { serviceProvider } = service;
          const isOnline = onlineUsers.includes(serviceProvider._id);
          const unread = unreadBySender[serviceProvider._id] || 0;

          return (
            <div
              key={service._id}
              onClick={() => handleSelectUser(service)}
              className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition 
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

              <div className="flex flex-col">
                <p className="text-gray-800 text-sm font-medium">{serviceProvider.name}</p>
                <span className="text-xs text-gray-500">{serviceProvider.email}</span>
                <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* 🔴 Unread Badge - Now updates in real-time */}
              {unread > 0 && (
                <span className="absolute right-3 top-3 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                  {unread}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSidebar;