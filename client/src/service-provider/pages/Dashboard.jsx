import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ShareContext } from "../../sharedcontext/SharedContext";
import * as bookingService from "../../services/bookingService";
import axios from "axios";
import {
  HiClipboardList,
  HiCog,
  HiXCircle,
  HiCurrencyDollar,
  HiCalendar,
  HiStar,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
} from "react-icons/fa";

const Dashboard = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [summaryCards, setSummaryCards] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const buttonRefs = useRef({});

  // Fetch bookings using fetchProviderBookings for service providers
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.fetchProviderBookings(backendUrl, {
          page: 1,
          limit: 1000
        });
        if (data.success) {
          setBookings(data.bookings || []);
          const totalBookings = data.bookings?.length || 0;
          const totalPages = Math.ceil(totalBookings / pagination.limit);
          
          setPagination({
            currentPage: 1,
            totalPages: totalPages,
            totalBookings: totalBookings,
            limit: pagination.limit,
            hasNextPage: totalPages > 1,
            hasPrevPage: false,
          });
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [backendUrl]);

  // Memoize filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        (statusFilter === "" || b.status === statusFilter) &&
        (paymentFilter === "" ||
          (b.is_paid
            ? "Paid"
            : b.paymentMethod === "Cash"
            ? "Cash"
            : "Not Paid") === paymentFilter)
    );
  }, [bookings, statusFilter, paymentFilter]);

  // Memoize current page data
  const currentPageData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredBookings.slice(startIndex, endIndex).map((b, idx) => ({
      ...b,
      displayNo: startIndex + idx + 1,
    }));
  }, [filteredBookings, pagination.currentPage, pagination.limit]);

  // Update pagination when filters change
  useEffect(() => {
    const totalFiltered = filteredBookings.length;
    const totalPages = Math.ceil(totalFiltered / pagination.limit);
    const currentPage = Math.min(pagination.currentPage, Math.max(1, totalPages));
    
    setPagination(prev => ({
      ...prev,
      totalPages: totalPages,
      totalBookings: totalFiltered,
      currentPage: totalFiltered > 0 ? currentPage : 1,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }));
  }, [filteredBookings]);

  // Compute chart data - NOW USING ACTUAL STATUS FROM DATABASE
  const computeChartData = useMemo(() => {
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
      } else {
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
          "In Progress": 0,
          Cancelled: 0,
          label: displayLabel,
        };

      if (b.status === "Completed") grouped[key].Completed += 1;
      else if (b.status === "Pending") grouped[key].Pending += 1;
      else if (b.status === "Waiting for Work") grouped[key]["Waiting for Work"] += 1;
      else if (b.status === "In Progress") grouped[key]["In Progress"] += 1;
      else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        period: grouped[key].label,
        Completed: grouped[key].Completed,
        Pending: grouped[key].Pending,
        "Waiting for Work": grouped[key]["Waiting for Work"],
        "In Progress": grouped[key]["In Progress"],
        Cancelled: grouped[key].Cancelled,
      }));
  }, [bookings, timeFilter]);

  // Pie chart data for service status distribution
  const pieChartData = useMemo(() => [
    {
      name: "Completed",
      value: bookings.filter((b) => b.status === "Completed").length,
      color: "#10B981", // Green
    },
    {
      name: "In Progress",
      value: bookings.filter((b) => b.status === "In Progress").length,
      color: "#F59E0B", // Amber
    },
    {
      name: "Waiting for Work",
      value: bookings.filter((b) => b.status === "Waiting for Work").length,
      color: "#3B82F6", // Blue
    },
    {
      name: "Pending",
      value: bookings.filter((b) => b.status === "Pending").length,
      color: "#6B7280", // Gray
    },
    {
      name: "Cancelled",
      value: bookings.filter((b) => b.status === "Cancelled").length,
      color: "#EF4444", // Red
    },
  ], [bookings]);

  // Summary cards - USING ACTUAL STATUS FROM DATABASE
  useEffect(() => {
    const totalEarnings = bookings
      .filter((b) => b.is_paid)
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const upcomingBookings = bookings.filter(
      (b) =>
        new Date(b.delivery_date) >= new Date() &&
        b.status !== "Cancelled" &&
        b.status !== "Completed"
    );

    setSummaryCards([
      {
        title: "Upcoming Services",
        count: upcomingBookings.length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCalendar,
        description: "Scheduled services",
      },
      {
        title: "Pending Requests",
        count: bookings.filter((b) => b.status === "Pending").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiClipboardList,
        description: "Awaiting confirmation",
      },
      {
        title: "Total Earnings",
        count: `${currSymbol}${totalEarnings}`,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCurrencyDollar,
        description: "All time earnings",
      },
      {
        title: "In Progress",
        count: bookings.filter((b) => b.status === "In Progress").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiClock,
        description: "Active work",
      },
      {
        title: "Waiting for Work",
        count: bookings.filter((b) => b.status === "Waiting for Work").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCog,
        description: "Ready to start",
      },
      {
        title: "Completed",
        count: bookings.filter((b) => b.status === "Completed").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCheckCircle,
        description: "Finished jobs",
      },
    ]);
  }, [bookings, currSymbol]);

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
      // Scroll to top of table
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    const totalPages = Math.ceil(filteredBookings.length / limit);
    
    setPagination(prev => ({
      ...prev,
      limit: limit,
      currentPage: 1,
      totalPages: totalPages,
      hasNextPage: totalPages > 1,
      hasPrevPage: false,
    }));
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const { currentPage, totalPages } = pagination;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        className="pointer-events-none"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Fetch customer details for modal and position it
  const handleViewCustomer = async (booking, index) => {
    try {
      if (!booking?.customer) return;

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

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600";
      case "Waiting for Work":
        return "text-blue-600";
      case "In Progress":
        return "text-purple-600";
      case "Pending":
        return "text-yellow-600";
      case "Cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter("");
    setPaymentFilter("");
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return statusFilter || paymentFilter;
  }, [statusFilter, paymentFilter]);

  return (
    <div className="min-h-screen bg-white">
      {/* Scrollable content container */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-3">
                  Service Provider Dashboard
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Dashboard
                </h1>
                <p className="text-gray-600">
                  Track and manage all your service bookings and customers
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  Total:{" "}
                  <span className="font-bold text-gray-800">
                    {pagination.totalBookings}
                  </span>{" "}
                  bookings
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {summaryCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`${card.bgColor} ${card.textColor} flex flex-col justify-between p-4 rounded-lg border border-gray-700 hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-medium opacity-90">
                        {card.title}
                      </p>
                      <p className="text-xl font-bold mt-1">{card.count}</p>
                    </div>
                    <Icon className="text-white text-lg opacity-80" />
                  </div>
                  <p className="text-sm opacity-80 mt-2">{card.description}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Service Timeline
                </h3>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Daily</option>
                </select>
              </div>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {dotStyle("#10B981")}
                <span className="text-xs font-medium text-gray-700">
                  Completed
                </span>
                {dotStyle("#3B82F6")}
                <span className="text-xs font-medium text-gray-700">
                  Waiting
                </span>
                {dotStyle("#8B5CF6")}
                <span className="text-xs font-medium text-gray-700">
                  In Progress
                </span>
                {dotStyle("#F59E0B")}
                <span className="text-xs font-medium text-gray-700">
                  Pending
                </span>
                {dotStyle("#9CA3AF")}
                <span className="text-xs font-medium text-gray-700">
                  Cancelled
                </span>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={computeChartData}
                    margin={{ top: 20, bottom: 5 }}
                    barSize={12}
                  >
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="Completed"
                      fill="#10B981"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Waiting for Work"
                      fill="#3B82F6"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="In Progress"
                      fill="#8B5CF6"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Pending"
                      fill="#F59E0B"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Cancelled"
                      fill="#9CA3AF"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Service Distribution
              </h3>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} services`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieChartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Bookings Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8 flex flex-col" style={{ height: '600px' }}>
            <div className="p-6 border-b border-gray-200 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Requests
                </h2>
                <div className="flex items-center gap-4">
                  {/* Active filters indicator */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-2"
                    >
                      <span>Clear Filters</span>
                      <HiXCircle className="w-3 h-3" />
                    </button>
                  )}
                  <div className="flex gap-4">
                    <select
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full sm:w-auto"
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
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full sm:w-auto"
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
              </div>

              {/* Pagination Controls - Top */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                  <span className="text-sm text-gray-600">requests per page</span>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredBookings.length === 0 ? 0 : 
                      (pagination.currentPage - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      filteredBookings.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredBookings.length}
                  </span>{" "}
                  filtered requests
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                  {/* First page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPrevPage || pagination.currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      !pagination.hasPrevPage || pagination.currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="First page"
                  >
                    <FaAngleDoubleLeft />
                  </button>

                  {/* Previous page */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`p-2 rounded-lg transition-colors ${
                      !pagination.hasPrevPage
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Previous page"
                  >
                    <FaChevronLeft />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === "..." ? (
                          <span className="px-2 text-gray-400">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              pagination.currentPage === pageNum
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Next page */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`p-2 rounded-lg transition-colors ${
                      !pagination.hasNextPage
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Next page"
                  >
                    <FaChevronRight />
                  </button>

                  {/* Last page */}
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={
                      !pagination.hasNextPage ||
                      pagination.currentPage === pagination.totalPages
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      !pagination.hasNextPage ||
                      pagination.currentPage === pagination.totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Last page"
                  >
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            </div>

            {/* SCROLLABLE TABLE CONTENT */}
            <div className="flex-1 overflow-y-auto table-container">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        No
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Service Name
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Customer Name
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-10 text-gray-500"
                        >
                          <div className="flex justify-center items-center">
                            <HiClock className="animate-spin text-2xl mr-2 text-gray-900" />
                            Loading bookings...
                          </div>
                        </td>
                      </tr>
                    ) : currentPageData.length > 0 ? (
                      currentPageData.map((b, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-900 font-medium">
                            {b.displayNo}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {b.serviceName}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {b.customer?.name || "N/A"}
                          </td>
                          <td className="p-4 text-sm">
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
                          <td className="p-4 text-sm text-gray-900 font-semibold">
                            {currSymbol} {b.amount}
                          </td>
                          <td className={`p-4 text-sm font-semibold ${
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
                          <td className="p-4 text-sm text-gray-900">{b.city}</td>
                          <td className="p-4 text-sm text-gray-900">
                            {new Date(b.delivery_date).toLocaleDateString()}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <button
                              ref={(el) => (buttonRefs.current[idx] = el)}
                              onClick={() => handleViewCustomer(b, idx)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors"
                            >
                              <FaEye className="text-sm" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-10 text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <HiExclamationCircle className="text-3xl text-gray-400 mb-2" />
                            <p>No requests found for selected filters.</p>
                            <p className="text-sm mt-1">
                              Try changing your filter criteria.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls - Bottom */}
            {filteredBookings.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrevPage || pagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasPrevPage || pagination.currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasPrevPage
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasNextPage
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={
                        !pagination.hasNextPage ||
                        pagination.currentPage === pagination.totalPages
                      }
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasNextPage ||
                        pagination.currentPage === pagination.totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
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
      </div>
    </div>
  );
};

export default Dashboard;