import React from "react";

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
import {
  totalRequests,
  newRequestsData,
  categoryData,
  statusData,
} from "../../assets/assets";

const Analytics = () => {
  const COLORS = ["#10B981", "#FBBF24", "#EF4444"]; // For pie chart slices

  return (
    <div className="p-6 flex flex-col items-center space-y-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      {/* Generate Report Button at Top */}
      <div className="w-full flex justify-end">
        <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600">
          Generate Report
        </button>
      </div>

      <div className="w-full max-w-6xl space-y-6">
        {/* Top Row: Total Requests + New Requests Graph */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Total Requests */}
          <div className="bg-white shadow-md rounded-2xl p-6 flex-1 flex flex-col items-center justify-center">
            <p className="text-gray-500">Total Requests</p>
            <p className="text-3xl font-bold">{totalRequests}</p>
          </div>

          {/* New Requests Graph */}
          <div className="bg-white shadow-md rounded-2xl p-6 flex-1">
            <p className="text-gray-500 mb-2">New Requests (Last 7 Days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={newRequestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#FACC15" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row: Category Chart + Status Pie Chart */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Requests by Category */}
          <div className="bg-white shadow-md rounded-2xl p-6 flex-1">
            <p className="text-gray-500 mb-2">Requests by Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Requests by Status (Pie Chart) */}
          <div className="bg-white shadow-md rounded-2xl p-6 flex-1 flex flex-col items-center">
            <p className="text-gray-500 mb-2">Requests by Status</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="requests"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#FBBF24"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
