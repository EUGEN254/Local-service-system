// components/chat/ChatSidebar.jsx
import React, { useContext, useState, useMemo } from "react";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets.js";

const ChatSidebar = ({ 
  selectedUser, 
  setSelectedUser, 
  services = [], // Provide default value
  onRemoveService,
  onClearAll 
}) => {
  const { user, socket, onlineUsers, unreadBySender, markChatAsRead } = useContext(ShareContext);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter services based on search term - ALWAYS call useMemo
  const filteredServices = useMemo(() => {
    if (!services || services.length === 0) return [];
    
    if (!searchTerm.trim()) return services;

    const term = searchTerm.toLowerCase().trim();
    return services.filter(service => {
      const { serviceProvider } = service;
      return (
        serviceProvider?.name?.toLowerCase().includes(term) ||
        serviceProvider?.email?.toLowerCase().includes(term) ||
        service?.serviceName?.toLowerCase().includes(term)
      );
    });
  }, [services, searchTerm]);

  // Move the conditional return AFTER all hooks
  if (!services || services.length === 0) {
    return (
      <div className="bg-white h-full border-r border-gray-200 p-5 rounded-tl-2xl rounded-bl-2xl flex items-center justify-center">
        <div className="text-center">
          <img 
            src={assets.search_icon} 
            alt="No conversations" 
            className="w-16 h-16 opacity-30 mx-auto mb-3"
          />
          <p className="text-gray-400 text-sm">No conversations yet</p>
          <p className="text-gray-400 text-xs mt-1">Your service providers will appear here</p>
        </div>
      </div>
    );
  }

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
    markChatAsRead(serviceProvider._id);
  };

  const handleRemoveService = (e, serviceId) => {
    e.stopPropagation(); // Prevent triggering the select user
    
    // Find the service being removed to get the serviceProvider ID
    const serviceToRemove = services.find(service => service._id === serviceId);
    
    //Mark messages as read before removing the service
    if (serviceToRemove && serviceToRemove.serviceProvider) {
      markChatAsRead(serviceToRemove.serviceProvider._id);
    }
    
    onRemoveService(serviceId);
  };

  const handleClearAll = () => {
    if (services.length > 0) {
      // ✅ Mark ALL conversations as read before clearing
      services.forEach(service => {
        const { serviceProvider } = service;
        if (serviceProvider && serviceProvider._id) {
          markChatAsRead(serviceProvider._id);
        }
      });
      setShowConfirmClear(true);
    }
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowConfirmClear(false);
    setSearchTerm(""); // Clear search when clearing all
    setSelectedUser(null); // Clear selected user
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
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

        {/* Search Bar */}
        <div className="relative flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
          <img src={assets.search_icon} alt="search" className="w-4 opacity-60" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 flex-1"
            placeholder="Search services or providers..."
          />
          {/* Clear search button */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Services Count */}
      <div className="flex justify-between items-center mt-4 mb-2">
        <span className="text-sm text-gray-600 font-medium">
          Conversations ({filteredServices.length})
          {searchTerm && (
            <span className="text-xs text-gray-400 ml-1">
              (of {services.length})
            </span>
          )}
        </span>
        {searchTerm && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Searching: "{searchTerm}"
          </span>
        )}
      </div>

      {/* Services List */}
      <div className="mt-2 space-y-2">
        {filteredServices.length === 0 ? (
          <div className="text-center py-8">
            <img 
              src={assets.search_icon} 
              alt="No results" 
              className="w-12 h-12 opacity-30 mx-auto mb-3"
            />
            <p className="text-sm text-gray-400">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                Try searching by name, email, or service
              </p>
            )}
          </div>
        ) : (
          filteredServices.map((service) => {
            const { serviceProvider } = service;
            const isOnline = onlineUsers.includes(serviceProvider._id);
            const unread = unreadBySender[serviceProvider._id] || 0;
            
            // ✅ Only show unread count if this is NOT the selected user
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
                  src={serviceProvider.image || assets.avatar_icon}
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
          })
        )}
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