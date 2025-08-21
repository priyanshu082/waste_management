const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const prisma = new PrismaClient();
const router = express.Router();

// Admin: Get all users
router.get("/", authenticate, authorize(["ADMIN"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        address: true,
        phoneNumber: true, // Changed from 'phone' to match schema
        preferredPickupTime: true, // Added to match schema
        profileImageUrl: true, // Added to match schema
        _count: {
          select: {
            pickupRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res
      .status(500)
      .json({ message: "Failed to get users", error: error.message });
    await prisma.$disconnect(); // Ensure connection is closed on error
  } finally {
    // Ensure connection is closed
    await prisma.$disconnect();
  }
});

// Admin: Update user role
router.patch(
  "/:id/role",
  authenticate,
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      res.status(200).json({
        message: "User role updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res
        .status(500)
        .json({ message: "Failed to update user role", error: error.message });
      await prisma.$disconnect(); // Ensure connection is closed on error
    } finally {
      // Ensure connection is closed
      await prisma.$disconnect();
    }
  }
);

// Admin: Adjust user points
router.patch(
  "/:id/points",
  authenticate,
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { points, operation } = req.body;

      let updateData = {};

      if (operation === "add") {
        updateData = {
          points: {
            increment: points,
          },
        };
      } else if (operation === "subtract") {
        updateData = {
          points: {
            decrement: points,
          },
        };
      } else {
        updateData = { points };
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          points: true,
        },
      });

      res.status(200).json({
        message: "User points updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update user points error:", error);
      res
        .status(500)
        .json({
          message: "Failed to update user points",
          error: error.message,
        });
      await prisma.$disconnect(); // Ensure connection is closed on error
    } finally {
      // Ensure connection is closed
      await prisma.$disconnect();
    }
  }
);

// Get user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        address: true,
        phoneNumber: true, // Changed from 'phone' to match schema
        preferredPickupTime: true, // Added to match schema
        profileImageUrl: true, // Added to match schema
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get user profile error:", error);
    res
      .status(500)
      .json({ message: "Failed to get user profile", error: error.message });
    await prisma.$disconnect(); // Ensure connection is closed on error
  } finally {
    // Ensure connection is closed
    await prisma.$disconnect();
  }
});

// Update user profile
router.patch("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      address,
      phoneNumber,
      preferredPickupTime,
      profileImageUrl,
    } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        address,
        phoneNumber, // Changed from 'phone' to match schema
        preferredPickupTime, // Added to match schema
        profileImageUrl, // Added to match schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        address: true,
        phoneNumber: true,
        preferredPickupTime: true,
        profileImageUrl: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
    await prisma.$disconnect(); // Ensure connection is closed on error
  } finally {
    // Ensure connection is closed
    await prisma.$disconnect();
  }
});

module.exports = router;
