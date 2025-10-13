import React, { useContext, useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShareContext } from "../../sharedcontext/SharedContext";
import axios from "axios";
import { HiClipboardList, HiCog, HiXCircle } from "react-icons/hi";

const Dashboard = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [chartData, setChartData] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const buttonRefs = useRef({});

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/serviceprovider/mybookings`,
          { withCredentials: true }
        );
        if (data.success) setBookings(data.bookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [backendUrl]);

  // Fetch customer details for modal and position it
  const handleViewCustomer = async (booking, index) => {
    try {
      if (!booking?.customer) return;

      // Ensure you get the ID string, not the object
      const customerId =
        typeof booking.customer === "object"
          ? booking.customer._id
          : booking.customer;

      const { data } = await axios.get(
        `${backendUrl}/api/serviceprovider/customer/${customerId}`,
        { withCredentials: true }
      );

      if (data.success) {
        setSelectedCustomer(data.customer);

        // Positioning logic...
        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;
          const viewportWidth = window.innerWidth;
          setModalPosition({
            top: rect.top + scrollTop - 10,
            right: viewportWidth - rect.right - scrollLeft,
          });
        }

        setModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
    }
  };

  // Update booking status
  const handleStatusUpdate = async (bookingId) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/serviceprovider/booking/${bookingId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (data.success) {
        // Update local state
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId ? { ...booking, status: newStatus } : booking
          )
        );
        setEditingStatus(null);
        setNewStatus("");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  // Start editing status
  const startEditingStatus = (bookingId, currentStatus) => {
    setEditingStatus(bookingId);
    setNewStatus(currentStatus);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingStatus(null);
    setNewStatus("");
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalOpen && !event.target.closest(".customer-modal")) {
        setModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalOpen]);

  // Compute chart data - NOW USING ACTUAL STATUS FROM DATABASE
  const computeChartData = (bookings, timeFilter) => {
    const grouped = {};

    bookings.forEach((b) => {
      const localDate = new Date(b.delivery_date);
      let key, displayLabel;

      if (timeFilter === "Daily") {
        key = localDate.toISOString().split("T")[0];
        displayLabel = localDate.toLocaleDateString();
      } else if (timeFilter === "Weekly") {
        const weekStart = new Date(localDate);
        weekStart.setDate(localDate.getDate() - localDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        key = weekStart.toISOString().split("T")[0];
        const options = { month: "short", day: "numeric" };
        displayLabel = `${weekStart.toLocaleDateString(
          undefined,
          options
        )} - ${weekEnd.toLocaleDateString(undefined, options)}`;
      } else if (timeFilter === "Monthly") {
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        key = `${year}-${month}`;
        displayLabel = localDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      }

      if (!grouped[key])
        grouped[key] = {
          Completed: 0,
          Pending: 0,
          "Waiting for Work": 0,
          "In Progress": 0, // ✅ Added In Progress
          Cancelled: 0,
          label: displayLabel,
        };

      // Use actual status from database
      if (b.status === "Completed") grouped[key].Completed += 1;
      else if (b.status === "Pending") grouped[key].Pending += 1;
      else if (b.status === "Waiting for Work") grouped[key]["Waiting for Work"] += 1;
      else if (b.status === "In Progress") grouped[key]["In Progress"] += 1; // ✅ Added In Progress counting
      else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        period: grouped[key].label,
        Completed: grouped[key].Completed,
        Pending: grouped[key].Pending,
        "Waiting for Work": grouped[key]["Waiting for Work"],
        "In Progress": grouped[key]["In Progress"], // ✅ Added In Progress
        Cancelled: grouped[key].Cancelled,
      }));
  };

  useEffect(() => {
    setChartData(computeChartData(bookings, timeFilter));
  }, [bookings, timeFilter]);

  // Summary cards - USING ACTUAL STATUS FROM DATABASE
  useEffect(() => {
    setSummaryCards([
      {
        title: "Pending Jobs",
        count: bookings.filter((b) => b.status === "Pending").length,
        bgColor: "bg-yellow-500",
        icon: HiClipboardList,
      },
      {
        title: "Waiting for Work",
        count: bookings.filter((b) => b.status === "Waiting for Work").length,
        bgColor: "bg-blue-500",
        icon: HiCog,
      },
      {
        title: "In Progress", // ✅ Added In Progress card
        count: bookings.filter((b) => b.status === "In Progress").length,
        bgColor: "bg-purple-500",
        icon: HiCog,
      },
      {
        title: "Completed Jobs",
        count: bookings.filter((b) => b.status === "Completed").length,
        bgColor: "bg-green-500",
        icon: HiCog,
      },
      {
        title: "Cancelled Jobs",
        count: bookings.filter((b) => b.status === "Cancelled").length,
        bgColor: "bg-gray-400",
        icon: HiXCircle,
      },
    ]);
  }, [bookings]);

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  // Filtered bookings for table - USING ACTUAL STATUS FROM DATABASE
  const filteredBookings = bookings.filter(
    (b) =>
      (statusFilter === "" || b.status === statusFilter) &&
      (paymentFilter === "" ||
        (b.is_paid
          ? "Paid"
          : b.paymentMethod === "Cash"
          ? "Cash"
          : "Not Paid") === paymentFilter)
  );

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600";
      case "Waiting for Work":
        return "text-blue-600";
      case "In Progress":
        return "text-purple-600"; // ✅ Updated color for In Progress
      case "Pending":
        return "text-yellow-600";
      case "Cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <p className="mb-3 lg:-mt-7 text-xl font-semibold">Dashboard</p>

      {/* Summary cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`${card.bgColor} flex-shrink-0 flex items-center justify-between p-4 rounded-xl shadow-md text-white min-w-[200px]`}
            >
              <div>
                <p className="text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-2">{card.count}</p>
              </div>
              <Icon className="text-white text-2xl" />
            </div>
          );
        })}
      </div>

      {/* Bar Chart - IMPROVED MOBILE RESPONSIVENESS */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4 w-full">
        <p className="font-semibold text-gray-700 text-lg sm:text-xl">Overview of Services</p>
        
        {/* Improved legend and filter section for mobile */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          {/* Legend - Improved for mobile */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2">
                {dotStyle("#10B981")}
                <span className="text-xs font-semibold text-gray-700">Completed</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {dotStyle("#3B82F6")}
                <span className="text-xs font-semibold text-gray-700">Waiting</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {dotStyle("#8B5CF6")}
                <span className="text-xs font-semibold text-gray-700">In Progress</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {dotStyle("#F59E0B")}
                <span className="text-xs font-semibold text-gray-700">Pending</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {dotStyle("#9CA3AF")}
                <span className="text-xs font-semibold text-gray-700">Cancelled</span>
              </div>
            </div>
          </div>
          
          {/* Time filter - Improved for mobile */}
          <div className="flex justify-end">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:w-auto"
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
        </div>

        {/* Chart container with better mobile handling */}
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ 
                top: 20, 
                bottom: 10,
                left: 0,
                right: 10
              }}
              barSize={14}
            >
              <XAxis 
                dataKey="period" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
                interval={0}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="Completed" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Waiting for Work" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="In Progress" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Pending" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#9CA3AF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Bookings Table */}
      <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Waiting for Work">Waiting for Work</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full sm:w-auto"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment</option>
              <option value="Paid">Paid</option>
              <option value="Cash">Cash</option>
              <option value="Not Paid">Not Paid</option>
            </select>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Upcoming Requests</h2>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <div className="overflow-y-auto max-h-96 scrollbar-thin">
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr className="border-b border-gray-300">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Service Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Customer Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Payment
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Location
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Date customer available
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      Loading bookings...
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 relative">
                      <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="p-3 text-sm text-gray-900">
                        {b.serviceName}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {b.customer?.name || "N/A"}
                      </td>
                      <td className="p-3 text-sm">
                        {editingStatus === b._id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Waiting for Work">Waiting for Work</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => handleStatusUpdate(b._id)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`font-semibold ${getStatusColor(b.status)} cursor-pointer hover:underline`}
                            onClick={() => startEditingStatus(b._id, b.status)}
                          >
                            {b.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-900 font-semibold">
                        {currSymbol} {b.amount}
                      </td>
                      <td className={`p-3 text-sm font-semibold ${
                        b.is_paid
                          ? "text-green-600"
                          : b.paymentMethod === "Cash"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}>
                        {b.is_paid
                          ? "Paid"
                          : b.paymentMethod === "Cash"
                          ? "Cash"
                          : "Not Paid"}
                      </td>
                      <td className="p-3 text-sm text-gray-900">{b.city}</td>
                      <td className="p-3 text-sm text-gray-900">
                        {new Date(b.delivery_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          ref={(el) => (buttonRefs.current[idx] = el)}
                          onClick={() => handleViewCustomer(b, idx)}
                          className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors relative"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      No requests found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Modal - Positioned above and to the right of view button */}
      {modalOpen && selectedCustomer && (
        <div
          className="customer-modal fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 w-80 max-w-sm p-4 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: "translateY(-100%)",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
            Customer Details
          </h2>

          {/* Customer info */}
          <div className="space-y-2 text-gray-700 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">Name:</span>
              <span>{selectedCustomer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Email:</span>
              <span className="text-right break-all ml-2">
                {selectedCustomer.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Phone:</span>
              <span>{selectedCustomer.phone}</span>
            </div>
          </div>

          {/* Close button at bottom */}
          <div className="flex justify-end mt-3 pt-2 border-t">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Fixed JSX warning by using style tag without jsx attribute */}
      <style>
        {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px) translateY(-100%);
            }
            to {
              opacity: 1;
              transform: translateY(0) translateY(-100%);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;