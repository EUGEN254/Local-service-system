import React, { useContext, useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ShareContext } from "../../sharedcontext/SharedContext";
import axios from "axios";
import {
  HiClipboardList,
  HiCog,
  HiXCircle,
  HiCurrencyDollar,
  HiCalendar,
  HiStar,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";

const Dashboard = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [chartData, setChartData] = useState([]);
  const [summaryCards, setSummaryCards] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/customer/mybookings`,
          { withCredentials: true }
        );

        if (data.success) setBookings(data.bookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [backendUrl]);

  const computeChartData = (bookings, timeFilter) => {
    const grouped = {};
    bookings.forEach((b) => {
      const localDate = new Date(b.delivery_date);
      let key, displayLabel;

      if (timeFilter === "Daily") {
        key = localDate.toISOString().split("T")[0];
        displayLabel = localDate.toLocaleDateString();
      } else if (timeFilter === "Weekly") {
        const weekStart = new Date(localDate);
        weekStart.setDate(localDate.getDate() - localDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        key = weekStart.toISOString().split("T")[0];
        const options = { month: "short", day: "numeric" };
        displayLabel = `${weekStart.toLocaleDateString(
          undefined,
          options
        )} - ${weekEnd.toLocaleDateString(undefined, options)}`;
      } else {
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        key = `${year}-${month}`;
        displayLabel = localDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      }

      if (!grouped[key])
        grouped[key] = {
          Completed: 0,
          Pending: 0,
          "In Progress": 0,
          Cancelled: 0,
          label: displayLabel,
        };

      // Use actual status from database
      if (b.status === "Completed") grouped[key].Completed += 1;
      else if (b.status === "Pending") grouped[key].Pending += 1;
      else if (b.status === "Waiting for Work" || b.status === "In Progress")
        grouped[key]["In Progress"] += 1;
      else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        period: grouped[key].label,
        Completed: grouped[key].Completed,
        Pending: grouped[key].Pending,
        "In Progress": grouped[key]["In Progress"],
        Cancelled: grouped[key].Cancelled,
      }));
  };

  useEffect(() => {
    setChartData(computeChartData(bookings, timeFilter));
  }, [bookings, timeFilter]);

  // Enhanced summary cards for users
  useEffect(() => {
    const totalSpent = bookings
      .filter((b) => b.is_paid)
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const upcomingBookings = bookings.filter(
      (b) =>
        new Date(b.delivery_date) >= new Date() &&
        b.status !== "Cancelled" &&
        b.status !== "Completed"
    );

    setSummaryCards([
      {
        title: "Upcoming Services",
        count: upcomingBookings.length,
        bgColor: "bg-blue-500",
        icon: HiCalendar,
        description: "Scheduled services",
      },
      {
        title: "Pending Payments",
        count: bookings.filter((b) => !b.is_paid && b.status !== "Cancelled")
          .length,
        bgColor: "bg-yellow-500",
        icon: HiCurrencyDollar,
        description: "Awaiting payment",
      },
      {
        title: "Completed Services",
        count: bookings.filter((b) => b.status === "Completed").length,
        bgColor: "bg-green-500",
        icon: HiCheckCircle,
        description: "Finished jobs",
      },
      {
        title: "Total Spent",
        count: `${currSymbol}${totalSpent}`,
        bgColor: "bg-purple-500",
        icon: HiStar,
        description: "All time",
      },
      {
        title: "In Progress",
        count: bookings.filter(
          (b) => b.status === "Waiting for Work" || b.status === "In Progress"
        ).length,
        bgColor: "bg-orange-500",
        icon: HiClock,
        description: "Active work",
      },
      {
        title: "Cancelled",
        count: bookings.filter((b) => b.status === "Cancelled").length,
        bgColor: "bg-gray-500",
        icon: HiXCircle,
        description: "Cancelled requests",
      },
    ]);
  }, [bookings, currSymbol]);

  // Pie chart data for service status distribution
  const pieChartData = [
    {
      name: "Completed",
      value: bookings.filter((b) => b.status === "Completed").length,
      color: "#10B981",
    },
    {
      name: "In Progress",
      value: bookings.filter(
        (b) => b.status === "Waiting for Work" || b.status === "In Progress"
      ).length,
      color: "#F59E0B",
    },
    {
      name: "Pending",
      value: bookings.filter((b) => b.status === "Pending").length,
      color: "#3B82F6",
    },
    {
      name: "Cancelled",
      value: bookings.filter((b) => b.status === "Cancelled").length,
      color: "#EF4444",
    },
  ];

  // Custom label component to prevent overlapping
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is more than 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const filteredRequests = bookings
    .map((b, idx) => ({
      no: idx + 1,
      serviceId: b.serviceId,
      service: b.serviceName,
      status: b.status,
      payment: b.is_paid
        ? "Paid"
        : b.paymentMethod === "Cash"
        ? "Cash"
        : "Not Paid",
      location: b.city,
      date: new Date(b.delivery_date).toLocaleDateString(),
      amount: b.amount,
      provider: b.providerName || "N/A",
    }))
    .filter(
      (req) =>
        (statusFilter === "" || req.status === statusFilter) &&
        (paymentFilter === "" || req.payment === paymentFilter)
    );

  const handleView = async (serviceId, index) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/serviceprovider/details/${serviceId}`,
        { withCredentials: true }
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
            top: rect.top + scrollTop + 120,
            right: viewportWidth - rect.right - scrollLeft,
          });
        }

        setServiceModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching service details:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serviceModalOpen && !event.target.closest(".service-modal")) {
        setServiceModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [serviceModalOpen]);

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2"
      style={{ backgroundColor: color }}
    />
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600";
      case "Waiting for Work":
      case "In Progress":
        return "text-orange-600";
      case "Pending":
        return "text-yellow-600";
      case "Cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-2xl font-bold text-gray-800">My Dashboard</p>
        <div className="text-sm text-gray-600">
          {bookings.length} total service{bookings.length !== 1 ? "s" : ""}{" "}
          booked
        </div>
      </div>

      {/* Enhanced Summary Cards Grid with Horizontal Scroll on Small Screens */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:overflow-visible">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`${card.bgColor} flex-shrink-0 flex flex-col justify-between p-4 rounded-xl shadow-lg text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer min-h-[120px] min-w-[200px] md:min-w-0`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium opacity-90">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.count}</p>
                </div>
                <Icon className="text-white text-xl opacity-80" />
              </div>
              <p className="text-xs opacity-80 mt-2">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <p className="font-semibold text-gray-700 text-lg">
            Service Timeline
          </p>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {dotStyle("#10B981")}
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Completed
              </span>
              {dotStyle("#F59E0B")}
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                In Progress
              </span>
              {dotStyle("#3B82F6")}
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Pending
              </span>
              {dotStyle("#EF4444")}
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Cancelled
              </span>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, bottom: 5 }}
                barSize={12}
              >
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Completed" fill="#10B981" radius={[5, 5, 0, 0]} />
                <Bar
                  dataKey="In Progress"
                  fill="#F59E0B"
                  radius={[5, 5, 0, 0]}
                />
                <Bar dataKey="Pending" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Cancelled" fill="#EF4444" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - FIXED VERSION */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          <p className="font-semibold text-gray-700 text-lg">
            Service Distribution
          </p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} services`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend below the chart */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieChartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Requests Table */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            My Service Requests
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Waiting for Work">Waiting for Work</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Payment</option>
              <option value="Paid">Paid</option>
              <option value="Cash">Cash</option>
              <option value="Not Paid">Not Paid</option>
            </select>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <div className="overflow-y-auto max-h-96 scrollbar-thin">
            <table className="w-full min-w-[800px]">
              <thead className="sticky top-0 bg-gray-50 z-20">
                <tr className="border-b border-gray-300">
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    #
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Service
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Provider
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Payment
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Location
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Schedule Date
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      <div className="flex justify-center items-center">
                        <HiClock className="animate-spin text-2xl mr-2" />
                        Loading your bookings...
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-sm text-gray-900 font-medium">
                        {req.no}
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {req.service}
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {req.provider}
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`font-semibold ${getStatusColor(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-sm font-semibold ${
                          req.payment === "Paid"
                            ? "text-green-600"
                            : req.payment === "Cash"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {req.payment}
                      </td>
                      <td className="p-4 text-sm text-gray-900 font-semibold">
                        {currSymbol} {req.amount || "0"}
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {req.location}
                      </td>
                      <td className="p-4 text-sm text-gray-900">{req.date}</td>
                      <td className="p-4 whitespace-nowrap">
                        <button
                          ref={(el) => (buttonRefs.current[idx] = el)}
                          onClick={() => handleView(req.serviceId, idx)}
                          className="py-2 px-4 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors shadow-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      <div className="flex flex-col items-center">
                        <HiExclamationCircle className="text-3xl text-gray-400 mb-2" />
                        <p>No service requests found for selected filters.</p>
                        <p className="text-sm mt-1">
                          Try changing your filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Modal */}
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

          {/* Service Image */}
          {selectedService.service?.image && (
            <div className="w-full h-40 overflow-hidden rounded-lg mb-3">
              <img
                src={selectedService.service.image}
                alt={selectedService.service.serviceName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
            {selectedService.service?.serviceName}
          </h2>

          <div className="space-y-2 text-gray-700 text-sm">
            {/* Service Details */}
            <div className="flex justify-between">
              <span className="font-semibold">Category:</span>
              <span>{selectedService.service?.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Provider:</span>
              <span>{selectedService.serviceProvider?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Amount:</span>
              <span className="font-semibold">
                {currSymbol} {selectedService.service?.amount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Status:</span>
              <span
                className={`font-semibold ${getStatusColor(
                  selectedService.service?.status
                )}`}
              >
                {selectedService.service?.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Added on:</span>
              <span>
                {new Date(
                  selectedService.service?.dateAdded
                ).toLocaleDateString()}
              </span>
            </div>

            {/* Service Provider Contact Details */}
            <div className="border-t pt-2 mt-2">
              <p className="font-semibold text-gray-800 mb-2">
                Provider Contact:
              </p>

              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span className="font-semibold text-blue-600">
                  {selectedService.serviceProvider?.phone}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold">Address:</span>
                <span className="font-semibold">
                  {selectedService.serviceProvider?.address}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-3 pt-2 border-t">
            <button
              onClick={() => setServiceModalOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Fixed JSX warning by using style tag without jsx attribute */}
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

export default Dashboard;
