
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import helmet from "helmet";

// Routes
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import rateLimit from "express-rate-limit";
const app = express();
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use("/api", apiLimiter);
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
// Prevent browser caching of API responses
app.use("/api", (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "origin: process.env.CLIENT_URL,",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available in controllers
app.set("io", io);

// Authenticate Socket.IO connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = decoded.userId;

    next();

  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

// Handle authenticated connections
io.on("connection", (socket) => {

  console.log("User connected:", socket.userId);

  // Join private user room
  socket.join(`user:${socket.userId}`);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });

});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", memberRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
// Health check
app.get("/", (req, res) => {
  res.send("WorkSphere API is running");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
