const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Get system settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = {
      siteName: "Smart Waste Management",
      maintenanceMode: false,
      notificationsEnabled: true,
      pointsPerRecyclable: 10,
      pointsPerOrganic: 5,
      version: "1.0.0",
    };

    res.status(200).json({ settings });
  } catch (error) {
    console.error("Get system settings error:", error);
    res
      .status(500)
      .json({ message: "Failed to get system settings", error: error.message });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    const {
      siteName,
      maintenanceMode,
      notificationsEnabled,
      pointsPerRecyclable,
      pointsPerOrganic,
    } = req.body;

    const settings = {
      siteName: siteName || "Smart Waste Management",
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : false,
      notificationsEnabled:
        notificationsEnabled !== undefined ? notificationsEnabled : true,
      pointsPerRecyclable: pointsPerRecyclable || 10,
      pointsPerOrganic: pointsPerOrganic || 5,
      version: "1.0.0",
    };

    res.status(200).json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update system settings error:", error);
    res.status(500).json({
      message: "Failed to update system settings",
      error: error.message,
    });
  }
};

// Generate system reports
const generateReports = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    const start = new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());

    let reportData = {};

    switch (reportType) {
      case "userActivity":
        reportData = await generateUserActivityReport(start, end);
        break;
      case "wasteCollection":
        reportData = await generateWasteCollectionReport(start, end);
        break;
      case "binStatus":
        reportData = await generateBinStatusReport();
        break;
      case "rewards":
        reportData = await generateRewardsReport(start, end);
        break;
      default:
        reportData = {
          userActivity: await generateUserActivityReport(start, end),
          wasteCollection: await generateWasteCollectionReport(start, end),
          binStatus: await generateBinStatusReport(),
          rewards: await generateRewardsReport(start, end),
        };
    }

    res.status(200).json({
      message: "Report generated successfully",
      reportType: reportType || "comprehensive",
      timeframe: {
        start,
        end,
      },
      data: reportData,
    });
  } catch (error) {
    console.error("Generate reports error:", error);
    res
      .status(500)
      .json({ message: "Failed to generate reports", error: error.message });
  } finally {
    await prisma.$disconnect();
  }
};

