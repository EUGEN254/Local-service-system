import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiSmartphone } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { ShareContext } from "../../sharedcontext/SharedContext";

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { service } = location.state || {};
  const{currSymbol} = useContext(ShareContext)

  // If no service selected, use placeholder
  const displayService = service || {
    name: "No Service Selected",
    category: "N/A",
    amount: 0,
    dateAdded: new Date().toISOString().split("T")[0],
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("UI Only: M-Pesa payment initiated!");
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < 4 ? "text-yellow-400" : "text-gray-300"}
      />
    ));

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <h2 className="text-3xl font-bold mb-8 text-center">Complete Your Booking</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6">Payment Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (M-Pesa)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City or County</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Date</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* M-Pesa Section */}
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

              <div className="ml-7 pl-1 border-l-2 border-green-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
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
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 mt-4"
            >
              Pay with M-Pesa
            </button>
          </div>
        </form>

        {/* Right: Booking Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md md:h-[50vh]">
          <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>

          <div className="flex items-center mb-4">
            <img
              src={displayService.image}
              alt={displayService.name}
              className="w-20 h-20 rounded-full mr-4 object-cover"
            />
            <div>
              <h4 className="text-lg font-semibold">Service name:  {displayService.serviceName}</h4>
              <p className="text-sm text-gray-500">Service Category:  {displayService.category}</p>
              <div className="flex mt-1">{renderStars(4)}</div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-1">Payment Status: Not Paid</p>
          <p className="text-lg font-bold mt-4">Price: {currSymbol} {displayService.amount}</p>
        </div>
      </div>
    </div>
  );
};

export default Payments;
