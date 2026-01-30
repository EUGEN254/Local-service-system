import React, { useState, useContext, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import * as chatService from "../../services/chatService";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets";
import { formatMessageTime } from "../../service-provider/libs/Utils.js";
import { v4 as uuidv4 } from "uuid"; 
import { FaImage, FaPaperPlane, FaTimes, FaCircleNotch } from "react-icons/fa";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const { user, backendUrl, socket, onlineUsers, messages, setMessages, markChatAsRead, setActiveRoomId } = useContext(ShareContext);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSending, setIsSending] = useState(false); // indicates a message send in progress
  const [imagePreview, setImagePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const scrollEnd = useRef();
  const fileInputRef = useRef();

  // Get current chat ID and messages from context
  const currentChatId = selectedUser ? [user._id, selectedUser._id].sort().join("_") : null;
  const chatMessages = currentChatId ? messages[currentChatId] || [] : [];

  // ✅ Scroll to bottom on new messages
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // ✅ Fetch old messages from DB and update context
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await chatService.fetchMessages(backendUrl, selectedUser._id);
        if (data.success) {
          setMessages((prev) => ({ ...prev, [currentChatId]: data.messages }));
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to fetch messages';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, backendUrl, currentChatId, setMessages]);

  // Mark this room as the active room so the shared socket listener doesn't mark
  // messages in this chat as unread when they arrive. When chat is closed, clear it.
  useEffect(() => {
    if (selectedUser) {
      setActiveRoomId(currentChatId);
      return () => setActiveRoomId(null);
    }
    // If no selected user ensure it's cleared
    setActiveRoomId(null);
  }, [selectedUser, currentChatId, setActiveRoomId]);

  // ✅ Receive messages via socket and update context WITH DUPLICATE PREVENTION
  useEffect(() => {
    if (!socket.current) return;

    const handleReceive = (msg) => {
      const currentRoomId = [user._id, selectedUser?._id].sort().join("_");
      if (msg.roomId !== currentRoomId) return;

      // ✅ ADDED DUPLICATE PREVENTION
      setMessages(prev => {
        const existingMessages = prev[currentChatId] || [];
        
        // Check if message already exists
        if (existingMessages.find(m => m.messageId === msg.messageId)) {
          return prev; // Don't add duplicate
        }
        
        // If the incoming message is for this open chat and is sent to the current user,
        // immediately mark it as read so unread counters update correctly.
        if (msg.receiver === user._id && selectedUser && msg.sender === selectedUser._id) {
          // fire-and-forget — mark read will update local state and call backend
          markChatAsRead(msg.sender).catch?.(() => {});
        }

        return {
          ...prev,
          [currentChatId]: [...existingMessages, msg]
        };
      });
    };

    socket.current.off("receiveMessage");
    socket.current.on("receiveMessage", handleReceive);

    return () => socket.current.off("receiveMessage", handleReceive);
  }, [selectedUser, user._id, socket, currentChatId, setMessages]);

  // ✅ Handle image selection (preview)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview({
        file: file,
        previewUrl: e.target.result
      });
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  // ✅ Handle send message and update context
  const handleSend = async () => {
    if ((!newMessage.trim() && !imagePreview) || !selectedUser) return;

    setIsSending(true);

    const roomId = [user._id, selectedUser._id].sort().join("_");
    const messageId = uuidv4();

    // If there's an image preview, send image first
    if (imagePreview) {
      await handleSendImage(messageId, roomId);
    } else {
      // Send text message only
      const messagePayload = {
        messageId,
        sender: user._id,
        receiver: selectedUser._id,
        text: newMessage,
        roomId,
        createdAt: new Date(),
      };

      try {
        await chatService.sendMessage(backendUrl, messagePayload);
        socket.current.emit("sendMessage", messagePayload);

        setMessages(prev => ({
          ...prev,
          [currentChatId]: [...(prev[currentChatId] || []), messagePayload]
        }));

        setNewMessage("");
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to send message';
        toast.error(msg);
      } finally {
        setIsSending(false);
      }
    }
  };

  // ✅ Handle send image and update context
  const handleSendImage = async (messageId, roomId) => {
    if (!imagePreview || !selectedUser) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', imagePreview.file);
      formData.append('sender', user._id);
      formData.append('receiver', selectedUser._id);
      formData.append('roomId', roomId);
      formData.append('messageId', messageId);
      formData.append('text', newMessage || "📷 Image");

      const data = await chatService.sendImage(backendUrl, formData);
      if (data.success) {
        const messagePayload = {
          messageId,
          sender: user._id,
          receiver: selectedUser._id,
          text: newMessage || "📷 Image",
          image: data.imageUrl,
          roomId,
          createdAt: new Date(),
        };

      
      socket.current.emit("sendMessage", messagePayload);

        // Update context with image message
        setMessages(prev => ({
          ...prev,
          [currentChatId]: [...(prev[currentChatId] || []), messagePayload]
        }));
        
        setNewMessage("");
        setImagePreview(null);
        setShowPreview(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to send image';
      toast.error(msg);
    } finally {
      setUploading(false);
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ Cancel image preview
  const handleCancelPreview = () => {
    setImagePreview(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !showPreview) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Determine if selectedUser is online
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id.toString()) : false;

  return selectedUser ? (
    <div className="h-full overflow-scroll relative bg-gray-100 rounded-2xl shadow-inner">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-300 bg-white rounded-t-2xl">
        <div className="relative">
          <img
            src={selectedUser?.image || assets.avatar_icon}
            alt="profile"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`} />
        </div>
        
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-800">{selectedUser?.name || "Chat"}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              isOnline ? "text-green-500" : "text-gray-500"
            }`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="back"
          className="md:hidden w-6 cursor-pointer opacity-70 hover:opacity-100 transition"
        />
      </div>

      {/* Messages */}
      <div className={`flex flex-col overflow-y-scroll p-4 space-y-3 ${
        showPreview ? 'h-[calc(100%-220px)]' : 'h-[calc(100%-120px)]'
      }`}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            No messages yet. Start a conversation!
          </p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.messageId}
              className={`flex items-end gap-2 ${
                msg.sender === user._id ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex flex-col ${msg.sender === user._id ? "items-end" : "items-start"}`}>
                {msg.image ? (
                  <div className={`p-2 rounded-lg max-w-xs ${
                    msg.sender === user._id ? "bg-yellow-500" : "bg-white border"
                  }`}>
                    <img 
                      src={msg.image} 
                      alt="Shared" 
                      className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                      onClick={() => window.open(msg.image, '_blank')}
                    />
                    {msg.text && msg.text !== "📷 Image" && (
                      <p className={`mt-2 text-sm ${msg.sender === user._id ? "text-gray-900" : "text-gray-800"}`}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <p
                    className={`p-3 text-sm rounded-lg wrap-break-word max-w-xs ${
                      msg.sender === user._id
                        ? "bg-yellow-500 text-gray-900 rounded-br-none"
                        : "bg-white text-gray-800 border rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </p>
                )}
                <span className="text-xs text-gray-500 mt-1">
                  {formatMessageTime(msg.createdAt || new Date())}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={scrollEnd} />
      </div>

      {/* ✅ CLEAN WHATSAPP-STYLE IMAGE PREVIEW - Above input field */}
      {showPreview && imagePreview && (
        <div className="border-t border-gray-300 bg-white">
          <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <img 
                  src={imagePreview.previewUrl} 
                  alt="Preview" 
                  className="w-12 h-12 object-cover rounded-lg border border-gray-300"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Photo</p>
                <p className="text-xs text-gray-500">Tap to add caption</p>
              </div>
            </div>
            <button
              onClick={handleCancelPreview}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t">
        {/* Caption input when preview is active */}
        {showPreview && imagePreview && (
          <div className="px-3 pt-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-yellow-500 text-sm mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
        )}
        
        <div className="flex items-center gap-3 p-3">
          <input
            type='file'
            id='image'
            ref={fileInputRef}
            accept='image/png, image/jpeg, image/jpg, image/gif, image/webp'
            hidden
            onChange={handleImageSelect}
            disabled={!isOnline || uploading}
          />
          
          {/* ✅ REACT ICONS Gallery Icon */}
          <label 
            htmlFor='image' 
            className={`cursor-pointer p-2 rounded-full transition-all ${
              !isOnline || uploading 
                ? 'opacity-50 cursor-not-allowed bg-gray-200' 
                : 'bg-yellow-100 hover:bg-yellow-200 shadow-sm'
            }`}
          >
            <FaImage className="w-5 h-5 text-gray-600" />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOnline ? "Type a message..." : "Service provider is offline"}
            className={`flex-1 p-2 rounded-full border outline-none ${
              isOnline ? "border-gray-300" : "border-gray-400 bg-gray-100"
            } ${showPreview ? 'opacity-50' : ''}`}
           
          />

          <button
            onClick={handleSend}
            disabled={!isOnline || (!newMessage.trim() && !imagePreview) || uploading || isSending}
            className={`p-2 rounded-full transition ${
              isOnline && (newMessage.trim() || imagePreview) && !uploading && !isSending
                ? "bg-yellow-500 hover:bg-yellow-400 shadow-sm" 
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <FaCircleNotch className="w-4 h-4 text-white animate-spin" />
            ) : uploading ? (
              <span className="text-xs text-white">📤</span>
            ) : (
              <FaPaperPlane className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <img src={assets.logo_icon} alt="Chat" className="w-16 opacity-40 mb-4" />
      <p className="text-lg font-medium">Select a service provider to start chatting</p>
      <p className="text-sm mt-2">Your conversations will appear here</p>
    </div>
  );
};

export default ChatContainer;