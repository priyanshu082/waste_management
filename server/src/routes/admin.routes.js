const express = require("express");
const {
  getSystemSettings,
  updateSystemSettings,
  generateReports,
  resetDatabase,
} = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// All admin routes require admin authentication
router.use(authenticate, authorize(["ADMIN"]));

// System settings
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);

// Reports
router.post("/reports", generateReports);

// Database management
router.post("/reset-database", resetDatabase);

// Simulate updates - new endpoint
router.post("/simulate-updates", async (req, res) => {
  try {
    const { updateType } = req.body;

    switch (updateType) {
      case "bin-status":
        // Simulate bin status updates
        const bins = await prisma.binStatus.findMany({ take: 5 });
        const statuses = ["NORMAL", "FULL", "MAINTENANCE", "OFFLINE"];
        const fillLevels = [25, 50, 75, 95, 100];

        for (const bin of bins) {
          await prisma.binStatus.update({
            where: { id: bin.id },
            data: {
              status: statuses[Math.floor(Math.random() * statuses.length)],
              fillLevel:
                fillLevels[Math.floor(Math.random() * fillLevels.length)],
              lastUpdated: new Date(),
            },
          });
        }
        break;

      case "pickup-requests":
        // Create some random pickup requests
        const users = await prisma.user.findMany({
          where: { role: "CITIZEN" },
          take: 3,
        });

        if (users.length > 0) {
          const wasteTypes = [
            "GENERAL",
            "RECYCLABLE",
            "ORGANIC",
            "HAZARDOUS",
            "ELECTRONIC",
          ];

          for (const user of users) {
            await prisma.pickupRequest.create({
              data: {
                userId: user.id,
                address: "123 Simulated St, Aligarh",
                wasteType:
                  wasteTypes[Math.floor(Math.random() * wasteTypes.length)],
                wasteDescription: "Simulated waste pickup",
                quantity: Math.floor(Math.random() * 10) + 1,
                status: "PENDING",
                preferredDate: new Date(Date.now() + 86400000), // Tomorrow
                createdAt: new Date(),
              },
            });
          }
        }
        break;

      case "user-activity":
        // Update last login for some users
        await prisma.user.updateMany({
          where: {
            role: "CITIZEN",
          },
          data: {
            lastLogin: new Date(),
          },
          take: 5,
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid update type" });
    }

    res.status(200).json({
      success: true,
      message: `Simulated ${updateType} updates successfully`,
    });
  } catch (error) {
    console.error("Simulate updates error:", error);
    res.status(500).json({
      message: "Failed to simulate updates",
      error: error.message,
    });
  }
});

// Schedule collection - new endpoint
router.post("/schedule-collection", async (req, res) => {
  try {
    const { date, area, notes, binIds } = req.body;

    if (!date || !area) {
      return res.status(400).json({ message: "Date and area are required" });
    }

    const newSchedule = await prisma.collectionSchedule.create({
      data: {
        scheduledDate: new Date(date),
        area,
        notes: notes || "",
        status: "SCHEDULED",
        createdAt: new Date(),
      },
    });

    // If bin IDs provided, associate them with the schedule
    if (binIds && binIds.length > 0) {
      for (const binId of binIds) {
        await prisma.binStatus.update({
          where: { id: binId },
          data: {
            nextCollection: new Date(date),
            lastUpdated: new Date(),
          },
        });
      }
    }

    res.status(201).json({
      message: "Collection scheduled successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error("Schedule collection error:", error);
    res.status(500).json({
      message: "Failed to schedule collection",
      error: error.message,
    });
  }
});

// Delete schedule - new endpoint
router.delete("/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const schedule = await prisma.collectionSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Delete the schedule
    await prisma.collectionSchedule.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({
      message: "Failed to delete schedule",
      error: error.message,
    });
  }
});

module.exports = router;
