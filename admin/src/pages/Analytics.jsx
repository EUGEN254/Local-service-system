import React, { useRef, useContext, useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { AdminContext } from "../context/AdminContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  HiDownload, 
  HiCalendar, 
  HiCurrencyDollar, 
  HiUserGroup,
  HiStar,
  HiTrendingUp,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle
} from "react-icons/hi";

// Move helper functions BEFORE the useMemo hook where they're used
const computeTimelineData = (bookings, range) => {
  const grouped = {};
  
  bookings.forEach(b => {
    const date = new Date(b.delivery_date || b.createdAt);
    let key, displayLabel;

    if (range === "day") {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      displayLabel = key;
    } else if (range === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      displayLabel = `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleString('default', { month: 'short' })}`;
    } else if (range === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      displayLabel = date.toLocaleString('default', { month: 'short' });
    } else {
      key = date.getFullYear().toString();
      displayLabel = date.getFullYear().toString();
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: displayLabel,
        Completed: 0,
        Pending: 0,
        'In Progress': 0,
        Cancelled: 0
      };
    }

    if (b.status === "Completed") grouped[key].Completed += 1;
    else if (b.status === "Pending") grouped[key].Pending += 1;
    else if (b.status === "Waiting for Work" || b.status === "In Progress") grouped[key]['In Progress'] += 1;
    else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
  });

  return Object.values(grouped).sort((a, b) => {
    if (range === "day") return new Date(a.period) - new Date(b.period);
    return a.period.localeCompare(b.period);
  });
};

const computeRevenueTrend = (completedBookings, range) => {
  const grouped = {};
  
  completedBookings.forEach(b => {
    const date = new Date(b.createdAt);
    let key, displayLabel;

    if (range === "day") {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      displayLabel = key;
    } else if (range === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
      displayLabel = `Week ${Math.ceil(date.getDate() / 7)}`;
    } else if (range === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      displayLabel = date.toLocaleString('default', { month: 'short' });
    } else {
      key = date.getFullYear().toString();
      displayLabel = date.getFullYear().toString();
    }

    if (!grouped[key]) grouped[key] = { period: displayLabel, revenue: 0 };
    grouped[key].revenue += b.amount || 0;
  });

  return Object.values(grouped).sort((a, b) => {
    if (range === "day") return new Date(a.period) - new Date(b.period);
    return a.period.localeCompare(b.period);
  });
};

const computeRepeatCustomers = (bookings) => {
  const customerBookings = bookings.reduce((acc, b) => {
    const customerId = b.customer?._id || b.customer;
    if (customerId) {
      if (!acc[customerId]) acc[customerId] = [];
      acc[customerId].push(b);
    }
    return acc;
  }, {});
  
  return Object.values(customerBookings).filter(bookings => bookings.length > 1);
};

const Analytics = () => {
  const { allBookings, customers, serviceProviders, fetchAllBookings, loadingAllBookings } = useContext(AdminContext);
  const analyticsRef = useRef();
  const [timeRange, setTimeRange] = useState("month");

  const COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"];

  // Fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchAllBookings();
  }, [timeRange]);

  // Generate analytics data from actual bookings - FIXED VERSION
  const analyticsData = useMemo(() => {
    if (!allBookings.length) {
      return {
        summary: {
          totalRequests: 0,
          completedJobs: 0,
          totalRevenue: 0,
          avgRevenuePerJob: 0,
          uniqueCustomers: 0,
          repeatCustomers: 0,
          completionRate: 0,
          pendingJobs: 0,
          inProgressJobs: 0
        },
        timelineData: [],
        statusDistribution: [],
        revenueTrend: [],
        categoryData: [],
        providerPerformance: []
      };
    }

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredBookings = allBookings.filter(b => 
      new Date(b.createdAt || b.delivery_date) >= startDate
    );

    const completedBookings = filteredBookings.filter(b => b.status === "Completed" && b.is_paid);
    const pendingBookings = filteredBookings.filter(b => b.status === "Pending");
    const inProgressBookings = filteredBookings.filter(b => b.status === "In Progress" || b.status === "Waiting for Work");
    const cancelledBookings = filteredBookings.filter(b => b.status === "Cancelled");

    // Revenue calculations
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const avgRevenuePerJob = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    // Status distribution for charts
    const statusDistribution = [
      { name: 'Completed', value: completedBookings.length, color: '#10B981' },
      { name: 'In Progress', value: inProgressBookings.length, color: '#F59E0B' },
      { name: 'Pending', value: pendingBookings.length, color: '#3B82F6' },
      { name: 'Cancelled', value: cancelledBookings.length, color: '#EF4444' }
    ];

    // Timeline data - Now these functions are defined before useMemo
    const timelineData = computeTimelineData(filteredBookings, timeRange);
    const revenueTrend = computeRevenueTrend(completedBookings, timeRange);

    // Customer analytics
    const uniqueCustomers = new Set(filteredBookings.map(b => b.customer?._id || b.customer)).size;
    const repeatCustomers = computeRepeatCustomers(filteredBookings);

    // Category data
    const categoryMap = {};
    filteredBookings.forEach(booking => {
      const category = booking.categoryName || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([category, requests]) => ({
      category: category.length > 10 ? category.substring(0, 10) + '...' : category,
      requests,
      fullCategory: category
    }));

    // Provider Performance
    const providerMap = {};
    filteredBookings.forEach(booking => {
      const provider = booking.providerName || 'Unknown';
      if (!providerMap[provider]) {
        providerMap[provider] = { completed: 0, total: 0 };
      }
      providerMap[provider].total++;
      if (booking.status === 'Completed') {
        providerMap[provider].completed++;
      }
    });
    const providerPerformance = Object.entries(providerMap).map(([provider, data]) => ({
      provider: provider.length > 12 ? provider.substring(0, 12) + '...' : provider,
      completionRate: Math.round((data.completed / data.total) * 100),
      fullProvider: provider
    }));

    return {
      summary: {
        totalRequests: filteredBookings.length,
        completedJobs: completedBookings.length,
        totalRevenue,
        avgRevenuePerJob,
        uniqueCustomers,
        repeatCustomers: repeatCustomers.length,
        completionRate: filteredBookings.length > 0 ? (completedBookings.length / filteredBookings.length * 100).toFixed(1) : 0,
        pendingJobs: pendingBookings.length,
        inProgressJobs: inProgressBookings.length
      },
      timelineData,
      statusDistribution,
      revenueTrend,
      categoryData,
      providerPerformance
    };
  }, [allBookings, timeRange]);

  // ... rest of your component code remains the same
  const generatePDFReport = async () => {
    if (!analyticsRef.current) return;

    try {
      const element = analyticsRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      let pageNumber = 1;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Page ${i} of ${totalPages} • Generated on ${new Date().toLocaleDateString()}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      pdf.save(`admin-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const summaryCards = [
    {
      title: "Total Bookings",
      value: analyticsData.summary?.totalRequests || 0,
      icon: HiCalendar,
      bgColor: "bg-blue-500",
      description: `Current ${timeRange}`
    },
    {
      title: "Completed Jobs",
      value: analyticsData.summary?.completedJobs || 0,
      icon: HiCheckCircle,
      bgColor: "bg-green-500",
      description: `${analyticsData.summary?.completionRate || 0}% completion rate`
    },
    {
      title: "Total Revenue",
      value: `KSh ${(analyticsData.summary?.totalRevenue || 0).toLocaleString()}`,
      icon: HiCurrencyDollar,
      bgColor: "bg-yellow-500",
      description: `Avg: KSh ${(analyticsData.summary?.avgRevenuePerJob || 0).toFixed(2)}`
    },
    {
      title: "Active Jobs",
      value: (analyticsData.summary?.inProgressJobs || 0) + (analyticsData.summary?.pendingJobs || 0),
      icon: HiClock,
      bgColor: "bg-orange-500",
      description: "In progress + pending"
    },
    {
      title: "Unique Customers",
      value: analyticsData.summary?.uniqueCustomers || 0,
      icon: HiUserGroup,
      bgColor: "bg-purple-500",
      description: `${analyticsData.summary?.repeatCustomers || 0} repeat customers`
    },
    {
      title: "Service Providers",
      value: serviceProviders.length,
      icon: HiTrendingUp,
      bgColor: "bg-indigo-500",
      description: `${serviceProviders.filter(p => p.isVerified).length} verified`
    }
  ];

  // Custom label for pie chart to prevent overlapping
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const dotStyle = (color) => (
    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
  );

  const { 
    summary,
    timelineData, 
    statusDistribution, 
    revenueTrend,
    categoryData,
    providerPerformance 
  } = analyticsData;

  if (loadingAllBookings) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div ref={analyticsRef} className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none bg-white">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <p className="text-2xl font-bold text-gray-800">Admin Analytics Dashboard</p>
          <p className="text-sm text-gray-600">Complete business overview and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <button 
            onClick={generatePDFReport}
            className="py-2 px-4 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <HiDownload className="text-lg" />
            Export PDF
          </button>
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
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
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
        {/* Service Timeline Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Booking Timeline</p>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {dotStyle("#10B981")}<span className="text-xs sm:text-sm font-semibold text-gray-700">Completed</span>
              {dotStyle("#F59E0B")}<span className="text-xs sm:text-sm font-semibold text-gray-700">In Progress</span>
              {dotStyle("#3B82F6")}<span className="text-xs sm:text-sm font-semibold text-gray-700">Pending</span>
              {dotStyle("#EF4444")}<span className="text-xs sm:text-sm font-semibold text-gray-700">Cancelled</span>
            </div>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData || []} margin={{ top: 20, bottom: 5 }} barSize={12}>
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Completed" fill="#10B981" radius={[5, 5, 0, 0]} />
                <Bar dataKey="In Progress" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Pending" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Cancelled" fill="#EF4444" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Booking Distribution</p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution || []}
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
                  {(statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} bookings`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {(statusDistribution || []).map((entry, index) => (
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

        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Revenue Trend (KSh)</p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`KSh ${value}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#D1FAE5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Bookings by Category</p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [
                  value, 
                  props.payload.fullCategory || props.payload.category
                ]} />
                <Bar dataKey="requests" fill="#8B5CF6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provider Performance */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
        <p className="font-semibold text-gray-700 text-lg">Provider Performance (Completion Rate %)</p>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value}%`, 
                  props.payload.fullProvider || props.payload.provider
                ]} 
              />
              <Bar dataKey="completionRate" fill="#F59E0B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty State Handling */}
      {allBookings.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
          <HiExclamationCircle className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
          <p className="text-gray-600">No bookings found in the system yet.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;