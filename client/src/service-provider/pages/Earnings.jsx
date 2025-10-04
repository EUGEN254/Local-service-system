import React from "react";
import { FaDollarSign, FaCheckCircle, FaClock, FaWallet } from "react-icons/fa";
import { earningServices, earningsSummary } from "../../assets/assets";

const Earnings = () => {
  const calculateTotal = (service) => service.people * service.amountPerPerson;

  const totalEarnings = earningServices.reduce(
    (acc, service) => acc + calculateTotal(service),
    0
  );

  const summaryCards = [
    {
      title: "Total Earnings",
      value: `$${earningsSummary.totalEarnings}`,
      bgColor: "bg-yellow-500",
      icon: <FaDollarSign className="text-2xl sm:text-3xl" />,
    },
    {
      title: "Services Completed",
      value: earningsSummary.totalServicesCompleted,
      bgColor: "bg-green-500",
      icon: <FaCheckCircle className="text-2xl sm:text-3xl" />,
    },
    {
      title: "Pending Requests",
      value: earningsSummary.pendingRequests,
      bgColor: "bg-yellow-400",
      icon: <FaClock className="text-2xl sm:text-3xl" />,
    },
    {
      title: "Paid Out",
      value: `$${earningsSummary.paidOut}`,
      bgColor: "bg-blue-500",
      icon: <FaWallet className="text-2xl sm:text-3xl" />,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none">
      <p className="mb-3 text-xl font-semibold text-gray-800">Earnings</p>

      {/* Summary Cards */}
      <div className="mb-6">
        <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {summaryCards.map((card, idx) => (
              <div
                key={idx}
                className={`${card.bgColor} text-white rounded-xl p-4 sm:p-6 shadow-md transform transition-all duration-300 flex flex-col hover:scale-105 min-h-[120px] min-w-[280px]`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm opacity-90">{card.title}</p>
                  {card.icon}
                </div>
                <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.bgColor} text-white rounded-xl p-4 sm:p-6 shadow-md transform transition-all duration-300 flex flex-col hover:scale-105 min-h-[120px]`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm opacity-90">{card.title}</p>
                {card.icon}
              </div>
              <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Table (unchanged) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-[400px] overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-200">
          <table className="w-full min-w-[600px] table-auto border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-300">
                <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  No
                </th>
                <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Service Name
                </th>
                <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  People Served
                </th>
                <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Earning per Person
                </th>
                <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earningServices.map((service, idx) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="p-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="p-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    {service.name}
                  </td>
                  <td className="p-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    {service.people}
                  </td>
                  <td className="p-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                    ${service.amountPerPerson}
                  </td>
                  <td className="p-3 text-xs sm:text-sm text-gray-900 font-semibold whitespace-nowrap">
                    ${calculateTotal(service)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <p className="text-base sm:text-lg font-bold text-yellow-600">
          Grand Total: ${totalEarnings}
        </p>
      </div>
    </div>
  );
};

export default Earnings;
