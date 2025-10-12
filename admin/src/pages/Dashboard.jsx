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

// Icons for summary cards (you can replace these with your actual icons)
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
      },
      {
        title: "Active Bookings",
        count: summaryStats.activeBookings,
        bgColor: "bg-orange-500",
        icon: ClockIcon,
        description: "Pending & In Progress",
      },
      {
        title: "Completed",
        count: summaryStats.completedBookings,
        bgColor: "bg-green-500",
        icon: ChartIcon,
        description: "Successfully delivered",
      },
      {
        title: "Total Revenue",
        count: `KSh ${summaryStats.totalRevenue.toLocaleString()}`,
        bgColor: "bg-purple-500",
        icon: MoneyIcon,
        description: "From paid bookings",
      },
      {
        title: "Total Customers",
        count: summaryStats.totalCustomers,
        bgColor: "bg-indigo-500",
        icon: UsersIcon,
        description: "Registered users",
      },
      {
        title: "Service Providers",
        count: `${summaryStats.verifiedProviders}/${summaryStats.totalProviders}`,
        bgColor: "bg-teal-500",
        icon: ToolsIcon,
        description: "Verified/Total",
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
      // Monthly data - group by month
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
      // Weekly data - group by week
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
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
      {/* Dashboard Title */}
      <p className="mb-3 text-xl font-semibold">Admin Dashboard</p>

      {/* Dynamic Summary Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {dynamicSummaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.bgColor} flex-shrink-0 flex items-center justify-between p-4 rounded-xl shadow-md text-white
                transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer min-w-[220px]`}
            >
              <div>
                <p className="text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.count}</p>
                <p className="text-xs opacity-90 mt-1">{card.description}</p>
              </div>
              <Icon />
            </div>
          );
        })}
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-700">Booking Overview</p>
          <div className="text-sm text-gray-600">
            Total: {summaryStats.totalBookings} | Completed:{" "}
            {summaryStats.completedBookings} | Active:{" "}
            {summaryStats.activeBookings}
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {dotStyle("#10B981")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              Completed
            </span>
            {dotStyle("#EF4444")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              Cancelled
            </span>
            {dotStyle("#3B82F6")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              In Progress
            </span>
            {dotStyle("#F59E0B")}
            <span className="text-xs sm:text-sm font-semibold text-gray-700">
              Pending
            </span>
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>

        <div className="w-full h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={timeFilter === "Monthly" ? "month" : "week"} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Completed" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Cancelled" fill="#EF4444" radius={[2, 2, 0, 0]} />
                <Bar
                  dataKey="In Progress"
                  fill="#3B82F6"
                  radius={[2, 2, 0, 0]}
                />
                <Bar dataKey="Pending" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {loadingAllBookings
                ? "Loading booking data..."
                : "No booking data available"}
            </div>
          )}
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
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
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
              <option value="Unpaid">Unpaid</option>
            </select>
            <button
              onClick={fetchAllBookings}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Upcoming Requests</h2>

        {loadingAllBookings ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-2">Loading bookings...</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <div className="overflow-y-auto max-h-96 scrollbar-thin">
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-gray-50 z-20">
                  <tr className="border-b border-gray-300">
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      No
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Provider
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Service
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Payment
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Location
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          <div>
                            <div className="font-medium">
                              {booking.customer?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.customer?.phone || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          {booking.providerName || "N/A"}
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          {booking.serviceName}
                          {booking.categoryName && (
                            <div className="text-xs text-gray-500">
                              {booking.categoryName}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          KSh {booking.amount}
                        </td>
                        <td className="p-3 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                        <td className="p-3 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.is_paid
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.is_paid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          {booking.address || "N/A"}
                          {booking.city && (
                            <div className="text-xs text-gray-500">
                              {booking.city}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(
                            booking.delivery_date || booking.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <button
                            onClick={() => {
                              /* Add view details functionality */
                            }}
                            className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          >
                            View
                          </button>
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
                <div className="p-8 text-center text-gray-500">
                  No bookings found for selected filters.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bookings & Transactions Section */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <BookingsAndTransactions />
      </div>

      {/* Users & Service Providers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customers Section */}
        <div className="bg-white p-4 rounded-xl shadow-md space-y-3 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Customers</h2>
            <button
              onClick={fetchCustomers}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No customers found.
            </div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer, idx) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">
                      {customer.name || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {customer.email}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {customer.phone || "N/A"}
                    </td>
                    <td className="p-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    <td className="p-3 whitespace-nowrap">
                      <button className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Service Providers Section */}
        <div className="bg-white p-4 rounded-xl shadow-md space-y-3 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Service Providers</h2>
            <button
              onClick={fetchServiceProviders}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingProviders ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">Loading service providers...</p>
            </div>
          ) : contextServiceProviders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service providers found.
            </div>
          ) : (
            <table className="w-full min-w-[500px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Verified
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contextServiceProviders.map((provider, idx) => (
                  <tr key={provider._id} className="hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">
                      {provider.name || "N/A"}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {provider.email}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {provider.phone || "N/A"}
                    </td>
                    <td className="p-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    <td className="p-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          provider.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {provider.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button className="py-1 px-3 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* notification */}
      <Notifications/>
    </div>
  );
};

export default Dashboard;
