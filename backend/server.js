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
import adminRouter from "./routes/adminRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import supportRouter from "./routes/supportRoutes.js";

// -------------------- EXPRESS + HTTP --------------------
const app = express();
const server = http.createServer(app); // needed for Socket.IO
const port = process.env.PORT || 4000;



// -------------------- MIDDLEWARE --------------------
connectCloudinary();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://admin-lss.vercel.app",
  "https://local-service-system.vercel.app",
  "https://local-service-system.onrender.com"
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

// -------------------- SOCKET.IO --------------------
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// Track online users (userId -> Set of socketIds)
export const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // ---------------- JOIN USER ROOM (COMBINED FOR CHAT & NOTIFICATIONS) ----------------
  socket.on("joinUserRoom", ({ userId, userName, userRole, roomProvider, serviceName, roomId }) => {
    if (!userId) return;

    if (!connectedUsers[userId]) connectedUsers[userId] = new Set();
    connectedUsers[userId].add(socket.id);

    // Join user's personal room for notifications (using userId)
    socket.join(userId);
    
    // Also join chat room if provided
    if (roomId) {
      socket.join(roomId);
      console.log(
        `${userRole} ${userName} (${userId}) joined room "${serviceName}" by ${roomProvider}. RoomID: ${roomId}`
      );
    }

    console.log(`🔔 ${userRole} ${userName} (${userId}) joined notification room`);

    io.emit("onlineUsers", Object.keys(connectedUsers));
  });

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

  // ---------------- BOOKING EVENTS ----------------
  socket.on("newBooking", (bookingData) => {
    // Emit to the specific service provider
    if (bookingData.providerId) {
      io.to(bookingData.providerId.toString()).emit("newBooking", bookingData);
    } 
  });

  socket.on("bookingStatusUpdate", (updateData) => {
    // Emit to both customer and provider
    if (updateData.customerId) {
      io.to(updateData.customerId.toString()).emit("bookingStatusUpdate", updateData);
    }
    if (updateData.providerId) {
      io.to(updateData.providerId.toString()).emit("bookingStatusUpdate", updateData);
    }
  });

  // ---------------- DISCONNECT ----------------
  socket.on("disconnect", () => {
    for (const userId in connectedUsers) {
      connectedUsers[userId].delete(socket.id);
      if (connectedUsers[userId].size === 0) delete connectedUsers[userId];
    }
    io.emit("onlineUsers", Object.keys(connectedUsers));
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




// -------------------- EXPORT IO FOR USE IN OTHER FILES --------------------
export { io };

// -------------------- START SERVER LOCALLY --------------------
server.listen(port, () => console.log(`Server started on PORT: ${port}`));


// -------------------- EXPORT FOR VERCEL --------------------
export default server;