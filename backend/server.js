// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "@upstash/redis"; // ← Use Upstash Redis
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

app.use("/api/status", (req, res) =>
  res.send("😁 SERVER IS LIVE - Programmer Eugen")
);

// -------------------- MONGODB --------------------
await connectDb();

// -------------------- UPSTASH REDIS SETUP --------------------
console.log("🔗 Connecting to Upstash Redis...");

// Create Redis client using your REST URL and token
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Test the connection
try {
  await redisClient.set("socket_test", "connected");
  const test = await redisClient.get("socket_test");
  console.log("✅ Upstash Redis connected successfully!", test);
} catch (err) {
  console.error("❌ Upstash Redis connection failed:", err);
}

// -------------------- SOCKET.IO WITH CUSTOM ADAPTER --------------------
export const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST"]
  }
});

console.log("✅ Socket.IO initialized!");

// Custom Redis helper functions for Upstash
const addOnlineUser = async (userId, socketId) => {
  try {
    // Use sets to store online users
    await redisClient.sadd("online_users", userId);
    // Store socket mapping
    await redisClient.hset(`user_sockets:${userId}`, { [socketId]: 'connected' });
    console.log(`✅ User ${userId} added to online users`);
  } catch (err) {
    console.error('❌ Redis error in addOnlineUser:', err);
  }
};

const removeOnlineUser = async (userId, socketId) => {
  try {
    // Remove socket from user's sockets
    await redisClient.hdel(`user_sockets:${userId}`, socketId);
    
    // Check if user has any remaining sockets
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
server.listen(port, () => {
  console.log(`🚀 Server started on PORT: ${port}`);
  console.log(`🔗 Upstash Redis: Connected`);
});

export default server;