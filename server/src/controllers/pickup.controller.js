const { PrismaClient } = require("@prisma/client");
const {
  uploadToCloudinary,
  analyzeWasteImage,
} = require("./cloudinary.controller");

const prisma = new PrismaClient();

// Create a new pickup request
const createPickupRequest = async (req, res) => {
  try {
    const { address, wasteType, notes } = req.body;
    const userId = req.user.id;

    let imageUrl = null;
    let wasteAnalysis = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file);
      imageUrl = uploadResult.url;

      // Analyze the waste image with AI if enabled
      try {
        wasteAnalysis = await analyzeWasteImage(imageUrl);
        console.log("Waste analysis result:", wasteAnalysis);
      } catch (analysisError) {
        console.error("Error analyzing waste image:", analysisError);
        // Continue with request creation even if analysis fails
      }
    }

    const request = await prisma.pickupRequest.create({
      data: {
        address,
        wasteType:
          wasteType || (wasteAnalysis ? wasteAnalysis.wasteType : "GENERAL"),
        notes: notes || "",
        imageUrl,
        userId,
      },
    });

    res.status(201).json({
      message: "Pickup request created successfully",
      request,
      wasteAnalysis,
    });
  } catch (error) {
    console.error("Create pickup request error:", error);
    res.status(500).json({
      message: "Failed to create pickup request",
      error: error.message,
    });
  }
};

// Get all pickup requests for admin/staff
const getAllPickupRequests = async (req, res) => {
  try {
    console.log("byeee");
    const { status } = req.query;

    const whereClause = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const requests = await prisma.pickupRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get all pickup requests error:", error);
    res.status(500).json({
      message: "Failed to get pickup requests",
      error: error.message,
    });
  }
};

// Get user's pickup requests
const getUserPickupRequests = async (req, res) => {
  try {
    console.log(req.user.role + "hiii");
    if (req.user.role == "ADMIN") {
      getAllPickupRequests(req, res);
      return;
    }

    const userId = req.user.id;

    const requests = await prisma.pickupRequest.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Get user pickup requests error:", error);
    res.status(500).json({
      message: "Failed to get pickup requests",
      error: error.message,
    });
  }
};

// Get a single pickup request by ID
const getPickupRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.pickupRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Pickup request not found" });
    }

    res.status(200).json({ request });
  } catch (error) {
    console.error("Get pickup request error:", error);
    res.status(500).json({
      message: "Failed to get pickup request",
      error: error.message,
    });
  }
};

// Update pickup request status
const updatePickupRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, notes } = req.body;

    // Build update data object
    const updateData = { status };

    // Add scheduledDate if provided
    if (scheduledDate) {
      updateData.scheduledDate = new Date(scheduledDate);
    }

    // Add notes if provided (for rejection reasons, etc.)
    if (notes) {
      updateData.notes = notes;
    }

    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: updateData,
    });

    // If request was completed, award points to the user
    if (status === "COMPLETED") {
      // Award points based on waste type
      let pointsToAdd = 10; // Default points

      // More points for recyclable and hazardous waste
      if (updatedRequest.wasteType === "RECYCLABLE") {
        pointsToAdd = 15;
      } else if (updatedRequest.wasteType === "HAZARDOUS") {
        pointsToAdd = 20;
      } else if (updatedRequest.wasteType === "ELECTRONIC") {
        pointsToAdd = 18;
      } else if (updatedRequest.wasteType === "ORGANIC") {
        pointsToAdd = 12;
      }

      // Update user points
      await prisma.user.update({
        where: { id: updatedRequest.userId },
        data: {
          points: {
            increment: pointsToAdd,
          },
        },
      });
    }

    res.status(200).json({
      message: "Pickup request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Update pickup request error:", error);
    res.status(500).json({
      message: "Failed to update pickup request",
      error: error.message,
    });
  }
};

// Cancel pickup request (citizen can cancel their own requests)
const cancelPickupRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the request first to verify ownership
    const request = await prisma.pickupRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ message: "Pickup request not found" });
    }

    // Check if user owns this request (unless they're admin/staff)
    if (
      request.userId !== userId &&
      req.user.role !== "ADMIN" &&
      req.user.role !== "STAFF"
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to cancel this request" });
    }

    // Check if request can be canceled (not already completed or rejected)
    if (request.status === "COMPLETED" || request.status === "REJECTED") {
      return res.status(400).json({
        message: `Cannot cancel a request that is already ${request.status.toLowerCase()}`,
      });
    }

    // Update the request status to REJECTED (used as canceled)
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes: request.notes
          ? `${request.notes} (Canceled by user)`
          : "Canceled by user",
      },
    });

    res.status(200).json({
      message: "Pickup request canceled successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Cancel pickup request error:", error);
    res.status(500).json({
      message: "Failed to cancel pickup request",
      error: error.message,
    });
  }
};

