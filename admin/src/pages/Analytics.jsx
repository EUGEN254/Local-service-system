import React, { useRef, useContext, useMemo } from "react";
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
} from "recharts";
import { AdminContext } from "../context/AdminContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Analytics = () => {
  const { allBookings, customers, serviceProviders } = useContext(AdminContext);
  const analyticsRef = useRef();

  const COLORS = ["#10B981", "#FBBF24", "#EF4444", "#3B82F6", "#8B5CF6"];

  // Generate analytics data from actual bookings
  const analyticsData = useMemo(() => {
    if (!allBookings.length) {
      return {
        totalRequests: 0,
        newRequestsData: [],
        categoryData: [],
        statusData: [],
        revenueData: [],
        providerPerformance: []
      };
    }

    // Total Requests
    const totalRequests = allBookings.length;

    // New Requests (Last 7 Days)
    const newRequestsData = [];
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => {
      const dayRequests = allBookings.filter(booking => 
        new Date(booking.createdAt).toISOString().split('T')[0] === date
      ).length;
      
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      newRequestsData.push({ day: dayName, requests: dayRequests });
    });

    // Requests by Category
    const categoryMap = {};
    allBookings.forEach(booking => {
      const category = booking.categoryName || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([category, requests]) => ({
      category: category.length > 10 ? category.substring(0, 10) + '...' : category,
      requests,
      fullCategory: category
    }));

    // Requests by Status
    const statusMap = {};
    allBookings.forEach(booking => {
      const status = booking.status || 'Pending';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusData = Object.entries(statusMap).map(([status, requests]) => ({
      status,
      requests
    }));

    // Revenue Data (Monthly)
    const revenueMap = {};
    allBookings.forEach(booking => {
      if (booking.is_paid) {
        const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short' });
        revenueMap[month] = (revenueMap[month] || 0) + (booking.amount || 0);
      }
    });
    const revenueData = Object.entries(revenueMap).map(([month, revenue]) => ({
      month,
      revenue
    }));

    // Provider Performance
    const providerMap = {};
    allBookings.forEach(booking => {
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
      totalRequests,
      newRequestsData,
      categoryData,
      statusData,
      revenueData,
      providerPerformance
    };
  }, [allBookings]);

  const downloadPDF = async () => {
    const element = analyticsRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('analytics-report.pdf');
  };

  const { 
    totalRequests, 
    newRequestsData, 
    categoryData, 
    statusData, 
    revenueData,
    providerPerformance 
  } = analyticsData;

  return (
    <div ref={analyticsRef} className="p-6 flex flex-col items-center space-y-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none bg-gray-50">
      {/* Generate Report Button at Top */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <button 
          onClick={downloadPDF}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
        >
          📊 Download PDF Report
        </button>
      </div>

      <div className="w-full max-w-6xl space-y-6">
        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow-md rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-blue-600">{totalRequests}</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">Total Customers</p>
            <p className="text-2xl font-bold text-green-600">{customers.length}</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">Service Providers</p>
            <p className="text-2xl font-bold text-purple-600">{serviceProviders.length}</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">Verified Providers</p>
            <p className="text-2xl font-bold text-teal-600">
              {serviceProviders.filter(p => p.isVerified).length}
            </p>
          </div>
        </div>

        {/* First Row: New Requests + Revenue */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* New Requests Graph */}
          <div className="bg-white shadow-md rounded-xl p-6 flex-1">
            <p className="text-gray-700 font-semibold mb-4">New Bookings (Last 7 Days)</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={newRequestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#FACC15" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white shadow-md rounded-xl p-6 flex-1">
            <p className="text-gray-700 font-semibold mb-4">Monthly Revenue (KSh)</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row: Category + Status */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Requests by Category */}
          <div className="bg-white shadow-md rounded-xl p-6 flex-1">
            <p className="text-gray-700 font-semibold mb-4">Bookings by Category</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [
                  value, 
                  props.payload.fullCategory || props.payload.category
                ]} />
                <Bar dataKey="requests" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Requests by Status (Pie Chart) */}
          <div className="bg-white shadow-md rounded-xl p-6 flex-1">
            <p className="text-gray-700 font-semibold mb-4">Bookings by Status</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="requests"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, requests }) => `${status}: ${requests}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Third Row: Provider Performance */}
        <div className="bg-white shadow-md rounded-xl p-6">
          <p className="text-gray-700 font-semibold mb-4">Provider Performance (Completion Rate %)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={providerPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value}%`, 
                  props.payload.fullProvider || props.payload.provider
                ]} 
              />
              <Bar dataKey="completionRate" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;