import React, { useContext, useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { ShareContext } from "../../sharedcontext/SharedContext";

const MyServices = () => {
  const {
    backendUrl,
    services,
    fetchServices,
    currSymbol,
    addService,
    removeService,
    verified,
    user,
    categories,
    fetchCategories,
    fetchCurrentUser,
  } = useContext(ShareContext);

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

  // id document verification
  const [formId, setFormId] = useState({
    phonenumber: "",
    frontImage: null,
    frontImagePreview: null,
    backImage: null,
    backImagePreview: null,
  });

  const handleIdChange = (e) => {
    const { name, value } = e.target;
    setFormId((prev) => ({ ...prev, [name]: value }));
  };

  const handleIDImageChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
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
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "application/pdf")
    ) {
      setFormId((prev) => ({
        ...prev,
        [`${side}Image`]: file,
        [`${side}ImagePreview`]: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }));
    }
  };

  // Fixed useEffect - runs only on mount
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []); // Empty dependency array - runs only once on mount

  // Separate useEffect for setting initial category
  useEffect(() => {
    // Set initial category when categories are loaded
    if (categories.length > 0 && !form.category) {
      setForm(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]); // Only runs when categories change

  // Refresh user data when component mounts
  useEffect(() => {
    fetchCurrentUser(false); // false means don't show loader
  }, []);

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
    setForm(prev => ({ ...prev, category: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      const { data } = await axios.post(
        `${backendUrl}/api/serviceprovider/add-service`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!data.success)
        throw new Error(data.message || "Failed to add service");
      addService(data.service);
      toast.success("Service added successfully!");
      setForm({
        category: categories.length > 0 ? categories[0].name : "",
        serviceName: "",
        amount: "",
        status: "Active",
        image: null,
        imagePreview: null,
      });
      setShowCustomCategory(false);
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
      const { data } = await axios.put(
        `${backendUrl}/api/serviceprovider/edit/${editModal._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!data.success)
        throw new Error(data.message || "Failed to update service");
      toast.success("Service updated!");
      fetchServices();
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
      const { data } = await axios.delete(
        `${backendUrl}/api/serviceprovider/delete/${deleteModal.serviceId}`,
        { withCredentials: true }
      );
      if (!data.success)
        throw new Error(data.message || "Failed to delete service");
      removeService(deleteModal.serviceId);
      toast.success("Service deleted!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  const handleShareDocument = async (e) => {
    e.preventDefault(); // Prevent form submission

    // Validation
    if (!formId.phonenumber) {
      return toast.error("Phone number is required");
    }

    if (!formId.frontImage) {
      return toast.error("Front ID image is required");
    }

    if (!formId.backImage) {
      return toast.error("Back ID image is required");
    }
    

    // Phone number validation (basic)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formId.phonenumber)) {
      return toast.error("Please enter a valid phone number (10-15 digits)");
    }

    // File size validation (optional but recommended)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (formId.frontImage && formId.frontImage.size > maxSize) {
      return toast.error("Front ID image is too large (max 5MB)");
    }

    if (formId.backImage && formId.backImage.size > maxSize) {
      return toast.error("Back ID image is too large (max 5MB)");
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("phonenumber", formId.phonenumber);
      formData.append("frontImage", formId.frontImage);
      formData.append("backImage", formId.backImage);
      formData.append("idType", "national-id");

      // Make the actual API call
      const { data } = await axios.post(
        `${backendUrl}/api/user/submit-id-verification`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!data.success)
        throw new Error(data.message || "ID verification failed");

      // Success case
      toast.success("ID submitted successfully! Awaiting admin confirmation.");

      // Reset form after successful submission
      setFormId({
        phonenumber: "",
        frontImage: null,
        frontImagePreview: null,
        backImage: null,
        backImagePreview: null,
      });

      // 🔑 KEY FIX: Refresh user data to clear rejection reason and update verification status
      await fetchCurrentUser(false);

    } catch (err) {
      console.error("Error submitting ID:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit ID documents"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <h1 className="text-xl font-semibold text-gray-800">My Services</h1>

      {/* --- Add Service Form --- */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Add Service</h2>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          onSubmit={handleAddService}
        >
          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>

            {/* Main Category Select */}
            <select
              name="category"
              value={showCustomCategory ? "custom" : form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
            >
              {/* Existing categories */}
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              {/* Custom category option */}
              <option value="custom">+ Add Custom Category</option>
            </select>

            {/* Custom Category Input - Only shows when "Add Custom Category" is selected */}
            {showCustomCategory && (
              <div className="mt-2">
                <input
                  type="text"
                  value={form.category}
                  onChange={handleCustomCategoryChange}
                  placeholder="Enter your custom category"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Type your custom category name
                </p>
              </div>
            )}
          </div>

          {/* Service Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Service Name
            </label>
            <input
              type="text"
              name="serviceName"
              value={form.serviceName}
              onChange={handleChange}
              placeholder="Enter service name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Service Image (required)
            </label>
            <div
              className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-yellow-500 transition relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
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
              <img
                src={form.imagePreview || assets.uploadArea}
                alt="Upload"
                className="h-32 w-32 object-cover rounded-lg"
              />
              <span className="mt-2 text-sm text-gray-500 text-center">
                Click or drag image here
              </span>
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
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto mt-2 px-6 py-2 rounded-lg text-white text-sm 
        ${loading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"}`}
              >
                {loading ? "Adding..." : "Add Service"}
              </button>
            </div>
          ) : (
            <div className="lg:w-[90vh] mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
              {/* Show rejection reason if rejected */}
              {user?.verificationStatus === "rejected" &&
                user?.rejectionReason && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Verification Rejected
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            <strong>Reason:</strong> {user.rejectionReason}
                          </p>
                          <p className="mt-1">
                            Please fix the issue and resubmit your ID documents.
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
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Verification Pending
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your ID documents are under review. You'll be notified
                          once verified.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xl font-semibold text-gray-800 mb-6 text-center">
                {user?.verificationStatus === "rejected"
                  ? "Please resubmit your ID documents with corrections"
                  : "To add a service, please share your ID for admin confirmation"}
              </p>

              <form className="space-y-6">
                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="number"
                    name="phonenumber"
                    value={formId.phonenumber}
                    onChange={handleIdChange}
                    placeholder="(e.g., +254700000000, 0700000000, 0100000000)"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                {/* ID Documents Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    ID Documents
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front ID Upload */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">
                        Front of ID
                      </p>
                      <div
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all duration-300 group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, "front")}
                        onClick={() =>
                          document.getElementById("front-id-file").click()
                        }
                      >
                        {formId.frontImagePreview ? (
                          <img
                            src={formId.frontImagePreview}
                            alt="Front ID Preview"
                            className="h-32 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <>
                            <i className="fas fa-id-card text-3xl text-gray-400 group-hover:text-blue-400 mb-3"></i>
                            <span className="mt-2 text-sm text-gray-500 text-center px-4">
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
                          onChange={(e) => handleIDImageChange(e, "front")}
                        />
                      </div>
                    </div>

                    {/* Back ID Upload */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">
                        Back of ID
                      </p>
                      <div
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all duration-300 group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, "back")}
                        onClick={() =>
                          document.getElementById("back-id-file").click()
                        }
                      >
                        {formId.backImagePreview ? (
                          <img
                            src={formId.backImagePreview}
                            alt="Back ID Preview"
                            className="h-32 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <>
                            <i className="fas fa-id-card text-3xl text-gray-400 group-hover:text-blue-400 mb-3"></i>
                            <span className="mt-2 text-sm text-gray-500 text-center px-4">
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
                  type="submit"
                  onClick={handleShareDocument}
                  disabled={loading}
                  className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                    ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    }`}
                >
                  {loading
                    ? "Submitting..."
                    : user?.verificationStatus === "rejected"
                    ? "Resubmit for Verification"
                    : "Submit for Verification"}
                </button>
              </form>
            </div>
          )}
        </form>
      </div>

      {/* --- Services Table --- */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">My Services</h2>
        {services.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No services added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    No
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Service Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Date Added
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Image
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service, idx) => (
                  <tr key={service._id}>
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">
                      {service.serviceName}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {service.category}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {service.status}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {currSymbol} {service.amount}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {new Date(service.dateAdded).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-gray-900">
                      {service.image && (
                        <img
                          src={service.image}
                          alt="Service"
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-900 flex space-x-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(service._id)}
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Edit Modal --- */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-lg font-semibold mb-4">Edit Service</h2>
            <form className="space-y-4" onSubmit={handleUpdateService}>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={editModal.category}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Service Name</label>
                <input
                  type="text"
                  name="serviceName"
                  value={editModal.serviceName}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={editModal.amount}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  name="status"
                  value={editModal.status}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Edit Image Upload */}
              <div>
                <label className="text-sm font-medium">Image</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-yellow-500 transition mt-1">
                  <img
                    src={
                      editModal.imagePreview ||
                      editModal.image ||
                      assets.uploadArea
                    }
                    alt="Edit Upload"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  <span className="mt-2 text-sm text-gray-500">
                    Click or drag an image to replace
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditImageChange}
                  />
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Modal --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this service?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyServices;