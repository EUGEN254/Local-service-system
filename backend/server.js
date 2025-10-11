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
connectCloudinary();
const allowedOrigins = [
  "http://localhost:5173",
  "https://local-service-system.vercel.app",
];
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Test route
app.use("/api/status", (req, res) =>
  res.send("😁 SERVER IS LIVE - Programmer Eugen")
);

// -------------------- MONGODB --------------------
await connectDb();

// -------------------- REDIS SETUP (Simple) --------------------
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Test Redis connection
try {
  await redis.set("server_started", new Date().toISOString());
  console.log("✅ Redis connected successfully");
} catch (err) {
  console.error("❌ Redis connection failed:", err);
}

// -------------------- SOCKET.IO --------------------
export const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Simple Redis functions for online users
const addOnlineUser = async (userId) => {
  try {
    await redis.sadd("online_users", userId);
  } catch (err) {
    console.error('Redis error:', err);
  }
};

const removeOnlineUser = async (userId) => {
  try {
    await redis.srem("online_users", userId);
  } catch (err) {
    console.error('Redis error:', err);
  }
};

const getOnlineUsers = async () => {
  try {
    return await redis.smembers("online_users") || [];
  } catch (err) {
    console.error('Redis error:', err);
    return [];
  }
};

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // ---------------- JOIN USER ROOM ----------------
  socket.on(
    "joinUserRoom",
    async ({ userId, userName, userRole, roomProvider, serviceName, roomId }) => {
      if (!userId) return;

      // Add to Redis online users
      await addOnlineUser(userId);
      
      socket.userId = userId;
      socket.join(roomId);

      console.log(
        `${userRole} ${userName} (${userId}) joined room "${serviceName}" by ${roomProvider}. RoomID: ${roomId}`
      );

      // Get online users from Redis and broadcast
      const onlineUsers = await getOnlineUsers();
      io.emit("onlineUsers", onlineUsers);
    }
  );

  // ---------------- JOIN / LEAVE ROOMS ----------------
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 Socket ${socket.id} left room ${roomId}`);
  });

  socket.on("leaveAllRooms", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    console.log(`🚪 Socket ${socket.id} left all rooms`);
  });

  // ---------------- SEND / RECEIVE MESSAGES ----------------
  socket.on(
    "sendMessage",
    async ({ messageId, sender, receiver, text, roomId, createdAt, image }) => {
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
          console.log("💾 Message saved:", messageId);
        } else {
          console.log("⚠️ Duplicate message ignored:", messageId);
        }
      } catch (err) {
        console.error("❌ Error saving message:", err.message);
      }
    }
  );

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", async () => {
    console.log("🔴 Socket disconnected:", socket.id);
    
    // Remove from Redis online users
    if (socket.userId) {
      await removeOnlineUser(socket.userId);
      
      // Broadcast updated online users
      const onlineUsers = await getOnlineUsers();
      io.emit("onlineUsers", onlineUsers);
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
server.listen(port, () => console.log(`Server started on PORT: ${port}`));

// -------------------- EXPORT FOR VERCEL --------------------
export default server;