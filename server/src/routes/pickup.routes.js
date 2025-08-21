const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  createPickupRequest,
  getAllPickupRequests,
  getUserPickupRequests,
  getPickupRequestById,
  updatePickupRequestStatus,
  cancelPickupRequest,
  generatePickupReports,
  analyzePickupRequests,
} = require("../controllers/pickup.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
});

// Create upload directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/");
}

// Protected routes
router.post("/", authenticate, upload.single("image"), createPickupRequest);

router.get("/", authenticate, getUserPickupRequests);

router.get("/:id", authenticate, getPickupRequestById);
router.delete("/:id", authenticate, cancelPickupRequest); // Allow users to cancel their own requests

// Admin/Staff routes
router.get(
  "/",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  getAllPickupRequests
);
router.patch(
  "/:id/status",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  updatePickupRequestStatus
);
router.post(
  "/reports",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  generatePickupReports
);
router.get(
  "/analytics/trends",
  authenticate,
  authorize(["ADMIN", "STAFF"]),
  analyzePickupRequests
);

module.exports = router;
