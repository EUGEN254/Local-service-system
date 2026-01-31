import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { assets } from "../../assets/assets";
import { toast } from "sonner";
import * as spServicesService from "../../services/spServicesService";
import { ShareContext } from "../../sharedcontext/SharedContext";
import { useServices } from "../../hooks/useServices";
import { useCategories } from "../../hooks/index";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEdit,
  FaTrash,
  FaImage,
  FaIdCard,
  FaPhone,
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { HiOutlinePhotograph } from "react-icons/hi";

const MyServices = () => {
  const {
    backendUrl,
    currSymbol,
    verified,
    user,
    fetchCurrentUser,
  } = useContext(ShareContext);

  // Use service and category hooks directly
  const {
    services,
    fetchServices,
    addService,
    removeService,
    pagination,
    setPagination,
  } = useServices(backendUrl);

  const {
    categories,
    fetchCategories,
  } = useCategories(backendUrl);


  const [form, setForm] = useState({
    category: "",
    serviceName: "",
    amount: "",
    status: "Active",
    image: null,
    imagePreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    serviceId: null,
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // id document verification
  const [formId, setFormId] = useState({
    phonenumber: "",
    frontImage: null,
    frontImagePreview: null,
    backImage: null,
    backImagePreview: null,
  });

  // FILTERING STATE
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    sortBy: "dateAdded",
    sortOrder: "desc",
  });

  // LOCAL SERVICES STATE FOR FILTERING
  const [localServices, setLocalServices] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Initialize categories and services
  useEffect(() => {
    fetchCategories();
    fetchServices(1, pagination.limit);
  }, []);

  // Separate useEffect for setting initial category
  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

  // Update local services when services from context change
  useEffect(() => {
    setLocalServices(services);
  }, [services]);

  // Apply filters to local services
  const applyFilters = useCallback(() => {
    if (!localServices.length) return [];

    let filtered = [...localServices];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.serviceName.toLowerCase().includes(searchTerm) ||
          service.category.toLowerCase().includes(searchTerm) ||
          service.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (service) => service.category === filters.category
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(
        (service) => service.status === filters.status
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "serviceName":
          aValue = a.serviceName.toLowerCase();
          bValue = b.serviceName.toLowerCase();
          break;
        case "amount":
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case "dateAdded":
          aValue = new Date(a.dateAdded);
          bValue = new Date(b.dateAdded);
          break;
        default:
          aValue = a[filters.sortBy];
          bValue = b[filters.sortBy];
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [localServices, filters]);

  // Get filtered services
  const filteredServices = useMemo(() => {
    return applyFilters();
  }, [applyFilters]);

  // Calculate pagination for filtered results
  const getPaginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, pagination.currentPage, pagination.limit]);

  // Calculate total pages for filtered results
  const totalFilteredPages = useMemo(() => {
    return Math.ceil(filteredServices.length / pagination.limit) || 1;
  }, [filteredServices.length, pagination.limit]);

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsFiltering(true);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSortChange = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
      sortBy: "dateAdded",
      sortOrder: "desc",
    });
    setIsFiltering(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalFilteredPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      const tableContainer = document.querySelector(".services-table-container");
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }
  };

  const handleLimitChange = (newLimit) => {
    const limit = parseInt(newLimit);
    setPagination((prev) => ({
      ...prev,
      limit: limit,
      currentPage: 1,
    }));
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const { currentPage } = pagination;
    const totalPages = totalFilteredPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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

  // --- Handlers for Add Service ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      if (value === "custom") {
        setShowCustomCategory(true);
        setForm((prev) => ({ ...prev, [name]: "" }));
      } else {
        setShowCustomCategory(false);
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomCategoryChange = (e) => {
    setForm((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!form.serviceName || !form.amount || !form.image) {
      return toast.info("Service name, amount, and image are required");
    }

    if (!form.category) {
      return toast.info("Please select or enter a category");
    }

    const formData = new FormData();
    formData.append("category", form.category);
    formData.append("serviceName", form.serviceName);
    formData.append("amount", form.amount);
    formData.append("status", form.status);
    formData.append("image", form.image);

    setLoading(true);
    try {
      const data = await spServicesService.addService(backendUrl, formData);

      if (!data.success)
        throw new Error(data.message || "Failed to add service");
      
      addService(data.service);
      toast.success("Service added successfully!");
      
      // Reset form
      setForm({
        category: categories.length > 0 ? categories[0].name : "",
        serviceName: "",
        amount: "",
        status: "Active",
        image: null,
        imagePreview: null,
      });
      setShowCustomCategory(false);
      
      // Refresh services
      fetchServices(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Edit Service ---
  const openEditModal = (service) => setEditModal(service);
  const closeEditModal = () => setEditModal(null);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditModal((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setEditModal((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editModal.serviceName || !editModal.amount)
      return toast.error("Service name and amount are required");

    const formData = new FormData();
    formData.append("category", editModal.category);
    formData.append("serviceName", editModal.serviceName);
    formData.append("amount", editModal.amount);
    formData.append("status", editModal.status);
    if (editModal.imageFile) formData.append("image", editModal.imageFile);

    setLoading(true);
    try {
      const data = await spServicesService.updateService(backendUrl, editModal._id, formData);

      if (!data.success)
        throw new Error(data.message || "Failed to update service");
      
      toast.success("Service updated!");
      fetchServices(pagination.currentPage, pagination.limit);
      closeEditModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Delete Service ---
  const openDeleteModal = (id) => setDeleteModal({ open: true, serviceId: id });
  const closeDeleteModal = () =>
    setDeleteModal({ open: false, serviceId: null });

  const confirmDelete = async () => {
    if (!deleteModal.serviceId) return;
    setLoading(true);
    try {
      const data = await spServicesService.deleteService(backendUrl, deleteModal.serviceId);
      if (!data.success)
        throw new Error(data.message || "Failed to delete service");
      
      removeService(deleteModal.serviceId);
      toast.success("Service deleted!");
      fetchServices(pagination.currentPage, pagination.limit);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  // ID Verification handlers
  const handleIdChange = (e) => {
    const { name, value } = e.target;
    setFormId((prev) => ({ ...prev, [name]: value }));
  };

  const handleIDImageChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFormId((prev) => ({
        ...prev,
        [`${side}Image`]: file,
        [`${side}ImagePreview`]: URL.createObjectURL(file),
      }));
    }
  };

  const handleDrop = (e, side) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFormId((prev) => ({
        ...prev,
        [`${side}Image`]: file,
        [`${side}ImagePreview`]: file.type.startsWith("image")
          ? URL.createObjectURL(file)
          : null,
      }));
    }
  };

  const handleShareDocument = async (e) => {
    e.preventDefault();

    if (!formId.phonenumber) {
      return toast.error("Phone number is required");
    }

    if (!formId.frontImage) {
      return toast.error("Front ID image is required");
    }

    if (!formId.backImage) {
      return toast.error("Back ID image is required");
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formId.phonenumber)) {
      return toast.error("Please enter a valid phone number (10-15 digits)");
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("phonenumber", formId.phonenumber);
      formData.append("frontImage", formId.frontImage);
      formData.append("backImage", formId.backImage);
      formData.append("idType", "national-id");

      const data = await spServicesService.submitIdVerification(backendUrl, formData);

      if (!data.success)
        throw new Error(data.message || "ID verification failed");

      toast.success("ID submitted successfully! Awaiting admin confirmation.");

      setFormId({
        phonenumber: "",
        frontImage: null,
        frontImagePreview: null,
        backImage: null,
        backImagePreview: null,
      });

      await fetchCurrentUser(false);
    } catch (err) {
      console.error("Error submitting ID:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit ID documents",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Scrollable content container */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-3">
                  Service Management
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Services
                </h1>
                <p className="text-gray-600">
                  Add, edit, and manage your service offerings
                </p>
              </div>
              <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                Total:{" "}
                <span className="font-bold text-gray-800">
                  {isFiltering ? filteredServices.length : services.length}
                </span>{" "}
                services
                {isFiltering && (
                  <span className="ml-2 text-blue-600">
                    (Filtered)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* --- Add Service Form --- */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Service</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddService}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={showCustomCategory ? "custom" : form.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="custom">+ Add Custom Category</option>
                    </select>

                    {showCustomCategory && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={form.category}
                          onChange={handleCustomCategoryChange}
                          placeholder="Enter your custom category"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Type your custom category name
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Service Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Service Name
                    </label>
                    <input
                      type="text"
                      name="serviceName"
                      value={form.serviceName}
                      onChange={handleChange}
                      placeholder="Enter service name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Service Image (required)
                  </label>
                  <div
                    className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition relative bg-gray-50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith("image/")) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image size should be less than 5MB");
                          return;
                        }
                        setForm((prev) => ({
                          ...prev,
                          image: file,
                          imagePreview: URL.createObjectURL(file),
                        }));
                      }
                    }}
                    onClick={() =>
                      document.getElementById("add-service-file").click()
                    }
                  >
                    {form.imagePreview ? (
                      <>
                        <img
                          src={form.imagePreview}
                          alt="Upload Preview"
                          className="h-40 w-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm((prev) => ({
                              ...prev,
                              image: null,
                              imagePreview: null,
                            }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FaTimes size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <HiOutlinePhotograph className="text-4xl text-gray-400 mb-3" />
                        <span className="text-sm text-gray-500 text-center">
                          Click or drag image here
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          JPG, PNG (Max 5MB)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="add-service-file"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                {verified ? (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    >
                      {loading ? "Adding..." : "Add Service"}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Show rejection reason if rejected */}
                    {user?.verificationStatus === "rejected" &&
                      user?.rejectionReason && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <FaExclamationCircle className="text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h3 className="text-sm font-medium text-red-800">
                                Verification Rejected
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>
                                  <strong>Reason:</strong>{" "}
                                  {user.rejectionReason}
                                </p>
                                <p className="mt-1">
                                  Please fix the issue and resubmit your ID
                                  documents.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Show pending status if pending */}
                    {user?.verificationStatus === "pending" && (
                      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <FaClock className="text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-medium text-yellow-800">
                              Verification Pending
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Your ID documents are under review. You'll be
                                notified once verified.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-lg font-semibold text-gray-900 mb-6 text-center">
                      {user?.verificationStatus === "rejected"
                        ? "Please resubmit your ID documents with corrections"
                        : "To add a service, please verify your identity"}
                    </p>

                    {/* ID Verification Form */}
                    <div className="space-y-6">
                      {/* Phone Number Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="relative">
                          <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            name="phonenumber"
                            value={formId.phonenumber}
                            onChange={handleIdChange}
                            placeholder="(e.g., +254700000000, 0700000000, 0100000000)"
                            required
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* ID Documents Section */}
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                          ID Documents
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Front ID Upload */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600 flex items-center">
                              <FaIdCard className="mr-2" /> Front of ID
                            </p>
                            <div
                              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 bg-gray-50 transition-colors group relative"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDrop(e, "front")}
                              onClick={() =>
                                document.getElementById("front-id-file").click()
                              }
                            >
                              {formId.frontImagePreview ? (
                                <>
                                  <img
                                    src={formId.frontImagePreview}
                                    alt="Front ID Preview"
                                    className="h-40 w-full object-contain rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormId((prev) => ({
                                        ...prev,
                                        frontImage: null,
                                        frontImagePreview: null,
                                      }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <FaTimes size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <FaIdCard className="text-3xl text-gray-400 group-hover:text-gray-500 mb-3" />
                                  <span className="text-sm text-gray-500 text-center px-4">
                                    Click or drag the front of your ID
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    JPG, PNG, or PDF (Max 5MB)
                                  </span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                id="front-id-file"
                                name="front"
                                className="hidden"
                                onChange={(e) =>
                                  handleIDImageChange(e, "front")
                                }
                              />
                            </div>
                          </div>

                          {/* Back ID Upload */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600 flex items-center">
                              <FaIdCard className="mr-2" /> Back of ID
                            </p>
                            <div
                              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 bg-gray-50 transition-colors group relative"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDrop(e, "back")}
                              onClick={() =>
                                document.getElementById("back-id-file").click()
                              }
                            >
                              {formId.backImagePreview ? (
                                <>
                                  <img
                                    src={formId.backImagePreview}
                                    alt="Back ID Preview"
                                    className="h-40 w-full object-contain rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormId((prev) => ({
                                        ...prev,
                                        backImage: null,
                                        backImagePreview: null,
                                      }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <FaTimes size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <FaIdCard className="text-3xl text-gray-400 group-hover:text-gray-500 mb-3" />
                                  <span className="text-sm text-gray-500 text-center px-4">
                                    Click or drag the back of your ID
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    JPG, PNG, or PDF (Max 5MB)
                                  </span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                id="back-id-file"
                                name="back"
                                className="hidden"
                                onChange={(e) => handleIDImageChange(e, "back")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="button"
                        onClick={handleShareDocument}
                        disabled={loading}
                        className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
                          ${
                            loading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                      >
                        {loading
                          ? "Submitting..."
                          : user?.verificationStatus === "rejected"
                            ? "Resubmit for Verification"
                            : "Submit for Verification"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* --- Services Table with Filters --- */}
          <div
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            style={{ height: "600px" }}
          >
            <div className="p-6 border-b border-gray-200 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">My Services</h2>

                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <FaFilter />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                  {isFiltering && (
                    <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-700">Filters</h3>
                    {isFiltering && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                      >
                        <FaTimes /> Clear All Filters
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Search
                      </label>
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="search"
                          value={filters.search}
                          onChange={handleFilterChange}
                          placeholder="Search services..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Sort By
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="sortBy"
                          value={filters.sortBy}
                          onChange={handleFilterChange}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="dateAdded">Date Added</option>
                          <option value="serviceName">Service Name</option>
                          <option value="amount">Amount</option>
                          <option value="status">Status</option>
                        </select>
                        <button
                          onClick={() =>
                            handleSortChange(filters.sortBy)
                          }
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                        >
                          {filters.sortOrder === "asc" ? (
                            <FaSortAmountUp />
                          ) : (
                            <FaSortAmountDown />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination Controls - Top */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                  <span className="text-sm text-gray-600">services per page</span>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredServices.length === 0
                      ? 0
                      : (pagination.currentPage - 1) * pagination.limit + 1}
                    -
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      filteredServices.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {filteredServices.length}
                  </span>{" "}
                  services
                  {isFiltering && " (filtered)"}
                </div>
              </div>

              {/* Page navigation */}
              {totalFilteredPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  {/* First page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.currentPage === 1
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
                    disabled={pagination.currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.currentPage === 1
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
                    disabled={pagination.currentPage === totalFilteredPages}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.currentPage === totalFilteredPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Next page"
                  >
                    <FaChevronRight />
                  </button>

                  {/* Last page */}
                  <button
                    onClick={() => handlePageChange(totalFilteredPages)}
                    disabled={pagination.currentPage === totalFilteredPages}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.currentPage === totalFilteredPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="Last page"
                  >
                    <FaAngleDoubleRight />
                  </button>
                </div>
              )}
            </div>

            {/* SCROLLABLE TABLE CONTENT */}
            <div className="flex-1 overflow-y-auto services-table-container">
              {filteredServices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <FaImage className="text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">
                    {isFiltering
                      ? "No services match your filters"
                      : "No services added yet."}
                  </p>
                  <p className="text-sm text-gray-400">
                    {isFiltering
                      ? "Try adjusting your filters"
                      : "Start by adding your first service above"}
                  </p>
                  {isFiltering && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr className="border-b border-gray-200">
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          #
                        </th>
                        <th 
                          className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange("serviceName")}
                        >
                          <div className="flex items-center gap-1">
                            Service Name
                            {filters.sortBy === "serviceName" && (
                              filters.sortOrder === "asc" ? 
                              <FaSortAmountUp className="text-blue-500" /> : 
                              <FaSortAmountDown className="text-blue-500" />
                            )}
                          </div>
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th 
                          className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange("amount")}
                        >
                          <div className="flex items-center gap-1">
                            Amount
                            {filters.sortBy === "amount" && (
                              filters.sortOrder === "asc" ? 
                              <FaSortAmountUp className="text-blue-500" /> : 
                              <FaSortAmountDown className="text-blue-500" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange("dateAdded")}
                        >
                          <div className="flex items-center gap-1">
                            Date Added
                            {filters.sortBy === "dateAdded" && (
                              filters.sortOrder === "asc" ? 
                              <FaSortAmountUp className="text-blue-500" /> : 
                              <FaSortAmountDown className="text-blue-500" />
                            )}
                          </div>
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Image
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getPaginatedData.map((service, idx) => {
                        const displayNo =
                          (pagination.currentPage - 1) * pagination.limit +
                          idx +
                          1;
                        return (
                          <tr
                            key={service._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4 text-sm text-gray-900 font-medium">
                              {displayNo}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {service.serviceName}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {service.category}
                            </td>
                            <td className="p-4 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  service.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {service.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {currSymbol} {parseFloat(service.amount).toFixed(2)}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {new Date(service.dateAdded).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {service.image && (
                                <img
                                  src={service.image}
                                  alt="Service"
                                  className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                                />
                              )}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(service)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  <FaEdit className="text-xs" /> Edit
                                </button>
                                <button
                                  onClick={() => openDeleteModal(service._id)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  <FaTrash className="text-xs" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls - Bottom */}
            {filteredServices.length > 0 && totalFilteredPages > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {totalFilteredPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        pagination.currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        pagination.currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === totalFilteredPages}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        pagination.currentPage === totalFilteredPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalFilteredPages)}
                      disabled={pagination.currentPage === totalFilteredPages}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        pagination.currentPage === totalFilteredPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Service
            </h2>
            <form className="space-y-4" onSubmit={handleUpdateService}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  name="category"
                  value={editModal.category}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Name
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={editModal.serviceName}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editModal.amount}
                  onChange={handleEditChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={editModal.status}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Edit Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Image
                </label>
                <div
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition bg-gray-50"
                  onClick={() =>
                    document.getElementById("edit-service-file").click()
                  }
                >
                  <img
                    src={
                      editModal.imagePreview ||
                      editModal.image ||
                      assets.uploadArea
                    }
                    alt="Edit Upload"
                    className="h-40 w-40 object-cover rounded-lg"
                  />
                  <span className="mt-2 text-sm text-gray-500">
                    Click to change image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    id="edit-service-file"
                    className="hidden"
                    onChange={handleEditImageChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {loading ? "Updating..." : "Update Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Modal --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this service? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServices;