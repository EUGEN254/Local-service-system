import React, { useState } from "react";
import {
  categories,
  services as initialServices,
} from "../../assets/assets";

const MyServices = () => {
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState({
    name: "",
    category: categories[0],
    amount: "",
    status: "Active",
  });

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add new service
  const handleAddService = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    const newService = {
      id: services.length + 1,
      name: form.name,
      category: form.category,
      status: form.status,
      amount: parseFloat(form.amount),
      dateAdded: new Date().toISOString().split("T")[0],
    };

    setServices((prev) => [...prev, newService]);
    setForm({
      name: "",
      category: categories[0],
      amount: "",
      status: "Active",
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <p className="text-xl font-semibold text-gray-800 mb-4">My Services</p>

      {/* Add Service Form */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Add Service</h2>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          onSubmit={handleAddService}
        >
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter service name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            />
          </div>

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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="w-full sm:w-auto mt-2 px-6 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors text-sm"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>

      {/* Services Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">My Services</h2>

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-4">
          {services.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No services added yet.
            </div>
          ) : (
            services.map((service, idx) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      service.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {service.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-semibold">${service.amount}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date Added:</span>
                    <p>{service.dateAdded}</p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button className="flex-1 px-3 py-2 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setServices(services.filter((s) => s.id !== service.id))
                    }
                    className="flex-1 px-3 py-2 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block max-h-[400px] overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-200">
          <table className="w-full table-auto border-collapse min-w-[800px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-300">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  No
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Service Name
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Category
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Status
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Amount
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Date Added
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service, idx) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                  <td className="p-3 text-sm text-gray-900 font-medium">
                    {service.name}
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {service.category}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        service.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-900 font-semibold">
                    ${service.amount}
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {service.dateAdded}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button className="mr-2 px-3 py-1 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setServices(services.filter((s) => s.id !== service.id))
                      }
                      className="px-3 py-1 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    No services added yet.
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

export default MyServices;
