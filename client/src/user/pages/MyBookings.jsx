import React, { useEffect, useState, useContext, useRef } from "react";
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
  FaHome,
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
  const buttonRefs = useRef({});

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/customer/mybookings`,
          {
            withCredentials: true,
          }
        );

        if (data.success) {
          // Handle different possible response structures
          const bookingsData =
            data.responseData || data.bookings || data.data || [];
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        } else {
          setBookings([]);
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

  // Handle View Provider button click
  const handleViewProvider = async (serviceId, index) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/customer/details/${serviceId}`,
        { withCredentials: true }
      );

      if (data.success) {
        setSelectedService(data.data);

        // Position the modal near the button
        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;
          const viewportWidth = window.innerWidth;

          setModalPosition({
            top: rect.top + scrollTop + 40, // Position 40px below the button
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

  // 🔍 Filters - Safe filtering with null checks
  const filteredBookings = (bookings || []).filter((booking) => {
    if (!booking) return false;

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      booking.serviceName?.toLowerCase().includes(search) ||
      booking.categoryName?.toLowerCase().includes(search) ||
      booking.providerName?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && booking.is_paid) ||
      (statusFilter === "pending" && !booking.is_paid);

    const serviceDate = booking.delivery_date
      ? new Date(booking.delivery_date)
      : null;
    const matchesDate =
      !dateTo || (serviceDate && serviceDate <= new Date(dateTo));

    return matchesSearch && matchesStatus && matchesDate;
  });

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
      className={`inline-flex w-fit mt-2 items-center px-3 py-1 rounded-full text-xs font-medium ${
        paid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
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
          return "bg-green-100 text-green-800";
        case "Pending":
          return "bg-yellow-100 text-yellow-800";
        case "Cancelled":
          return "bg-red-100 text-red-800";
        case "Waiting for Work":
          return "bg-blue-100 text-blue-800";
        case "In Progress":
          return "bg-orange-100 text-orange-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
          status
        )}`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="py-12 px-4 max-w-6xl mx-auto bg-gray-50 min-h-screen overflow-y-auto scrollbar-none">
      <h1 className="text-3xl font-bold mb-4">My Bookings</h1>
      <p className="mb-8 text-gray-600">
        Track your services, payment status, and booking details.
      </p>

      {/* 🔎 Search + Filters */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by service, category, or provider..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-gray-300"
        >
          <option value="all">All Bookings</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending Payment</option>
        </select>

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* 📄 Bookings List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading bookings...</span>
          </div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 bg-gray-100 p-4 font-semibold text-gray-700">
              <div>Service</div>
              <div>Provider</div>
              <div>Address</div>
              <div>Status</div>
              <div>Payment</div>
              <div>Date</div>
              <div>Action</div>
            </div>

            {/* Rows */}
            {filteredBookings.map((booking, index) => (
              <div
                key={booking._id || index}
                className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200 items-center hover:bg-gray-50 transition-colors"
              >
                {/* Service Info */}
                <div>
                  <h3 className="text-base font-semibold">
                    {booking.serviceName || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {booking.categoryName || "N/A"}
                  </p>
                  <p className="text-sm font-semibold mt-1">
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
                    <FaMapMarkerAlt className="mr-1 text-gray-500" />{" "}
                    {booking.city || "N/A"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {booking.address || "N/A"}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Payment */}
                <div>
                  <PaymentStatusBadge paid={booking.is_paid} />
                  {!booking.is_paid && booking.status !== "Cancelled" && (
                    <Link
                      to="/user/payment"
                      state={{ service: booking }}
                      className="flex items-center w-fit gap-2 mt-2 px-2 py-1 bg-gray-800 text-white rounded-md text-xs hover:bg-gray-700"
                    >
                      <FaMoneyBillWave /> Pay Now
                    </Link>
                  )}
                </div>

                {/* Date */}
                <div className="text-sm text-gray-600">
                  <FaCalendarAlt className="inline mr-1 text-gray-400" />
                  {formatDate(booking.delivery_date)}
                </div>

                {/* Action - View Provider Button */}
                <div className="whitespace-nowrap">
                  <button
                    ref={(el) => (buttonRefs.current[index] = el)}
                    onClick={() => handleViewProvider(booking.serviceId, index)}
                    className="py-2 px-4 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors shadow-sm"
                    disabled={!booking.serviceId}
                  >
                    View Provider
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {bookings.length === 0
              ? "You haven't booked any services yet."
              : "No bookings found matching your filters."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Service Provider Details Modal */}
      {serviceModalOpen && selectedService && (
        <div
          className="service-modal fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-300 w-80 max-w-sm p-4 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: "translateY(-100%)",
          }}
        >
          <button
            onClick={() => setServiceModalOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg transition-colors"
          >
            ✕
          </button>

          {/* Provider Image */}
          {selectedService.serviceProvider?.image && (
            <div className="w-full h-32 overflow-hidden rounded-lg mb-3">
              <img
                src={selectedService.serviceProvider.image}
                alt={selectedService.serviceProvider.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2 flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Provider Details
          </h2>

          <div className="space-y-3 text-gray-700 text-sm">
            {/* Provider Basic Info */}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Name:</span>
              <span className="font-semibold text-blue-600">
                {selectedService.serviceProvider?.name || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center">
                <FaPhone className="mr-1 text-green-500" /> Phone:
              </span>
              <span className="font-semibold text-green-600">
                {selectedService.serviceProvider?.phone || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold flex items-center">
                <FaEnvelope className="mr-1 text-purple-500" /> Email:
              </span>
              <span className="font-semibold text-purple-600 text-xs">
                {selectedService.serviceProvider?.email || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="font-semibold flex items-center">
                <FaHome className="mr-1 text-orange-500" /> Address:
              </span>
              <span className="font-semibold text-right">
                {selectedService.serviceProvider?.address || "N/A"}
              </span>
            </div>

    

            {/* Provider Bio if available */}
            {selectedService.serviceProvider?.bio && (
              <div className="border-t pt-3 mt-3">
                <h3 className="font-semibold text-gray-800 mb-2">About:</h3>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedService.serviceProvider.bio}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t">
            <button
              onClick={() => setServiceModalOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px) translateY(-100%); }
            to { opacity: 1; transform: translateY(0) translateY(-100%); }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
        `}
      </style>
    </div>
  );
};

export default MyBookings;
