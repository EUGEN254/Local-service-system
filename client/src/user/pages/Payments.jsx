import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSmartphone } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext";

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, currSymbol } = useContext(ShareContext);

  // service passed from MyBookings or Service page
  const { service } = location.state || {};
  const displayService = service || {
    servicerProvider: "N/A",
    serviceName: "No Service Selected",
    category: "N/A",
    amount: 0,
    image: "",
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    delivery_date: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("Mpesa");
  const [mpesaAmount, setMpesaAmount] = useState(displayService.amount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} className={i < 4 ? "text-yellow-400" : "text-gray-300"} />
    ));

  // ✅ handle M-Pesa payment with polling before redirect
  const handleMpesaPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Processing payment...");

      let bookingId = displayService._id || displayService.bookingId; // Existing booking if any

      // 🧩 Step 1: Create booking only if it doesn't already exist
      if (!bookingId) {
        setMessage("Creating booking...");
        const bookingRes = await axios.post(
          `${backendUrl}/api/customer/create`,
          {
            serviceId: displayService._id || displayService.id,
            servicerProvider: displayService.servicerProvider,
            serviceName: displayService.serviceName,
            categoryName: displayService.category,
            amount: displayService.amount,
            address: formData.address,
            city: formData.city,
            delivery_date: formData.delivery_date,
            paymentMethod: "Mpesa",
            is_paid: false,
          },
          { withCredentials: true }
        );
        bookingId = bookingRes.data.booking._id;
      } else {
        console.log("♻️ Reusing existing booking:", bookingId);
      }

      // 🧩 Step 2: Start M-Pesa STK push
      setMessage("Initiating M-Pesa STK push...");
      const mpesaRes = await axios.post(
        `${backendUrl}/api/mpesa/stkpush`,
        {
          amount: displayService.amount,
          phone: formData.phone,
          serviceId: displayService._id || displayService.id,
          serviceName: displayService.serviceName,
          bookingId, // Use existing booking
        },
        { withCredentials: true }
      );

      if (!mpesaRes.data.success) {
        setLoading(false);
        setError("Failed to initiate M-Pesa payment.");
        setMessage("");
        return;
      }

      const checkoutId = mpesaRes.data.data?.CheckoutRequestID;
      if (!checkoutId) {
        setLoading(false);
        setError("Missing payment reference. Please try again.");
        setMessage("");
        return;
      }

      // 🧩 Step 3: Poll for payment confirmation
      setMessage("Waiting for payment confirmation...");
      let attempts = 0;
      const maxAttempts = 30;
      let pollingActive = true;

      const checkStatus = async () => {
        if (!pollingActive) return;

        try {
          const statusRes = await axios.get(
            `${backendUrl}/api/mpesa/status/${checkoutId}`
          );
          const status = statusRes.data.status;

          if (status === "completed") {
            pollingActive = false;
            setMessage("✅ Payment successful!");
            setError("");

            // 🧩 Mark booking as paid in backend
            await axios.put(
              `${backendUrl}/api/customer/update-booking-status/${bookingId}`,
              {
                is_paid: true,
                status: "Waiting for Work",
              },
              { withCredentials: true }
            );

            setTimeout(() => navigate("/user/my-bookings"), 2500);
          } else if (status === "failed") {
            pollingActive = false;
            setError("❌ Payment failed. Please try again.");
            setMessage("");
            setLoading(false);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 3000);
          } else {
            pollingActive = false;
            setError("⚠️ Payment timeout. Please try again.");
            setMessage("");
            setLoading(false);
          }
        } catch (err) {
          console.error("Polling error:", err);
          pollingActive = false;
          setError("Error checking payment status.");
          setMessage("");
          setLoading(false);
        }
      };

      checkStatus();
    } catch (err) {
      console.error("M-Pesa Error:", err);
      setError("M-Pesa payment failed. Try again.");
      setMessage("");
      setLoading(false);
    }
  };

  // ✅ handle cash payment
  const handleCashPayment = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("Creating your cash booking...");

      // 1️⃣ Create the booking directly (no M-Pesa)
      const bookingRes = await axios.post(
        `${backendUrl}/api/customer/create`,
        {
          serviceId: displayService._id || displayService.id,
          servicerProvider: displayService.serviceProviderName,
          serviceName: displayService.serviceName,
          categoryName: displayService.category,
          amount: displayService.amount,
          address: formData.address,
          city: formData.city,
          delivery_date: formData.delivery_date,
          paymentMethod: "Cash",
          is_paid: false,
        },
        { withCredentials: true }
      );

      if (bookingRes.data.success) {
        setMessage("Cash booking created successfully!");
        setTimeout(() => navigate("/user/my-bookings"), 2000);
      } else {
        throw new Error("Booking creation failed");
      }
    } catch (err) {
      console.error("❌ Cash Booking Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create cash booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === "Mpesa") {
      if (Number(mpesaAmount) !== Number(displayService.amount)) {
        setError(
          `Amount must be exactly ${currSymbol}${displayService.amount}`
        );
        return;
      }
      handleMpesaPayment();
    } else {
      handleCashPayment();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen overflow-y-auto bg-gray-50">
      <h2 className="text-3xl font-bold mb-8 text-center">
        Complete Your Booking
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-6">Payment Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (M-Pesa)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="2547XXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City or County
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Date
              </label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]} 
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2">Payment Method</h4>
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "Mpesa"}
                  onChange={() => setPaymentMethod("Mpesa")}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <label className="ml-3 flex items-center">
                  <FiSmartphone className="w-5 h-5 text-green-500 mr-2" />
                  M-Pesa
                </label>
              </div>

              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <label className="ml-3">Pay in Cash</label>
              </div>

              {paymentMethod === "Mpesa" && (
                <div className="ml-7 pl-1 border-l-2 border-green-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You will receive an M-Pesa prompt on your phone.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 mt-4 disabled:bg-blue-400"
            >
              {loading
                ? "Processing..."
                : paymentMethod === "Mpesa"
                ? "Pay with M-Pesa"
                : "Confirm Cash Booking"}
            </button>
          </div>

          {/* Feedback */}
          {message && (
            <p className="mt-4 text-green-600 text-sm font-medium">{message}</p>
          )}
          {error && !loading && (
            <p className="mt-4 text-red-600 text-sm font-medium">{error}</p>
          )}
        </form>

        {/* Right: Booking Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md md:h-[50vh]">
          <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
          <div className="flex items-center mb-4">
            <img
              src={displayService.image}
              alt={displayService.serviceName}
              className="w-20 h-20 rounded-full mr-4 object-cover"
            />
            <div>
              <h4 className="text-lg font-semibold">
                {displayService.serviceName}
              </h4>
              <p className="text-sm text-gray-500">
                Category: {displayService.category}
              </p>
              <div className="flex mt-1">{renderStars(4)}</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Payment Status: Pending</p>
          <p className="text-lg font-bold mt-4">
            Price: {currSymbol} {displayService.amount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payments;
