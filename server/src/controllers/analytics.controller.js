
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get analytics data
const getAnalyticsData = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    
    // In a real implementation, this would query the database for real analytics data
    // For now, we'll return mock data for demonstration purposes
    
    // Mock analytics data
    const analyticsData = {
      wasteSummary: {
        byType: [
          { wasteType: 'GENERAL', count: 120 },
          { wasteType: 'RECYCLABLE', count: 95 },
          { wasteType: 'ORGANIC', count: 75 },
          { wasteType: 'HAZARDOUS', count: 25 },
          { wasteType: 'ELECTRONIC', count: 35 },
          { wasteType: 'CONSTRUCTION', count: 20 }
        ],
        byStatus: [
          { status: 'PENDING', count: 45 },
          { status: 'APPROVED', count: 30 },
          { status: 'SCHEDULED', count: 35 },
          { status: 'COMPLETED', count: 230 },
          { status: 'REJECTED', count: 30 }
        ],
        total: 370,
        pending: 45,
        completed: 230,
        rejected: 30
      },
      binSummary: {
        total: 50,
        fullPercentage: 12,
        maintenancePercentage: 6,
        averageFullness: 64,
        byStatus: [
          { status: 'NORMAL', count: 38 },
          { status: 'FULL', count: 6 },
          { status: 'MAINTENANCE', count: 3 },
          { status: 'OFFLINE', count: 3 }
        ]
      },
      userSummary: {
        total: 1250,
        admins: 5,
        staff: 25,
        citizens: 1220,
        newLastMonth: 78,
        averagePoints: 124
      },
      weeklyActivity: [
        { date: 'Mon', pickups: 12, recycled: 8 },
        { date: 'Tue', pickups: 19, recycled: 14 },
        { date: 'Wed', pickups: 15, recycled: 11 },
        { date: 'Thu', pickups: 18, recycled: 12 },
        { date: 'Fri', pickups: 22, recycled: 15 },
        { date: 'Sat', pickups: 14, recycled: 10 },
        { date: 'Sun', pickups: 9, recycled: 6 }
      ],
      wasteByArea: [
        { area: 'Downtown', general: 42, recyclable: 35, organic: 28, hazardous: 12 },
        { area: 'Uptown', general: 35, recyclable: 40, organic: 30, hazardous: 5 },
        { area: 'Westside', general: 28, recyclable: 25, organic: 20, hazardous: 8 },
        { area: 'Eastside', general: 30, recyclable: 30, organic: 32, hazardous: 10 },
        { area: 'Northside', general: 25, recyclable: 32, organic: 18, hazardous: 6 }
      ]
    };
    
    // Modify data based on time range
    let modifiedData = { ...analyticsData };
    
    if (timeRange === 'week') {
      // Reduce numbers for weekly view
      modifiedData.wasteSummary.total = Math.round(analyticsData.wasteSummary.total / 4);
      modifiedData.wasteSummary.pending = Math.round(analyticsData.wasteSummary.pending / 4);
      modifiedData.wasteSummary.completed = Math.round(analyticsData.wasteSummary.completed / 4);
      modifiedData.wasteSummary.rejected = Math.round(analyticsData.wasteSummary.rejected / 4);
      modifiedData.wasteSummary.byType = analyticsData.wasteSummary.byType.map(item => ({
        ...item,
        count: Math.round(item.count / 4)
      }));
      modifiedData.wasteSummary.byStatus = analyticsData.wasteSummary.byStatus.map(item => ({
        ...item,
        count: Math.round(item.count / 4)
      }));
      modifiedData.userSummary.newLastMonth = Math.round(analyticsData.userSummary.newLastMonth / 4);
    } else if (timeRange === 'year') {
      // Increase numbers for yearly view
      modifiedData.wasteSummary.total = analyticsData.wasteSummary.total * 12;
      modifiedData.wasteSummary.pending = analyticsData.wasteSummary.pending * 12;
      modifiedData.wasteSummary.completed = analyticsData.wasteSummary.completed * 12;
      modifiedData.wasteSummary.rejected = analyticsData.wasteSummary.rejected * 12;
      modifiedData.wasteSummary.byType = analyticsData.wasteSummary.byType.map(item => ({
        ...item,
        count: item.count * 12
      }));
      modifiedData.wasteSummary.byStatus = analyticsData.wasteSummary.byStatus.map(item => ({
        ...item,
        count: item.count * 12
      }));
      modifiedData.userSummary.newLastMonth = analyticsData.userSummary.newLastMonth * 12;
    }
    
    res.status(200).json(modifiedData);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to get analytics data', 
      error: error.message 
    });
  }
};

module.exports = {
  getAnalyticsData
};
