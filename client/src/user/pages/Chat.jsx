import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";

const Chat = () => {
  const location = useLocation();
  const { service } = location.state || {};
  const [selectedUser, setSelectedUser] = useState(false);

  // Store all clicked services
  const [servicesList, setServicesList] = useState(() => {
    const saved = localStorage.getItem("servicesList");
    return saved ? JSON.parse(saved) : [];
  });

  // Add new service if provider not already in list
  useEffect(() => {
    if (!service || !service.serviceProvider) return;

    setServicesList((prev) => {
      // Check if this provider already exists in the list
      const providerExists = prev.some(
        (s) => s.serviceProvider._id === service.serviceProvider._id
      );
      
      if (!providerExists) {
        const updated = [...prev, service];
        localStorage.setItem("servicesList", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [service]);

  // Remove service from list
  const removeService = (serviceId) => {
    setServicesList((prev) => {
      const updated = prev.filter((service) => service._id !== serviceId);
      
      // If removing the currently selected user, clear selection
      const removedService = prev.find(s => s._id === serviceId);
      if (removedService && selectedUser && selectedUser._id === removedService.serviceProvider._id) {
        setSelectedUser(false);
      }
      
      localStorage.setItem("servicesList", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all services
  const clearAllServices = () => {
    setServicesList([]);
    setSelectedUser(false);
    localStorage.removeItem("servicesList");
  };

  return (
    <div className="w-full h-[calc(100vh-6rem)] flex justify-center items-center bg-gray-100">
      <div
        className={`w-full h-full max-w-6xl mx-auto 
          bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden
          grid transition-all duration-300 ease-in-out
          ${
            selectedUser
              ? "md:grid-cols-[1fr_1.8fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
              : "md:grid-cols-[1fr_1.5fr]"
          }`}
      >
        {/* Left Chat Sidebar */}
        <ChatSidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          services={servicesList}
          onRemoveService={removeService}
          onClearAll={clearAllServices}
        />

        {/* Main Chat Container */}
        <ChatContainer
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />

        {/* Right Info Sidebar */}
        <RightSidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>
    </div>
  );
};

export default Chat;