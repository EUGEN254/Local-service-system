import React, { useRef, useMemo, useState, useEffect } from "react";
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
  Area,
  LineChart,
  Line,
} from "recharts";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminProviders } from "../hooks/useAdminProviders";
import { useAdminBookings } from "../hooks/useAdminBookings";
import { usePaymentAnalytics } from "../hooks/usePaymentAnalytics";
import {
  HiDownload,
  HiCalendar,
  HiCurrencyDollar,
  HiUserGroup,
  HiStar,
  HiTrendingUp,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
  HiCreditCard,
  HiReceiptTax,
} from "react-icons/hi";

// Helper functions
const computeTimelineData = (bookings, range) => {
  const grouped = {};

  bookings.forEach((b) => {
    const date = new Date(b.delivery_date || b.createdAt);
    let key, displayLabel;

    if (range === "day") {
      key = date.toLocaleTimeString([], { hour: '2-digit', hour12: false });
      displayLabel = key;
    } else if (range === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      displayLabel = `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleString("default", { month: "short" })}`;
    } else if (range === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      displayLabel = date.toLocaleString("default", { month: "short" });
    } else {
      key = date.getFullYear().toString();
      displayLabel = date.getFullYear().toString();
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: displayLabel,
        Completed: 0,
        Pending: 0,
        "In Progress": 0,
        Cancelled: 0,
      };
    }

    if (b.status === "Completed") grouped[key].Completed += 1;
    else if (b.status === "Pending") grouped[key].Pending += 1;
    else if (b.status === "Waiting for Work" || b.status === "In Progress")
      grouped[key]["In Progress"] += 1;
    else if (b.status === "Cancelled") grouped[key].Cancelled += 1;
  });

  return Object.values(grouped).sort((a, b) => {
    if (range === "day") return a.period.localeCompare(b.period);
    return new Date(a.period) - new Date(b.period);
  });
};

