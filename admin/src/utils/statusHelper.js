/**
 * Status Badge Helper
 * Returns appropriate styling for status badges
 */

export const getStatusColor = (status) => {
  const statusColors = {
    // Booking statuses
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    "in progress": "bg-purple-100 text-purple-800",
    "waiting for work": "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",

    // Payment statuses
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-red-100 text-red-800",
    pending_payment: "bg-yellow-100 text-yellow-800",

    // User statuses
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
    banned: "bg-red-100 text-red-800",

    // Provider statuses
    verified: "bg-green-100 text-green-800",
    unverified: "bg-yellow-100 text-yellow-800",
  };

  return statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

export const getStatusBadgeClass = (status) => {
  const baseClass = "px-3 py-1 rounded-full text-xs font-medium";
  const colorClass = getStatusColor(status);
  return `${baseClass} ${colorClass}`;
};

export const capitalizeStatus = (status) => {
  return status
    .split(/(?=[A-Z])|_/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
