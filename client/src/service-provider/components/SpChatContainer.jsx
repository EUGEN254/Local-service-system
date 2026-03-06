import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as chatService from "../../services/chatService";
import { v4 as uuidv4 } from "uuid";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets.js";
import { formatMessageTime } from "../libs/Utils.js";
import { FaImage, FaPaperPlane, FaTimes, FaCircleNotch } from "react-icons/fa";

const SpChatContainer = ({ selectedUser, setSelectedUser }) => {
  const {
    user,
    backendUrl,
    socket,
    onlineUsers,
    messages,
    setMessages,
    markChatAsRead,
    setActiveRoomId,
  } = useContext(ShareContext);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef();
  const messageEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const currentChatIdRef = useRef(null);

  // Get current chat ID and messages from context - USING MEMO
  const currentChatId = useMemo(
    () => (selectedUser ? [user._id, selectedUser._id].sort().join("_") : null),
    [selectedUser, user._id],
  );

  // Update ref when currentChatId changes
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  // Get messages for current chat - USING MEMO
  const chatMessages = useMemo(
    () => (currentChatId ? messages[currentChatId] || [] : []),
    [messages, currentChatId],
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatMessages.length > prevMessagesLengthRef.current) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    prevMessagesLengthRef.current = chatMessages.length;
  }, [chatMessages]);

  // Join room when selectedUser changes
  useEffect(() => {
    if (!socket.current || !selectedUser) return;

    const roomId = currentChatId;

    socket.current.emit("leaveAllRooms");
    socket.current.emit("joinRoom", roomId);

    return () => {
      socket.current.emit("leaveRoom", roomId);
    };
  }, [selectedUser, currentChatId, socket]);

  // Fetch previous messages - WITH ABORT CONTROLLER
  useEffect(() => {
    if (!selectedUser) return;

    const abortController = new AbortController();

    const fetchMessages = async () => {
      // Don't refetch if we already have messages
      if (chatMessages.length > 0) {
        return;
      }

      setLoading(true);
      try {
        const data = await chatService.fetchMessages(
          backendUrl,
          selectedUser._id,
          { signal: abortController.signal },
        );
        if (data.success) {
          setMessages((prev) => ({ ...prev, [currentChatId]: data.messages }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Error fetching messages:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    return () => abortController.abort();
  }, [
    selectedUser,
    backendUrl,
    currentChatId,
    setMessages,
    chatMessages.length,
  ]);

  // Mark this room as active
  useEffect(() => {
    if (selectedUser) {
      setActiveRoomId(currentChatId);
      return () => setActiveRoomId(null);
    }
    setActiveRoomId(null);
  }, [selectedUser, currentChatId, setActiveRoomId]);

  // Receive messages via socket
  const handleReceiveMessage = useCallback(
    (msg) => {
      if (msg.roomId !== currentChatIdRef.current) return;

      setMessages((prev) => {
        const existingMessages = prev[currentChatIdRef.current] || [];

        // Check if message already exists
        if (existingMessages.some((m) => m.messageId === msg.messageId)) {
          return prev;
        }

        // If this message is incoming for the currently open chat, mark it as read
        if (
          msg.receiver === user._id &&
          selectedUser &&
          msg.sender === selectedUser._id
        ) {
          markChatAsRead(msg.sender).catch(() => {});
        }

        return {
          ...prev,
          [currentChatIdRef.current]: [...existingMessages, msg],
        };
      });
    },
    [selectedUser, user._id, markChatAsRead, setMessages],
  );

  // Socket listener setup
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.current.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, handleReceiveMessage]);

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview({
        file: file,
        previewUrl: e.target.result,
      });
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle send message - WITH OPTIMISTIC UPDATE
  const handleSend = useCallback(async () => {
    if ((!newMessage.trim() && !imagePreview) || !selectedUser) return;

    const roomId = currentChatId;
    const messageId = uuidv4();

    setIsSending(true);

    if (imagePreview) {
      await handleSendImage(messageId, roomId);
    } else {
      // Create message payload
      const messagePayload = {
        messageId,
        sender: user._id,
        receiver: selectedUser._id,
        text: newMessage,
        roomId,
        createdAt: new Date(),
      };

      // OPTIMISTIC UPDATE - Show message immediately
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), messagePayload],
      }));

      setNewMessage("");

      try {
        // Emit via socket for real-time to other user
        socket.current.emit("sendMessage", messagePayload);

        // Save to DB
        await chatService.sendMessage(backendUrl, messagePayload);
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => ({
          ...prev,
          [currentChatId]: (prev[currentChatId] || []).filter(
            (m) => m.messageId !== messageId,
          ),
        }));
        console.error("❌ Error sending message:", err);
      } finally {
        setIsSending(false);
      }
    }
  }, [
    newMessage,
    imagePreview,
    selectedUser,
    currentChatId,
    user._id,
    backendUrl,
    socket,
    setMessages,
  ]);

  // Handle send image - WITH OPTIMISTIC UPDATE
  const handleSendImage = useCallback(
    async (messageId, roomId) => {
      if (!imagePreview || !selectedUser) return;

      setUploading(true);

      // Create optimistic image message
      const optimisticMessage = {
        messageId,
        sender: user._id,
        receiver: selectedUser._id,
        text: newMessage || "📷 Image",
        image: imagePreview.previewUrl, // Preview URL temporarily
        roomId,
        createdAt: new Date(),
        isOptimistic: true,
      };

      // OPTIMISTIC UPDATE - Show image immediately
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), optimisticMessage],
      }));

      try {
        const formData = new FormData();
        formData.append("image", imagePreview.file);
        formData.append("sender", user._id);
        formData.append("receiver", selectedUser._id);
        formData.append("roomId", roomId);
        formData.append("messageId", messageId);
        formData.append("text", newMessage || "📷 Image");

        const data = await chatService.sendImage(backendUrl, formData);

        if (data.success) {
          // Update optimistic message with real image URL
          setMessages((prev) => ({
            ...prev,
            [currentChatId]: (prev[currentChatId] || []).map((msg) =>
              msg.messageId === messageId
                ? { ...msg, image: data.imageUrl, isOptimistic: false }
                : msg,
            ),
          }));

          // Emit socket event for other user
          socket.current.emit("sendMessage", {
            ...optimisticMessage,
            image: data.imageUrl,
            isOptimistic: false,
          });

          setNewMessage("");
          setImagePreview(null);
          setShowPreview(false);
        }
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => ({
          ...prev,
          [currentChatId]: (prev[currentChatId] || []).filter(
            (m) => m.messageId !== messageId,
          ),
        }));
        console.error("❌ Error sending image:", err);
        alert("Failed to send image");
      } finally {
        setUploading(false);
        setIsSending(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      imagePreview,
      selectedUser,
      newMessage,
      currentChatId,
      user._id,
      backendUrl,
      socket,
      setMessages,
    ],
  );

  // Cancel image preview
  const handleCancelPreview = useCallback(() => {
    setImagePreview(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const isOnline = useMemo(
    () =>
      selectedUser ? onlineUsers.includes(selectedUser._id.toString()) : false,
    [selectedUser, onlineUsers],
  );

  // If no user selected, show placeholder
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <img
          src={assets.logo_icon}
          alt="Chat"
          className="w-16 opacity-40 mb-4"
        />
        <p className="text-lg font-medium">
          Select a customer to start chatting
        </p>
        <p className="text-sm mt-2">Your conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden relative bg-gray-100 rounded-2xl shadow-inner flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-300 bg-white rounded-t-2xl flex-shrink-0">
        <div className="relative">
          <img
            src={selectedUser?.image || assets.avatar_icon}
            alt="profile"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-800">
            {selectedUser?.name || "Chat"}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                isOnline ? "text-green-500" : "text-gray-500"
              }`}
            >
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chatMessages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            No messages yet. Start a conversation!
          </p>
        ) : (
          <>
            {chatMessages.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex items-end gap-2 ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col ${msg.sender === user._id ? "items-end" : "items-start"}`}
                >
                  {msg.image ? (
                    <div
                      className={`p-2 rounded-lg max-w-xs ${
                        msg.sender === user._id
                          ? "bg-yellow-500"
                          : "bg-white border"
                      } ${msg.isOptimistic ? "opacity-70" : ""}`}
                    >
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                      {msg.text && msg.text !== "📷 Image" && (
                        <p
                          className={`mt-2 text-sm ${msg.sender === user._id ? "text-gray-900" : "text-gray-800"}`}
                        >
                          {msg.text}
                        </p>
                      )}
                      {msg.isOptimistic && (
                        <p className="text-xs text-gray-500 mt-1">Sending...</p>
                      )}
                    </div>
                  ) : (
                    <p
                      className={`p-3 text-sm rounded-lg break-words max-w-xs ${
                        msg.sender === user._id
                          ? "bg-yellow-500 text-gray-900 rounded-br-none"
                          : "bg-white text-gray-800 border rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                  <span className="text-xs text-gray-500 mt-1 px-1">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      {/* Image Preview */}
      {showPreview && imagePreview && (
        <div className="border-t border-gray-300 bg-white flex-shrink-0">
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
                <p className="text-xs text-gray-500">
                  Add a caption (optional)
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelPreview}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
            >
              <FaTimes />
            </button>
          </div>

          {/* Caption input */}
          <div className="px-3 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-yellow-500 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t flex-shrink-0">
        <div className="flex items-center gap-3 p-3">
          <input
            type="file"
            id="image"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            hidden
            onChange={handleImageSelect}
            disabled={!isOnline || uploading}
          />

          <label
            htmlFor="image"
            className={`cursor-pointer p-2 rounded-full transition-all ${
              !isOnline || uploading
                ? "opacity-50 cursor-not-allowed bg-gray-200"
                : "bg-yellow-100 hover:bg-yellow-200 shadow-sm"
            }`}
          >
            <FaImage className="w-5 h-5 text-gray-600" />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOnline ? "Type a message..." : "User is offline"}
            className={`flex-1 p-2 rounded-full border outline-none ${
              isOnline
                ? "border-gray-300 focus:border-yellow-500"
                : "border-gray-400 bg-gray-100"
            }`}
            disabled={!isOnline || uploading}
          />

          <button
            onClick={handleSend}
            disabled={
              !isOnline ||
              (!newMessage.trim() && !imagePreview) ||
              uploading ||
              isSending
            }
            className={`p-2 rounded-full transition ${
              isOnline &&
              (newMessage.trim() || imagePreview) &&
              !uploading &&
              !isSending
                ? "bg-yellow-500 hover:bg-yellow-400 shadow-sm"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSending || uploading ? (
              <FaCircleNotch className="w-4 h-4 text-white animate-spin" />
            ) : (
              <FaPaperPlane className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpChatContainer;
