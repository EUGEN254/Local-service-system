import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
import { dummyBookings } from "../../assets/assets";

const MyBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateTo, setDateTo] = useState("");

  const filteredBookings = dummyBookings.filter((booking) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      booking.service_name.toLowerCase().includes(search) ||
      booking.category_name.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && booking.is_paid) ||
      (statusFilter === "pending" && !booking.is_paid);

    const serviceDate = new Date(booking.service_date);
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
      className={`inline-flex w-fit mt-2 -ml-2 items-center px-3 py-1 rounded-full text-xs font-medium ${
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
    <div className="py-12 px-4 max-w-6xl mx-auto bg-gray-50 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <h1 className="text-3xl font-bold mb-4">My Bookings</h1>
      <p className="mb-8 text-gray-600">
        Track and manage your booked services.
      </p>

      {/* Search + Filters */}
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

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[700px] bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Headers */}
            <div className="grid grid-cols-4 gap-4 bg-gray-100 p-4 font-semibold text-gray-700">
              <div>Image</div>
              <div>Service</div>
              <div>Booking</div>
              <div>Date</div>
            </div>

            {/* Table Rows */}
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 items-center"
              >
                {/* Column 1: Image */}
                <div className="flex items-center">
                  <img
                    src={
                      booking.service_image || "https://via.placeholder.com/80"
                    }
                    alt={booking.service_name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                </div>

                {/* Column 2: Service Name */}
                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-semibold">
                    {booking.service_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {booking.category_name}
                  </p>
                  {booking.provider_name && (
                    <p className="text-sm text-gray-500">
                      Provider: {booking.provider_name}
                    </p>
                  )}
                </div>

                {/* Column 3: Booking Total */}
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-gray-500">KES {booking.amount}</p>
                  <PaymentStatusBadge paid={booking.is_paid} />
                </div>

                {/* Column 4: Service Date + Action */}
                <div className="flex flex-col justify-center">
                  <p className="text-sm text-gray-500">
                    <FaCalendarAlt className="inline mr-1" />
                    {formatDate(booking.service_date)}
                  </p>
                  {!booking.is_paid && (
                    <Link
                      to="/payment"
                      state={{ service: booking }}
                      className="flex items-center w-fit gap-2 mt-2 px-2 py-1 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
                    >
                      <FaMoneyBillWave /> Complete Payment
                    </Link>
                  )}
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
              : "You haven't booked any services yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
