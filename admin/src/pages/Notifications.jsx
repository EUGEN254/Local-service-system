import React, { useState } from "react";
import { notifications as initialNotifications } from "../assets/assets";
import { FaCheckCircle } from "react-icons/fa";

const categories = ["All", "User", "Service Provider", "Booking", "Transaction"];

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeCategory, setActiveCategory] = useState("All");

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications =
    activeCategory === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeCategory);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <button
          onClick={markAllAsRead}
          className="text-sm text-blue-500 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-96 scrollbar-thin">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No notifications found.
          </div>
        ) : (
          <ul>
            {filteredNotifications.map((n) => (
              <li
                key={n.id}
                className={`p-4 border-b last:border-b-0 flex justify-between items-center hover:bg-gray-50 transition-colors ${
                  n.read ? "bg-white" : "bg-yellow-50"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-gray-500">
                    {n.type}
                  </span>
                  <p className="text-sm text-gray-700">{n.message}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{n.date}</span>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1"
                    >
                      <FaCheckCircle /> Mark as read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
