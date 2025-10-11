// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { Redis } from "@upstash/redis";
import connectDb from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import serviceRouter from "./routes/serviceProviderRoute.js";
import customerRouter from "./routes/customeRoutes.js";
import mpesaRouter from "./routes/mpesaRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import Chat from "./models/Chat.js";

// -------------------- EXPRESS + HTTP --------------------
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

// -------------------- MIDDLEWARE --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://local-service-system.vercel.app",
];

app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Test routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running! ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/status", (req, res) => {
  res.json({ 
    message: "😁 SERVER IS LIVE - Programmer Eugen",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// Create io instance at top level so it can be exported
export const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Track if server is already running
let serverStarted = false;

// Initialize function
async function initializeServer() {
  // Prevent multiple server starts
  if (serverStarted) {
    console.log("ℹ️ Server already initialized, skipping...");
    return;
  }

  try {
    console.log("🚀 Initializing server...");
    serverStarted = true;

    // -------------------- MONGODB & CLOUDINARY --------------------
    await connectDb();
    console.log("✅ MongoDB connected");
    await connectCloudinary();
    console.log("✅ Cloudinary connected");

    // -------------------- UPSTASH REDIS --------------------
    console.log("🔗 Connecting to Upstash Redis...");
    
    // Use environment variables for production, hardcoded for testing
    const redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "https://warm-phoenix-12407.upstash.io",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "ATB3AAIncDJjYjQxYjBiNDMxM2U0Y2VmYWM4YTFlZTMwYTg1MmFkOXAyMTI0MDc",
    });

    // Test Redis connection
    await redisClient.set("server_start_test", new Date().toISOString());
    const testResult = await redisClient.get("server_start_test");
    console.log("✅ Upstash Redis connected successfully!", testResult);

    console.log("✅ Socket.IO initialized!");

    // Redis helper functions
    const addOnlineUser = async (userId, socketId) => {
      try {
        await redisClient.sadd("online_users", userId);
        await redisClient.hset(`user_sockets:${userId}`, { [socketId]: 'connected' });
        console.log(`✅ User ${userId} added to online users`);
      } catch (err) {
        console.error('❌ Redis error in addOnlineUser:', err);
      }
    };

    const removeOnlineUser = async (userId, socketId) => {
      try {
        await redisClient.hdel(`user_sockets:${userId}`, socketId);
        const remainingSockets = await redisClient.hgetall(`user_sockets:${userId}`);
        
        if (!remainingSockets || Object.keys(remainingSockets).length === 0) {
          await redisClient.srem("online_users", userId);
          console.log(`✅ User ${userId} removed from online users`);
        }
      } catch (err) {
        console.error('❌ Redis error in removeOnlineUser:', err);
      }
    };

    const getOnlineUsers = async () => {
      try {
        return await redisClient.smembers("online_users") || [];
      } catch (err) {
        console.error('❌ Redis error in getOnlineUsers:', err);
        return [];
      }
    };

    // -------------------- SOCKET.IO EVENTS --------------------
    io.on("connection", (socket) => {
      console.log("🟢 New socket connected:", socket.id);

      // ---------------- JOIN USER ROOM ----------------
      socket.on("joinUserRoom", async ({ userId, userName, userRole, roomProvider, serviceName, roomId }) => {
        if (!userId) return;

        try {
          await addOnlineUser(userId, socket.id);
          
          socket.userId = userId;
          socket.userName = userName;
          
          if (roomId) {
            socket.join(roomId);
            console.log(`✅ ${userName} joined room: ${roomId}`);
          }

          console.log(`👤 ${userRole} ${userName} (${userId}) is now online`);

          // Broadcast updated online users
          const onlineUsers = await getOnlineUsers();
          io.emit("onlineUsers", onlineUsers);
          console.log(`📢 Online users: ${onlineUsers.length} users`);
          
        } catch (err) {
          console.error("❌ Error in joinUserRoom:", err);
        }
      });

      // ---------------- SEND / RECEIVE MESSAGES ----------------
      socket.on("sendMessage", async ({ messageId, sender, receiver, text, roomId, createdAt, image }) => {
        console.log(`💬 Message from ${sender} to ${receiver}`);
        
        const message = {
          messageId,
          sender,
          receiver,
          text,
          image,
          roomId,
          createdAt: createdAt || new Date(),
        };

        io.to(roomId).emit("receiveMessage", message);

        try {
          let chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
          if (!chat) chat = new Chat({ participants: [sender, receiver], messages: [] });

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
            console.log("💾 Message saved to database");
          }
        } catch (err) {
          console.error("❌ Error saving message:", err.message);
        }
      });

      // ---------------- DISCONNECT ----------------
      socket.on("disconnect", async (reason) => {
        console.log("🔴 Socket disconnected:", socket.id, "Reason:", reason);
        
        try {
          if (socket.userId) {
            await removeOnlineUser(socket.userId, socket.id);
            const onlineUsers = await getOnlineUsers();
            io.emit("onlineUsers", onlineUsers);
            console.log(`📢 Online users after disconnect: ${onlineUsers.length} users`);
          }
        } catch (err) {
          console.error("❌ Error handling disconnect:", err);
        }
      });
    });

    // -------------------- ROUTES --------------------
    app.use("/api/user", userRouter);
    app.use("/api/serviceprovider", serviceRouter);
    app.use("/api/customer", customerRouter);
    app.use("/api/mpesa", mpesaRouter);
    app.use("/api/chat", chatRouter);

    // -------------------- START SERVER --------------------
    // Only start server if not in Vercel serverless environment
    if (process.env.VERCEL !== "1") {
      server.listen(port, () => {
        console.log(`🚀 Server started on PORT: ${port}`);
        console.log(`🔗 Upstash Redis: Connected`);
        console.log(`🌐 CORS: ${allowedOrigins.join(', ')}`);
      });
    } else {
      console.log("🚀 Server running on Vercel");
    }

  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    serverStarted = false; // Reset flag on error
  }
}

// For Vercel: Export the app for serverless functions
export default app;

// For local development: Initialize the server
if (process.env.VERCEL !== "1") {
  initializeServer();
}