import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { users as initialUsers } from "../assets/assets";

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
  });

  // Handle form input
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // Add new user
  const handleAdd = (e) => {
    e.preventDefault();
    const id = users.length + 1;
    setUsers([...users, { ...newUser, id }]);
    setNewUser({ name: "", email: "", phone: "", role: "", status: "Active" });
  };

  // Edit user (console log for now)
  const handleEdit = (id) => {
    console.log("Edit user:", id);
  };

  // Delete user
  const handleDelete = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6">
      {/* Add User Form */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Add User</h2>
        <form className="flex flex-wrap gap-3 items-end" onSubmit={handleAdd}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={newUser.phone}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={newUser.role}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <select
            name="status"
            value={newUser.status}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* User Table */}
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <div className="overflow-y-auto max-h-96 scrollbar-thin">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 bg-gray-50 z-20">
              <tr className="border-b border-gray-300">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  No
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Name
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Email
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Phone
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Role
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Status
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {user.phone}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {user.role}
                  </td>
                  <td
                    className={`p-3 text-sm font-semibold whitespace-nowrap ${
                      user.status === "Active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {user.status}
                  </td>
                  <td className="p-3 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="py-1 px-3 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
