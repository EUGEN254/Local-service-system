import React, { useContext, useState, useEffect } from "react";
import { assets, categories } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { ShareContext } from "../../sharedcontext/SharedContext";

const MyServices = () => {
  const { backendUrl, services, fetchServices,currSymbol, addService, removeService } =
    useContext(ShareContext);

  const [form, setForm] = useState({
    category: categories[0],
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

  useEffect(() => {
    fetchServices();
  }, []);

  // --- Handlers for Add Service ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        category: categories[0],
        serviceName: "",
        amount: "",
        status: "Active",
        image: null,
        imagePreview: null,
      });
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
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
              onClick={() => document.getElementById("add-service-file").click()}
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


          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto mt-2 px-6 py-2 rounded-lg text-white text-sm ${
                loading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {loading ? "Adding..." : "Add Service"}
            </button>
          </div>
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
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Service Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Date Added</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Image</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service, idx) => (
                  <tr key={service._id}>
                    <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="p-3 text-sm text-gray-900">{service.serviceName}</td>
                    <td className="p-3 text-sm text-gray-900">{service.category}</td>
                    <td className="p-3 text-sm text-gray-900">{service.status}</td>
                    <td className="p-3 text-sm text-gray-900">{currSymbol} {service.amount}</td>
                    <td className="p-3 text-sm text-gray-900">{new Date(service.dateAdded).toLocaleDateString()}</td>
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
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
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
                    src={editModal.imagePreview || editModal.image || assets.uploadArea}
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
            <p className="mb-4">Are you sure you want to delete this service?</p>
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