// Generate pickup reports
const generatePickupReports = async (req, res) => {
  try {
    const { startDate, endDate, status, wasteType } = req.body;

    const whereClause = {};

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Add status filter if provided
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    // Add waste type filter if provided
    if (wasteType && wasteType !== "ALL") {
      whereClause.wasteType = wasteType;
    }

    // Get pickup requests based on filters
    const requests = await prisma.pickupRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals and stats
    const totalRequests = requests.length;
    const completedRequests = requests.filter(
      (req) => req.status === "COMPLETED"
    ).length;
    const pendingRequests = requests.filter(
      (req) => req.status === "PENDING"
    ).length;
    const rejectedRequests = requests.filter(
      (req) => req.status === "REJECTED"
    ).length;

    // Group by waste type
    const wasteTypeCount = requests.reduce((acc, req) => {
      acc[req.wasteType] = (acc[req.wasteType] || 0) + 1;
      return acc;
    }, {});

    // Group by day
    const requestsByDay = requests.reduce((acc, req) => {
      const date = new Date(req.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      report: {
        dateRange: {
          start: startDate || "All time",
          end: endDate || "All time",
        },
        totals: {
          totalRequests,
          completedRequests,
          pendingRequests,
          rejectedRequests,
          completionRate:
            totalRequests > 0
              ? Math.round((completedRequests / totalRequests) * 100)
              : 0,
        },
        distribution: {
          byWasteType: wasteTypeCount,
          byDay: requestsByDay,
        },
        requests,
      },
    });
  } catch (error) {
    console.error("Generate pickup reports error:", error);
    res.status(500).json({
      message: "Failed to generate pickup reports",
      error: error.message,
    });
  }
};

// Analyze pickup requests for trends and insights
const analyzePickupRequests = async (req, res) => {
  try {
    const { timeFrame } = req.query; // 'week', 'month', 'year'

    let startDate;
    const endDate = new Date();

    // Set start date based on time frame
    switch (timeFrame) {
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Default to 3 months
    }

    // Get pickup requests for the period
    const requests = await prisma.pickupRequest.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Analyze trends

    // Group requests by week
    const requestsByWeek = {};
    for (const request of requests) {
      const date = new Date(request.createdAt);
      const weekNumber = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${weekNumber}`;

      if (!requestsByWeek[weekKey]) {
        requestsByWeek[weekKey] = {
          count: 0,
          byWasteType: {},
          byStatus: {},
        };
      }

      requestsByWeek[weekKey].count++;
      requestsByWeek[weekKey].byWasteType[request.wasteType] =
        (requestsByWeek[weekKey].byWasteType[request.wasteType] || 0) + 1;
      requestsByWeek[weekKey].byStatus[request.status] =
        (requestsByWeek[weekKey].byStatus[request.status] || 0) + 1;
    }

    // Find common areas with high pickup volume
    const requestsByAddress = {};
    for (const request of requests) {
      const addressParts = request.address.split(",");
      const neighborhood =
        addressParts.length > 1
          ? addressParts[1].trim()
          : addressParts[0].trim();

      requestsByAddress[neighborhood] =
        (requestsByAddress[neighborhood] || 0) + 1;
    }

    // Sort areas by request count
    const hotspotAreas = Object.entries(requestsByAddress)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));

    // Most common waste types
    const wasteTypeCounts = {};
    for (const request of requests) {
      wasteTypeCounts[request.wasteType] =
        (wasteTypeCounts[request.wasteType] || 0) + 1;
    }

    const mostCommonWasteTypes = Object.entries(wasteTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / requests.length) * 100),
      }));

    res.status(200).json({
      analysis: {
        timeFrame,
        totalRequests: requests.length,
        averageRequestsPerWeek:
          requests.length / Object.keys(requestsByWeek).length,
        trendsOverTime: Object.entries(requestsByWeek).map(([week, data]) => ({
          week,
          count: data.count,
          byWasteType: data.byWasteType,
          byStatus: data.byStatus,
        })),
        hotspotAreas,
        mostCommonWasteTypes,
        completionRate: Math.round(
          (requests.filter((r) => r.status === "COMPLETED").length /
            requests.length) *
            100
        ),
      },
    });
  } catch (error) {
    console.error("Analyze pickup requests error:", error);
    res.status(500).json({
      message: "Failed to analyze pickup requests",
      error: error.message,
    });
  }
};

// Helper function to get week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

module.exports = {
  createPickupRequest,
  getAllPickupRequests,
  getUserPickupRequests,
  getPickupRequestById,
  updatePickupRequestStatus,
  cancelPickupRequest,
  generatePickupReports,
  analyzePickupRequests,
};
