import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSmartphone,
  FiCreditCard,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiHome,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";
import * as bookingService from "../../services/bookingService";
import * as paymentService from "../../services/paymentService";
import { formatDateForInput } from "../../utils/formatDateHelper.js";

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, currSymbol } = useContext(ShareContext);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { service } = location.state || {};
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch payment history if no service is selected
  useEffect(() => {
    if (!service) {
      fetchPaymentHistory();
    }
  }, [service, backendUrl]);

  const fetchPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await bookingService.fetchMyBookings(backendUrl, {
        page: 1,
        limit: 100,
        paymentStatus: "all"
      });
      if (data.success) {
        setPaymentHistory(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const displayService = service || {
    serviceProvider: "N/A",
    serviceName: "No Service Selected",
    category: "N/A",
    amount: 0,
    image: "",
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: displayService.phone || "",
    address: displayService.address || "",
    city: displayService.city || "",
    delivery_date: displayService.delivery_date || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaAmount, setMpesaAmount] = useState(displayService.amount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMpesaPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Initiating payment...");

      let bookingId = displayService._id;
      const isExistingBooking = displayService.status && displayService._id;

      if (!isExistingBooking) {
        setMessage("Creating booking record...");
        const bookingRes = await bookingService.createBooking(backendUrl, {
          serviceId: displayService._id || displayService.id,
          serviceProvider: displayService.serviceProviderName,
          serviceName: displayService.serviceName,
          categoryName: displayService.category,
          amount: displayService.amount,
          image: displayService.image,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          delivery_date: formData.delivery_date,
          paymentMethod: "Mpesa",
          is_paid: false,
          status: "Pending",
        });
        bookingId =
          bookingRes.booking?._id || bookingRes.bookingId || bookingId;
      }

      setMessage("Sending M-Pesa request to your phone...");
      const mpesaRes = await paymentService.initiateMpesa(backendUrl, {
        amount: displayService.amount,
        phone: formData.phone,
        serviceId: displayService._id || displayService.id,
        serviceName: displayService.serviceName,
        bookingId,
      });

      if (!mpesaRes.success) {
        throw new Error(
          mpesaRes.message || "Failed to initiate M-Pesa payment",
        );
      }

      const checkoutRequestId =
        mpesaRes.data?.checkoutRequestID || mpesaRes.checkoutRequestID;
      if (!checkoutRequestId) {
        throw new Error("Missing payment reference");
      }

      setCheckoutId(checkoutRequestId);
      setMessage("Check your phone for M-Pesa prompt...");

      let attempts = 0;
      const maxAttempts = 20;
      let pollingActive = true;

      const checkStatus = async () => {
        if (!pollingActive) return;

        try {
          const statusRes = await paymentService.checkMpesaStatus(
            backendUrl,
            checkoutRequestId,
          );
          const status =
            statusRes.status ||
            statusRes.data?.status ||
            statusRes.data?.Status ||
            null;

          if (status === "completed") {
            pollingActive = false;
            setMessage("Payment confirmed! Redirecting...");
            setError("");

            await bookingService.updateBookingStatus(backendUrl, bookingId, {
              is_paid: true,
              status: "Waiting for Work",
            });

            setTimeout(() => navigate("/user/my-bookings"), 1500);
          } else if (status === "failed") {
            pollingActive = false;
            setMessage("");
            setError("Payment was not completed. Please try again.");
            await bookingService.updateBookingStatus(backendUrl, bookingId, {
              is_paid: false,
              status: "Payment Failed",
            });
            setLoading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 3000);
          } else {
            pollingActive = false;
            setMessage("");
            setError("Payment timeout. Please check your phone or try again.");
            await bookingService.updateBookingStatus(backendUrl, bookingId, {
              is_paid: false,
              status: "Payment Failed",
            });
            setLoading(false);
          }
        } catch (err) {
          pollingActive = false;
          setMessage("");
          setError("Error checking payment status");
          setLoading(false);
        }
      };

      checkStatus();
    } catch (err) {
      console.error("M-Pesa Error:", err);
      setMessage("");
      setError(
        err.response?.data?.message || "Payment failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Creating booking...");

      const bookingRes = await bookingService.createBooking(backendUrl, {
        serviceId: displayService._id || displayService.id,
        serviceProvider: displayService.serviceProviderName,
        serviceName: displayService.serviceName,
        categoryName: displayService.category,
        amount: displayService.amount,
        image: displayService.image,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        delivery_date: formData.delivery_date,
        paymentMethod: "Cash",
        is_paid: false,
      });

      if (bookingRes.success) {
        setMessage("Booking confirmed! Redirecting...");
        setTimeout(() => navigate("/user/my-bookings"), 1500);
      } else {
        throw new Error("Booking creation failed");
      }
    } catch (err) {
      setMessage("");
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.address ||
      !formData.delivery_date
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "mpesa") {
      if (Number(mpesaAmount) !== Number(displayService.amount)) {
        setError(
          `Amount must be exactly ${currSymbol}${displayService.amount}`,
        );
        return;
      }

      handleMpesaPayment();
    } else {
      handleCashPayment();
    }
  };

  const PaymentMethodCard = ({ icon, title, description, value, selected }) => (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
      onClick={() => setPaymentMethod(value)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded ${selected ? "bg-blue-100" : "bg-gray-100"}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
        >
          {selected && (
            <div className="w-full h-full flex items-center justify-center">
              <FiCheckCircle className="text-white text-xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <FiArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Show Payment Form if Service is Selected */}
        {service ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Complete Booking
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in your details and choose payment method
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Service Details */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Service Details</h3>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {displayService.image ? (
                    <img
                      src={displayService.image}
                      alt={displayService.serviceName}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">
                    {displayService.serviceName}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    Category: {displayService.category}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="w-4 h-4" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      (4.8 • 124 reviews)
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currSymbol} {displayService.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-6">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-1">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      <span>Full Name</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-1">
                      <FiSmartphone className="w-4 h-4 text-gray-500" />
                      <span>Phone Number (M-Pesa)</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-4 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
                      <span className="text-gray-700 font-medium">+254</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="7XX XXX XXX"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-1">
                      <FiHome className="w-4 h-4 text-gray-500" />
                      <span>City/County</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city or county"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4 text-gray-500" />
                      <span>Preferred Date</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formatDateForInput(formData.delivery_date)}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <span>Address</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your complete address"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Section */}
          <div>
            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-6">Payment Method</h3>
              <div className="space-y-4">
                <PaymentMethodCard
                  icon={<FiSmartphone className="w-5 h-5 text-green-600" />}
                  title="M-Pesa"
                  description="Pay instantly via M-Pesa"
                  value="mpesa"
                  selected={paymentMethod === "mpesa"}
                />

                <PaymentMethodCard
                  icon={<FiCreditCard className="w-5 h-5 text-gray-600" />}
                  title="Cash on Delivery"
                  description="Pay when service is completed"
                  value="cash"
                  selected={paymentMethod === "cash"}
                />
              </div>

              {paymentMethod === "mpesa" && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    M-Pesa Payment
                  </h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount to Pay
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 font-medium">
                        {currSymbol}
                      </span>
                      <input
                        type="number"
                        value={mpesaAmount}
                        onChange={(e) => setMpesaAmount(e.target.value)}
                        className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-700">
                    <FiCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      You'll receive an M-Pesa prompt on your phone to complete
                      payment
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                    paymentMethod === "mpesa"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : paymentMethod === "mpesa" ? (
                    "Pay with M-Pesa"
                  ) : (
                    "Confirm Cash Booking"
                  )}
                </button>

                {checkoutId && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Reference:{" "}
                      <span className="font-mono text-gray-800">
                        {checkoutId.slice(-8)}
                      </span>
                    </p>
                  </div>
                )}

                {message && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4" />
                      {message}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Check your phone for M-Pesa prompt</p>
                    <p>• Ensure you have sufficient balance</p>
                    <p>• Contact support: 0700 000 000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <>
            {/* Payment History View */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Payment History
              </h1>
              <p className="text-gray-600 mt-1">
                View all your payments and bookings
              </p>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentHistory.length > 0 ? (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Provider</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment Method</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paymentHistory
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((booking) => (
                          <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{booking.serviceName}</p>
                                <p className="text-xs text-gray-500">{booking.categoryName}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {booking.providerName || booking.serviceProvider}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {currSymbol}{booking.amount?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.paymentMethod === 'Mpesa' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {booking.paymentMethod || 'Cash'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.is_paid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.is_paid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow border border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, paymentHistory.length)}</span> of{' '}
                    <span className="font-medium">{paymentHistory.length}</span> payments
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 border rounded-md text-sm font-medium ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.ceil(paymentHistory.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(paymentHistory.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(paymentHistory.length / itemsPerPage)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium ${
                        currentPage === Math.ceil(paymentHistory.length / itemsPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4 text-6xl">📋</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600 mb-8">You haven't made any payments yet</p>
                <button
                  onClick={() => navigate("/user/dashboard")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Browse Services
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Payments;
