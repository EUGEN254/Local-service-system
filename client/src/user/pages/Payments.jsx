import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiSmartphone } from "react-icons/fi";
import { FaMoneyBillWave, FaStar } from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { service } = location.state || {};
  const { backendUrl, currSymbol } = useContext(ShareContext);

  // if service not found
  const displayService = service || {
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const serviceAmount = Number(displayService.amount) || 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // validate mpesa amount
  const handleAmountChange = (e) => {
    const value = Number(e.target.value);
    setMpesaAmount(value);

    if (value !== serviceAmount) {
      setError(`Amount must be exactly ${currSymbol}${serviceAmount}`);
    } else {
      setError("");
    }
  };

  // handle mpesa stk push
  const handleMpesaPayment = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { phone } = formData;
      if (!phone) return setError("Please enter a valid phone number.");

      if (Number(mpesaAmount) !== serviceAmount)
        return setError(`Amount must be exactly ${currSymbol}${serviceAmount}`);

      const res = await axios.post(
        `${backendUrl}/api/mpesa/stkpush`,
        {
          amount: mpesaAmount,
          phone,
          serviceId: displayService.id,
          serviceName: displayService.serviceName,
        },
        { withCredentials: true }
      );

      setMessage("✅ M-Pesa STK Push sent! Check your phone to complete payment.");
      console.log("Mpesa Response:", res.data);
    } catch (err) {
      console.error("Mpesa Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // handle cash payment
  const handleCashPayment = () => {
    setMessage(
      "💵 You have chosen to pay in cash. Please pay the service provider upon arrival."
    );
  };

  // handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === "Mpesa") {
      handleMpesaPayment();
    } else if (paymentMethod === "Cash") {
      handleCashPayment();
    }
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      />
    ));

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <h2 className="text-3xl font-bold mb-8 text-center">Complete Your Booking</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-6">Payment Details</h3>

          <div className="space-y-4">
            {/* Customer Details */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="2547XXXXXXXX"
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

              {/* M-Pesa Option */}
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "Mpesa"}
                  onChange={() => setPaymentMethod("Mpesa")}
                  className="h-4 w-4 text-green-600 border-gray-300"
                />
                <label className="ml-3 flex items-center">
                  <FiSmartphone className="w-5 h-5 text-green-500 mr-2" />
                  M-Pesa
                </label>
              </div>

              {/* Cash Option */}
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                  className="h-4 w-4 text-green-600 border-gray-300"
                />
                <label className="ml-3 flex items-center">
                  <FaMoneyBillWave className="w-5 h-5 text-gray-700 mr-2" />
                  Pay in Cash
                </label>
              </div>

              {/* M-Pesa Amount */}
              {paymentMethod === "Mpesa" && (
                <div className="ml-7 pl-2 border-l-2 border-green-200 mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={mpesaAmount}
                    onChange={handleAmountChange}
                    className={`w-full px-4 py-2 border rounded-md ${
                      error ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    You’ll receive an M-Pesa prompt on your phone.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 mt-4 disabled:bg-green-300"
            >
              {loading
                ? "Processing..."
                : paymentMethod === "Mpesa"
                ? "Pay with M-Pesa"
                : "Confirm Cash Payment"}
            </button>

            {message && (
              <p className="text-green-600 text-sm mt-3 font-medium">{message}</p>
            )}
            {error && !loading && (
              <p className="text-red-600 text-sm mt-3 font-medium">{error}</p>
            )}
          </div>
        </form>

        {/* Right: Booking Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md md:h-[50vh]">
          <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>

          <div className="flex items-center mb-4">
            {displayService.image && (
              <img
                src={displayService.image}
                alt={displayService.serviceName}
                className="w-20 h-20 rounded-full mr-4 object-cover"
              />
            )}
            <div>
              <h4 className="text-lg font-semibold">
                Service: {displayService.serviceName}
              </h4>
              <p className="text-sm text-gray-500">
                Category: {displayService.category}
              </p>
              <div className="flex mt-1">{renderStars(4)}</div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-1">Payment Status: Not Paid</p>
          <p className="text-lg font-bold mt-4">
            Price: {currSymbol} {serviceAmount}
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          ← Back to My Bookings
        </button>
      </div>
    </div>
  );
};

export default Payments;
