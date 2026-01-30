/**
 * Common Admin Utilities
 * Centralized utility functions
 */

export const truncateText = (text, length = 50) => {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "..." : text;
};

export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const formatCurrency = (amount, currency = "KSh") => {
  if (!amount) return `${currency} 0`;
  const formatted = parseFloat(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const sortByDate = (items, dateField = "createdAt", order = "desc") => {
  const sorted = [...items].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
  return sorted;
};

export const filterByStatus = (items, status, statusField = "status") => {
  if (!status) return items;
  return items.filter((item) => item[statusField]?.toLowerCase() === status.toLowerCase());
};

export const searchInArray = (items, query, fields = ["name", "email"]) => {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) =>
      item[field]?.toString().toLowerCase().includes(lowerQuery)
    )
  );
};
