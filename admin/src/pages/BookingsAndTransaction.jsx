import React, { useState } from "react";
import { bookings as initialBookings, transactions as initialTransactions } from "../assets/assets";

const tabs = ["Bookings", "Transactions"];

const BookingsAndTransaction = () => {
  const [activeTab, setActiveTab] = useState("Bookings");
  const [selectedRecord, setSelectedRecord] = useState(null); // for modal
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setModalOpen(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Bookings & Transactions</h2>

      {/* Tabs */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <div className="overflow-y-auto max-h-96 scrollbar-thin">
          {activeTab === "Bookings" && (
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr className="border-b border-gray-300">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Service</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialBookings.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">{b.user}</td>
                    <td className="p-3 text-sm text-gray-900">{b.service}</td>
                    <td className="p-3 text-sm text-gray-900">{b.date}</td>
                    <td className="p-3 text-sm text-gray-900">{b.time}</td>
                    <td
                      className={`p-3 text-sm font-semibold ${
                        b.status === "Confirmed"
                          ? "text-green-600"
                          : b.status === "Cancelled"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {b.status}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => openModal(b)}
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
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr className="border-b border-gray-300">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount ($)</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Payment Method</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialTransactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">{t.user}</td>
                    <td className="p-3 text-sm text-gray-900">{t.amount}</td>
                    <td
                      className={`p-3 text-sm font-semibold ${
                        t.status === "Paid"
                          ? "text-green-600"
                          : t.status === "Failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {t.status}
                    </td>
                    <td className="p-3 text-sm text-gray-900">{t.date}</td>
                    <td className="p-3 text-sm text-gray-900">{t.method}</td>
                    <td className="p-3">
                      <button
                        onClick={() => openModal(t)}
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

          {(activeTab === "Bookings" && initialBookings.length === 0) ||
          (activeTab === "Transactions" && initialTransactions.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              No records found.
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <div className="mb-2">
              {Object.entries(selectedRecord).map(([key, value]) => (
                <p key={key} className="text-sm text-gray-700">
                  <span className="font-semibold">{key}:</span> {value}
                </p>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              {selectedRecord.user && (
                <>
                  <a
                    href={`mailto:${selectedRecord.user.replace(" ", "").toLowerCase()}@example.com`}
                    className="py-1 px-3 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                  >
                    Contact
                  </a>
                </>
              )}
              <button
                onClick={closeModal}
                className="py-1 px-3 rounded-lg bg-gray-300 text-sm hover:bg-gray-400 transition-colors"
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

export default BookingsAndTransaction;
