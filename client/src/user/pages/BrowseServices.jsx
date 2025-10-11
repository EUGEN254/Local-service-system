import React, { useState, useEffect, useContext } from "react";
import { FaStar } from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";
import { categories } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext";

const BrowseServices = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/customer/services");
        if (data.success) {
          setServices(data.services);
        } else {
          console.error("Failed to fetch services:", data.message);
        }
      } catch (err) {
        console.error("Error fetching services:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      />
    ));
  };

  // Filter services based on selected category
  const filteredServices =
    selectedCategory === "All"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  if (loading) {
    return <div className="p-6 text-center">Loading services...</div>;
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <h2 className="text-2xl font-bold mb-4">Browse Services</h2>

      {/* Filter Dropdown */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded p-1"
        >
          <option value="All">All</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No services found.
          </div>
        ) : (
          filteredServices.map((service, index) => {
            const randomRating = Math.floor(Math.random() * 5) + 1;

            return (
              <div
                key={`${service._id}-${index}`}
                className="border rounded-xl p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between"
              >
                {/* Service Header */}
                <div className="flex items-center mb-4">
                  <img
                    src={service.image || "https://picsum.photos/150"}
                    alt={service.serviceName}
                    className="w-12 h-12 rounded-full mr-3 object-cover border border-gray-200"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {service.serviceName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Category: {service.category} <br />
                      Provider:{" "}
                      <span className="font-medium text-gray-700">
                        {service.serviceProviderName}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Service Details */}
                <p className="text-sm text-gray-700 mb-2">
                  Price:{" "}
                  <span className="font-medium">
                    {currSymbol}
                    {service.amount}
                  </span>
                </p>
                <div className="flex mb-4">{renderStars(randomRating)}</div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={() =>
                      navigate("/user/payment", { state: { service } })
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                  >
                    Book Now
                  </button>

                  <button
                    onClick={() =>
                      navigate("/user/chat", { state: { service } })
                    }
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition font-medium"
                  >
                    <FiMessageCircle className="text-lg" />
                    <span className="text-sm">Chat</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BrowseServices;
