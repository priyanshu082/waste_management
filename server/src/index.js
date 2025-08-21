const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const pickupRoutes = require("./routes/pickup.routes");
const recyclingRoutes = require("./routes/recycling.routes");
const binStatusRoutes = require("./routes/binStatus.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const rewardsRoutes = require("./routes/rewards.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize PrismaClient with connection pooling
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pickup-requests", pickupRoutes);
app.use("/api/recycling-centers", recyclingRoutes);
app.use("/api/bin-status", binStatusRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/rewards", rewardsRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Handle Prisma connection errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
  // Close Prisma connections on errors
  prisma.$disconnect();
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
