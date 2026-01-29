import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaFilter,
  FaEye,
  FaSortAmountDown,
  FaCalendar,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaBars,
} from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const MyBookings = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [sortBy, setSortBy] = useState("date-desc");
  const [isMobileView, setIsMobileView] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  });

  // Debounce for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const buttonRefs = useRef({});
  const isMounted = useRef(true);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch bookings from backend with all filters
  const fetchBookings = useCallback(async (page = 1, isFilterChange = false) => {
    try {
      // Cancel previous requests if any
      if (window.controller) {
        window.controller.abort();
      }
      
      const controller = new AbortController();
      window.controller = controller;

      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page,
        limit: pagination.limit,
        sort: sortBy,
      });

      // Add filters if they exist
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      if (statusFilter !== "all") {
        params.append("paymentStatus", statusFilter);
      }

      if (dateTo) {
        params.append("dateTo", dateTo);
      }

      const { data } = await axios.get(
        `${backendUrl}/api/customer/mybookings?${params.toString()}`,
        {
          withCredentials: true,
          signal: controller.signal,
        },
      );

      if (data.success) {
        setBookings(data.bookings || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalBookings: 0,
            limit: 10,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          },
        );
      } else {
        setBookings([]);
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
      } else {
        console.error("Error fetching bookings:", err);
        setBookings([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [backendUrl, debouncedSearchTerm, statusFilter, dateTo, sortBy, pagination.limit]);

  // FIXED: Single useEffect for fetching data
  useEffect(() => {
    isMounted.current = true;
    
    // Add a small delay to prevent rapid successive calls
    const timer = setTimeout(() => {
      fetchBookings(pagination.currentPage);
    }, 300);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (window.controller) {
        window.controller.abort();
      }
    };
  }, [fetchBookings, pagination.currentPage]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case "search":
        setSearchTerm(value);
        break;
      case "status":
        setStatusFilter(value);
        // Reset to page 1 when filter changes
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        break;
      case "date":
        setDateTo(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        break;
      case "sort":
        setSortBy(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        break;
      default:
        break;
    }
  };

  // FIXED: Handle limit change
  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination(prev => ({
      ...prev,
      limit: limit,
      currentPage: 1,
    }));
  };

  // Handle View Provider button click
  const handleViewProvider = async (serviceId, index) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/customer/details/${serviceId}`,
        { withCredentials: true },
      );

      if (data.success) {
        setSelectedService(data.data);

        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;
          const viewportWidth = window.innerWidth;

          setModalPosition({
            top: rect.top + scrollTop + 40,
            right: viewportWidth - rect.right - scrollLeft,
          });
        }

        setServiceModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching provider details:", err);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceModalOpen && !event.target.closest(".service-modal")) {
        setServiceModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [serviceModalOpen]);

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      // Scroll to top of bookings list
      const bookingsContainer = document.querySelector(".bookings-list-container");
      if (bookingsContainer) {
        bookingsContainer.scrollTop = 0;
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateTo("");
    setSortBy("date-desc");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return (
      searchTerm || statusFilter !== "all" || dateTo || sortBy !== "date-desc"
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const PaymentStatusBadge = ({ paid }) => (
    <span
      className={`inline-flex w-fit items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
        paid
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {paid ? (
        <>
          <FaCheckCircle className="mr-1.5 h-3 w-3 text-green-500" />
          Paid
        </>
      ) : (
        <>
          <FaTimesCircle className="mr-1.5 h-3 w-3 text-red-500" />
          Pending
        </>
      )}
    </span>
  );

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "Completed":
          return "bg-green-50 text-green-700 border border-green-200";
        case "Pending":
          return "bg-yellow-50 text-yellow-700 border border-yellow-200";
        case "Cancelled":
          return "bg-red-50 text-red-700 border border-red-200";
        case "Waiting for Work":
          return "bg-blue-50 text-blue-700 border border-blue-200";
        case "In Progress":
          return "bg-orange-50 text-orange-700 border border-orange-200";
        default:
          return "bg-gray-50 text-gray-700 border border-gray-200";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
          status,
        )}`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = isMobileView ? 3 : 5;
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

  // Mobile Booking Card Component
  const MobileBookingCard = ({ booking, index }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {booking.serviceName || "N/A"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {booking.categoryName || "N/A"}
          </p>
          <p className="text-sm font-bold text-blue-600 mt-2">
            {currSymbol} {booking.amount || "0"}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FaUser className="mr-2 text-gray-400" />
          <span className="font-medium mr-2">Provider:</span>
          {booking.providerName || "N/A"}
        </div>

        <div className="flex items-start text-sm text-gray-600">
          <FaMapMarkerAlt className="mr-2 mt-0.5 text-gray-400" />
          <div>
            <span className="font-medium">Address:</span>
            <p className="text-xs">{booking.address || "N/A"}</p>
            <p className="text-xs">{booking.city || ""}</p>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <FaCalendarAlt className="mr-2 text-gray-400" />
          <span className="font-medium mr-2">Date:</span>
          {formatDate(booking.delivery_date)}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <PaymentStatusBadge paid={booking.is_paid} />

        <div className="flex gap-2">
          {!booking.is_paid && booking.status !== "Cancelled" && (
            <Link
              to="/user/payment"
              state={{ service: booking }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
            >
              <FaMoneyBillWave className="text-xs" /> Pay
            </Link>
          )}
          <button
            ref={(el) => (buttonRefs.current[index] = el)}
            onClick={() => handleViewProvider(booking.serviceId, index)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
            disabled={!booking.serviceId}
          >
            <FaEye className="text-xs" /> View
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-6 px-4 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Track your services, payment status, and booking details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Active filters indicator */}
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-2"
                >
                  <span>Clear Filters</span>
                  <FaTimesCircle />
                </button>
              )}
              <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200">
                Total:{" "}
                <span className="font-bold text-gray-800">
                  {pagination.totalBookings}
                </span>{" "}
                bookings
              </div>
            </div>
          </div>
        </div>

        {/* 🔎 Search + Filters + Sort */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Payment Status Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">All Bookings</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending Payment</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <FaSortAmountDown className="absolute left-3 top-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <FaCalendar className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 📄 Bookings Container - FIXED HEIGHT FOR SCROLLING */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <>
              {/* Pagination Controls - Top (FIXED - NOT SCROLLABLE) */}
              <div className="border-b border-gray-200 bg-gray-50 p-4 shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-sm text-gray-600">
                      bookings per page
                    </span>
                  </div>

                  {/* Page info */}
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-800">
                      {(pagination.currentPage - 1) * pagination.limit + 1}-
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalBookings,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-800">
                      {pagination.totalBookings}
                    </span>{" "}
                    bookings
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={
                        !pagination.hasPrevPage || pagination.currentPage === 1
                      }
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
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
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
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
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

              {/* SCROLLABLE BOOKINGS AREA - NOW FIXED */}
              <div className="flex-1 overflow-y-auto bookings-list-container">
                {!isMobileView ? (
                  /* Desktop Table View */
                  <div className="min-w-full">
                    {/* Table Header - Sticky inside scrollable area */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                      <div className="grid grid-cols-7 gap-4 p-4 font-semibold text-gray-700 bg-gray-50">
                        <div className="text-sm">SERVICE</div>
                        <div className="text-sm">PROVIDER</div>
                        <div className="text-sm">ADDRESS</div>
                        <div className="text-sm">STATUS</div>
                        <div className="text-sm">PAYMENT</div>
                        <div className="text-sm">DATE</div>
                        <div className="text-sm">ACTION</div>
                      </div>
                    </div>

                    {/* Bookings List - THIS NOW SCROLLS PROPERLY */}
                    <div className="divide-y divide-gray-100">
                      {bookings.map((booking, index) => (
                        <div
                          key={booking._id || index}
                          className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
                        >
                          {/* Service Info */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800">
                              {booking.serviceName || "N/A"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {booking.categoryName || "N/A"}
                            </p>
                            <p className="text-sm font-bold text-gray-600 mt-2">
                              {currSymbol} {booking.amount || "0"}
                            </p>
                          </div>

                          {/* Provider */}
                          <div>
                            <p className="text-sm text-gray-700">
                              {booking.providerName || "N/A"}
                            </p>
                          </div>

                          {/* Address */}
                          <div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <FaMapMarkerAlt className="mr-2 text-gray-400" />{" "}
                              {booking.city || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {booking.address || "N/A"}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <StatusBadge status={booking.status} />
                          </div>

                          {/* Payment */}
                          <div className="space-y-2">
                            <PaymentStatusBadge paid={booking.is_paid} />
                            {!booking.is_paid &&
                              booking.status !== "Cancelled" && (
                                <Link
                                  to="/user/payment"
                                  state={{ service: booking }}
                                  className="flex items-center w-fit gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors"
                                >
                                  <FaMoneyBillWave className="text-sm" /> Pay
                                  Now
                                </Link>
                              )}
                          </div>

                          {/* Date */}
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2 text-gray-400" />
                              {formatDate(booking.delivery_date)}
                            </div>
                          </div>

                          {/* Action */}
                          <div>
                            <button
                              ref={(el) => (buttonRefs.current[index] = el)}
                              onClick={() =>
                                handleViewProvider(booking.serviceId, index)
                              }
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-colors shadow-sm"
                              disabled={!booking.serviceId}
                            >
                              <FaEye className="text-sm" /> View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Mobile Card View */
                  <div className="p-4">
                    {bookings.map((booking, index) => (
                      <MobileBookingCard
                        key={booking._id || index}
                        booking={booking}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls - Bottom (FIXED - NOT SCROLLABLE) */}
              <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={
                        !pagination.hasPrevPage || pagination.currentPage === 1
                      }
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasPrevPage || pagination.currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
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
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters()
                    ? "No bookings found matching your filters."
                    : "You haven't booked any services yet."}
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Provider Details Modal */}
      {serviceModalOpen && selectedService && (
        <div
          className="service-modal fixed z-50 bg-white rounded-xl shadow-xl border border-gray-300 w-11/12 md:w-96 max-w-sm p-5 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: "translateY(-100%)",
          }}
        >
          <button
            onClick={() => setServiceModalOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg transition-colors"
          >
            ✕
          </button>

          {/* Provider Image */}
          {selectedService.serviceProvider?.image && (
            <div className="w-full h-40 overflow-hidden rounded-lg mb-4 border border-gray-200">
              <img
                src={selectedService.serviceProvider.image}
                alt={selectedService.serviceProvider.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Provider Details
          </h2>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Name:</span>
              <span className="font-semibold text-blue-600">
                {selectedService.serviceProvider?.name || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium flex items-center">
                <FaPhone className="mr-2 text-green-500" /> Phone:
              </span>
              <span className="font-semibold text-green-600">
                {selectedService.serviceProvider?.phone || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium flex items-center">
                <FaEnvelope className="mr-2 text-purple-500" /> Email:
              </span>
              <span className="font-semibold text-purple-600 text-sm">
                {selectedService.serviceProvider?.email || "N/A"}
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setServiceModalOpen(false)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;