
const express = require('express');
const { 
  getAvailableRewards, 
  getRewardHistory, 
  redeemReward,
  createReward,
  updateReward,
  deleteReward
} = require('../controllers/rewards.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// All reward routes require authentication
router.use(authenticate);

// Citizen routes
router.get('/', getAvailableRewards);
router.get('/history', getRewardHistory);
router.post('/redeem', redeemReward);

// Admin routes
router.post('/create', authorize(['ADMIN']), createReward);
router.put('/:id', authorize(['ADMIN']), updateReward);
router.delete('/:id', authorize(['ADMIN']), deleteReward);

// Additional custom endpoints for the rewards system

// Get user points
router.get('/user-points', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ points: user.points });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({ message: 'Failed to get user points', error: error.message });
  }
});

// Get available reward categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'VOUCHER',
      'DISCOUNT',
      'MERCHANDISE',
      'DONATION',
      'EXPERIENCE'
    ];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get reward categories error:', error);
    res.status(500).json({ message: 'Failed to get reward categories', error: error.message });
  }
});

// Get top redeemed rewards
router.get('/top-redeemed', authorize(['ADMIN']), async (req, res) => {
  try {
    const topRewards = await prisma.reward.findMany({
      orderBy: {
        redemptions: {
          _count: 'desc'
        }
      },
      take: 5,
      include: {
        _count: {
          select: { redemptions: true }
        }
      }
    });
    
    res.status(200).json({ topRewards });
  } catch (error) {
    console.error('Get top redeemed rewards error:', error);
    res.status(500).json({ message: 'Failed to get top redeemed rewards', error: error.message });
  }
});

module.exports = router;
