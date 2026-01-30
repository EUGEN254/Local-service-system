import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { 
  FaStar, 
  FaFilter, 
  FaChevronLeft, 
  FaChevronRight, 
  FaAngleDoubleLeft, 
  FaAngleDoubleRight,
  FaSearch,
  FaTimesCircle
} from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import * as serviceService from "../../services/serviceService";
import { fetchLandingCategories } from "../../services/landingPageService";
import { ShareContext } from "../../sharedcontext/SharedContext";

const BrowseServices = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { backendUrl, currSymbol } = useContext(ShareContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalServices: 0,
    limit: 9,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch services from API with pagination (uses service layer)
  const fetchServices = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);

      const result = await serviceService.fetchPublicServices(
        backendUrl,
        page,
        limit,
        searchTerm,
        selectedCategory
      );

      setServices(result.services || []);
      setPagination((prev) => ({
        ...prev,
        currentPage: result.pagination?.currentPage || 1,
        totalPages: result.pagination?.totalPages || 1,
        totalServices: result.pagination?.totalServices || 0,
        limit: result.pagination?.limit || limit,
        hasNextPage: result.pagination?.hasNextPage || false,
        hasPrevPage: result.pagination?.hasPrevPage || false,
      }));
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error fetching services';
      toast.error(msg);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch services when filters or pagination changes
  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    const timer = setTimeout(() => {
      fetchServices(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  // Fetch services when page or limit changes
  useEffect(() => {
    if (pagination.currentPage > 0) {
      fetchServices(pagination.currentPage, pagination.limit);
    }
  }, [pagination.currentPage, pagination.limit]);

  // Fetch categories (uses landingPageService)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchLandingCategories(backendUrl);
        setCategories(cats || []);
      } catch (error) {
        const msg = error?.response?.data?.message || error.message || 'Error fetching categories';
        toast.error(msg);
      }
    };
    loadCategories();
  }, []);

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
      // Scroll to top of services grid
      const servicesContainer = document.querySelector('.overflow-y-auto');
      if (servicesContainer) {
        servicesContainer.scrollTop = 0;
      }
    }
  };

  // FIXED: Handle limit change - this now properly triggers a refetch
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      currentPage: 1, // Reset to page 1 when changing limit
    }));
    // The useEffect above will detect limit change and trigger fetchServices
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return searchTerm || selectedCategory !== "All";
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const { currentPage, totalPages } = pagination;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

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

  // Loading skeleton
  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Skeleton for header */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
            
            {/* Skeleton for filter bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="h-12 bg-gray-100 rounded-lg"></div>
            </div>
            
            {/* Skeleton for pagination */}
            <div className="h-12 bg-gray-50 rounded-lg mb-6"></div>
            
            {/* Skeleton for services grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
                {/* Active filters indicator */}
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-2"
                  >
                    <span>Clear Filters</span>
                    <FaTimesCircle className="w-3 h-3" />
                  </button>
                )}
                <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  Total:{" "}
                  <span className="font-bold text-gray-800">
                    {pagination.totalServices}
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
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search services by name, category, or provider..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
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
                      {categories.map((category) => (
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

            {/* Pagination Controls - Top */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={pagination.limit}
                  onChange={handleLimitChange}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="6">6</option>
                  <option value="9">9</option>
                  <option value="12">12</option>
                  <option value="18">18</option>
                  <option value="24">24</option>
                </select>
                <span className="text-sm text-gray-600">services per page</span>
              </div>

              {/* Page info */}
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {pagination.totalServices === 0 ? 0 : 
                    (pagination.currentPage - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalServices
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {pagination.totalServices}
                </span>{" "}
                services
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrevPage || pagination.currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    !pagination.hasPrevPage || pagination.currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="First page"
                >
                  <FaAngleDoubleLeft />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`p-2 rounded-lg transition-colors ${
                    !pagination.hasPrevPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="Previous page"
                >
                  <FaChevronLeft />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === "..." ? (
                        <span className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            pagination.currentPage === pageNum
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next page */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`p-2 rounded-lg transition-colors ${
                    !pagination.hasNextPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="Next page"
                >
                  <FaChevronRight />
                </button>

                {/* Last page */}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={
                    !pagination.hasNextPage ||
                    pagination.currentPage === pagination.totalPages
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    !pagination.hasNextPage ||
                    pagination.currentPage === pagination.totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="Last page"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
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
                onClick={clearAllFilters}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Browse All Services
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {services.map((service, index) => {
                  const rating = service.rating || service.providerRating || 0;
                  const reviews = service.totalReviews || service.reviewCount || 0;
                  const ratingDisplay = parseFloat(rating).toFixed(1);

                  return (
                    <div
                      key={`${service._id}-${index}`}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden transition-colors hover:shadow-md"
                    >
                      {/* Service Image */}
                      <div className="relative overflow-hidden h-48">
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
                            {ratingDisplay}
                          </span>
                          <span className="text-gray-300 text-xs">
                            ({reviews})
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
                            {renderStars(Math.round(rating))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({ratingDisplay}) · {reviews} reviews
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              navigate("/user/payment", { state: { service } });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
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

              {/* Pagination Controls - Bottom */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrevPage || pagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasPrevPage || pagination.currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasPrevPage
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasNextPage
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={
                        !pagination.hasNextPage ||
                        pagination.currentPage === pagination.totalPages
                      }
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        !pagination.hasNextPage ||
                        pagination.currentPage === pagination.totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
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