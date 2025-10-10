// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import cookieParser from 'cookie-parser';
import connectDb from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import serviceRouter from './routes/serviceProviderRoute.js';
import customerRouter from './routes/customeRoutes.js';
import mpesaRouter from './routes/mpesaRoutes.js';
import { Server } from 'socket.io';
import chatRouter from './routes/chatRoutes.js';
import Chat from './models/Chat.js';



const app = express();
const server = http.createServer(app); // HTTP server needed for Socket.IO
const port = process.env.PORT || 4000;

// Connect to Cloudinary
connectCloudinary();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://local-service-system.vercel.app',
];

// Middleware
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Test endpoint
app.use('/api/status', (req, res) =>
  res.send('😁😁 SERVER IS LIVE fine Programmer Eugen')
);

// Connect to MongoDB
await connectDb();

// ---------------- SOCKET.IO SETUP ----------------
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Track online users
// Structure: { userId: Set of socketIds }
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  // ---------------- JOIN USER ROOM ----------------
  socket.on("joinUserRoom", ({ userId, userName, userRole, roomProvider, serviceName, roomId }) => {
    if (!userId) return;

    // Track multiple sockets per user
    if (!connectedUsers[userId]) connectedUsers[userId] = new Set();
    connectedUsers[userId].add(socket.id);

    // Join the specific room
    socket.join(roomId);

    console.log(
      `${userRole} ${userName} (${userId}) joined their room for service "${serviceName}" offered by ${roomProvider}. RoomID: ${roomId}`
    );

    // Broadcast online users to everyone
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
  socket.on("sendMessage", async ({ messageId, sender, receiver, text, roomId, createdAt }) => {
    const message = { messageId, sender, receiver, text, roomId, createdAt: createdAt || new Date() };

    // Emit to everyone in room
    io.to(roomId).emit("receiveMessage", message);

    try {
      let chat = await Chat.findOne({ participants: { $all: [sender, receiver] } });
      if (!chat) chat = new Chat({ participants: [sender, receiver], messages: [] });

      // Prevent duplicates by checking messageId
      const exists = chat.messages.find((m) => m.messageId === messageId);
      if (!exists) {
        chat.messages.push({ messageId, sender, text, createdAt });
        await chat.save();
        console.log("💾 Message saved to DB:", messageId);
      } else {
        console.log("⚠️ Duplicate message ignored:", messageId);
      }
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  // ---------------- HANDLE DISCONNECT ----------------
  socket.on("disconnect", () => {
    // Remove socket from all users
    for (const userId in connectedUsers) {
      connectedUsers[userId].delete(socket.id);
      if (connectedUsers[userId].size === 0) {
        delete connectedUsers[userId];
      }
    }

    console.log("🔴 Socket disconnected:", socket.id);

    // Broadcast updated online users
    io.emit("onlineUsers", Object.keys(connectedUsers));
  });
});


// ---------------- END SOCKET.IO ----------------

// Routes
app.use('/api/user', userRouter);
app.use('/api/serviceprovider', serviceRouter);
app.use('/api/customer', customerRouter);
app.use('/api/mpesa', mpesaRouter);
app.use('/api/chat', chatRouter);

// Start server
server.listen(port, () => console.log(`Server started on PORT: ${port}`));
