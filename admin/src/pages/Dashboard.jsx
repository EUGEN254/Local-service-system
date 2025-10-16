import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AdminContext } from "../context/AdminContext";
import BookingsAndTransactions from "./BookingsAndTransaction";
import Notifications from "./Notifications";

// Icons for summary cards
const UsersIcon = () => <i className="fas fa-users text-white text-2xl"></i>;
const CalendarIcon = () => (
  <i className="fas fa-calendar-check text-white text-2xl"></i>
);
const MoneyIcon = () => (
  <i className="fas fa-money-bill-wave text-white text-2xl"></i>
);
const ToolsIcon = () => <i className="fas fa-tools text-white text-2xl"></i>;
const ChartIcon = () => (
  <i className="fas fa-chart-line text-white text-2xl"></i>
);
const ClockIcon = () => <i className="fas fa-clock text-white text-2xl"></i>;

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [activeTab, setActiveTab] = useState("overview");

  const {
    customers,
    fetchCustomers,
    loadingUsers,
    serviceProviders: contextServiceProviders,
    fetchServiceProviders,
    loadingProviders,
    allBookings,
    fetchAllBookings,
    loadingAllBookings,
  } = useContext(AdminContext);

  // Fetch customers and service providers on component mount
  useEffect(() => {
    fetchCustomers();
    fetchServiceProviders();
    fetchAllBookings();
  }, []);

  // Calculate all statistics for summary cards
  const summaryStats = useMemo(() => {
    if (!allBookings.length) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        inProgressBookings: 0,
        totalRevenue: 0,
        paidBookings: 0,
        totalCustomers: customers.length,
        totalProviders: contextServiceProviders.length,
        verifiedProviders: contextServiceProviders.filter((p) => p.isVerified)
          .length,
        activeBookings: 0,
      };
    }

    const totalRevenue = allBookings
      .filter((booking) => booking.is_paid)
      .reduce((sum, booking) => sum + (booking.amount || 0), 0);

    return {
      totalBookings: allBookings.length,
      completedBookings: allBookings.filter((b) => b.status === "Completed")
        .length,
      pendingBookings: allBookings.filter((b) => b.status === "Pending").length,
      inProgressBookings: allBookings.filter((b) => b.status === "In Progress")
        .length,
      totalRevenue: totalRevenue,
      paidBookings: allBookings.filter((b) => b.is_paid).length,
      totalCustomers: customers.length,
      totalProviders: contextServiceProviders.length,
      verifiedProviders: contextServiceProviders.filter((p) => p.isVerified)
        .length,
      activeBookings: allBookings.filter(
        (b) =>
          b.status === "Pending" ||
          b.status === "In Progress" ||
          b.status === "Confirmed"
      ).length,
    };
  }, [allBookings, customers, contextServiceProviders]);

  // Generate dynamic summary cards based on actual data
  const dynamicSummaryCards = useMemo(
    () => [
      {
        title: "Total Bookings",
        count: summaryStats.totalBookings,
        bgColor: "bg-blue-500",
        icon: CalendarIcon,
        description: "All time bookings",
        gradient: "from-blue-500 to-blue-600",
      },
      {
        title: "Active Bookings",
        count: summaryStats.activeBookings,
        bgColor: "bg-orange-500",
        icon: ClockIcon,
        description: "Pending & In Progress",
        gradient: "from-orange-500 to-orange-600",
      },
      {
        title: "Completed",
        count: summaryStats.completedBookings,
        bgColor: "bg-green-500",
        icon: ChartIcon,
        description: "Successfully delivered",
        gradient: "from-green-500 to-green-600",
      },
      {
        title: "Total Revenue",
        count: `KSh ${summaryStats.totalRevenue.toLocaleString()}`,
        bgColor: "bg-purple-500",
        icon: MoneyIcon,
        description: "From paid bookings",
        gradient: "from-purple-500 to-purple-600",
      },
      {
        title: "Total Customers",
        count: summaryStats.totalCustomers,
        bgColor: "bg-indigo-500",
        icon: UsersIcon,
        description: "Registered users",
        gradient: "from-indigo-500 to-indigo-600",
      },
      {
        title: "Service Providers",
        count: `${summaryStats.verifiedProviders}/${summaryStats.totalProviders}`,
        bgColor: "bg-teal-500",
        icon: ToolsIcon,
        description: "Verified/Total",
        gradient: "from-teal-500 to-teal-600",
      },
    ],
    [summaryStats]
  );

  // Generate chart data from actual bookings
  const chartData = useMemo(() => {
    if (!allBookings.length) return [];

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (timeFilter === "Monthly") {
      const monthlyData = {};

      allBookings.forEach((booking) => {
        const date = new Date(booking.createdAt);
        const monthYear = `${
          monthNames[date.getMonth()]
        } ${date.getFullYear()}`;

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            Completed: 0,
            Cancelled: 0,
            Pending: 0,
            "In Progress": 0,
          };
        }

        if (booking.status === "Completed") {
          monthlyData[monthYear].Completed++;
        } else if (booking.status === "Cancelled") {
          monthlyData[monthYear].Cancelled++;
        } else if (booking.status === "In Progress") {
          monthlyData[monthYear]["In Progress"]++;
        } else {
          monthlyData[monthYear].Pending++;
        }
      });

      return Object.entries(monthlyData)
        .map(([month, counts]) => ({
          month,
          ...counts,
        }))
        .sort((a, b) => {
          const [aMonth, aYear] = a.month.split(" ");
          const [bMonth, bYear] = b.month.split(" ");
          const aIndex = monthNames.indexOf(aMonth) + parseInt(aYear) * 12;
          const bIndex = monthNames.indexOf(bMonth) + parseInt(bYear) * 12;
          return aIndex - bIndex;
        })
        .slice(-6);
    } else {
      const weeklyData = {};
      const now = new Date();
      const last4Weeks = [];

      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i * 7);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekLabel = `Week ${Math.ceil((weekStart.getDate() + 6) / 7)} ${
          monthNames[weekStart.getMonth()]
        }`;
        last4Weeks.push({
          week: weekLabel,
          Completed: 0,
          Cancelled: 0,
          Pending: 0,
          "In Progress": 0,
        });
      }

      allBookings.forEach((booking) => {
        const bookingDate = new Date(booking.createdAt);
        const weekStart = new Date(bookingDate);
        weekStart.setDate(bookingDate.getDate() - bookingDate.getDay());
        const weekLabel = `Week ${Math.ceil((weekStart.getDate() + 6) / 7)} ${
          monthNames[weekStart.getMonth()]
        }`;

        const weekData = last4Weeks.find((w) => w.week === weekLabel);
        if (weekData) {
          if (booking.status === "Completed") {
            weekData.Completed++;
          } else if (booking.status === "Cancelled") {
            weekData.Cancelled++;
          } else if (booking.status === "In Progress") {
            weekData["In Progress"]++;
          } else {
            weekData.Pending++;
          }
        }
      });

      return last4Weeks;
    }
  }, [allBookings, timeFilter]);

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2 shadow-sm"
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            Welcome to your administration panel
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-2 sm:px-3 py-1 rounded-lg border">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-1 sm:p-2">
        <div className="flex flex-nowrap overflow-x-auto gap-1 sm:gap-2 pb-1 scrollbar-hide">
          {[
            { id: "overview", label: "Overview", icon: "fas fa-chart-pie" },
            { id: "bookings", label: "Bookings", icon: "fas fa-calendar" },
            { id: "customers", label: "Customers", icon: "fas fa-users" },
            {
              id: "providers",
              label: "Providers",
              icon: "fas fa-tools",
            },
            {
              id: "transactions",
              label: "Transactions",
              icon: "fas fa-money-bill",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <i className={`${tab.icon} text-xs sm:text-sm`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Dynamic Summary Cards - Horizontal scroll on small screens */}
          <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex gap-3 sm:gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {dynamicSummaryCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${card.gradient} rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden min-w-[180px] sm:min-w-0 flex-shrink-0 sm:flex-shrink`}
                  >
                    <div className="p-4 sm:p-5 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs sm:text-sm font-medium opacity-90">
                            {card.title}
                          </p>
                          <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{card.count}</p>
                          <p className="text-xs opacity-80 mt-1">
                            {card.description}
                          </p>
                        </div>
                        <div className="p-1 sm:p-2 bg-white bg-opacity-20 rounded-lg sm:rounded-xl">
                          <Icon />
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3 w-full bg-white bg-opacity-20 rounded-full h-1">
                        <div
                          className="bg-white rounded-full h-1 transition-all duration-1000"
                          style={{
                            width: `${Math.min(
                              (card.count / (summaryStats.totalBookings || 1)) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analytics Chart Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Booking Analytics
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">
                    Visual overview of booking trends and performance
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {[
                      { color: "#10B981", label: "Completed" },
                      { color: "#EF4444", label: "Cancelled" },
                      { color: "#3B82F6", label: "In Progress" },
                      { color: "#F59E0B", label: "Pending" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        {dotStyle(item.color)}
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-full sm:w-auto"
                  >
                    <option value="Monthly">Monthly View</option>
                    <option value="Weekly">Weekly View</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6">
              <div className="w-full h-64 sm:h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                      barSize={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey={timeFilter === "Monthly" ? "month" : "week"}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <YAxis
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          fontSize: "12px"
                        }}
                      />
                      <Bar
                        dataKey="Completed"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Cancelled"
                        fill="#EF4444"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="In Progress"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Pending"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-chart-bar text-xl sm:text-2xl text-gray-400"></i>
                    </div>
                    <p className="text-sm sm:text-lg font-medium text-center">
                      {loadingAllBookings
                        ? "Loading booking data..."
                        : "No booking data available"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 text-center">
                      Data will appear here once bookings are made
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bookings Tab Content */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Booking Management
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Manage and monitor all service bookings
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  className="border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-full sm:min-w-[120px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  className="border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-full sm:min-w-[120px]"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="">All Payment</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
                <button
                  onClick={fetchAllBookings}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center"
                >
                  <i className="fas fa-sync-alt text-xs"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div>
            {loadingAllBookings ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">Loading bookings data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] sm:min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "No",
                        "Customer",
                        "Provider",
                        "Service",
                        "Amount",
                        "Status",
                        "Payment status",
                        "Payment method",
                        "Location",
                        "Date",
                      ].map((header) => (
                        <th
                          key={header}
                          className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allBookings
                      .filter(
                        (booking) =>
                          (statusFilter === "" ||
                            booking.status === statusFilter) &&
                          (paymentFilter === "" ||
                            (paymentFilter === "Paid" && booking.is_paid) ||
                            (paymentFilter === "Unpaid" && !booking.is_paid))
                      )
                      .map((booking, idx) => (
                        <tr
                          key={booking._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 font-medium">
                            {idx + 1}
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <div>
                              <div className="font-medium text-gray-900">
                                {booking.customer?.name || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {booking.customer?.phone || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                            {booking.providerName || "N/A"}
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <div className="text-gray-900">
                              {booking.serviceName}
                            </div>
                            {booking.categoryName && (
                              <div className="text-xs text-gray-500">
                                {booking.categoryName}
                              </div>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-gray-900">
                            KSh {booking.amount?.toLocaleString() || "0"}
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                booking.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : booking.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.status === "Confirmed"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                booking.is_paid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.is_paid ? "Paid" : "Unpaid"}
                            </span>
                          </td>

                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                              {booking.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm">
                            <div className="text-gray-900">
                              {booking.address || "N/A"}
                            </div>
                            {booking.city && (
                              <div className="text-xs text-gray-500">
                                {booking.city}
                              </div>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                            {new Date(
                              booking.delivery_date || booking.createdAt
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {allBookings.filter(
                  (booking) =>
                    (statusFilter === "" || booking.status === statusFilter) &&
                    (paymentFilter === "" ||
                      (paymentFilter === "Paid" && booking.is_paid) ||
                      (paymentFilter === "Unpaid" && !booking.is_paid))
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
                    <i className="fas fa-inbox text-2xl sm:text-4xl mb-2 sm:mb-3 text-gray-300"></i>
                    <p className="text-sm sm:text-lg font-medium">No bookings found</p>
                    <p className="text-xs sm:text-sm">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customers Tab Content */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Customer Management
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Manage registered customers and their information
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button className="px-3 sm:px-4 py-2 bg-green-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <i className="fas fa-plus text-xs"></i>
                  Add Customer
                </button>
                <button
                  onClick={fetchCustomers}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center"
                >
                  <i className="fas fa-sync-alt text-xs"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
                <i className="fas fa-users text-2xl sm:text-4xl mb-2 sm:mb-3 text-gray-300"></i>
                <p className="text-sm sm:text-lg font-medium">No customers found</p>
                <p className="text-xs sm:text-sm">Start by adding your first customer</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "No",
                      "Name",
                      "Email",
                      "Phone",
                      "Join Date",
                      "Status",
                    ].map((header) => (
                      <th
                        key={header}
                        className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer, idx) => (
                    <tr
                      key={customer._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 font-medium">
                        {idx + 1}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            {customer.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">
                              {customer.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                        {customer.email}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                        {customer.phone || "N/A"}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            customer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : customer.status === "inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {customer.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Service Providers Tab Content */}
      {activeTab === "providers" && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Service Provider Management
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  Manage service providers and verification status
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button className="px-3 sm:px-4 py-2 bg-green-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                  <i className="fas fa-plus text-xs"></i>
                  Add Provider
                </button>
                <button
                  onClick={fetchServiceProviders}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center"
                >
                  <i className="fas fa-sync-alt text-xs"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingProviders ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-base">Loading service providers...</p>
              </div>
            ) : contextServiceProviders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
                <i className="fas fa-tools text-2xl sm:text-4xl mb-2 sm:mb-3 text-gray-300"></i>
                <p className="text-sm sm:text-lg font-medium">
                  No service providers found
                </p>
                <p className="text-xs sm:text-sm">
                  Start by adding your first service provider
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "No",
                      "Provider",
                      "Contact",
                      "Services",
                      "Verification",
                      "Status",
                    ].map((header) => (
                      <th
                        key={header}
                        className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contextServiceProviders.map((provider, idx) => (
                    <tr
                      key={provider._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 font-medium">
                        {idx + 1}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            {provider.name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">
                              {provider.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <div className="text-gray-900">{provider.email}</div>
                        <div className="text-xs text-gray-500">
                          {provider.phone || "No phone"}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900">
                        {provider.services?.length > 0
                          ? `${provider.services.length} services`
                          : "No services"}
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            provider.serviceProviderInfo?.idVerification
                              ?.status === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {provider.serviceProviderInfo?.idVerification
                            ?.status === "verified"
                            ? "Verified"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            provider.status === "active"
                              ? "bg-green-100 text-green-800"
                              : provider.status === "inactive"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {provider.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab Content */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <BookingsAndTransactions />
        </div>
      )}

      {/* Notifications - Always visible */}
      <Notifications />
    </div>
  );
};

export default Dashboard;