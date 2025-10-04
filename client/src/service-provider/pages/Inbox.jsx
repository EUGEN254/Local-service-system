import React, { useState } from "react";
import { clients, messages } from "../../assets/assets";

const Inbox = () => {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [showClients, setShowClients] = useState(false); // modal visibility

  return (
    <>
      <div className="mb-3">
        <p className="text-xl">Inbox</p>
      </div>

      <div className="flex flex-col md:flex-row h-full bg-gray-50 rounded-2xl overflow-hidden shadow-md">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <h2 className="p-4 text-lg font-semibold border-b border-gray-200">Clients</h2>
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedClient === client.id ? "bg-gray-100 font-semibold" : ""
                }`}
              >
                <p>{client.name}</p>
                <p className="text-xs text-gray-500">{client.lastMessage}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* Mobile: Show clients button */}
          <div className="md:hidden p-2 border-b border-gray-300">
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              onClick={() => setShowClients(true)}
            >
              Show Clients
            </button>
          </div>

          <div className="p-4 border-b border-gray-300 font-semibold">
            {clients.find((c) => c.id === selectedClient)?.name || "Select a client"}
          </div>

          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages[selectedClient]?.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-xs ${
                  msg.from === "me"
                    ? "bg-yellow-500 text-white ml-auto"
                    : "bg-white text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="p-4 border-t border-gray-300 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Modal */}
      {showClients && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-11/12 max-w-sm rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 flex justify-between items-center border-b border-gray-200">
              <h2 className="text-lg font-semibold">Clients</h2>
              <button
                className="text-gray-500"
                onClick={() => setShowClients(false)}
              >
                Close
              </button>
            </div>
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {clients.map((client) => (
                <li
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client.id);
                    setShowClients(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-100 ${
                    selectedClient === client.id ? "bg-gray-100 font-semibold" : ""
                  }`}
                >
                  <p>{client.name}</p>
                  <p className="text-xs text-gray-500">{client.lastMessage}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Inbox;
