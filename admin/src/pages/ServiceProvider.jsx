import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import axios from 'axios'

const ServiceProvider = () => {
  const { 
    serviceProviders, 
    loadingProviders, 
    fetchServiceProviders,
    updateVerificationStatus,
    updateProviderProfile,
    deleteProvider,
    updatingProvider,
    backendUrl
  } = useContext(AdminContext);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    imageFile: null,
    imagePreview: ""
  });

  // Add Form State
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    image: "",
    imageFile: null,
    imagePreview: ""
  });

  const [addingProvider, setAddingProvider] = useState(false);

  useEffect(() => {
    fetchServiceProviders();
  }, []);

  const handleView = (provider) => {
    setSelectedProvider(provider);
    setShowViewModal(true);
  };

  const handleEdit = (provider) => {
    setSelectedProvider(provider);
    setEditForm({
      name: provider.name,
      email: provider.email,
      phone: provider.phone || "",
      image: provider.image || "",
      imageFile: null,
      imagePreview: provider.image || ""
    });
    setShowEditModal(true);
  };

  const handleDelete = (provider) => {
    setSelectedProvider(provider);
    setShowDeleteModal(true);
  };

  const handleAddNew = () => {
    setAddForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      image: "",
      imageFile: null,
      imagePreview: ""
    });
    setShowAddModal(true);
  };

  const handleApprove = async (providerId) => {
    const success = await updateVerificationStatus(providerId, "verified");
    if (success) {
      toast.success("Service provider approved successfully!");
      setShowViewModal(false);
    } else {
      toast.error("Failed to approve service provider");
    }
  };

  const openRejectModal = (provider) => {
    setSelectedProvider(provider);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const success = await updateVerificationStatus(selectedProvider._id, "rejected", rejectionReason);
    if (success) {
      toast.success("Service provider rejected successfully!");
      setShowRejectModal(false);
      setShowViewModal(false);
    } else {
      toast.error("Failed to reject service provider");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name || !editForm.email) {
      toast.error("Name and email are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("phone", editForm.phone);
    
    if (editForm.imageFile) {
      formData.append("image", editForm.imageFile);
    }

    const success = await updateProviderProfile(selectedProvider._id, formData);
    
    if (success) {
      toast.success("Provider updated successfully!");
      setShowEditModal(false);
    } else {
      toast.error("Failed to update provider");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Name, email and password are required");
      return;
    }

    if (addForm.password !== addForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (addForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAddingProvider(true);

    try {
      const formData = new FormData();
      formData.append("name", addForm.name);
      formData.append("email", addForm.email);
      formData.append("phone", addForm.phone);
      formData.append("password", addForm.password);
      formData.append("role", "service-provider");
      
      if (addForm.imageFile) {
        formData.append("image", addForm.imageFile);
      }

      // You'll need to create this API endpoint
      const { data } = await axios.post(
        `${backendUrl}/api/admin/create-provider`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (data.success) {
        toast.success("Service provider created successfully!");
        setShowAddModal(false);
        fetchServiceProviders(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to create provider");
      }
    } catch (err) {
      console.error("Error creating provider:", err);
      toast.error(err.response?.data?.message || "Failed to create provider");
    } finally {
      setAddingProvider(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteProvider(selectedProvider._id);
    if (success) {
      setShowDeleteModal(false);
    } else {
      toast.error("Failed to delete provider");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "pending": { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      "verified": { color: "bg-green-100 text-green-800", label: "Verified" },
      "rejected": { color: "bg-red-100 text-red-800", label: "Rejected" },
      "not-submitted": { color: "bg-gray-100 text-gray-800", label: "Not Submitted" }
    };
    
    const config = statusConfig[status] || statusConfig["not-submitted"];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Image Upload Component (Reusable)
  const ImageUpload = ({ form, setForm, formKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Profile Image
      </label>
      
      {/* Current Image Preview */}
      {form.image && !form.imagePreview && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">Current Image:</p>
          <img
            src={form.image}
            alt="Current profile"
            className="w-20 h-20 rounded-full object-cover border"
          />
        </div>
      )}
      
      {/* Drag & Drop Upload Area */}
      <div
        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all duration-300 group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) {
            setForm({
              ...form, 
              imageFile: file,
              imagePreview: URL.createObjectURL(file)
            });
          }
        }}
        onClick={() => document.getElementById(`${formKey}-profile-image`).click()}
      >
        {form.imagePreview ? (
          <img
            src={form.imagePreview}
            alt="Profile preview"
            className="h-24 w-24 object-cover rounded-full"
          />
        ) : form.image ? (
          <img
            src={form.image}
            alt="Current profile"
            className="h-24 w-24 object-cover rounded-full"
          />
        ) : (
          <>
            <i className="fas fa-user-circle text-3xl text-gray-400 group-hover:text-blue-400 mb-2"></i>
            <span className="mt-2 text-sm text-gray-500 text-center px-4">
              Click or drag a profile image here
            </span>
            <span className="text-xs text-gray-400 mt-1">
              JPG, PNG (Max 5MB)
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          id={`${formKey}-profile-image`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setForm({
                ...form, 
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
              });
            }
          }}
        />
      </div>
      
      {/* Remove Image Button */}
      {(form.imageFile || form.image) && (
        <button
          type="button"
          onClick={() => setForm({
            ...form, 
            image: "",
            imageFile: null,
            imagePreview: ""
          })}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
        >
          Remove Image
        </button>
      )}
    </div>
  );

  if (loadingProviders) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service Providers</h1>
          <p className="text-gray-600">Manage and verify service providers</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FaPlus />
          Add Provider
        </button>
      </div>

      {/* Service Providers Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Image</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Verification Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serviceProviders.map((provider, idx) => (
                <tr key={provider._id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="p-4">
                    {provider.image ? (
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{provider.email}</td>
                  <td className="p-4 text-sm text-gray-900">{provider.phone || "N/A"}</td>
                  <td className="p-4">
                    {getStatusBadge(provider.serviceProviderInfo?.idVerification?.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(provider)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        <FaEye className="text-xs" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(provider)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(provider)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                      >
                        <FaTrash className="text-xs" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {serviceProviders.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No service providers found.
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">ID Verification Documents</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Provider Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Provider Information</h4>
                <p><strong>Name:</strong> {selectedProvider.name}</p>
                <p><strong>Email:</strong> {selectedProvider.email}</p>
                <p><strong>Phone:</strong> {selectedProvider.phone || "N/A"}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedProvider.serviceProviderInfo?.idVerification?.status)}</p>
              </div>

              {/* ID Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-3">Front of ID</h4>
                  {selectedProvider.serviceProviderInfo?.idVerification?.idFrontImage ? (
                    <img
                      src={selectedProvider.serviceProviderInfo.idVerification.idFrontImage}
                      alt="Front ID"
                      className="w-full h-64 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No front ID uploaded</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Back of ID</h4>
                  {selectedProvider.serviceProviderInfo?.idVerification?.idBackImage ? (
                    <img
                      src={selectedProvider.serviceProviderInfo.idVerification.idBackImage}
                      alt="Back ID"
                      className="w-full h-64 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No back ID uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedProvider.serviceProviderInfo?.idVerification?.status === "pending" && (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => openRejectModal(selectedProvider)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FaTimes />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedProvider._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FaCheck />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Rejection Reason</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide a reason for rejection:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Provider</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Image Upload */}
                <ImageUpload form={editForm} setForm={setEditForm} formKey="edit" />
                
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProvider}
                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                      updatingProvider ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {updatingProvider ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Service Provider</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={addForm.confirmPassword}
                    onChange={(e) => setAddForm({...addForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {/* Image Upload */}
                <ImageUpload form={addForm} setForm={setAddForm} formKey="add" />
                
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingProvider}
                    className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${
                      addingProvider ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {addingProvider ? "Creating..." : "Create Provider"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete <strong>{selectedProvider.name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProvider;