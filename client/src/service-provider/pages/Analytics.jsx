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
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { ShareContext } from "../../sharedcontext/SharedContext";
import axios from "axios";
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

const Analytics = () => {
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [analyticsData, setAnalyticsData] = useState({});
  const dashboardRef = useRef();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${backendUrl}/api/serviceprovider/mybookings`,
          { withCredentials: true }
        );
        if (data.success) {
          setBookings(data.bookings);
          computeAnalytics(data.bookings, timeRange);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [backendUrl]);

  const computeAnalytics = (bookings, range) => {
    const now = new Date();
    let startDate;

    switch (range) {
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

    const filteredBookings = bookings.filter(b => 
      new Date(b.createdAt) >= startDate
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

    // Timeline data (similar to customer dashboard)
    const timelineData = computeTimelineData(filteredBookings, range);
    const revenueTrend = computeRevenueTrend(completedBookings, range);

    // Customer analytics
    const uniqueCustomers = new Set(filteredBookings.map(b => b.customer?._id || b.customer)).size;
    const repeatCustomers = computeRepeatCustomers(filteredBookings);

    setAnalyticsData({
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
      statusDistribution,
      timelineData,
      revenueTrend
    });
  };

  const computeTimelineData = (bookings, range) => {
    const grouped = {};
    
    bookings.forEach(b => {
      const date = new Date(b.delivery_date || b.createdAt);
      let key, displayLabel;

      if (range === "day") {
        key = date.toLocaleTimeString([], { hour: '2-digit', hour12: false });
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
      if (range === "day") return a.period.localeCompare(b.period);
      return new Date(a.period) - new Date(b.period);
    });
  };

  const computeRevenueTrend = (completedBookings, range) => {
    const grouped = {};
    
    completedBookings.forEach(b => {
      const date = new Date(b.createdAt);
      let key, displayLabel;

      if (range === "day") {
        key = date.toLocaleTimeString([], { hour: '2-digit', hour12: false });
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
      if (range === "day") return a.period.localeCompare(b.period);
      return new Date(a.period) - new Date(b.period);
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

  const generatePDFReport = async () => {
    if (!dashboardRef.current) return;

    try {
      // Dynamically import the libraries to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Create a clone of the dashboard element to avoid oklch color issues
      const element = dashboardRef.current;
      const clone = element.cloneNode(true);
      
      // Remove problematic classes and add PDF-specific styles
      clone.style.backgroundColor = '#ffffff';
      clone.style.color = '#000000';
      clone.classList.add('pdf-export');
      
      // Append clone to body temporarily
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 1.5, // Lower scale for better compatibility
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Fix styles in the cloned document
          const clonedElement = clonedDoc.querySelector('.pdf-export');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#000000';
            
            // Fix any problematic elements
            const elements = clonedElement.querySelectorAll('*');
            elements.forEach(el => {
              // Remove any modern CSS that might cause issues
              if (el.style.backgroundImage?.includes('oklch')) {
                el.style.backgroundImage = 'none';
              }
              if (el.style.color?.includes('oklch')) {
                el.style.color = '#000000';
              }
            });
          }
        }
      });

      // Remove the clone
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const imgWidth = 190; // Smaller width for margins
      const pageHeight = 277; // A4 height in mm (297 - 10mm margins)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Start 10mm from top
      let pageNumber = 1;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pageNumber++;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add footer with page numbers
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

      pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback: Generate a simple text-based PDF
      try {
        await generateSimplePDF();
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
        alert('Error generating PDF report. Please try again or contact support.');
      }
    }
  };

  // Fallback PDF generation without html2canvas
  const generateSimplePDF = async () => {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 128);
    pdf.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    pdf.setFontSize(12);
    pdf.setTextColor(100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
    pdf.text(`Time Range: ${timeRange}`, pageWidth / 2, 37, { align: 'center' });
    
    let yPosition = 50;
    
    // Summary section
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Summary', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    const summary = analyticsData.summary || {};
    const summaryData = [
      ['Total Requests', summary.totalRequests || 0],
      ['Completed Jobs', summary.completedJobs || 0],
      ['Total Revenue', `${currSymbol}${(summary.totalRevenue || 0).toLocaleString()}`],
      ['Completion Rate', `${summary.completionRate || 0}%`],
      ['Unique Customers', summary.uniqueCustomers || 0],
      ['Repeat Customers', summary.repeatCustomers || 0],
    ];
    
    summaryData.forEach(([label, value]) => {
      pdf.text(`${label}: ${value}`, 25, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    // Status distribution
    if (analyticsData.statusDistribution) {
      pdf.setFontSize(16);
      pdf.text('Status Distribution', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      analyticsData.statusDistribution.forEach(item => {
        pdf.text(`${item.name}: ${item.value} services`, 25, yPosition);
        yPosition += 6;
      });
    }
    
    // Add page number
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(
      `Page 1 of 1 • Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    pdf.save(`analytics-simple-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const summaryCards = [
    {
      title: "Total Requests",
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
      value: `${currSymbol}${(analyticsData.summary?.totalRevenue || 0).toLocaleString()}`,
      icon: HiCurrencyDollar,
      bgColor: "bg-yellow-500",
      description: `Avg: ${currSymbol}${(analyticsData.summary?.avgRevenuePerJob || 0).toFixed(2)}`
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
      title: "Avg per Customer",
      value: analyticsData.summary?.uniqueCustomers && analyticsData.summary?.totalRequests 
        ? (analyticsData.summary.totalRequests / analyticsData.summary.uniqueCustomers).toFixed(1)
        : 0,
      icon: HiTrendingUp,
      bgColor: "bg-indigo-500",
      description: "Jobs per customer"
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none bg-white">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <p className="text-2xl font-bold text-gray-800">Analytics Dashboard</p>
          <p className="text-sm text-gray-600">Performance insights and business metrics</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              computeAnalytics(bookings, e.target.value);
            }}
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

      {/* Enhanced Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`${card.bgColor} flex flex-col justify-between p-4 rounded-xl shadow-lg text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer min-h-[120px]`}
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

      {/* Charts Section - Similar to Customer Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Timeline Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Service Timeline</p>
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
              <BarChart data={analyticsData.timelineData || []} margin={{ top: 20, bottom: 5 }} barSize={12}>
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
          <p className="font-semibold text-gray-700 text-lg">Service Distribution</p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.statusDistribution || []}
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
                  {(analyticsData.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} services`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {(analyticsData.statusDistribution || []).map((entry, index) => (
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
          <p className="font-semibold text-gray-700 text-lg">Revenue Trend</p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`${currSymbol}${value}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#D1FAE5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">Performance Metrics</p>
          <div className="grid grid-cols-2 gap-4 h-64">
            <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg p-4 border border-green-200">
              <HiCheckCircle className="text-3xl text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{analyticsData.summary?.completionRate || 0}%</p>
              <p className="text-sm text-gray-600 text-center">Completion Rate</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-4 border border-blue-200">
              <HiUserGroup className="text-3xl text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{analyticsData.summary?.repeatCustomers || 0}</p>
              <p className="text-sm text-gray-600 text-center">Repeat Customers</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg p-4 border border-purple-200">
              <HiTrendingUp className="text-3xl text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.summary?.uniqueCustomers && analyticsData.summary?.totalRequests 
                  ? (analyticsData.summary.totalRequests / analyticsData.summary.uniqueCustomers).toFixed(1)
                  : 0}
              </p>
              <p className="text-sm text-gray-600 text-center">Avg Jobs per Customer</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <HiCurrencyDollar className="text-3xl text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">
                {currSymbol}{(analyticsData.summary?.avgRevenuePerJob || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 text-center">Avg Revenue per Job</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Handling */}
      {bookings.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
          <HiExclamationCircle className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
          <p className="text-gray-600">You haven't received any service requests yet.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;