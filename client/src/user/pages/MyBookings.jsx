import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const MyBookings = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendUrl}/api/customer/mybookings`, {
          withCredentials: true,
        });
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [backendUrl]);

  // 🔍 Filters
  const filteredBookings = bookings.filter((booking) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      booking.serviceName?.toLowerCase().includes(search) ||
      booking.categoryName?.toLowerCase().includes(search);

      const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && booking.status === "Waiting for Work") ||
      (statusFilter === "pending" && booking.status === "Pending") ||
      (statusFilter === "failed" && booking.status === "Payment Failed");

    const serviceDate = new Date(booking.delivery_date);
    const matchesDate = !dateTo || serviceDate <= new Date(dateTo);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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
            placeholder="Search by service or category..."
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
          <option value="pending">Pending</option>
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
        <div className="text-center py-20 text-gray-500">Loading bookings...</div>
      ) : filteredBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[750px] bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 bg-gray-100 p-4 font-semibold text-gray-700">
              <div>Service</div>
              <div>Provider</div>
              <div>Address</div>
              <div>Status</div>
              <div>Date Customer is Available</div>
            </div>

            {/* Rows */}
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="grid grid-cols-5 gap-4 p-4 border-b border-gray-200 items-center"
              >
                {/* Service Info */}
                <div>
                  <h3 className="text-base font-semibold">
                    {booking.serviceName}
                  </h3>
                  <p className="text-sm text-gray-500">{booking.categoryName}</p>
                  <p className="text-sm font-semibold mt-1">
                    {currSymbol} {booking.amount}
                  </p>
                </div>

                {/* Provider */}
                <div>
                  <p className="text-sm text-gray-700">{booking.providerName}</p>
                </div>

                {/* Address */}
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaMapMarkerAlt className="mr-1 text-gray-500" />{" "}
                    {booking.city || "N/A"}
                  </p>
                  <p className="text-xs text-gray-400">{booking.address}</p>
                </div>

                {/* Payment */}
                <div>
                  <PaymentStatusBadge 
                  paid={booking.is_paid} />
                  {!booking.is_paid && (
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
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            No bookings found.{" "}
            {searchTerm
              ? "Try a different search term."
              : "You haven’t booked any services yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;






