import React, { useEffect, useState, useContext } from "react";
import { assets } from "../../assets/assets.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";

const SpChatSidebar = ({ selectedUser, setSelectedUser }) => {
  const { backendUrl, socket, onlineUsers } = useContext(ShareContext); // Use context onlineUsers
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

  // REMOVED the local onlineUsers useEffect since we're using context

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

      {/* Customers List */}
      <div className="mt-4 space-y-2">
        {customers.map((customer) => {
          const isOnline = onlineUsers.includes(customer._id.toString()); // Now using context onlineUsers
          const unread = unreadCounts[customer._id] || 0;

          return (
            <div key={customer._id} onClick={() => { setSelectedUser(customer); setUnreadCounts(prev => ({ ...prev, [customer._id]: 0 })); }}
              className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                selectedUser?._id === customer._id ? "bg-yellow-500/10 border border-yellow-400/30" : "hover:bg-gray-100"
              }`}
            >
              <img src={customer?.image || assets.avatar_icon} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <div className="flex flex-col">
                <p className="text-gray-800 text-sm font-medium">{customer.name}</p>
                <span className="text-xs text-gray-500">{customer.email}</span>
                <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              {unread > 0 && <span className="absolute right-3 top-3 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">{unread}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpChatSidebar;