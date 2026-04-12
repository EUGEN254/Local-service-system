import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import * as chatService from "../../services/chatService";
import { ShareContext } from "../../sharedcontext/SharedContext.jsx";
import { assets } from "../../assets/assets";
import { formatMessageTime } from "../../service-provider/libs/Utils.js";
import { v4 as uuidv4 } from "uuid";
import { FaImage, FaPaperPlane, FaTimes, FaCircleNotch } from "react-icons/fa";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
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
  const hasFetchedRef = useRef(false);

  const currentChatId = useMemo(
    () => (selectedUser ? [user._id, selectedUser._id].sort().join("_") : null),
    [selectedUser, user._id],
  );

  const currentChatIdRef = useRef(currentChatId);
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

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

  // Reset fetch flag when user changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [selectedUser]);

  // Fetch old messages from DB
  useEffect(() => {
    if (!selectedUser || hasFetchedRef.current) return;

    const abortController = new AbortController();

    const fetchMessages = async () => {
      hasFetchedRef.current = true;
      setLoading(true);
      try {
        const data = await chatService.fetchMessages(
          backendUrl,
          selectedUser._id,
          { signal: abortController.signal },
        );
           if (data.success) {
          console.log("📥 fetch returned messages:", data.messages.map(m => m.messageId));
          setMessages((prev) => ({ ...prev, [currentChatId]: data.messages }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          hasFetchedRef.current = false;
          const msg =
            err?.response?.data?.message ||
            err.message ||
            "Failed to fetch messages";
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    return () => abortController.abort();
  }, [selectedUser, backendUrl, currentChatId, setMessages]);

  // Mark this room as the active room
  useEffect(() => {
    if (selectedUser) {
      setActiveRoomId(currentChatId);
      return () => setActiveRoomId(null);
    }
    setActiveRoomId(null);
  }, [selectedUser, currentChatId, setActiveRoomId]);

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview({ file: file, previewUrl: e.target.result });
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle send message
  const handleSend = useCallback(async () => {
    if ((!newMessage.trim() && !imagePreview) || !selectedUser) return;

    setIsSending(true);

    const roomId = currentChatId;
    const messageId = uuidv4();

    if (imagePreview) {
      await handleSendImage(messageId, roomId);
    } else {
      const messagePayload = {
        messageId,
        sender: user._id,
        receiver: selectedUser._id,
        text: newMessage,
        roomId,
        createdAt: new Date(),
      };

      // Optimistic update
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), messagePayload],
      }));

      setNewMessage("");

      try {
        socket.current.emit("sendMessage", messagePayload);
        await chatService.sendMessage(backendUrl, messagePayload);
      } catch (err) {
        setMessages((prev) => ({
          ...prev,
          [currentChatId]: (prev[currentChatId] || []).filter(
            (m) => m.messageId !== messageId,
          ),
        }));
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to send message";
        toast.error(msg);
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

  // Handle send image
  const handleSendImage = useCallback(
    async (messageId, roomId) => {
      if (!imagePreview || !selectedUser) return;

      setUploading(true);

      const optimisticMessage = {
        messageId,
        sender: user._id,
        receiver: selectedUser._id,
        text: newMessage || "📷 Image",
        image: imagePreview.previewUrl,
        roomId,
        createdAt: new Date(),
        isOptimistic: true,
      };

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
          setMessages((prev) => ({
            ...prev,
            [currentChatId]: (prev[currentChatId] || []).map((msg) =>
              msg.messageId === messageId
                ? { ...msg, image: data.imageUrl, isOptimistic: false }
                : msg,
            ),
          }));

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
        setMessages((prev) => ({
          ...prev,
          [currentChatId]: (prev[currentChatId] || []).filter(
            (m) => m.messageId !== messageId,
          ),
        }));
        const msg =
          err?.response?.data?.message || err.message || "Failed to send image";
        toast.error(msg);
      } finally {
        setUploading(false);
        setIsSending(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleCancelPreview = useCallback(() => {
    setImagePreview(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <img src={assets.logo_icon} alt="Chat" className="w-16 opacity-40 mb-4" />
        <p className="text-lg font-medium">Select a service provider to start chatting</p>
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
          <span className={`text-xs font-medium ${isOnline ? "text-green-500" : "text-gray-500"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
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
                className={`flex items-end gap-2 ${
                  msg.sender === user._id ? "justify-end" : "justify-start"
                }`}
              >
                <div className={`flex flex-col ${msg.sender === user._id ? "items-end" : "items-start"}`}>
                  {msg.image ? (
                    <div
                      className={`p-2 rounded-lg max-w-xs ${
                        msg.sender === user._id ? "bg-yellow-500" : "bg-white border"
                      } ${msg.isOptimistic ? "opacity-70" : ""}`}
                    >
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                      {msg.text && msg.text !== "📷 Image" && (
                        <p className={`mt-2 text-sm ${msg.sender === user._id ? "text-gray-900" : "text-gray-800"}`}>
                          {msg.text}
                        </p>
                      )}
                      {msg.isOptimistic && (
                        <p className="text-xs text-gray-500 mt-1">Sending...</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <p
                        className={`p-3 text-sm rounded-lg break-words max-w-xs ${
                          msg.sender === user._id
                            ? "bg-yellow-500 text-gray-900 rounded-br-none"
                            : "bg-white text-gray-800 border rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </p>
                    </div>
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
              <img
                src={imagePreview.previewUrl}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg border border-gray-300"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Photo</p>
                <p className="text-xs text-gray-500">Add a caption (optional)</p>
              </div>
            </div>
            <button
              onClick={handleCancelPreview}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
            >
              <FaTimes />
            </button>
          </div>
          <div className="px-3 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-yellow-500 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
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
            placeholder={isOnline ? "Type a message..." : "Service provider is offline"}
            className={`flex-1 p-2 rounded-full border outline-none ${
              isOnline ? "border-gray-300 focus:border-yellow-500" : "border-gray-400 bg-gray-100"
            }`}
            disabled={!isOnline || uploading}
          />
          <button
            onClick={handleSend}
            type="button"
            disabled={!isOnline || (!newMessage.trim() && !imagePreview) || uploading || isSending}
            className={`p-2 rounded-full transition ${
              isOnline && (newMessage.trim() || imagePreview) && !uploading && !isSending
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

export default ChatContainer;