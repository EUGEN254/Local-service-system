import React, { useContext, useEffect, useState } from "react";
import { FaDollarSign, FaCheckCircle, FaClock, FaWallet, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";
import axios from "axios";

const Earnings = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/serviceprovider/mybookings`,
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

  // Filter bookings based on time period
  const getFilteredBookings = () => {
    const now = new Date();
    const completedBookings = bookings.filter(b => b.status === "Completed" && b.is_paid);

    switch (timeFilter) {
      case "today":
        return completedBookings.filter(b => {
          const bookingDate = new Date(b.updatedAt);
          return bookingDate.toDateString() === now.toDateString();
        });
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return completedBookings.filter(b => new Date(b.updatedAt) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return completedBookings.filter(b => new Date(b.updatedAt) >= monthAgo);
      default:
        return completedBookings;
    }
  };

  const filteredBookings = getFilteredBookings();
  const allCompletedBookings = bookings.filter(b => b.status === "Completed" && b.is_paid);

  // Calculate earnings data
  const totalEarnings = filteredBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalAllTimeEarnings = allCompletedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const completedServices = filteredBookings.length;
  const totalServicesCompleted = allCompletedBookings.length;

  // Calculate pending earnings (bookings that are completed but might have pending payout)
  const pendingPayoutBookings = bookings.filter(b => 
    b.status === "Completed" && b.is_paid
    // Add your payout logic here if you have a payout system
  );
  const pendingPayout = pendingPayoutBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Calculate this month's growth
  const thisMonthBookings = allCompletedBookings.filter(b => {
    const bookingDate = new Date(b.updatedAt);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear();
  });
  const lastMonthBookings = allCompletedBookings.filter(b => {
    const bookingDate = new Date(b.updatedAt);
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return bookingDate.getMonth() === lastMonth && 
           bookingDate.getFullYear() === lastMonthYear;
  });

  const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const lastMonthEarnings = lastMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const growthPercentage = lastMonthEarnings > 0 
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
    : thisMonthEarnings > 0 ? 100 : 0;

  const summaryCards = [
    {
      title: "Total Earnings",
      value: `${currSymbol}${totalEarnings}`,
      description: `All time: ${currSymbol}${totalAllTimeEarnings}`,
      bgColor: "bg-gradient-to-r from-yellow-500 to-orange-500",
      icon: <FaDollarSign className="text-2xl" />,
    },
    {
      title: "Services Completed",
      value: completedServices,
      description: `Total: ${totalServicesCompleted} services`,
      bgColor: "bg-gradient-to-r from-green-500 to-emerald-600",
      icon: <FaCheckCircle className="text-2xl" />,
    },
    {
      title: "Available for Payout",
      value: `${currSymbol}${pendingPayout}`,
      description: "Ready to withdraw",
      bgColor: "bg-gradient-to-r from-blue-500 to-cyan-600",
      icon: <FaWallet className="text-2xl" />,
    },
    {
      title: "Monthly Growth",
      value: `${growthPercentage}%`,
      description: "vs last month",
      bgColor: "bg-gradient-to-r from-purple-500 to-pink-600",
      icon: <FaChartLine className="text-2xl" />,
    },
  ];

  // Group earnings by service for detailed breakdown
  const earningsByService = filteredBookings.reduce((acc, booking) => {
    const serviceName = booking.serviceName || "Unknown Service";
    if (!acc[serviceName]) {
      acc[serviceName] = {
        serviceName,
        count: 0,
        totalAmount: 0,
        category: booking.categoryName || "Uncategorized"
      };
    }
    acc[serviceName].count += 1;
    acc[serviceName].totalAmount += booking.amount || 0;
    return acc;
  }, {});

  const earningsByServiceArray = Object.values(earningsByService);

  return (
    <div className="space-y-6 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <p className="text-xl font-semibold text-gray-800">Earnings Overview</p>
        
        {/* Time Filter */}
        <div className="flex gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-6">
            <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4 min-w-max">
                {summaryCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`${card.bgColor} text-white rounded-xl p-4 sm:p-6 shadow-lg transform transition-all duration-300 flex flex-col hover:scale-105 min-h-[120px] min-w-[280px]`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium opacity-90">{card.title}</p>
                        <p className="text-xl font-bold mt-1">{card.value}</p>
                      </div>
                      {card.icon}
                    </div>
                    <p className="text-xs opacity-80 mt-2">{card.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card, idx) => (
                <div
                  key={idx}
                  className={`${card.bgColor} text-white rounded-xl p-4 sm:p-6 shadow-lg transform transition-all duration-300 flex flex-col hover:scale-105 min-h-[120px]`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium opacity-90">{card.title}</p>
                      <p className="text-xl font-bold mt-1">{card.value}</p>
                    </div>
                    {card.icon}
                  </div>
                  <p className="text-xs opacity-80 mt-2">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings Breakdown by Service */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Earnings Breakdown by Service
            </h3>
            
            {earningsByServiceArray.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-x-auto overflow-y-auto scrollbar-thin">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-300">
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Service</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Jobs Completed</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Total Earnings</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Average per Job</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earningsByServiceArray.map((service, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-900 font-medium">
                            {service.serviceName}
                          </td>
                          <td className="p-3 text-sm text-gray-900">
                            {service.category}
                          </td>
                          <td className="p-3 text-sm text-gray-900">
                            {service.count}
                          </td>
                          <td className="p-3 text-sm text-gray-900 font-semibold">
                            {currSymbol}{service.totalAmount}
                          </td>
                          <td className="p-3 text-sm text-gray-900">
                            {currSymbol}{(service.totalAmount / service.count).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t border-gray-300">
                        <td colSpan="3" className="p-3 text-sm font-semibold text-gray-700 text-right">
                          Total:
                        </td>
                        <td className="p-3 text-sm font-semibold text-yellow-600">
                          {currSymbol}{totalEarnings}
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          {currSymbol}{(totalEarnings / completedServices).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-2" />
                <p>No earnings data for the selected period</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Completed Jobs</h3>
            
            {filteredBookings.length > 0 ? (
              <div className="space-y-3">
                {filteredBookings.slice(0, 5).map((booking, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.serviceName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.updatedAt).toLocaleDateString()} • {booking.customer?.name || "Customer"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{currSymbol}{booking.amount}</p>
                      <p className="text-xs text-gray-500 capitalize">{booking.paymentMethod?.toLowerCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No recent completed jobs
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Earnings;