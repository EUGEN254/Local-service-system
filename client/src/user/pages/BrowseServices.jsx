import React, { useState, useEffect, useContext } from "react";
import { FaStar } from "react-icons/fa";
import { categories } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext";

const BrowseServices = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const {backendUrl,currSymbol} = useContext(ShareContext);
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
                className="border rounded-lg p-4 shadow hover:shadow-lg transition"
              >
                {/* Service Image */}
                <div className="flex items-center mb-3">
                  <img
                    src={service.image || "https://picsum.photos/150"}
                    alt={service.serviceName}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">
                     Service: {service.serviceName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Category: {service.category} <br />
                      Service Provider: {service.serviceProviderName}
                    </p>
                  </div>
                </div>

                {/* Service Details */}
                <p className="text-sm mb-2">Price: {currSymbol} {service.amount}</p>
                <div className="flex mb-2">{renderStars(randomRating)}</div>

                <button
                  onClick={() =>
                    navigate("/user/payment", { state: { service } })
                  }
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Book Now
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BrowseServices;
