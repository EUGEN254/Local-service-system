import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";

const ServiceCategories = () => {
  const {
    categories,
    loadingCategories,
    updatingCategory,
    addingCategory,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  } = useContext(AdminContext);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    image: "",
    imageFile: null,
    imagePreview: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    image: "",
    imageFile: null,
    imagePreview: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddNew = () => {
    setAddForm({
      name: "",
      description: "",
      image: "",
      imageFile: null,
      imagePreview: ""
    });
    setShowAddModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setEditForm({
      name: category.name,
      description: category.description,
      image: category.image || "",
      imageFile: null,
      imagePreview: category.image || ""
    });
    setShowEditModal(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (!addForm.name.trim() || !addForm.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", addForm.name);
    formData.append("description", addForm.description);
    
    if (addForm.imageFile) {
      formData.append("image", addForm.imageFile);
    }

    const success = await createCategory(formData);
    
    if (success) {
      setShowAddModal(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name.trim() || !editForm.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", editForm.name);
    formData.append("description", editForm.description);
    
    if (editForm.imageFile) {
      formData.append("image", editForm.imageFile);
    }

    const success = await updateCategory(selectedCategory._id, formData);
    
    if (success) {
      setShowEditModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteCategory(selectedCategory._id);
    if (success) {
      setShowDeleteModal(false);
    }
  };

  const handleStatusToggle = async (category) => {
    await toggleCategoryStatus(category._id);
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
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

  // Reusable Image Upload Component
  const ImageUpload = ({ form, setForm, formKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category Image
      </label>
      
      {/* Current Image Preview */}
      {form.image && !form.imagePreview && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">Current Image:</p>
          <img
            src={form.image}
            alt="Current category"
            className="w-20 h-20 object-cover border rounded-lg"
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
        onClick={() => document.getElementById(`${formKey}-category-image`).click()}
      >
        {form.imagePreview ? (
          <img
            src={form.imagePreview}
            alt="Category preview"
            className="h-32 w-full object-cover rounded-lg"
          />
        ) : form.image ? (
          <img
            src={form.image}
            alt="Current category"
            className="h-32 w-full object-cover rounded-lg"
          />
        ) : (
          <>
            <i className="fas fa-image text-3xl text-gray-400 group-hover:text-blue-400 mb-2"></i>
            <span className="mt-2 text-sm text-gray-500 text-center px-4">
              Click or drag a category image here
            </span>
            <span className="text-xs text-gray-400 mt-1">
              JPG, PNG (Max 5MB)
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          id={`${formKey}-category-image`}
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

  if (loadingCategories) {
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
          <h1 className="text-2xl font-bold text-gray-800">Service Categories</h1>
          <p className="text-gray-600">Manage service categories and their details</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FaPlus />
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Image</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Services</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category, idx) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-4">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <i className="fas fa-image text-gray-400"></i>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="p-4 text-sm text-gray-900">{category.description}</td>
                  <td className="p-4 text-sm text-gray-900">{category.servicesCount || 0}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(category.isActive)}
                      <button
                        onClick={() => handleStatusToggle(category)}
                        className={`p-1 rounded ${
                          category.isActive 
                            ? "text-red-500 hover:bg-red-50" 
                            : "text-green-500 hover:bg-green-50"
                        }`}
                        title={category.isActive ? "Deactivate" : "Activate"}
                      >
                        {category.isActive ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
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

          {categories.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No categories found.
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Category</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
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
                    disabled={addingCategory}
                    className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${
                      addingCategory ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {addingCategory ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Category</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
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
                    disabled={updatingCategory}
                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                      updatingCategory ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {updatingCategory ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
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
                  Are you sure you want to delete <strong>{selectedCategory.name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. Make sure there are no services associated with this category.
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

export default ServiceCategories;