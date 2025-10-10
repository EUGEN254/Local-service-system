import React, { useState } from "react";
import SpChatSideBar from "../components/SpChatSideBar";
import SpChatContainer from "../components/SpChatContainer";
import SpRightSidebar from "../components/SpRightSidebar";

const Inbox = () => {
  const [selectedUser, setSelectedUser] = useState(false);

  return (
    <div className="w-full h-[calc(100vh-6rem)] flex justify-center items-center bg-gray-100">
      {/* Outer Wrapper (consistent card style) */}
      <div
        className={`w-full h-full max-w-6xl mx-auto 
          bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden
          grid transition-all duration-300 ease-in-out
          ${
            selectedUser
              ? "md:grid-cols-[1fr_1.8fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
              : "md:grid-cols-[1fr_1.5fr]"
          }`}
      >
        {/* Left Chat Sidebar */}
        <SpChatSideBar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          
        />

        {/* Main Chat Container */}
        <SpChatContainer
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />

        {/* Right Info Sidebar */}
        <SpRightSidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      </div>
    </div>
  );
};

export default Inbox;
