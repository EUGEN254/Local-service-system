import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import cookieParser from "cookie-parser";
import { connectDb, connectCloudinary } from "./src/config/index.js";
import {
  userRouter,
  serviceRouter,
  customerRouter,
  mpesaRouter,
  chatRouter,
  adminRouter,
  categoryRouter,
  notificationRouter,
  supportRouter,
  landipageDetailsRouter,
} from "./src/routes/index.js";
import { Chat } from "./src/models/index.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./src/models/index.js";
import { errorHandler } from "./src/middleware/index.js";

// -------------------- EXPRESS + HTTP SETUP --------------------
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

// -------------------- MIDDLEWARE --------------------
connectCloudinary();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://admin-lss.vercel.app",
  "https://local-service-system.vercel.app",
  "https://local-service-system.onrender.com",
];

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use("/api/status", (req, res) => res.send("SERVER IS LIVE"));

// -------------------- DATABASE --------------------
await connectDb();

// -------------------- SOCKET.IO SETUP --------------------
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Track online users: userId -> Set of socketIds
export const connectedUsers = {};

// -------------------- SOCKET AUTH --------------------
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers?.cookie || "";
    const token = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) return next(new Error("Authentication error: missing token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return next(new Error("Authentication error"));

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("Authentication error"));

    socket.user = user;
    return next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    return next(new Error("Authentication error"));
  }
});

// -------------------- HELPER: EMIT ONLINE USERS --------------------
const emitOnlineUsers = () => {
  // Send the list of all currently online user IDs to every connected socket
  const onlineUserIds = Object.keys(connectedUsers);
  io.emit("onlineUsers", onlineUserIds);
};

// -------------------- SOCKET CONNECTION --------------------
io.on("connection", (socket) => {
  // ---------------- JOIN USER ROOM --------------------
  socket.on("joinUserRoom", ({ userId, roomId }) => {
    const authUserId = socket.user?._id?.toString();
    const targetId = userId?.toString();

    // Prevent impersonation
    if (!targetId || !authUserId || targetId !== authUserId) {
      console.warn(`Socket ${socket.id} attempted to join room for ${userId}`);
      return;
    }

    // Track socket in connectedUsers
    if (!connectedUsers[targetId]) connectedUsers[targetId] = new Set();
    connectedUsers[targetId].add(socket.id);

    // Join personal room for notifications(booking ...)
    socket.join(targetId);

    // Join chat room if provided
    if (roomId) socket.join(roomId);

    // Emit updated online users to all clients
    emitOnlineUsers();
  });

  // ---------------- JOIN / LEAVE ROOMS --------------------
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("leaveAllRooms", () => {
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
  });

  // ---------------- SEND / RECEIVE MESSAGES --------------------
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

      console.log(
        "📨 sendMessage received from socket:",
        socket.id,
        "| messageId:",
        messageId,
      );
      console.log(
        "📡 Broadcasting to room:",
        roomId,
        "| EXCLUDING sender socket:",
        socket.id,
      );

      // Emit to everyone in the room
      socket.to(roomId).emit("receiveMessage", message);
    },
  );

  // ---------------- BOOKING EVENTS --------------------
  socket.on("newBooking", (bookingData) => {
    if (bookingData.providerId)
      io.to(bookingData.providerId.toString()).emit("newBooking", bookingData);
  });

  socket.on("bookingStatusUpdate", (updateData) => {
    if (updateData.customerId)
      io.to(updateData.customerId.toString()).emit(
        "bookingStatusUpdate",
        updateData,
      );
    if (updateData.providerId)
      io.to(updateData.providerId.toString()).emit(
        "bookingStatusUpdate",
        updateData,
      );
  });

  // ---------------- DISCONNECT --------------------
  // In server.js, update the disconnect handler:
  socket.on("disconnect", (reason) => {
    console.log(`  Socket ${socket.id} disconnected. Reason:`, reason);
    console.log(`   User:`, socket.user?._id?.toString() || "Unknown");

    for (const userId in connectedUsers) {
      connectedUsers[userId].delete(socket.id);
      if (connectedUsers[userId].size === 0) {
        delete connectedUsers[userId];
        console.log(`   User ${userId} now has no connections`);
      }
    }
    emitOnlineUsers();
  });
});

// -------------------- ROUTES --------------------
app.use("/api/user", userRouter);
app.use("/api/serviceprovider", serviceRouter);
app.use("/api/customer", customerRouter);
app.use("/api/mpesa", mpesaRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/support", supportRouter);
app.use("/api/landingpage", landipageDetailsRouter);

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use(errorHandler);

// -------------------- START SERVER --------------------
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Export io for other modules
export { io };
export default server;
