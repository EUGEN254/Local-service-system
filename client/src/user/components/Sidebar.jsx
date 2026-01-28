import React, { useContext } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  FaTachometerAlt, 
  FaServicestack, 
  FaBook, 
  FaDollarSign, 
  FaInbox,
  FaQuestionCircle, 
  FaCog, 
  FaSignOutAlt,
  FaHome,
  FaSearch,
  FaUsers
} from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const navLinks = (logoutUser, navigate) => ({
  menu: [
    { 
      name: "Dashboard", 
      icon: <FaTachometerAlt className="w-5 h-5" />, 
      path: "dashboard" 
    },
    { 
      name: "Browse Services", 
      icon: <FaServicestack className="w-5 h-5" />, 
      path: "browse-services" 
    },
    { 
      name: "My Bookings", 
      icon: <FaBook className="w-5 h-5" />, 
      path: "my-bookings" 
    },
    { 
      name: "Payments", 
      icon: <FaDollarSign className="w-5 h-5" />, 
      path: "payment" 
    },
    { 
      name: "Chat", 
      icon: <FaInbox className="w-5 h-5" />, 
      path: "chat" 
    },
    { 
      name: "All Providers", 
      icon: <FaUsers className="w-5 h-5" />, 
      path: "all-providers" 
    },
  ],
  other: [
    { 
      name: "Home", 
      icon: <FaHome className="w-5 h-5" />, 
      path: "/",
      onClick: () => navigate('/')
    },
    { 
      name: "Help & Support", 
      icon: <FaQuestionCircle className="w-5 h-5" />, 
      path: "help" 
    },
    { 
      name: "Settings", 
      icon: <FaCog className="w-5 h-5" />, 
      path: "settings" 
    },
    { 
      name: "Logout", 
      icon: <FaSignOutAlt className="w-5 h-5" />, 
      danger: true, 
      path: "/",
      onClick: () => {
        logoutUser();
        navigate('/');
      }
    },
  ],
});

const Sidebar = ({ onLinkClick }) => {
  const { logoutUser, totalUnread } = useContext(ShareContext);
  const location = useLocation();
  const navigate = useNavigate();
  const links = navLinks(logoutUser, navigate);

  // ✅ Check if user is currently on the chat page
  const isOnChatPage = location.pathname.includes('/chat');

  return (
    <div className="w-74 h-full bg-gray-900 text-white shadow-lg flex flex-col overflow-hidden">
      {/* Header - Matches Landing Page */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-900 font-bold text-lg">W</span>
          </div>
          <div>
            <div className="text-xl font-bold text-white">WorkLink</div>
            <div className="text-xs text-gray-400">Customer Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Main Menu */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Main Menu</p>
            <div className="flex-1 border-b border-gray-700"></div>
          </div>
          
          <ul className="space-y-1">
            {links.menu.map((link, index) => (
              <li key={index}>
                {link.path.startsWith('/') ? (
                  <button
                    onClick={() => {
                      navigate(link.path);
                      onLinkClick?.();
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors relative ${
                      location.pathname.includes(link.path)
                        ? "bg-white text-gray-900 font-semibold"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.name}</span>
                    {link.name === "Chat" && totalUnread > 0 && !isOnChatPage && (
                      <span className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-5 text-center">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={link.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative ${
                        isActive
                          ? "bg-white text-gray-900 font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                    end
                  >
                    {link.icon}
                    <span className="text-lg font-medium">{link.name}</span>
                    {link.name === "Chat" && totalUnread > 0 && !isOnChatPage && (
                      <span className="absolute right-3 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-5 text-center">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Other Menu */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Other</p>
            <div className="flex-1 border-b border-gray-700"></div>
          </div>
          
          <ul className="space-y-1">
            {links.other.map((link, index) => (
              <li key={index}>
                {link.onClick ? (
                  <button
                    onClick={() => {
                      link.onClick();
                      onLinkClick?.();
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${
                      link.danger
                        ? "text-red-400 hover:bg-red-900/20 hover:text-red-300"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.name}</span>
                  </button>
                ) : (
                  <NavLink
                    to={link.path}
                    onClick={onLinkClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white text-gray-900 font-semibold"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                    end
                  >
                    {link.icon}
                    <span className="text-sm font-medium">{link.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;