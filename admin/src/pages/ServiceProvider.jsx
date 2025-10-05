import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { serviceProviders as initialProviders } from "../assets/assets";

const ServiceProvider = () => {
  const [providers, setProviders] = useState(initialProviders);
  const [newProvider, setNewProvider] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
  });

  const handleChange = (e) => {
    setNewProvider({ ...newProvider, [e.target.name]: e.target.value });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const id = providers.length + 1;
    setProviders([...providers, { ...newProvider, id }]);
    setNewProvider({ name: "", email: "", phone: "", image: "" });
  };

  const handleEdit = (id) => {
    console.log("Edit provider:", id);
  };

  const handleDelete = (id) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  return (
    <div className="p-6">
      {/* Add Service Provider Form */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Add Service Provider</h2>
        <form
          className="flex flex-wrap gap-3 items-end"
          onSubmit={handleAdd}
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newProvider.name}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newProvider.email}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={newProvider.phone}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
            required
          />
          <input
            type="text"
            name="image"
            placeholder="Image URL"
            value={newProvider.image}
            onChange={handleChange}
            className="border px-3 py-1 rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Service Providers Table */}
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
                  Image
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Email
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Phone Number
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider, idx) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {provider.name}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {provider.image ? (
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {provider.email}
                  </td>
                  <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                    {provider.phone}
                  </td>
                  <td className="p-3 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => handleEdit(provider.id)}
                      className="py-1 px-3 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="py-1 px-3 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {providers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No service providers found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceProvider;
