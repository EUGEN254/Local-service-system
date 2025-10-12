import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";


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
  } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState("Bookings");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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
  }, [activeTab, filters]);

  const openModal = (record) => {
    setSelectedRecord(record);
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
      <h2 className="text-2xl font-bold mb-6">Bookings & Transactions</h2>

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
                    <tr key={booking._id} className="hover:bg-gray-50">
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
                      <td className="p-3">
                        <button
                          onClick={() => openModal(booking)}
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
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {activeTab === "Bookings" ? "Booking" : "Transaction"} Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(selectedRecord).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-semibold text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
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