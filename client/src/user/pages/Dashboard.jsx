import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { toast } from "react-toastify";
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
import { fetchProviderDetails } from "../../services/landingPageService";
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
  const [chartData, setChartData] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef({});

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.fetchMyBookings(backendUrl, {
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
        const msg = err?.response?.data?.message || err.message || 'Error fetching bookings';
        toast.error(msg);
        setBookings([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalBookings: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [backendUrl]);

  // Memoize filtered requests to prevent recalculations
  const filteredRequests = useMemo(() => {
    return bookings.filter((b) =>
      (statusFilter === "" || b.status === statusFilter) &&
      (paymentFilter === "" || 
        (paymentFilter === "Paid" ? b.is_paid : 
         paymentFilter === "Cash" ? b.paymentMethod === "Cash" : 
         paymentFilter === "Not Paid" ? !b.is_paid : true))
    );
  }, [bookings, statusFilter, paymentFilter]);

  // Memoize current page data
  const currentPageData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredRequests.slice(startIndex, endIndex).map((req, idx) => ({
      no: startIndex + idx + 1,
      serviceId: req.serviceId,
      service: req.serviceName,
      status: req.status,
      payment: req.is_paid
        ? "Paid"
        : req.paymentMethod === "Cash"
          ? "Cash"
          : "Not Paid",
      location: req.city,
      date: new Date(req.delivery_date).toLocaleDateString(),
      amount: req.amount,
      provider: req.providerName || "N/A",
    }));
  }, [filteredRequests, pagination.currentPage, pagination.limit]);

  // Update pagination when filters or limit changes
  useEffect(() => {
    const totalFiltered = filteredRequests.length;
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
  }, [filteredRequests]); // Removed pagination.limit from dependencies

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
          options,
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
          "In Progress": 0,
          Cancelled: 0,
          label: displayLabel,
        };

      // Use actual status from database
      if (b.status === "Completed") grouped[key].Completed += 1;
      else if (b.status === "Pending") grouped[key].Pending += 1;
      else if (b.status === "Waiting for Work" || b.status === "In Progress")
        grouped[key]["In Progress"] += 1;
      else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        period: grouped[key].label,
        Completed: grouped[key].Completed,
        Pending: grouped[key].Pending,
        "In Progress": grouped[key]["In Progress"],
        Cancelled: grouped[key].Cancelled,
      }));
  }, [bookings, timeFilter]);

  // Enhanced summary cards for users 
  useEffect(() => {
    const totalSpent = bookings
      .filter((b) => b.is_paid)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    

    const upcomingBookings = bookings.filter(
      (b) =>
        new Date(b.delivery_date) >= new Date() &&
        b.status !== "Cancelled" &&
        b.status !== "Completed",
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
        title: "Pending Payments",
        count: bookings.filter((b) => !b.is_paid && b.status !== "Cancelled")
          .length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCurrencyDollar,
        description: "Awaiting payment",
      },
      {
        title: "Completed Services",
        count: bookings.filter((b) => b.status === "Completed").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiCheckCircle,
        description: "Finished jobs",
      },
      {
        title: "Total Spent",
        count: `${currSymbol}${totalSpent}`,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiStar,
        description: "All time",
      },
      {
        title: "In Progress",
        count: bookings.filter(
          (b) => b.status === "Waiting for Work" || b.status === "In Progress",
        ).length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiClock,
        description: "Active work",
      },
      {
        title: "Cancelled",
        count: bookings.filter((b) => b.status === "Cancelled").length,
        bgColor: "bg-gray-800",
        textColor: "text-white",
        icon: HiXCircle,
        description: "Cancelled requests",
      },
    ]);
  }, [bookings, currSymbol]);

  // Pie chart data for service status distribution
  const pieChartData = useMemo(() => [
    {
      name: "Completed",
      value: bookings.filter((b) => b.status === "Completed").length,
      color: "#10B981", // Green
    },
    {
      name: "In Progress",
      value: bookings.filter(
        (b) => b.status === "Waiting for Work" || b.status === "In Progress",
      ).length,
      color: "#F59E0B", // Amber
    },
    {
      name: "Pending",
      value: bookings.filter((b) => b.status === "Pending").length,
      color: "#3B82F6", // Blue
    },
    {
      name: "Cancelled",
      value: bookings.filter((b) => b.status === "Cancelled").length,
      color: "#EF4444", // Red
    },
  ], [bookings]);

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
    const totalPages = Math.ceil(filteredRequests.length / limit);
    
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
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
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

  const handleView = async (serviceId, index) => {
    try {
      const data = await fetchProviderDetails(backendUrl, serviceId);
  
      if (data.success) {
        setSelectedService(data.data || data);
        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;
          const viewportWidth = window.innerWidth;

          setModalPosition({
            top: rect.top + scrollTop + 120,
            right: viewportWidth - rect.right - scrollLeft,
          });
        }

        setServiceModalOpen(true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error fetching service details';
      toast.error(msg);
    }
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceModalOpen && !event.target.closest(".service-modal")) {
        setServiceModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [serviceModalOpen]);

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600";
      case "Waiting for Work":
      case "In Progress":
        return "text-orange-600";
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
                  Customer Dashboard
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Dashboard
                </h1>
                <p className="text-gray-600">
                  Track and manage all your service bookings in one place
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

          {/* Service Requests Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8 flex flex-col" style={{ height: '600px' }}>
            <div className="p-6 border-b border-gray-200 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  My Service Requests
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
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full sm:w-auto"
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Waiting for Work">Waiting for Work</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full sm:w-auto"
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
                    {filteredRequests.length === 0 ? 0 : 
                      (pagination.currentPage - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      filteredRequests.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredRequests.length}
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
                        #
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Service
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Provider
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Location
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Action
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
                            Loading your bookings...
                          </div>
                        </td>
                      </tr>
                    ) : currentPageData.length > 0 ? (
                      currentPageData.map((req, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 text-sm text-gray-900 font-medium">
                            {req.no}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {req.service}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {req.provider}
                          </td>
                          <td className="p-4 text-sm">
                            <span
                              className={`font-semibold ${getStatusColor(
                                req.status,
                              )}`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td
                            className={`p-4 text-sm font-semibold ${
                              req.payment === "Paid"
                                ? "text-green-600"
                                : req.payment === "Cash"
                                  ? "text-blue-600"
                                  : "text-red-600"
                            }`}
                          >
                            {req.payment}
                          </td>
                          <td className="p-4 text-sm text-gray-900 font-semibold">
                            {currSymbol} {req.amount || "0"}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {req.location}
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {req.date}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <button
                              ref={(el) => (buttonRefs.current[idx] = el)}
                              onClick={() => handleView(req.serviceId, idx)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors"
                            >
                              <FaEye className="text-sm" /> Details
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
                            <p>No service requests found for selected filters.</p>
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
            {filteredRequests.length > 0 && (
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
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
                {dotStyle("#F59E0B")}
                <span className="text-xs font-medium text-gray-700">
                  In Progress
                </span>
                {dotStyle("#3B82F6")}
                <span className="text-xs font-medium text-gray-700">
                  Pending
                </span>
                {dotStyle("#EF4444")}
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
                      dataKey="In Progress"
                      fill="#F59E0B"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Pending"
                      fill="#3B82F6"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Cancelled"
                      fill="#EF4444"
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

          {/* Service Modal */}
          {serviceModalOpen && selectedService && (
            <div
              className="service-modal fixed z-50 bg-white rounded-lg border border-gray-300 shadow-xl w-80 max-w-sm p-4"
              style={{
                top: `${modalPosition.top}px`,
                right: `${modalPosition.right}px`,
                transform: "translateY(-100%)",
              }}
            >
              <button
                onClick={() => setServiceModalOpen(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>

              {/* Service Image */}
              {selectedService.service?.image && (
                <div className="w-full h-40 overflow-hidden rounded-lg mb-3">
                  <img
                    src={selectedService.service.image}
                    alt={selectedService.service.serviceName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h2 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">
                {selectedService.service?.serviceName}
              </h2>

              <div className="space-y-2 text-gray-700 text-sm">
                {/* Service Details */}
                <div className="flex justify-between">
                  <span className="font-semibold">Category:</span>
                  <span>{selectedService.service?.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Provider Name:</span>
                  <span>{selectedService.provider?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Amount:</span>
                  <span className="font-semibold">
                    {currSymbol} {selectedService.service?.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  <span
                    className={`font-semibold ${getStatusColor(
                      selectedService.service?.status,
                    )}`}
                  >
                    {selectedService.service?.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Added on:</span>
                  <span>
                    {new Date(
                      selectedService.provider?.updatedAt,
                    ).toLocaleDateString()}
                  </span>
                </div>

                {/* Service Provider Contact Details */}
                <div className="border-t pt-2 mt-2">
                  <p className="font-semibold text-gray-900 mb-2">
                    Provider Contact:
                  </p>

                  <div className="flex justify-between">
                    <span className="font-semibold">Phone:</span>
                    <span className="font-semibold text-blue-600">
                      {selectedService.provider?.phone}
                    </span>
                  </div>

                </div>
              </div>

              <div className="flex justify-end mt-3 pt-2 border-t">
                <button
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;