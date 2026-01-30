import React, { useContext, useEffect, useState } from "react";
import * as allProviders from "../../services/allProviders.js";
import * as ratingService from '../../services/ratingService';
import RatingModal from '../components/RatingModal.jsx';
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { useNavigate } from "react-router-dom";
import { 
  FaStar, 
  FaCheckCircle, 
  FaTimesCircle,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaUserCircle,
  FaIdCard,
  FaCalendarAlt,
  FaUserCheck
} from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";

const AllProviders = () => {
  const { backendUrl, user } = useContext(ShareContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    console.log('showRatingModal', showRatingModal, 'selectedProvider', selectedProvider);
  }, [showRatingModal, selectedProvider]);

  // Get service providers
  const getAllServiceProviders = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await allProviders.fetchAllProviders(
        backendUrl,
        page,
        limit
      );
      
      if (result?.providers) {
        setProviders(result.providers);
        setPagination({
          page: result.page,
          limit: result.limit,
          total: result.total
        });
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (backendUrl) {
      getAllServiceProviders();
    }
  }, [backendUrl]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get verification badge color
  const getVerificationColor = (status) => {
    switch(status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <FaTimesCircle className="h-5 w-5 text-red-500 mr-3" />
          <div>
            <p className="text-red-700 font-medium">Error loading providers</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => getAllServiceProviders()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
          {/* modal intentionally not rendered inside error block */}
      </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Service Providers</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all registered service providers ({pagination.total} total)
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search providers by name, email, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">Sort by</option>
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rating</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div key={provider._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Provider Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    {provider.image ? (
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUserCircle className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {provider.name}
                      </h2>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {provider.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Service Provider</p>
                    
                    {/* Rating */}
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(provider.serviceProviderInfo?.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {provider.serviceProviderInfo?.rating || 0} ({provider.serviceProviderInfo?.totalReviews || 0} reviews)
                      </span>
                    </div>
                      {/* Rate button opens modal */}
                      <div className="mt-2">
                        {user ? (
                          <button
                            onClick={() => {
                              console.log('Rate button clicked for', provider._id);
                              setSelectedProvider(provider);
                              setShowRatingModal(true);
                            }}
                            className="px-3 py-1 bg-yellow-400 text-white rounded text-sm hover:bg-yellow-500"
                          >
                            Rate
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500">Login to rate</div>
                        )}
                      </div>
                  </div>
                </div>
              </div>

              {/* Provider Details */}
              <div className="p-6">
                {/* Contact Information */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="truncate">{provider.email}</span>
                    {provider.emailVerified && (
                      <FaCheckCircle className="h-4 w-4 text-green-500 ml-2" />
                    )}
                  </div>
                  {provider.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaPhone className="h-4 w-4 text-gray-400 mr-3" />
                      <span>{provider.phone}</span>
                    </div>
                  )}
                </div>

                {/* ID Verification Status */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FaIdCard className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">ID Verification</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationColor(provider.serviceProviderInfo?.idVerification?.status)}`}>
                      {provider.serviceProviderInfo?.idVerification?.status || 'Not Submitted'}
                    </span>
                  </div>
                  {provider.serviceProviderInfo?.idVerification?.verifiedAt && (
                    <div className="flex items-center text-xs text-gray-500">
                      <FaUserCheck className="h-3 w-3 mr-1" />
                      Verified on {formatDate(provider.serviceProviderInfo.idVerification.verifiedAt)}
                    </div>
                  )}
                </div>

                {/* Job Stats */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {provider.serviceProviderInfo?.completedJobs || 0}
                      </div>
                      <div className="text-xs text-gray-500">Completed Jobs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {provider.serviceProviderInfo?.rating || 0}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                  <button 
                    onClick={() => {
                      const serviceData = {
                        _id: provider._id,
                        serviceName: "Service Inquiry",
                        serviceProviderName: provider.name,
                        providerImage: provider.image,
                        category: "General",
                        amount: 0,
                        rating: provider.serviceProviderInfo?.rating || 0,
                        totalReviews: provider.serviceProviderInfo?.totalReviews || 0,
                        serviceProvider: {
                          _id: provider._id,
                          name: provider.name,
                          image: provider.image,
                          email: provider.email,
                        },
                      };
                      navigate("/user/chat", { state: { service: serviceData } });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <FiMessageCircle className="text-lg" />
                    <span>Message</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <FaCalendarAlt className="h-3 w-3 mr-1" />
                    Joined {formatDate(provider.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <FaBriefcase className="h-3 w-3 mr-1" />
                    {provider.serviceProviderInfo?.isVerified ? 'Verified' : 'Unverified'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {providers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <FaUserCircle className="h-full w-full opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
            <p className="text-gray-500">There are no service providers registered yet.</p>
          </div>
        )}

        {/* Pagination */}
        {providers.length > 0 && (
          <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> providers
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => getAllServiceProviders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => getAllServiceProviders(pagination.page + 1)}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className={`px-4 py-2 border rounded-md text-sm font-medium ${pagination.page * pagination.limit >= pagination.total ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {showRatingModal && (
      <RatingModal
        backendUrl={backendUrl}
        provider={selectedProvider || providers[0]}
        onClose={() => { setShowRatingModal(false); setSelectedProvider(null); }}
        onRated={() => getAllServiceProviders(pagination.page, pagination.limit)}
      />
    )}
    </>
  );
};

export default AllProviders;