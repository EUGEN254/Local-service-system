import React, { useState, useEffect, useContext } from "react";
import { FaStar, FaFilter } from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext";

const BrowseServices = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/landingpage/categories`,
        );
        if (data.success) {
          setCategories(data.data);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };
    fetchCategories();
  }, []);

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  // Filter services based on selected category and search
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "All" || service.category === selectedCategory;

    const matchesSearch =
      searchTerm === "" ||
      service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceProviderName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white ">
      {/* Scrollable content container */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-3">
                  {selectedCategory === "All"
                    ? "All Categories"
                    : selectedCategory}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedCategory === "All"
                    ? "Discover All Services"
                    : selectedCategory}
                </h1>
                <p className="text-gray-600">
                  {selectedCategory === "All"
                    ? "Browse all professional services from verified providers"
                    : `Top-rated ${selectedCategory.toLowerCase()} professionals ready to help`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded">
                  <span className="font-medium text-gray-900">
                    {filteredServices.length}
                  </span>{" "}
                  services
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search services by name, category, or provider..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-transparent"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-4">
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((category, idx) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                      <FaFilter className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4 text-gray-300">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No services found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? `No results for "${searchTerm}". Try a different search.`
                  : selectedCategory !== "All"
                    ? `No services found in ${selectedCategory}. Try selecting "All Categories".`
                    : "No services available at the moment."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchTerm("");
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Browse All Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredServices.map((service, index) => {
                const randomRating = Math.floor(Math.random() * 5) + 1;
                const randomReviews = Math.floor(Math.random() * 400) + 50;

                return (
                  <div
                    key={`${service._id}-${index}`}
                    className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden transition-colors hover:shadow-md"
                  >
                    {/* Service Image */}
                    <div
                      onClick={() => {
                        /* Optional: Add quick view modal */
                      }}
                      className="relative overflow-hidden h-48"
                    >
                      <img
                        src={service.image || "https://picsum.photos/400/300"}
                        alt={service.serviceName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-white text-gray-900 text-xs font-medium px-2 py-1 rounded">
                          {service.category?.charAt(0).toUpperCase() +
                            service.category?.slice(1) || "Service"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        <span className="font-bold">★</span>
                        <span className="font-medium">
                          {randomRating.toFixed(1)}
                        </span>
                        <span className="text-gray-300 text-xs">
                          ({randomReviews})
                        </span>
                      </div>
                    </div>

                    {/* Service Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {service.serviceName}
                        </h3>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold text-gray-900">
                            {currSymbol}
                            {service.amount}
                          </span>
                          <span className="text-xs text-gray-500">
                            starting price
                          </span>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={
                            service.providerImage || "https://picsum.photos/40"
                          }
                          alt={service.serviceProviderName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {service.serviceProviderName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Service Provider
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {renderStars(randomRating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({randomRating.toFixed(1)})
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            navigate("/user/payment", { state: { service } })
                          }
                          className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded transition-colors"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() =>
                            navigate("/user/chat", { state: { service } })
                          }
                          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium text-sm border border-gray-300 hover:border-gray-400 px-4 py-2.5 rounded transition-colors"
                        >
                          <FiMessageCircle className="text-lg" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Post a request and let
              providers come to you.
            </p>
            <button
              onClick={() => navigate("/user/post-request")}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Post a Service Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseServices;
