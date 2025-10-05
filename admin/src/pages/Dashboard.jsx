import React, { useState } from "react";
import {
  summaryCards,
  monthlyStatusData,
  upcomingRequests,
  users,
  serviceProviders,
  notifications,
} from "../assets/assets"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const tabs = ["Bookings", "Transactions"];

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [activeTab, setActiveTab] = useState("Bookings");

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  const filteredRequests = upcomingRequests.filter(
    (req) =>
      (statusFilter === "" || req.status === statusFilter) &&
      (paymentFilter === "" || req.payment === paymentFilter)
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
      {/* Dashboard Title */}
      <p className="mb-3 text-xl font-semibold">Admin Dashboard</p>

      {/* Summary Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.bgColor} flex-shrink-0 flex items-center justify-between p-4 rounded-xl shadow-md text-white
                transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer min-w-[200px]`}
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

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-2xl mx-auto">
        <p className="font-semibold text-gray-700">Overview of Services</p>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {dotStyle("#FACC15")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Completed</span>
            {dotStyle("#9CA3AF")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Cancelled</span>
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option>Monthly</option>
            <option>Weekly</option>
          </select>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyStatusData}
              margin={{ top: 20, bottom: 5 }}
              barSize={12}
              barGap={2}
              barCategoryGap={8}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Completed" fill="#FACC15" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#9CA3AF" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Requests Table */}
      <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Service Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{req.no}</td>
                    <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{req.service}</td>
                    <td className={`p-3 text-sm font-semibold whitespace-nowrap ${
                      req.status === "Completed"
                        ? "text-green-600"
                        : req.status === "Cancelled"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}>{req.status}</td>
                    <td className={`p-3 text-sm font-semibold whitespace-nowrap ${
                      req.payment === "Paid"
                        ? "text-green-600"
                        : req.payment === "Cash"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}>{req.payment}</td>
                    <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{req.location}</td>
                    <td className="p-3 text-sm text-gray-900 whitespace-nowrap">{req.date}</td>
                    <td className="p-3 whitespace-nowrap">
                      <button className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-gray-500">No requests found for selected filters.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings & Transactions Section */}
      <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
        <h2 className="text-lg font-semibold mb-4">Bookings & Transactions</h2>
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
        {/* You can reuse the BookingsAndTransactions table component here */}
      </div>

      {/* Users & Service Providers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-md space-y-3 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          <table className="w-full min-w-[500px]">
            <thead className="sticky top-0 bg-gray-50 z-20">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u, idx) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-3 text-sm text-gray-900">{u.name}</td>
                  <td className="p-3 text-sm text-gray-900">{u.email}</td>
                  <td className="p-3 text-sm text-gray-900">{u.phone}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md space-y-3 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Service Providers</h2>
          <table className="w-full min-w-[500px]">
            <thead className="sticky top-0 bg-gray-50 z-20">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceProviders.map((sp, idx) => (
                <tr key={sp.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-3 text-sm text-gray-900">{sp.name}</td>
                  <td className="p-3 text-sm text-gray-900">{sp.email}</td>
                  <td className="p-3 text-sm text-gray-900">{sp.phone}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white p-4 rounded-xl shadow-md space-y-3 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="overflow-y-auto max-h-72 scrollbar-thin">
          {notifications.map((n, idx) => (
            <div
              key={idx}
              className={`p-3 mb-2 rounded-lg ${
                n.type === "Booking" ? "bg-yellow-50" :
                n.type === "Transaction" ? "bg-green-50" :
                "bg-blue-50"
              }`}
            >
              <p className="text-sm text-gray-700 font-semibold">{n.title}</p>
              <p className="text-xs text-gray-500">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
