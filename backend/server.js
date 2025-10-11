// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import cookieParser from "cookie-parser";
import connectDb from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import serviceRouter from "./routes/serviceProviderRoute.js";
import customerRouter from "./routes/customeRoutes.js";
import mpesaRouter from "./routes/mpesaRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import Chat from "./models/Chat.js";
import { Server } from "socket.io";

// -------------------- EXPRESS + HTTP --------------------
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

// -------------------- MIDDLEWARE --------------------
connectCloudinary();
const allowedOrigins = [
  "http://localhost:5173",
  "https://local-service-system.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Test route
app.use("/api/status", (req, res) =>
  res.send("😁 SERVER IS LIVE - Programmer Eugen")
);

// -------------------- MONGODB --------------------
await connectDb();

// -------------------- SOCKET.IO --------------------
export const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

// Track online users and their rooms
export const connectedUsers = {};
const userRooms = {}; // Track rooms per user for reconnection

// Helper to get user ID from socket (you might need to implement auth)
const getUserIdFromSocket = (socket) => {
  // This depends on how you handle authentication
  // You might want to pass userId in handshake or via auth token
  return socket.handshake.auth?.userId || null;
};

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);
  console.log("🔗 Socket auth:", socket.handshake.auth);

  // ---------------- JOIN USER ROOM ----------------
  socket.on(
    "joinUserRoom",
    ({ userId, userName, userRole, roomProvider, serviceName, roomId }) => {
      if (!userId) {
        console.log("❌ joinUserRoom: Missing userId");
        return;
      }

      if (!connectedUsers[userId]) connectedUsers[userId] = new Set();
      connectedUsers[userId].add(socket.id);

      // Store user's main room
      userRooms[userId] = roomId;
      
      socket.join(roomId);
      socket.userId = userId; // Attach userId to socket for easier access

      console.log(
        `👤 ${userRole} ${userName} (${userId}) joined room "${serviceName}" by ${roomProvider}. RoomID: ${roomId}`
      );
      console.log(`📊 Online users: ${Object.keys(connectedUsers).length}`);

      io.emit("onlineUsers", Object.keys(connectedUsers));
    }
  );

  // ---------------- JOIN / LEAVE ROOMS ----------------
  socket.on("joinRoom", (roomId, callback) => {
    if (!roomId) {
      console.log("❌ joinRoom: Missing roomId");
      if (callback) callback({ status: 'error', message: 'Missing roomId' });
      return;
    }

    socket.join(roomId);
    
    // Store room for this user
    const userId = socket.userId || getUserIdFromSocket(socket);
    if (userId) {
      userRooms[userId] = roomId;
    }

    console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
    console.log(`🏠 Socket ${socket.id} now in rooms:`, Array.from(socket.rooms));

    if (callback) callback({ status: 'success', roomId });
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 Socket ${socket.id} left room ${roomId}`);
  });

  socket.on("leaveAllRooms", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`🚪 Socket ${socket.id} left room ${room}`);
      }
    });
  });

  // ---------------- RESTORE ROOMS ON RECONNECTION ----------------
  socket.on("restoreRooms", (userId) => {
    if (userId && userRooms[userId]) {
      socket.join(userRooms[userId]);
      socket.userId = userId;
      console.log(`🔄 Restored room ${userRooms[userId]} for user ${userId}`);
    }
  });

  // ---------------- SEND / RECEIVE MESSAGES ----------------
  socket.on(
    "sendMessage",
    async (messageData, callback) => {
      const { messageId, sender, receiver, text, roomId, createdAt, image } = messageData;
      
      console.log('📤 Received message:', {
        roomId,
        messageId,
        sender,
        receiver,
        socketId: socket.id,
        rooms: Array.from(socket.rooms)
      });

      if (!roomId) {
        console.log("❌ sendMessage: Missing roomId");
        if (callback) callback({ status: 'error', message: 'Missing roomId' });
        return;
      }

      const message = {
        messageId,
        sender,
        receiver,
        text,
        image,
        roomId,
        createdAt: createdAt || new Date(),
      };

      try {
        // Emit to room first for instant delivery
        console.log(`📨 Emitting to room: ${roomId}`);
        io.to(roomId).emit("receiveMessage", message);
        console.log('✅ Message emitted successfully to room');

        // Send acknowledgment back to sender
        if (callback) {
          callback({ 
            status: 'delivered', 
            messageId,
            roomId,
            timestamp: new Date()
          });
        }

        // Save to database
        let chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
        if (!chat) {
          chat = new Chat({ 
            participants: [sender, receiver], 
            messages: [] 
          });
        }

        // Prevent duplicates
        const exists = chat.messages.find((m) => m.messageId === messageId);
        if (!exists) {
          chat.messages.push({
            messageId,
            sender,
            text,
            image,
            createdAt: message.createdAt,
          });
          chat.updatedAt = new Date();
          await chat.save();
          console.log("💾 Message saved to database:", messageId);
        } else {
          console.log("⚠️ Duplicate message ignored:", messageId);
        }

      } catch (err) {
        console.error("❌ Error processing message:", err.message);
        if (callback) {
          callback({ 
            status: 'error', 
            message: 'Failed to process message',
            error: err.message 
          });
        }
      }
    }
  );

  // ---------------- TYPING INDICATORS ----------------
  socket.on("typingStart", ({ roomId, userId, userName }) => {
    socket.to(roomId).emit("userTyping", { userId, userName, typing: true });
  });

  socket.on("typingStop", ({ roomId, userId }) => {
    socket.to(roomId).emit("userTyping", { userId, typing: false });
  });

  // ---------------- HEALTH CHECK ----------------
  socket.on("ping", (callback) => {
    if (callback) callback({ 
      status: 'pong', 
      timestamp: new Date(),
      socketId: socket.id 
    });
  });

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", socket.id, "Reason:", reason);
    
    // Clean up user tracking
    for (const userId in connectedUsers) {
      connectedUsers[userId].delete(socket.id);
      if (connectedUsers[userId].size === 0) {
        delete connectedUsers[userId];
        delete userRooms[userId];
      }
    }
    
    console.log(`📊 Remaining online users: ${Object.keys(connectedUsers).length}`);
    io.emit("onlineUsers", Object.keys(connectedUsers));
  });

  // ---------------- ERROR HANDLING ----------------
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// -------------------- HEALTH CHECK ENDPOINT --------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    onlineUsers: Object.keys(connectedUsers).length,
    socketConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------- SOCKET.IO HEALTH CHECK --------------------
app.get("/api/socket-health", (req, res) => {
  const socketInfo = {
    connectedUsers: Object.keys(connectedUsers),
    userRooms,
    totalSockets: io.engine.clientsCount,
    serverTime: new Date()
  };
  res.json(socketInfo);
});

// -------------------- ROUTES --------------------
app.use("/api/user", userRouter);
app.use("/api/serviceprovider", serviceRouter);
app.use("/api/customer", customerRouter);
app.use("/api/mpesa", mpesaRouter);
app.use("/api/chat", chatRouter);

// -------------------- 404 HANDLER --------------------
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl,
    method: req.method 
  });
});

// -------------------- ERROR HANDLER --------------------
app.use((error, req, res, next) => {
  console.error("🚨 Global error handler:", error);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// -------------------- START SERVER LOCALLY --------------------
if (process.env.NODE_ENV !== "production") {
  server.listen(port, () => {
    console.log(`🚀 Server started on PORT: ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  });
}

// -------------------- EXPORT FOR VERCEL --------------------
export default server;