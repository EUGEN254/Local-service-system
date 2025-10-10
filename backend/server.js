import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDb from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import serviceRouter from "./routes/serviceProviderRoute.js";
import customerRouter from "./routes/customeRoutes.js";
import mpesaRouter from "./routes/mpesaRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import { Server as IOServer } from "socket.io";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://local-service-system.vercel.app",
];

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Test endpoint
app.use("/api/status", (req, res) => res.send("😁 SERVER IS LIVE"));

// Routes
app.use("/api/user", userRouter);
app.use("/api/serviceprovider", serviceRouter);
app.use("/api/customer", customerRouter);
app.use("/api/mpesa", mpesaRouter);
app.use("/api/chat", chatRouter);

// Connect to Cloudinary & MongoDB
await connectCloudinary();
await connectDb();

// ---------------- SOCKET.IO ----------------
// Store connected users
global.connectedUsers = {};

// Local development: start server normally
if (process.env.NODE_ENV !== "production") {
  const http = (await import("http")).default;
  const server = http.createServer(app);
  global.io = new IOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  global.io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("joinUserRoom", ({ userId, roomId }) => {
      if (!userId) return;
      if (!global.connectedUsers[userId]) global.connectedUsers[userId] = new Set();
      global.connectedUsers[userId].add(socket.id);
      socket.join(roomId);
      global.io.emit("onlineUsers", Object.keys(global.connectedUsers));
    });

    socket.on("disconnect", () => {
      for (const userId in global.connectedUsers) {
        global.connectedUsers[userId].delete(socket.id);
        if (global.connectedUsers[userId].size === 0) delete global.connectedUsers[userId];
      }
      global.io.emit("onlineUsers", Object.keys(global.connectedUsers));
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// ---------------- Vercel serverless handler ----------------
export default async function handler(req, res) {
  // Upgrade WebSocket requests
  if (req.headers.upgrade?.toLowerCase() === "websocket") {
    if (!global.io) {
      global.io = new IOServer(res.socket.server, {
        cors: {
          origin: allowedOrigins,
          credentials: true,
        },
      });

      global.io.on("connection", (socket) => {
        console.log("🟢 Socket connected (serverless):", socket.id);

        socket.on("joinUserRoom", ({ userId, roomId }) => {
          if (!userId) return;
          if (!global.connectedUsers[userId]) global.connectedUsers[userId] = new Set();
          global.connectedUsers[userId].add(socket.id);
          socket.join(roomId);
          global.io.emit("onlineUsers", Object.keys(global.connectedUsers));
        });

        socket.on("disconnect", () => {
          for (const userId in global.connectedUsers) {
            global.connectedUsers[userId].delete(socket.id);
            if (global.connectedUsers[userId].size === 0) delete global.connectedUsers[userId];
          }
          global.io.emit("onlineUsers", Object.keys(global.connectedUsers));
          console.log("🔴 Socket disconnected (serverless):", socket.id);
        });
      });
    }
    res.end();
  } else {
    return app(req, res);
  }
}
