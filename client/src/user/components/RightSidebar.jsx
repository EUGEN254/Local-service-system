import React, { useContext } from "react";
import { ShareContext } from "../../sharedcontext/SharedContext";
import { assets } from "../../assets/assets";

const RightSidebar = ({ selectedUser }) => {
  const { user, messages } = useContext(ShareContext);
  
  // Hide sidebar if no user selected
  if (!selectedUser) return null;

  // Get current chat ID and messages
  const currentChatId = selectedUser ? [user._id, selectedUser._id].sort().join("_") : null;
  const chatMessages = currentChatId ? messages[currentChatId] || [] : [];

  // Filter messages that have images and extract unique images
  const sharedMedia = chatMessages
    .filter(msg => msg.image && msg.image.trim() !== "")
    .map(msg => ({
      url: msg.image,
      timestamp: msg.createdAt,
      messageId: msg.messageId || msg._id
    }))
    .filter((media, index, self) => 
      index === self.findIndex(m => m.url === media.url)
    );

  const handleImageError = (e) => {
    // If image fails to load, show a placeholder
    e.target.src = assets.gallery_icon;
    e.target.className = "w-full h-24 object-contain p-3 bg-gray-200";
  };

  return (
    <div className={`hidden md:flex flex-col w-full bg-white border-l border-gray-200 overflow-y-auto rounded-tr-2xl rounded-br-2xl`}>
      {/* Profile Section */}
      <div className="flex flex-col items-center py-6 px-4 text-center">
        <img
          src={selectedUser?.image || selectedUser?.profilePic || assets.avatar_icon}
          alt="User profile"
          className="w-16 h-16 rounded-full object-cover shadow-md mb-3"
        />

        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          {selectedUser?.name || selectedUser?.fullName || "Unknown User"}
        </h2>

        {selectedUser?.email && (
          <p className="text-sm text-gray-500 mt-1">{selectedUser.email}</p>
        )}

        {selectedUser?.bio && (
          <p className="text-sm text-gray-400 mt-1 italic">{selectedUser.bio}</p>
        )}
      </div>

      <hr className="border-gray-200 my-2" />

      {/* Media Section */}
      <div className="px-5 pb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-gray-700">Shared Media</p>
          {sharedMedia.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {sharedMedia.length} {sharedMedia.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {sharedMedia.length === 0 ? (
          <div className="text-center py-8">
            <img 
              src={assets.gallery_icon} 
              alt="No media" 
              className="w-12 h-12 opacity-30 mx-auto mb-3"
            />
            <p className="text-sm text-gray-400">No media shared yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto">
            {sharedMedia.map((media, index) => (
              <div
                key={media.messageId || index}
                onClick={() => window.open(media.url, "_blank")}
                className="cursor-pointer group bg-gray-100 rounded-xl overflow-hidden"
              >
                <img
                  src={media.url}
                  alt={`Shared media ${index + 1}`}
                  className="w-full h-24 object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={handleImageError}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional: Shared Files/Documents Section */}
      <div className="px-5 pb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-gray-700">Shared Files</p>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">0 items</span>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">No files shared yet</p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;