// Helper function for user activity report
async function generateUserActivityReport(start, end) {
  try {
    const [newUsers, activeUsers, totalUsers, topUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.user.count({
        where: {
          pickupRequests: {
            some: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.user.findMany({
        where: {
          role: "CITIZEN",
        },
        orderBy: {
          points: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          points: true,
          _count: {
            select: {
              pickupRequests: true,
            },
          },
        },
      }),
    ]);

    return {
      newUsers,
      activeUsers,
      totalUsers,
      topUsers,
      activityRate: totalUsers
        ? ((activeUsers / totalUsers) * 100).toFixed(2)
        : 0,
    };
  } catch (error) {
    console.error("Error in generateUserActivityReport:", error);
    return {
      newUsers: 0,
      activeUsers: 0,
      totalUsers: 0,
      topUsers: [],
      activityRate: 0,
      error: error.message,
    };
  }
}

// Helper function for waste collection report
async function generateWasteCollectionReport(start, end) {
  try {
    const totalRequests = await prisma.pickupRequest.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const [pending, approved, scheduled, completed, rejected] =
      await Promise.all([
        prisma.pickupRequest.count({
          where: {
            status: "PENDING",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            status: "APPROVED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            status: "SCHEDULED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            status: "REJECTED",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
      ]);

    const [general, recyclable, organic, hazardous, electronic, construction] =
      await Promise.all([
        prisma.pickupRequest.count({
          where: {
            wasteType: "GENERAL",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            wasteType: "RECYCLABLE",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            wasteType: "ORGANIC",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            wasteType: "HAZARDOUS",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            wasteType: "ELECTRONIC",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.pickupRequest.count({
          where: {
            wasteType: "CONSTRUCTION",
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
      ]);

    const currentDate = new Date(start);
    const dailyBreakdown = [];
    const daysInRange = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (daysInRange > 30) {
      return {
        totalRequests,
        statusBreakdown: {
          pending,
          approved,
          scheduled,
          completed,
          rejected,
        },
        wasteTypeBreakdown: {
          general,
          recyclable,
          organic,
          hazardous,
          electronic,
          construction,
        },
        dailyBreakdown: [
          {
            date: start.toISOString().split("T")[0],
            count: totalRequests,
          },
        ],
        note: "Daily breakdown simplified due to date range exceeding 30 days",
      };
    }

    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.pickupRequest.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      dailyBreakdown.push({
        date: currentDate.toISOString().split("T")[0],
        count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalRequests,
      statusBreakdown: {
        pending,
        approved,
        scheduled,
        completed,
        rejected,
      },
      wasteTypeBreakdown: {
        general,
        recyclable,
        organic,
        hazardous,
        electronic,
        construction,
      },
      dailyBreakdown,
    };
  } catch (error) {
    console.error("Error in generateWasteCollectionReport:", error);
    return {
      totalRequests: 0,
      statusBreakdown: {
        pending: 0,
        approved: 0,
        scheduled: 0,
        completed: 0,
        rejected: 0,
      },
      wasteTypeBreakdown: {
        general: 0,
        recyclable: 0,
        organic: 0,
        hazardous: 0,
        electronic: 0,
        construction: 0,
      },
      dailyBreakdown: [],
      error: error.message,
    };
  }
}

// Helper function for bin status report
async function generateBinStatusReport() {
  try {
    const bins = await prisma.binStatus.findMany();

    const statusCounts = {
      normal: 0,
      full: 0,
      maintenance: 0,
      offline: 0,
    };

    let totalFullnessLevel = 0;

    bins.forEach((bin) => {
      totalFullnessLevel += bin.fullnessLevel;

      switch (bin.status) {
        case "NORMAL":
          statusCounts.normal++;
          break;
        case "FULL":
          statusCounts.full++;
          break;
        case "MAINTENANCE":
          statusCounts.maintenance++;
          break;
        case "OFFLINE":
          statusCounts.offline++;
          break;
      }
    });

    const alertRate = bins.length
      ? (
          ((statusCounts.full +
            statusCounts.maintenance +
            statusCounts.offline) /
            bins.length) *
          100
        ).toFixed(2)
      : 0;

    const averageFullness = bins.length
      ? (totalFullnessLevel / bins.length).toFixed(2)
      : 0;

    return {
      totalBins: bins.length,
      statusCounts,
      alertRate,
      averageFullness,
      criticalBins: bins
        .filter((bin) => bin.status !== "NORMAL")
        .sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1))
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Error in generateBinStatusReport:", error);
    return {
      totalBins: 0,
      statusCounts: {
        normal: 0,
        full: 0,
        maintenance: 0,
        offline: 0,
      },
      alertRate: 0,
      averageFullness: 0,
      criticalBins: [],
      error: error.message,
    };
  }
}

// Helper function for rewards report
async function generateRewardsReport(start, end) {
  try {
    const totalRedemptions = await prisma.rewardRedemption.count({
      where: {
        redeemedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const popularRewards = await prisma.rewardRedemption.groupBy({
      by: ["rewardId"],
      where: {
        redeemedAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        rewardId: true,
      },
      orderBy: {
        _count: {
          rewardId: "desc",
        },
      },
      take: 5,
    });

    const rewardIds = popularRewards.map((item) => item.rewardId);
    const rewards = await prisma.reward.findMany({
      where: {
        id: {
          in: rewardIds,
        },
      },
    });

    const popularRewardsDetailed = popularRewards.map((item) => {
      const reward = rewards.find((r) => r.id === item.rewardId);
      return {
        rewardId: item.rewardId,
        rewardName: reward?.name || "Unknown",
        pointsCost: reward?.pointsCost || 0,
        redemptionCount: item._count.rewardId,
      };
    });

    const totalPointsSpent = await prisma.rewardRedemption.aggregate({
      where: {
        redeemedAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        pointsCost: true,
      },
    });

    return {
      totalRedemptions,
      popularRewards: popularRewardsDetailed,
      totalPointsSpent: totalPointsSpent._sum.pointsCost || 0,
      averagePointsPerRedemption:
        totalRedemptions > 0
          ? (totalPointsSpent._sum.pointsCost || 0) / totalRedemptions
          : 0,
    };
  } catch (error) {
    console.error("Error in generateRewardsReport:", error);
    return {
      totalRedemptions: 0,
      popularRewards: [],
      totalPointsSpent: 0,
      averagePointsPerRedemption: 0,
      error: error.message,
    };
  }
}

// Reset database (for testing/development only)
const resetDatabase = async (req, res) => {
  try {
    res.status(403).json({ message: "Operation not allowed in production" });
  } catch (error) {
    console.error("Reset database error:", error);
    res
      .status(500)
      .json({ message: "Failed to reset database", error: error.message });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  generateReports,
  resetDatabase,
};
