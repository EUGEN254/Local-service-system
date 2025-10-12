// assets.js
import { FaClipboardList, FaCogs, FaDollarSign } from "react-icons/fa";
import avatar_icon from './avatar_icon.png'

export const assets = {
    avatar_icon,
}


// Service Providers
export const serviceProviders = [
  { id: 1, name: "John Doe", image: "https://randomuser.me/api/portraits/men/1.jpg", email: "john@example.com", phone: "123-456-7890" },
  { id: 2, name: "Jane Smith", image: "https://randomuser.me/api/portraits/women/2.jpg", email: "jane@example.com", phone: "987-654-3210" },
  { id: 3, name: "Bob Johnson", image: "https://randomuser.me/api/portraits/men/3.jpg", email: "bob@example.com", phone: "555-555-5555" },
  { id: 4, name: "Mike Ross", image: "https://randomuser.me/api/portraits/men/4.jpg", email: "mike@example.com", phone: "444-555-6666" },
  { id: 5, name: "Emma Watson", image: "https://randomuser.me/api/portraits/women/5.jpg", email: "emma@example.com", phone: "333-222-1111" },
];

// Users
export const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "123-456-7890", role: "Admin", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", phone: "987-654-3210", role: "User", status: "Inactive" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", phone: "555-555-5555", role: "User", status: "Active" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", phone: "444-555-7777", role: "User", status: "Active" },
  { id: 5, name: "Peter Parker", email: "peter@example.com", phone: "333-444-5555", role: "User", status: "Active" },
];

// Notifications
export const notifications = [
  { id: 1, type: "User", message: "New user Alice Johnson registered.", date: "2025-10-05 09:30 AM", read: false },
  { id: 2, type: "Service Provider", message: "Service Provider Bob Smith added a new service.", date: "2025-10-05 10:15 AM", read: false },
  { id: 3, type: "Booking", message: "New booking received for Service X.", date: "2025-10-05 11:00 AM", read: true },
  { id: 4, type: "Transaction", message: "Payment of $150 completed successfully.", date: "2025-10-05 11:30 AM", read: false },
  { id: 5, type: "Booking", message: "Booking #123 cancelled by user.", date: "2025-10-05 12:00 PM", read: true },
];

// Bookings
export const bookings = [
  { id: 1, user: "Alice Johnson", service: "House Cleaning", date: "2025-10-05", time: "10:00 AM", status: "Confirmed" },
  { id: 2, user: "Bob Smith", service: "Plumbing", date: "2025-10-06", time: "2:00 PM", status: "Pending" },
  { id: 3, user: "Charlie Brown", service: "Gardening", date: "2025-10-07", time: "11:30 AM", status: "Cancelled" },
];

// Transactions
export const transactions = [
  { id: 1, user: "Alice Johnson", amount: 150, status: "Paid", date: "2025-10-05 10:15 AM", method: "Credit Card" },
  { id: 2, user: "Bob Smith", amount: 200, status: "Pending", date: "2025-10-06 2:30 PM", method: "Cash" },
  { id: 3, user: "Charlie Brown", amount: 100, status: "Failed", date: "2025-10-07 12:00 PM", method: "PayPal" },
];

// Monthly Status Data
export const monthlyStatusData = [
  { month: "Jan", Completed: 10, Cancelled: 2 },
  { month: "Feb", Completed: 15, Cancelled: 5 },
  { month: "Mar", Completed: 20, Cancelled: 3 },
  { month: "Apr", Completed: 12, Cancelled: 4 },
  { month: "May", Completed: 18, Cancelled: 6 },
  { month: "Jun", Completed: 25, Cancelled: 5 },
  { month: "Jul", Completed: 25, Cancelled: 5 },
  { month: "Aug", Completed: 25, Cancelled: 5 },
  { month: "Sep", Completed: 25, Cancelled: 5 },
  { month: "Oct", Completed: 25, Cancelled: 5 },
  { month: "Nov", Completed: 25, Cancelled: 5 },
  { month: "Dec", Completed: 25, Cancelled: 5 },
];

// Upcoming Requests
export const upcomingRequests = [
  { no: 1, service: "Plumbing", status: "Completed", payment: "Paid", location: "New York", date: "2025-10-05" },
  { no: 2, service: "Electrical", status: "Cancelled", payment: "Cash", location: "Los Angeles", date: "2025-10-06" },
  { no: 3, service: "Cleaning", status: "Pending", payment: "Not Paid", location: "Chicago", date: "2025-10-07" },
  { no: 4, service: "Painting", status: "Pending", payment: "Not Paid", location: "Miami", date: "2025-10-08" },
  { no: 5, service: "Gardening", status: "Pending", payment: "Not Paid", location: "Boston", date: "2025-10-09" },
];

// Summary Cards
export const summaryCards = [
  { title: "New Job Requests", count: 12, icon: FaClipboardList, bgColor: "bg-blue-500" },
  { title: "Active Services", count: 7, icon: FaCogs, bgColor: "bg-green-500" },
  { title: "Earnings", count: "$3,250", icon: FaDollarSign, bgColor: "bg-yellow-500" },
];
