import React, { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets";
import { formatMessageTime } from "../../service-provider/libs/Utils.js";
import { v4 as uuidv4 } from "uuid"; 

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const { user, backendUrl, socket } = useContext(ShareContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]); // Track online users
  const scrollEnd = useRef();

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Listen for online users updates
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("onlineUsers", (onlineIds) => {
      setOnlineUsers(onlineIds);
    });

    return () => socket.current.off("onlineUsers");
  }, [socket]);

  // ✅ Join room when user changes
  useEffect(() => {
    if (!socket.current || !selectedUser) return;

    const newRoomId = [user._id, selectedUser._id].sort().join("_");

    socket.current.emit("leaveAllRooms");
    socket.current.emit("joinRoom", newRoomId);
    console.log("✅ Joined room:", newRoomId);

    setMessages([]);

    return () => {
      socket.current.emit("leaveRoom", newRoomId);
      console.log("🚪 Left room:", newRoomId);
    };
  }, [selectedUser]);

  // ✅ Fetch old messages from DB
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/chat/messages/${selectedUser._id}`,
          { withCredentials: true }
        );
        if (data.success) setMessages(data.messages);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // ✅ Receive messages via socket
  useEffect(() => {
    if (!socket.current) return;

    const handleReceive = (msg) => {
      const currentRoomId = [user._id, selectedUser?._id].sort().join("_");
      if (msg.roomId !== currentRoomId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev; // prevent duplicates
        return [...prev, msg];
      });
    };

    socket.current.off("receiveMessage");
    socket.current.on("receiveMessage", handleReceive);

    return () => socket.current.off("receiveMessage", handleReceive);
  }, [selectedUser, user._id]);

  // ✅ Handle send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const roomId = [user._id, selectedUser._id].sort().join("_");
    const messageId = uuidv4();

    const messagePayload = {
      messageId,
      sender: user._id,
      receiver: selectedUser._id,
      text: newMessage,
      roomId,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${backendUrl}/api/chat/send`, messagePayload, { withCredentials: true });
      socket.current.emit("sendMessage", messagePayload);
      setMessages((prev) => [...prev, messagePayload]);
      setNewMessage("");
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Determine if selectedUser is online
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  return selectedUser ? (
    <div className="h-full overflow-scroll relative bg-gray-100 rounded-2xl shadow-inner">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-300 bg-white rounded-t-2xl">
        <img
          src={selectedUser?.image || assets.profile_martin}
          alt="profile"
          className="w-9 h-9 rounded-full object-cover"
        />
        <p className="flex-1 text-lg font-semibold text-gray-800 flex items-center gap-2">
          {selectedUser?.name || "Chat"}
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="back"
          className="md:hidden w-6 cursor-pointer opacity-70 hover:opacity-100 transition"
        />
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            No messages yet. Start a conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`flex items-end gap-2 ${
                msg.sender === user._id ? "justify-end" : "justify-start"
              }`}
            >
              <p
                className={`p-3 text-sm rounded-lg break-words ${
                  msg.sender === user._id
                    ? "bg-yellow-500 text-gray-900 rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                {msg.text}
              </p>
              <span className="text-xs text-gray-500 mt-1">
                {formatMessageTime(msg.createdAt || new Date())}
              </span>
            </div>
          ))
        )}
        <div ref={scrollEnd} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-white border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-full border border-gray-300 outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-yellow-500 p-2 rounded-full hover:bg-yellow-400 transition"
        >
          <img src={assets.send_button} alt="send" className="w-5" />
        </button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      Select a chat to start messaging
    </div>
  );
};

export default ChatContainer;
