
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();
const router = express.Router();

// Get all collection schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await prisma.collectionSchedule.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    res.status(200).json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Failed to get schedules', error: error.message });
  }
});

// Admin: Create collection schedule
router.post('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { area, dayOfWeek, startTime, endTime, wasteTypes } = req.body;
    
    const schedule = await prisma.collectionSchedule.create({
      data: {
        area,
        dayOfWeek,
        startTime,
        endTime,
        wasteTypes
      }
    });
    
    res.status(201).json({
      message: 'Collection schedule created successfully',
      schedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
});

// Admin: Update collection schedule
router.put('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const { area, dayOfWeek, startTime, endTime, wasteTypes, isActive } = req.body;
    
    const schedule = await prisma.collectionSchedule.update({
      where: { id },
      data: {
        area,
        dayOfWeek,
        startTime,
        endTime,
        wasteTypes,
        isActive
      }
    });
    
    res.status(200).json({
      message: 'Collection schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Failed to update schedule', error: error.message });
  }
});

// Admin: Delete collection schedule
router.delete('/:id', authenticate, authorize(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.collectionSchedule.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: 'Collection schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
  }
});

module.exports = router;
