import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

// Example asset data
const initialCategories = [
  { id: 1, name: "Plumbing", description: "All plumbing services" },
  { id: 2, name: "Electrical", description: "Electrical repairs & installation" },
  { id: 3, name: "Cleaning", description: "Home and office cleaning" },
];

const ServiceCategories = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    const id = categories.length ? categories[categories.length - 1].id + 1 : 1;
    setCategories([...categories, { ...newCategory, id }]);
    setNewCategory({ name: "", description: "" });
  };

  const handleDelete = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">Service Categories</h2>

      {/* Add New Category */}
      <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <input
          type="text"
          placeholder="Category Name"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <input
          type="text"
          placeholder="Description"
          value={newCategory.description}
          onChange={(e) =>
            setNewCategory({ ...newCategory, description: e.target.value })
          }
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          onClick={handleAddCategory}
          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm"
        >
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 overflow-x-auto">
        <div className="overflow-y-auto max-h-96 scrollbar-thin">
          <table className="w-full min-w-[500px]">
            <thead className="sticky top-0 bg-gray-50 z-20">
              <tr className="border-b border-gray-300">
                <th className="p-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-3 text-sm text-gray-900">{cat.name}</td>
                  <td className="p-3 text-sm text-gray-900">{cat.description}</td>
                  <td className="p-3 flex gap-2">
                    <button className="p-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategories;
