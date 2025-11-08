import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus, FaUser, FaUserShield, FaTimes, FaCheck, FaBan } from "react-icons/fa";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";

const UserManagement = () => {
  const {
    customers,
    admins,
    loadingUsers,
    updatingUser,
    addingUser,
    fetchCustomers,
    fetchAdmins,
    updateUserStatus,
    updateUser,
    createUser,
    deleteUser,
  } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState("customers");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    status: "active"
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: ""
  });

  useEffect(() => {
    fetchCustomers();
    fetchAdmins();
  }, []);

  const handleAddNew = () => {
    setAddForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "customer",
      status: "active"
    });
    setShowAddModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
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

    const formData = new FormData();
    formData.append("name", addForm.name);
    formData.append("email", addForm.email);
    formData.append("phone", addForm.phone);
    formData.append("password", addForm.password);
    formData.append("role", addForm.role);
    formData.append("status", addForm.status);

    const success = await createUser(formData);
    
    if (success) {
      setShowAddModal(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name || !editForm.email || !editForm.role) {
      toast.error("Name, email and role are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("phone", editForm.phone);
    formData.append("role", editForm.role);
    formData.append("status", editForm.status);

    const success = await updateUser(selectedUser._id, formData);
    
    if (success) {
      setShowEditModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteUser(selectedUser._id, selectedUser.role);
    if (success) {
      setShowDeleteModal(false);
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    await updateUserStatus(user._id, newStatus);
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Admin
        </span>
      );
    } else if (role === "service-provider") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Service Provider
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Customer
        </span>
      );
    }
  };

  const currentUsers = activeTab === "customers" ? customers : admins;

  if (loadingUsers) {
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
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage customers and administrators</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FaPlus />
          Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-4 py-2 font-medium ${
              activeTab === "customers"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser />
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-2 px-4 py-2 font-medium ${
              activeTab === "admins"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUserShield />
            Administrators ({admins.length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentUsers.map((user, idx) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="p-4 text-sm text-gray-900">{user.email}</td>
                  <td className="p-4 text-sm text-gray-900">{user.phone || "N/A"}</td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.status)}
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`p-1 rounded ${
                          user.status === "active" 
                            ? "text-red-500 hover:bg-red-50" 
                            : "text-green-500 hover:bg-green-50"
                        }`}
                        title={user.status === "active" ? "Deactivate" : "Activate"}
                      >
                        {user.status === "active" ? <FaBan /> : <FaCheck />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
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

          {currentUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No {activeTab} found.
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New User</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({...addForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="service-provider">Service Provider</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({...addForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                    disabled={addingUser}
                    className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${
                      addingUser ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {addingUser ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit User</h3>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="service-provider">Service Provider</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
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
                    disabled={updatingUser}
                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                      updatingUser ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {updatingUser ? "Updating..." : "Update User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
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
                  Are you sure you want to delete <strong>{selectedUser.name}</strong>?
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

export default UserManagement;