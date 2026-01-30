import React, { useContext, useEffect, useState } from "react";
import LoginSignUp from "./LoginSignUp";
import AnimatedCounter from "./AnimatedCounter";
import LearnMore from "./LearnMore";
import { ShareContext } from "../sharedcontext/SharedContext";
import * as landingPageService from "../services/landingPageService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useLandingPage, useCategories } from "../hooks/index";
import {
  FaSignOutAlt,
  FaChevronDown,
  FaTachometerAlt,
  FaCog,
} from "react-icons/fa";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("Sign Up");
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user, logoutUser, backendUrl, currSymbol } = useContext(ShareContext);

  // Use hooks directly
  const {
    landingCategories,
    landingServices,
    loadingLandingData,
    fetchLandingData,
  } = useLandingPage(backendUrl);

  const { fetchCategories } = useCategories(backendUrl);

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Helper function to get correct dashboard path based on user role
  const getDashboardPath = () => {
    if (user?.role === "serviceprovider" || user?.role === "service-provider") {
      return "/sp/dashboard";
    }
    return "/user/dashboard";
  };

  // Helper function to get correct settings path based on user role
  const getSettingsPath = () => {
    if (user?.role === "serviceprovider" || user?.role === "service-provider") {
      return "/sp/settings";
    }
    return "/user/settings";
  };

  // Fetch landing data and categories on mount
  useEffect(() => {
    fetchLandingData();
    fetchCategories();
  }, [fetchLandingData, fetchCategories]);

  // Use landing data from hook
  useEffect(() => {
    if (landingCategories.length > 0) {
      setSelectedCategory("All");
    }
  }, [landingCategories]);

  // Filter services based on selected category
  const filteredServices =
    selectedCategory === "All"
      ? landingServices
      : landingServices.filter(
          (service) => service.category === selectedCategory,
        );

  const handleQuickView = async (serviceId) => {
    try {
      const data = await landingPageService.fetchProviderDetails(
        backendUrl,
        serviceId,
      );
      if (data.success) {
        setSelectedProvider(data.data); // Set the entire data object, not just provider
        setShowProviderModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle booking attempt from provider modal
  const handleBookClick = (provider) => {
    // If not logged in, show signup/login
    if (!user) {
      setAuthMode("Sign Up");
      setShowAuthModal(true);
      setShowProviderModal(false);
      return;
    }

    // Prevent booking own services
    const userId = user?._id || user?.id || user?.userId;
    const providerId = provider?._id || provider?.id || provider?._id;
    if (userId && providerId && userId.toString() === providerId.toString()) {
      toast.error("You can't book your own service.");
      return;
    }

    // If signed in as a service provider, show warning and CTA to switch role
    if (user?.role === "service-provider" || user?.role === "serviceprovider") {
      toast.warn(
        <div>
          <div>
            You're signed in as a Service Provider. Switch to a Customer account
            to make a booking.
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                navigate(getSettingsPath());
                toast.dismiss();
              }}
              className="px-3 py-1 bg-white text-sm rounded border"
            >
              Switch to Customer
            </button>
          </div>
        </div>,
        { autoClose: 6000 },
      );
      return;
    }

    // Navigate to payment with service data
    navigate("/user/payment", { state: { service: selectedProvider?.service } });
    setShowProviderModal(false);
   
  };

  // Render star rating with colors
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  // view of service provider modal
  const ProviderDetailsModal = () => {
    if (!selectedProvider) return null;

    const provider = selectedProvider.provider || selectedProvider;
    const info = provider.serviceProviderInfo || {};
    const ratings = selectedProvider.ratings || { averageRating: 0, totalReviews: 0, reviews: [] };

    const renderStars = (rating) => {
      return Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-lg ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {provider.name}
              </h2>
              <p className="text-gray-600 mt-1">{provider.email}</p>
            </div>
            <button
              onClick={() => {
                setShowProviderModal(false);
                setSelectedProvider(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Provider Profile */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column - Profile */}
              <div className="md:w-1/3">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow"
                    />
                    <h3 className="text-xl font-bold mt-4">{provider.name}</h3>
                    <div className="mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          info.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {info.isVerified
                          ? "✓ Verified"
                          : "Pending Verification"}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-gray-700">{provider.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700">{provider.email}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-gray-900">
                        {info.completedJobs || 0}
                      </div>
                      <div className="text-sm text-gray-600">Jobs Done</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-gray-900">
                        {info.rating || 0}
                      </div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="md:w-2/3">
                {/* Verification Status */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Verification Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">ID Verification</span>
                      <span
                        className={`font-medium ${
                          info.idVerification?.status === "verified"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {info.idVerification?.status || "Not submitted"}
                      </span>
                    </div>
                    {info.idVerification?.submittedAt && (
                      <div className="text-sm text-gray-500">
                        Submitted:{" "}
                        {new Date(
                          info.idVerification.submittedAt,
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Services Offered
                  </h3>
                  {info.services && info.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {info.services
                        .filter((service) => service.serviceName)
                        .map((service, index) => (
                          <span
                            key={service._id || index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {service.serviceName}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No services listed yet</p>
                  )}
                </div>

                {/* About */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700">
                    Member since{" "}
                    {new Date(provider.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 mt-2">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {provider.status}
                    </span>
                  </p>
                </div>

                {/* Ratings & Reviews */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Customer Reviews
                  </h3>
                  
                  {/* Average Rating Display */}
                  <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(ratings.averageRating)}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {ratings.averageRating}
                      </div>
                      <div className="text-sm text-gray-600">
                        Based on {ratings.totalReviews} reviews
                      </div>
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  {ratings.reviews && ratings.reviews.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {ratings.reviews.map((review) => (
                        <div key={review._id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {review.userImage ? (
                                <img
                                  src={review.userImage}
                                  alt={review.userName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                                  {review.userName?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {review.userName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-700 ml-10">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No reviews yet. Be the first to rate this provider!
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={() => handleBookClick(provider)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Book This Provider
                  </button>
                  <button
                    onClick={() => setShowProviderModal(false)}
                    className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div
                onClick={() => navigate("/")}
                className="flex items-center cursor-pointer"
              >
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">W</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">WorkLink</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#categories"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Categories
              </a>
              <a
                href="#services"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Services
              </a>
              <button
                onClick={() => setShowLearnMore(true)}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                How It Works
              </button>
            </div>

            {/* Right side - Auth/User */}
            {user ? (
              <div className="flex items-center gap-6">
                {/* Dashboard button */}
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="hidden md:block text-gray-700 hover:text-gray-900 font-medium  px-4 py-2  hover:bg-gray-100"
                >
                  Dashboard
                </button>

                {/* User dropdown */}
                <div className="relative">
                  <div
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <FaChevronDown
                      className={`text-gray-600 text-sm transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-68 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-lg font-medium text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-base text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate(getDashboardPath());
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        >
                          <FaTachometerAlt className="text-gray-500" />
                          <span className="font-medium text-lg">Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate(getSettingsPath());
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        >
                          <FaCog className="text-gray-500" />
                          <span className="font-medium text-lg">Settings</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm"
                          onClick={logoutUser}
                        >
                          <FaSignOutAlt className="text-red-500" />
                          <span className="font-medium text-lg">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setAuthMode("Login");
                    setShowAuthModal(true);
                  }}
                  className="hidden sm:block text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("Sign Up");
                    setShowAuthModal(true);
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
              <span className="text-sm font-medium">
                ✨ Trusted by 10+ professionals
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
              Find Trusted{" "}
              <span className="text-white">
                Home Mantainance Service Providers
              </span>
            </h1>

            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Connect with verified professionals for all your needs. Browse
              categories, compare prices, and book quality services with
              confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  setAuthMode("Sign Up");
                  setShowAuthModal(true);
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowLearnMore(true)}
                className="bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>Learn More</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold mb-2 text-white">
                  <AnimatedCounter target={50} suffix="+" duration={2000} />
                </div>
                <div className="text-sm text-gray-300">Services Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold mb-2 text-white">
                  <AnimatedCounter target={20} suffix="+" duration={2000} />
                </div>
                <div className="text-sm text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold mb-2 text-white">
                  <AnimatedCounter target={98} suffix="%" duration={2000} />
                </div>
                <div className="text-sm text-gray-300">Satisfaction Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold mb-2 text-white">
                  24/7
                </div>
                <div className="text-sm text-gray-300">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Sidebar Layout */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        id="categories"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Browse Categories
              </h2>

              {/* Categories mapping */}
              <div className="space-y-2">
                {loadingLandingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-200 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : landingCategories.length > 0 ? (
                  landingCategories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg text-left ${
                        selectedCategory === category.name
                          ? "bg-gray-100 border border-gray-300"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Category Image - fixed to use img tag */}
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                            selectedCategory === category.name
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className="font-bold">
                            {category.name?.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${
                            selectedCategory === category.name
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </p>
                      </div>

                      {selectedCategory === category.name && (
                        <div className="text-gray-900">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No categories available
                  </p>
                )}
              </div>

              {/* Category Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Selected Category:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedCategory}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Services Available:
                  </span>
                  <span className="text-sm font-medium text-gray-900 px-2 py-1 bg-gray-100 rounded">
                    {filteredServices.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content - Services */}
          <div className="lg:w-3/4" id="services">
            {/* Selected Category Header */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
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
                  <button
                    onClick={() => {
                      setAuthMode("Sign Up");
                      setShowAuthModal(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Post a Request
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap gap-2 mb-8">
                {["All", "Popular", "Available Now"].map((filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-2 font-medium rounded-lg border ${
                      filter === "All"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Grid */}
            {loadingLandingData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden transition-colors"
                  >
                    <div
                      onClick={() => handleQuickView(service._id)}
                      className="relative overflow-hidden h-48"
                    >
                      <img
                        src={service.image}
                        alt={service.serviceName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-white text-gray-900 text-xs font-medium px-2 py-1 rounded">
                          {service.category.charAt(0).toUpperCase() +
                            service.category.slice(1)}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        <span className="font-bold">★</span>
                        <span className="font-medium">
                          {(service.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-gray-300 text-xs">
                          ({service.totalReviews || 0})
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {service.serviceName}
                      </h3>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-bold text-gray-900">
                          {currSymbol}{service.amount}
                        </span>
                        <span className="text-xs text-gray-500">
                          starting price
                        </span>
                      </div>

                      {/* Star Rating Display */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-0.5">
                          {renderStars(service.rating || 0)}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({service.totalReviews || 0} reviews)
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() =>
                            handleQuickView(service._id)
                          }
                          className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                        >
                          Quick View
                        </button>
                        {user ? (
                          <button
                            onClick={() => {
                              if (user?.role === "customer") {
                                navigate("/user/payment", {
                                  state: { service },
                                });
                                window.scrollTo(0, 0);
                              } else {
                                toast.info("kindly register as a customer");
                              }
                            }}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded transition-colors"
                          >
                            Book Now
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setAuthMode("Sign Up");
                              setShowAuthModal(true);
                            }}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded transition-colors"
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4 text-gray-300">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No services found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try selecting a different category
                </p>
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Browse All Services
                </button>
              </div>
            )}

            {/* Features Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Why Choose WorkLink
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: "🔒",
                    title: "Verified Providers",
                    description:
                      "All service providers are background-checked and verified",
                  },
                  {
                    icon: "💳",
                    title: "Secure Payments",
                    description:
                      "Protected transactions with money-back guarantee",
                  },
                  {
                    icon: "⭐",
                    title: "Quality Guaranteed",
                    description: "5-star service quality with customer reviews",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-lg border border-gray-200"
                  >
                    <div className="text-2xl mb-4">{feature.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          {user ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ready to Book a Service?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Browse our verified service providers and book your next appointment today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/user/dashboard")}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Browse Services
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ready to Find Your Perfect Service?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of satisfied customers who found their trusted
                service providers on WorkLink
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setAuthMode("Sign Up");
                    setShowAuthModal(true);
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg px-8 py-4 rounded-lg transition-colors"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => setShowLearnMore(true)}
                  className="bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Learn More
                </button>
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 w-full max-w-md">
            <LoginSignUp
              initialState={authMode}
              setShowAuthModal={setShowAuthModal}
            />
          </div>
        </div>
      )}

      {/* Provider Details Modal */}
      {showProviderModal && <ProviderDetailsModal />}

      {showLearnMore && (
        <LearnMore
          onClose={() => setShowLearnMore(false)}
          setShowAuthModal={setShowAuthModal}
          setAuthMode={setAuthMode}
        />
      )}
    </div>
  );
};

export default LandingPage;
