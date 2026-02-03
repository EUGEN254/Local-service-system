import React, { useState, useEffect } from "react";
import { useAdminBookings } from "../hooks/useAdminBookings";
import { useAdmin } from "../context/AdminContext";
import { FaEye, FaCheck, FaCheckCircle } from "react-icons/fa";


const BookingsAndTransactions = () => {
  const {
    bookings,
    transactions,
    loadingBookings,
    loadingTransactions,
    updatingBooking,
    fetchBookings,
    fetchTransactions,
    updateBookingStatus,
    markBookingAsRead,
    markAllBookingsAsRead,
  } = useAdminBookings();

  const { fetchUnreadBookingCount } = useAdmin();

  const [activeTab, setActiveTab] = useState("Bookings");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewLayout, setViewLayout] = useState("table"); // "table" or "card"
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    if (activeTab === "Bookings") {
      fetchBookings(filters);
    } else {
      fetchTransactions(filters);
    }
  }, [activeTab, filters, fetchBookings, fetchTransactions]);

  const openModal = (record) => {
    setSelectedRecord(record);
    // Only mark as read for bookings, not transactions
    if (activeTab === "Bookings") {
      markAsRead(record._id);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setModalOpen(false);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    const success = await updateBookingStatus(bookingId, newStatus);
    if (success) {
      closeModal();
    }
  };

  const markAsRead = async (recordId) => {
    try {
      await markBookingAsRead(recordId);
      // Refresh the unread booking count in navbar and sidebar
      await fetchUnreadBookingCount();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await markAllBookingsAsRead();
      if (result.success) {
        // Refresh the unread booking count in navbar and sidebar
        await fetchUnreadBookingCount();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': 'text-yellow-600 bg-yellow-100',
      'Confirmed': 'text-blue-600 bg-blue-100',
      'In Progress': 'text-purple-600 bg-purple-100',
      'Completed': 'text-green-600 bg-green-100',
      'Cancelled': 'text-red-600 bg-red-100',
      'paid': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'pending': 'text-yellow-600 bg-yellow-100'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bookings & Transactions</h2>
        {activeTab === "Bookings" && (
          <div className="flex gap-2 items-center">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2"
              title="Mark all pending bookings as read"
            >
              <FaCheck size={14} />
              Mark All as Read
            </button>
            <button
              onClick={() => setViewLayout("table")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewLayout === "table"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewLayout("card")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewLayout === "card"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Card View
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          {activeTab === "Bookings" ? (
            <>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </>
          )}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("Bookings")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "Bookings"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActiveTab("Transactions")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "Transactions"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Loading States */}
      {(loadingBookings && activeTab === "Bookings") || 
       (loadingTransactions && activeTab === "Transactions") ? (
        <div className="text-center py-8">Loading...</div>
      ) : viewLayout === "card" && activeTab === "Bookings" ? (
        /* Card View Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                booking.adminRead
                  ? "border-gray-200 bg-gray-50"
                  : "border-blue-400 bg-blue-50 shadow-md"
              }`}
              onClick={() => openModal(booking)}
            >
              {/* Unread indicator */}
              {!booking.adminRead && (
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    New
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(booking._id);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                  >
                    Mark as read
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                  <p className="font-semibold text-gray-900">{booking.customer?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Service</p>
                  <p className="font-medium text-gray-800">{booking.serviceName}</p>
                  <p className="text-xs text-gray-600">{booking.categoryName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                    <p className="font-semibold text-gray-900">KSh {booking.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery</p>
                    <p className="text-sm text-gray-700">{formatDate(booking.delivery_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(booking);
                  }}
                  className="flex items-center gap-2 py-1 px-3 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600 transition-colors"
                >
                  <FaEye size={12} />
                  View Details
                </button>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="col-span-full p-6 text-center text-gray-500">
              No bookings found.
            </div>
          )}
        </div>
      ) : (
        /* Table Section */
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <div className="overflow-y-auto max-h-96 scrollbar-thin">
            {activeTab === "Bookings" && (
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-gray-50 z-20">
                  <tr className="border-b border-gray-300">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Service</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Delivery Date</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking, idx) => (
                    <tr 
                      key={booking._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        booking.adminRead ? "" : "bg-blue-50 border-l-4 border-blue-400"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="p-3 text-sm text-gray-900">
                        {booking.customer?.name || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {booking.serviceName} ({booking.categoryName})
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        KSh {booking.amount}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {formatDate(booking.delivery_date)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => openModal(booking)}
                          className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          <FaEye size={12} />
                          View
                        </button>
                        {!booking.adminRead && (
                          <button
                            onClick={() => markAsRead(booking._id)}
                            className="py-1 px-3 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors flex items-center gap-1"
                            title="Mark as read"
                          >
                            <FaCheckCircle size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "Transactions" && (
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-gray-50 z-20">
                  <tr className="border-b border-gray-300">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Service</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, idx) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="p-3 text-sm text-gray-900">{transaction.customer}</td>
                      <td className="p-3 text-sm text-gray-900">{transaction.serviceName}</td>
                      <td className="p-3 text-sm text-gray-900">KSh {transaction.amount}</td>
                      <td className="p-3 text-sm text-gray-900">{transaction.phone}</td>
                      <td className="p-3 text-sm text-gray-900 font-mono text-xs">
                        {transaction.transactionId}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openModal(transaction)}
                          className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {((activeTab === "Bookings" && bookings.length === 0) ||
              (activeTab === "Transactions" && transactions.length === 0)) && (
              <div className="p-6 text-center text-gray-500">
                No records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-6 text-gray-900">
              {activeTab === "Bookings" ? "Booking" : "Transaction"} Details
            </h3>
            
            <div className="space-y-4">
              {activeTab === "Bookings" ? (
                <>
                  {/* Customer Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.customer?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.customer?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Service Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Service</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.serviceName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.categoryName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Provider</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.providerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Provider Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.providerPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Booking Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="text-sm font-medium text-gray-900">KSh {selectedRecord.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedRecord.delivery_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedRecord.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRecord.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">City</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.notes || 'No notes'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Timestamps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedRecord.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Updated</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedRecord.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Transaction - Customer Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Customer Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.customer || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction - Service Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Service Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Service Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.serviceName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.categoryName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction - Payment Section */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="text-sm font-medium text-gray-900">KSh {selectedRecord.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</p>
                        <p className="text-sm font-mono text-gray-900">{selectedRecord.transactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRecord.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction - Details Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Transaction Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedRecord.createdAt)}</p>
                      </div>
                      {selectedRecord.bookingId && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Booking ID</p>
                          <p className="text-sm font-mono text-gray-900">{typeof selectedRecord.bookingId === 'object' ? (selectedRecord.bookingId._id || JSON.stringify(selectedRecord.bookingId)) : String(selectedRecord.bookingId)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {activeTab === "Bookings" && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Update Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedRecord._id, status)}
                      disabled={updatingBooking}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedRecord.status === status
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } ${updatingBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-gray-300 text-sm hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAndTransactions;
