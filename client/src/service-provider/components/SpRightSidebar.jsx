import React from 'react'
import { assets, imagesDummyData } from "../../assets/assets"

const SpRightSidebar = ({ selectedUser }) => {
  if (!selectedUser) return null;
  
    return (
      <div
        className={`hidden md:flex flex-col w-full bg-white border-l border-gray-200 
          overflow-y-auto rounded-tr-2xl rounded-br-2xl`}
      >
        {/* Profile Section */}
        <div className="flex flex-col items-center py-6 px-4 text-center">
          <img
            src={selectedUser?.image || assets.avatar_icon}
            alt="User profile"
            className="w-16 h-16 rounded-full object-cover shadow-md mb-3"
          />
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {selectedUser.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{selectedUser.bio}</p>
        </div>
  
        <hr className="border-gray-200 my-2" />
  
        {/* Media Section */}
        <div className="px-5 pb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Shared Media</p>
  
          <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto">
            {imagesDummyData.map((url, index) => (
              <div
                key={index}
                onClick={() => window.open(url, "_blank")}
                className="cursor-pointer"
              >
                <img
                  src={url}
                  alt={`shared-media-${index}`}
                  className="w-full h-24 object-cover rounded-xl hover:opacity-90 transition"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
export default SpRightSidebar