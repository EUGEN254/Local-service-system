import React, { useContext, useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShareContext } from "../../sharedcontext/SharedContext";
import axios from "axios";
import {
  HiClipboardList,
  HiCog,
  HiXCircle,
} from "react-icons/hi";

const Dashboard = () => {
  const { backendUrl } = useContext(ShareContext);
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
        console.log(bookings);
        
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
        displayLabel = `${weekStart.toLocaleDateString(undefined, options)} - ${weekEnd.toLocaleDateString(undefined, options)}`;
      } else {
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        key = `${year}-${month}`;
        displayLabel = localDate.toLocaleString("default", { month: "short", year: "numeric" });
      }

      if (!grouped[key]) grouped[key] = { Completed: 0, Pending: 0, Cancelled: 0, label: displayLabel };

      if (b.status === "Cancelled") grouped[key].Cancelled += 1;
      else if (b.is_paid) grouped[key].Completed += 1;
      else grouped[key].Pending += 1;
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((key) => ({
        period: grouped[key].label,
        Completed: grouped[key].Completed,
        Pending: grouped[key].Pending,
        Cancelled: grouped[key].Cancelled,
      }));
  };

  useEffect(() => {
    setChartData(computeChartData(bookings, timeFilter));
  }, [bookings, timeFilter]);

  useEffect(() => {
    setSummaryCards([
      {
        title: "New Job Requests (not paid)",
        count: bookings.filter((b) => !b.is_paid && b.paymentMethod === "Cash").length,
        bgColor: "bg-yellow-500",
        icon: HiClipboardList,
      },
      {
        title: "Active Services (paid)",
        count: bookings.filter((b) => b.is_paid && b.status !== "Cancelled").length,
        bgColor: "bg-green-500",
        icon: HiCog,
      },
      {
        title: "Cancelled Jobs",
        count: bookings.filter((b) => b.status === "Cancelled").length,
        bgColor: "bg-gray-400",
        icon: HiXCircle,
      },
    ]);
  }, [bookings]);

  const filteredRequests = bookings
    .map((b, idx) => ({
      no: idx + 1,
      serviceId: b.serviceId,
      service: b.serviceName,
      status: b.status,
      payment: b.is_paid ? "Paid" : b.paymentMethod === "Cash" ? "Cash" : "Not Paid",
      location: b.city,
      date: new Date(b.delivery_date).toLocaleDateString(),
    }))
    .filter(
      (req) =>
        (statusFilter === "" || req.status === statusFilter) &&
        (paymentFilter === "" || req.payment === paymentFilter)
    );

  const handleView = async (serviceId, index) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/serviceprovider/details/${serviceId}`, { withCredentials: true });
      if (data.success) {
        setSelectedService(data.service);

        const button = buttonRefs.current[index];
        if (button) {
          const rect = button.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          const viewportWidth = window.innerWidth;

          setModalPosition({
            top: rect.top + scrollTop - 10,
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
    <span className="inline-block w-3 h-3 rounded-full mr-1 sm:mr-2" style={{ backgroundColor: color }} />
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      {/* Summary Cards */}
      <p className="mb-3 lg:-mt-7 text-xl font-semibold">Dashboard</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.bgColor} flex-shrink-0 flex items-center justify-between p-4 rounded-xl shadow-md text-white min-w-[200px]`}>
              <div>
                <p className="text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-2">{card.count}</p>
              </div>
              <Icon className="text-white text-2xl" />
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-2xl mx-auto">
        <p className="font-semibold text-gray-700">Overview of Services</p>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {dotStyle("#FACC15")}<span className="text-xs sm:text-sm font-semibold text-gray-700">Completed</span>
            {dotStyle("#9CA3AF")}<span className="text-xs sm:text-sm font-semibold text-gray-700">Cancelled</span>
          </div>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, bottom: 5 }} barSize={12}>
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Completed" fill="#FACC15" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Pending" fill="#FBBF24" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#9CA3AF" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Requests Table */}
      <div className="bg-white p-4 -mt-2 rounded-xl shadow-md space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
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
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Date customer available</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading bookings...</td></tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900">{req.no}</td>
                      <td className="p-3 text-sm text-gray-900">{req.service}</td>
                      <td className={`p-3 text-sm font-semibold ${req.status === "Completed" ? "text-green-600" : req.status === "Cancelled" ? "text-red-600" : "text-yellow-600"}`}>{req.status}</td>
                      <td className={`p-3 text-sm font-semibold ${req.payment === "Paid" ? "text-green-600" : req.payment === "Cash" ? "text-yellow-600" : "text-red-600"}`}>{req.payment}</td>
                      <td className="p-3 text-sm text-gray-900">{req.location}</td>
                      <td className="p-3 text-sm text-gray-900">{req.date}</td>
                      <td className="p-3 whitespace-nowrap">
                        <button ref={el => buttonRefs.current[idx] = el} onClick={() => handleView(req.serviceId, idx)} className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">No requests found for selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Modal with Image */}
      {serviceModalOpen && selectedService && (
        <div
          className="service-modal fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-300 w-80 max-w-sm p-4 animate-fade-in"
          style={{
            top: `${modalPosition.top}px`,
            right: `${modalPosition.right}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <button onClick={() => setServiceModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          
          {/* Image */}
          {selectedService.image && (
            <div className="w-full h-40 overflow-hidden rounded-lg mb-3">
              <img src={selectedService.image} alt={selectedService.serviceName} className="w-full h-full object-cover" />
            </div>
          )}

          <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">{selectedService.serviceName}</h2>
          <div className="space-y-2 text-gray-700 text-sm">
            <div className="flex justify-between"><span className="font-semibold">Category:</span>{selectedService.category}</div>
            <div className="flex justify-between"><span className="font-semibold">Provider:</span>{selectedService.serviceProviderName}</div>
            <div className="flex justify-between"><span className="font-semibold">Amount:</span>${selectedService.amount}</div>
            <div className="flex justify-between"><span className="font-semibold">Status:</span>{selectedService.status}</div>
            <div className="flex justify-between"><span className="font-semibold">Added on:</span>{new Date(selectedService.dateAdded).toLocaleDateString()}</div>
          </div>
          <div className="flex justify-end mt-3 pt-2 border-t">
            <button onClick={() => setServiceModalOpen(false)} className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px) translateY(-100%); }
          to { opacity: 1; transform: translateY(0) translateY(-100%); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Dashboard;
