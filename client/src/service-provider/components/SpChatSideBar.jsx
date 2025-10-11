import React, { useEffect, useState, useContext } from "react";
import { assets } from "../../assets/assets.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";

const SpChatSidebar = ({ selectedUser, setSelectedUser }) => {
  const { backendUrl, socket, onlineUsers } = useContext(ShareContext);
  const [customers, setCustomers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/chat/my-customers`, {
          withCredentials: true,
        });
        if (data.success) setCustomers(data.customers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [backendUrl]);

  // Fetch unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/chat/unread-count`, {
          withCredentials: true,
        });
        if (data.success) {
          const counts = {};
          data.unreadCounts.forEach((u) => (counts[u._id] = u.count));
          setUnreadCounts(counts);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setSelectedUser(customer);
    // Clear unread count for this customer when selected
    setUnreadCounts(prev => ({ ...prev, [customer._id]: 0 }));
    
    // You might also want to mark messages as read in the backend
    markMessagesAsRead(customer._id);
  };

  // Mark messages as read in backend
  const markMessagesAsRead = async (customerId) => {
    try {
      await axios.post(`${backendUrl}/api/chat/mark-read`, 
        { senderId: customerId },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading customers...</div>;
  if (customers.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">No active customers yet</div>;

  return (
    <div className={`bg-white h-full border-r border-gray-200 p-5 overflow-y-auto rounded-tl-2xl rounded-bl-2xl transition-all duration-300 ${selectedUser ? "max-md:hidden" : ""}`}>
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <img src={assets.logo} alt="logo" className="w-28" />
          <img src={assets.menu_icon} alt="Menu" className="w-5 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
          <img src={assets.search_icon} alt="search" className="w-4 opacity-60" />
          <input type="text" className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500 flex-1" placeholder="Search customers..." />
        </div>
      </div>

      {/* Customers Count */}
      <div className="flex justify-between items-center mt-4 mb-2">
        <span className="text-sm text-gray-600 font-medium">
          Customers ({customers.length})
        </span>
      </div>

      {/* Customers List */}
      <div className="mt-2 space-y-2">
        {customers.map((customer) => {
          const isOnline = onlineUsers.includes(customer._id.toString());
          const unread = unreadCounts[customer._id] || 0;
          
          // ✅ KEY CHANGE: Only show unread count if this is NOT the selected customer
          const showUnreadBadge = unread > 0 && selectedUser?._id !== customer._id;

          return (
            <div 
              key={customer._id} 
              onClick={() => handleSelectCustomer(customer)}
              className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                selectedUser?._id === customer._id 
                  ? "bg-yellow-500/10 border border-yellow-400/30" 
                  : "hover:bg-gray-100"
              }`}
            >
              <img 
                src={customer?.image || assets.avatar_icon} 
                alt={customer.name} 
                className="w-10 h-10 rounded-full object-cover border border-gray-200" 
              />
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-gray-800 text-sm font-medium truncate">{customer.name}</p>
                <span className="text-xs text-gray-500 truncate">{customer.email}</span>
                <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              
              {/* 🔴 Unread Badge - Only show when NOT the selected customer */}
              {showUnreadBadge && (
                <span className="absolute right-3 top-3 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-5 text-center">
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

export default SpChatSidebar;