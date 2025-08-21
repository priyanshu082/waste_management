
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createNotification } = require('../controllers/notification.controller');

const prisma = new PrismaClient();
const router = express.Router();

// Get all bin statuses (admin/staff only)
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const bins = await prisma.binStatus.findMany({
      orderBy: {
        lastUpdated: 'desc'
      }
    });
    res.status(200).json({ bins });
  } catch (error) {
    console.error('Get bin statuses error:', error);
    res.status(500).json({ message: 'Failed to get bin statuses', error: error.message });
  }
});

// Get bin status counts for dashboard
router.get('/counts', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const binCounts = {
      total: await prisma.binStatus.count(),
      full: await prisma.binStatus.count({
        where: { status: 'FULL' }
      }),
      maintenance: await prisma.binStatus.count({
        where: { status: 'MAINTENANCE' }
      }),
      offline: await prisma.binStatus.count({
        where: { status: 'OFFLINE' }
      }),
      normal: await prisma.binStatus.count({
        where: { status: 'NORMAL' }
      })
    };
    
    res.status(200).json({ binCounts });
  } catch (error) {
    console.error('Get bin counts error:', error);
    res.status(500).json({ message: 'Failed to get bin counts', error: error.message });
  }
});

// Get bin alerts (bins that are full or need maintenance)
router.get('/alerts', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const alerts = await prisma.binStatus.findMany({
      where: {
        OR: [
          { status: 'FULL' },
          { status: 'MAINTENANCE' },
          { status: 'OFFLINE' }
        ]
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });
    
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Get bin alerts error:', error);
    res.status(500).json({ message: 'Failed to get bin alerts', error: error.message });
  }
});

// Update bin status (simulating IoT update)
router.post('/update', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { binId, fullnessLevel, status } = req.body;
    
    const updatedBin = await prisma.binStatus.update({
      where: { binId },
      data: {
        fullnessLevel,
        status,
        lastUpdated: new Date()
      }
    });
    
    // If bin is full, create a notification for admins
    if (status === 'FULL' || status === 'MAINTENANCE') {
      // Find all admin and staff users
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'STAFF']
          }
        }
      });
      
      // Create notifications for each admin/staff
      const notificationType = status === 'FULL' ? 'WARNING' : 'ERROR';
      const notificationTitle = status === 'FULL' ? 'Bin Full Alert' : 'Bin Maintenance Required';
      const message = `Bin ${binId} at ${updatedBin.location} is ${status.toLowerCase()}. Please take action.`;
      
      for (const user of adminUsers) {
        await createNotification(
          user.id,
          notificationTitle,
          message,
          notificationType
        );
      }
    }
    
    res.status(200).json({
      message: 'Bin status updated successfully',
      bin: updatedBin
    });
  } catch (error) {
    console.error('Update bin status error:', error);
    res.status(500).json({ message: 'Failed to update bin status', error: error.message });
  }
});

// For demonstration: Simulate random bin updates (would be IoT in real app)
router.post('/simulate-update', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const bins = await prisma.binStatus.findMany();
    
    const updatedBins = await Promise.all(
      bins.map(async (bin) => {
        // Random change in fullness level (-5 to +15)
        let newFullnessLevel = bin.fullnessLevel + Math.floor(Math.random() * 20) - 5;
        
        // Keep within 0-100 range
        newFullnessLevel = Math.max(0, Math.min(100, newFullnessLevel));
        
        // Determine status based on fullness
        let newStatus = 'NORMAL';
        if (newFullnessLevel > 85) {
          newStatus = 'FULL';
        } else if (Math.random() < 0.05) { // 5% chance of maintenance
          newStatus = 'MAINTENANCE';
        } else if (Math.random() < 0.02) { // 2% chance of being offline
          newStatus = 'OFFLINE';
        }
        
        // Only create notification if status changed to an alert state
        if ((newStatus === 'FULL' || newStatus === 'MAINTENANCE' || newStatus === 'OFFLINE') && bin.status !== newStatus) {
          // Find all admin and staff users
          const adminUsers = await prisma.user.findMany({
            where: {
              role: {
                in: ['ADMIN', 'STAFF']
              }
            }
          });
          
          // Create notifications for each admin/staff
          const notificationType = newStatus === 'FULL' ? 'WARNING' : 'ERROR';
          const notificationTitle = `Bin ${newStatus.toLowerCase()} Alert`;
          const message = `Bin ${bin.binId} at ${bin.location} is now ${newStatus.toLowerCase()}. Please take action.`;
          
          for (const user of adminUsers) {
            await createNotification(
              user.id,
              notificationTitle,
              message,
              notificationType
            );
          }
        }
        
        return prisma.binStatus.update({
          where: { id: bin.id },
          data: {
            fullnessLevel: newFullnessLevel,
            status: newStatus,
            lastUpdated: new Date()
          }
        });
      })
    );
    
    res.status(200).json({
      message: 'Bin statuses simulated successfully',
      updatedCount: updatedBins.length
    });
  } catch (error) {
    console.error('Simulate bin updates error:', error);
    res.status(500).json({ message: 'Failed to simulate bin updates', error: error.message });
  }
});

module.exports = router;