const computeRevenueTrend = (completedBookings, range) => {
  const grouped = {};

  completedBookings.forEach((b) => {
    const date = new Date(b.createdAt);
    let key, displayLabel;

    if (range === "day") {
      key = date.toLocaleTimeString([], { hour: '2-digit', hour12: false });
      displayLabel = key;
    } else if (range === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
      displayLabel = `Week ${Math.ceil(date.getDate() / 7)}`;
    } else if (range === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      displayLabel = date.toLocaleString("default", { month: "short" });
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

  return Object.values(customerBookings).filter(
    (bookings) => bookings.length > 1,
  );
};

const Analytics = () => {
  const { customers, loadingUsers } = useAdminUsers();
  const { serviceProviders } = useAdminProviders();
  const { allBookings, loadingAllBookings, fetchAllBookings } =
    useAdminBookings();
  const { paymentData, loading: paymentLoading, fetchPaymentAnalytics } = usePaymentAnalytics();
  const analyticsRef = useRef();
  const [timeRange, setTimeRange] = useState("month");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"];

  // Fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // Fetch payment analytics
  useEffect(() => {
    if (allBookings.length > 0) {
      let startDate;
      const now = new Date();
      
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
      
      fetchPaymentAnalytics(
        startDate.toISOString().split("T")[0],
        now.toISOString().split("T")[0],
        timeRange === "day" ? "day" : timeRange === "week" ? "week" : "month",
      );
    }
  }, [allBookings.length, timeRange, fetchPaymentAnalytics]);

  // Generate analytics data from actual bookings
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
          inProgressJobs: 0,
        },
        timelineData: [],
        statusDistribution: [],
        revenueTrend: [],
        categoryData: [],
        providerPerformance: [],
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

    const filteredBookings = allBookings.filter(
      (b) => new Date(b.createdAt || b.delivery_date) >= startDate,
    );

    const completedBookings = filteredBookings.filter(
      (b) => b.status === "Completed" && b.is_paid,
    );
    const allCompletedBookings = filteredBookings.filter(b => b.status === "Completed");
    const pendingBookings = filteredBookings.filter(
      (b) => b.status === "Pending",
    );
    const inProgressBookings = filteredBookings.filter(
      (b) => b.status === "In Progress" || b.status === "Waiting for Work",
    );
    const cancelledBookings = filteredBookings.filter(
      (b) => b.status === "Cancelled",
    );

    // Revenue calculations
    const totalRevenue = completedBookings.reduce(
      (sum, b) => sum + (b.amount || 0),
      0,
    );
    const avgRevenuePerJob =
      completedBookings.length > 0
        ? totalRevenue / completedBookings.length
        : 0;

    // Status distribution for charts
    const statusDistribution = [
      { name: "Completed", value: allCompletedBookings.length, color: "#10B981" },
      {
        name: "In Progress",
        value: inProgressBookings.length,
        color: "#F59E0B",
      },
      { name: "Pending", value: pendingBookings.length, color: "#3B82F6" },
      { name: "Cancelled", value: cancelledBookings.length, color: "#EF4444" },
    ];

    // Timeline data
    const timelineData = computeTimelineData(filteredBookings, timeRange);
    const revenueTrend = computeRevenueTrend(completedBookings, timeRange);

    // Customer analytics
    const uniqueCustomers = new Set(
      filteredBookings.map((b) => b.customer?._id || b.customer),
    ).size;
    const repeatCustomers = computeRepeatCustomers(filteredBookings);

    // Category data
    const categoryMap = {};
    filteredBookings.forEach((booking) => {
      const category = booking.categoryName || "Uncategorized";
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(
      ([category, requests]) => ({
        category:
          category.length > 10 ? category.substring(0, 10) + "..." : category,
        requests,
        fullCategory: category,
      }),
    );

    // Provider Performance
    const providerMap = {};
    filteredBookings.forEach((booking) => {
      const provider = booking.providerName || "Unknown";
      if (!providerMap[provider]) {
        providerMap[provider] = { completed: 0, total: 0 };
      }
      providerMap[provider].total++;
      if (booking.status === "Completed") {
        providerMap[provider].completed++;
      }
    });
    const providerPerformance = Object.entries(providerMap).map(
      ([provider, data]) => ({
        provider:
          provider.length > 12 ? provider.substring(0, 12) + "..." : provider,
        completionRate: Math.round((data.completed / data.total) * 100),
        fullProvider: provider,
      }),
    );

    return {
      summary: {
        totalRequests: filteredBookings.length,
        completedJobs: completedBookings.length,
        totalRevenue,
        avgRevenuePerJob,
        uniqueCustomers,
        repeatCustomers: repeatCustomers.length,
        completionRate:
          filteredBookings.length > 0
            ? (
                (completedBookings.length / filteredBookings.length) *
                100
              ).toFixed(1)
            : 0,
        pendingJobs: pendingBookings.length,
        inProgressJobs: inProgressBookings.length,
      },
      timelineData,
      statusDistribution,
      revenueTrend,
      categoryData,
      providerPerformance,
    };
  }, [allBookings, timeRange]);

  // Fallback PDF generation without html2canvas (text-based)
  const generateSimplePDF = async () => {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(59, 130, 246);
    pdf.text('Admin Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
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
      ['Total Bookings', summary.totalRequests || 0],
      ['Completed Jobs', summary.completedJobs || 0],
      ['Total Revenue', `KSh ${(summary.totalRevenue || 0).toLocaleString()}`],
      ['Completion Rate', `${summary.completionRate || 0}%`],
      ['Unique Customers', summary.uniqueCustomers || 0],
      ['Repeat Customers', summary.repeatCustomers || 0],
      ['Active Jobs', (summary.inProgressJobs || 0) + (summary.pendingJobs || 0)],
      ['Service Providers', serviceProviders.length],
    ];
    
    summaryData.forEach(([label, value]) => {
      pdf.text(`${label}: ${value}`, 25, yPosition);
      yPosition += 6;
      
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
    });
    
    yPosition += 10;
    
    // Status distribution
    if (analyticsData.statusDistribution && analyticsData.statusDistribution.length > 0) {
      pdf.setFontSize(16);
      pdf.text('Booking Status Distribution', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      analyticsData.statusDistribution.forEach(item => {
        pdf.text(`${item.name}: ${item.value} bookings`, 25, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // Payment data
    if (paymentData?.summary) {
      pdf.setFontSize(16);
      pdf.text('Payment Analytics', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      const paymentSummary = [
        ['Total Payment Revenue', `KSh ${(paymentData.summary.totalRevenue || 0).toLocaleString()}`],
        ['Total Transactions', paymentData.summary.totalTransactions || 0],
        ['Unique Paying Customers', paymentData.summary.uniqueCustomers || 0],
        ['Avg Transaction Value', `KSh ${(paymentData.summary.averageTransactionValue || 0).toFixed(2)}`],
      ];
      
      paymentSummary.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 25, yPosition);
        yPosition += 6;
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Add page number
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Page ${i} of ${totalPages} • Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    pdf.save(`admin-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generatePDFReport = async () => {
    if (!analyticsRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    
    try {
      // Dynamically import the libraries
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Create a clone of the dashboard element
      const element = analyticsRef.current;
      const clone = element.cloneNode(true);
      
      // Apply PDF-specific styles to clone
      clone.style.backgroundColor = '#ffffff';
      clone.style.color = '#000000';
      clone.classList.add('pdf-export');
      
      // Remove any oklch colors by converting inline styles
      const allElements = clone.getElementsByTagName('*');
      Array.from(allElements).forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        
        // Check and fix background color
        if (computedStyle.backgroundColor?.includes('oklch')) {
          el.style.backgroundColor = '#ffffff';
        }
        if (computedStyle.color?.includes('oklch')) {
          el.style.color = '#000000';
        }
        if (computedStyle.borderColor?.includes('oklch')) {
          el.style.borderColor = '#cbd5e1';
        }
        
        // Fix gradient backgrounds
        if (computedStyle.background?.includes('oklch')) {
          el.style.background = '#3b82f6';
        }
      });
      
      // Append clone to body temporarily
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = element.offsetWidth + 'px';
      document.body.appendChild(clone);
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.pdf-export');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            
            const elements = clonedElement.querySelectorAll('*');
            elements.forEach(el => {
              // Remove any remaining problematic styles
              const styles = window.getComputedStyle(el);
              if (styles.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (styles.color?.includes('oklch')) {
                el.style.color = '#000000';
              }
              if (styles.background?.includes('oklch')) {
                el.style.background = '#3b82f6';
              }
            });
          }
        }
      });

      // Remove the clone
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      // Add first page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Add page numbers
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Page ${i} of ${totalPages} • Generated on ${new Date().toLocaleString()}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }
      
      pdf.save(`admin-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF with html2canvas:", error);
      
      // Fallback to simple PDF generation
      try {
        await generateSimplePDF();
      } catch (fallbackError) {
        console.error("Fallback PDF generation also failed:", fallbackError);
        alert("Error generating PDF report. Please try again or contact support.");
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Prepare summary cards
  const summaryCards = [
    {
      title: "Total Bookings",
      value: analyticsData.summary?.totalRequests || 0,
      icon: HiCalendar,
      gradient: "bg-blue-600",
      description: `Current ${timeRange}`,
    },
    {
      title: "Completed Jobs",
      value: analyticsData.summary?.completedJobs || 0,
      icon: HiCheckCircle,
      gradient: "bg-green-600",
      description: `${analyticsData.summary?.completionRate || 0}% completion rate`,
    },
    {
      title: "Payment Revenue",
      value: `KSh ${(paymentData?.summary?.totalRevenue || 0).toLocaleString()}`,
      icon: HiCreditCard,
      gradient: "bg-emerald-600",
      description: `${paymentData?.summary?.totalTransactions || 0} transactions`,
    },
    {
      title: "Total Revenue",
      value: `KSh ${(analyticsData.summary?.totalRevenue || 0).toLocaleString()}`,
      icon: HiCurrencyDollar,
      gradient: "bg-yellow-600",
      description: `Avg: KSh ${(analyticsData.summary?.avgRevenuePerJob || 0).toFixed(2)}`,
    },
    {
      title: "Active Jobs",
      value:
        (analyticsData.summary?.inProgressJobs || 0) +
        (analyticsData.summary?.pendingJobs || 0),
      icon: HiClock,
      gradient: "bg-orange-600",
      description: "In progress + pending",
    },
    {
      title: "Unique Customers",
      value: analyticsData.summary?.uniqueCustomers || 0,
      icon: HiUserGroup,
      gradient: "bg-purple-600",
      description: `${analyticsData.summary?.repeatCustomers || 0} repeat customers`,
    },
    {
      title: "Service Providers",
      value: serviceProviders.length,
      icon: HiTrendingUp,
      gradient: "bg-indigo-600",
      description: `${serviceProviders.filter((p) => p.isVerified).length} verified`,
    },
  ];

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
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
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const dotStyle = (color) => (
    <span
      className="inline-block w-3 h-3 rounded-full mr-2"
      style={{ backgroundColor: color }}
    />
  );

  const {
    summary,
    timelineData,
    statusDistribution,
    revenueTrend,
    categoryData,
    providerPerformance,
  } = analyticsData;

  if (loadingAllBookings || paymentLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      ref={analyticsRef}
      className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto bg-white"
    >
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 sticky top-0 bg-white z-10 pb-4">
        <div>
          <p className="text-2xl font-bold text-gray-800">
            Admin Analytics Dashboard
          </p>
          <p className="text-sm text-gray-600">
            Complete business overview and performance metrics
          </p>
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
            disabled={isGeneratingPDF}
            className={`py-2 px-4 rounded-lg text-white text-sm transition-colors flex items-center gap-2 shadow-sm ${
              isGeneratingPDF 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <HiDownload className="text-lg" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards Grid with Horizontal Scroll on Small Screens */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-3 sm:gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`${card.gradient} rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden min-w-[180px] sm:min-w-0 flex-shrink-0 sm:flex-shrink`}
              >
                <div className="p-4 sm:p-5 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs sm:text-sm font-medium opacity-90">{card.title}</p>
                      <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{card.value}</p>
                    </div>
                    <Icon className="text-white text-xl opacity-80" />
                  </div>
                  <p className="text-xs opacity-80 mt-1">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Analytics Section */}
      {paymentData && paymentData.summary?.totalRevenue > 0 && (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <HiReceiptTax className="text-emerald-500" />
              Payment Analytics
            </h2>
          </div>

          {/* Monthly Payment Summary */}
          {paymentData.monthlySummary && paymentData.monthlySummary.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
              <p className="font-semibold text-gray-700 text-lg">Monthly Payment Summary</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentData.monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayPeriod" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalAmount" fill="#10B981" name="Revenue (KSh)" />
                  <Bar yAxisId="right" dataKey="transactionCount" fill="#3B82F6" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily Payment Trend */}
          {paymentData.dailyTrend && paymentData.dailyTrend.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
              <p className="font-semibold text-gray-700 text-lg">Daily Payment Trend</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentData.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#F59E0B" name="Amount (KSh)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="count" stroke="#8B5CF6" name="Transactions" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payment Status Distribution */}
          {paymentData.statusDistribution && paymentData.statusDistribution.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
              <p className="font-semibold text-gray-700 text-lg">Payment Status Distribution</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {paymentData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Customers */}
          {paymentData.topCustomers && paymentData.topCustomers.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
              <p className="font-semibold text-gray-700 text-lg">Top Paying Customers</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentData.topCustomers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="customerName" width={100} />
                  <Tooltip formatter={(value) => [`KSh ${value}`, 'Total Amount']} />
                  <Bar dataKey="totalAmount" fill="#EC4899" name="Total Amount (KSh)" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="border-b border-gray-200 pb-2">
        <h2 className="text-xl font-bold text-gray-800">Booking Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Timeline Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">
            Booking Timeline
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
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={timelineData || []}
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

        {/* Service Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">
            Booking Distribution
          </p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height={300}>
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
          <p className="font-semibold text-gray-700 text-lg">
            Revenue Trend (KSh)
          </p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`KSh ${value}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  fill="#D1FAE5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
          <p className="font-semibold text-gray-700 text-lg">
            Bookings by Category
          </p>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.fullCategory || props.payload.category,
                  ]}
                />
                <Bar dataKey="requests" fill="#8B5CF6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provider Performance */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 border border-gray-200">
        <p className="font-semibold text-gray-700 text-lg">
          Provider Performance (Completion Rate %)
        </p>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={providerPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value}%`,
                  props.payload.fullProvider || props.payload.provider,
                ]}
              />
              <Bar
                dataKey="completionRate"
                fill="#F59E0B"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Empty State Handling */}
      {allBookings.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
          <HiExclamationCircle className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600">No bookings found in the system yet.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;