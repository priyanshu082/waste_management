
const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('./notification.controller');

const prisma = new PrismaClient();

// Get all available rewards
const getAvailableRewards = async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        pointsCost: 'asc'
      }
    });
    
    res.status(200).json({ rewards });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ 
      message: 'Failed to get rewards', 
      error: error.message 
    });
  }
};

// Get user's reward history
const getRewardHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const history = await prisma.rewardRedemption.findMany({
      where: {
        userId
      },
      include: {
        reward: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        redeemedAt: 'desc'
      }
    });
    
    // Format the response
    const formattedHistory = history.map(item => ({
      id: item.id,
      rewardId: item.rewardId,
      rewardName: item.reward.name,
      pointsCost: item.pointsCost,
      redeemedAt: item.redeemedAt
    }));
    
    res.status(200).json({ history: formattedHistory });
  } catch (error) {
    console.error('Get reward history error:', error);
    res.status(500).json({ 
      message: 'Failed to get reward history', 
      error: error.message 
    });
  }
};

// Redeem a reward
const redeemReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;
    
    // Get the user to check points
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the reward
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    // Check if the reward is active
    if (!reward.isActive) {
      return res.status(400).json({ message: 'This reward is no longer available' });
    }
    
    // Check if user has enough points
    if (user.points < reward.pointsCost) {
      return res.status(400).json({ 
        message: 'Not enough points', 
        pointsNeeded: reward.pointsCost - user.points
      });
    }
    
    // Start a transaction
    const [updatedUser, redemption] = await prisma.$transaction([
      // Deduct points from user
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            decrement: reward.pointsCost
          }
        }
      }),
      
      // Create redemption record
      prisma.rewardRedemption.create({
        data: {
          userId,
          rewardId,
          pointsCost: reward.pointsCost
        }
      })
    ]);
    
    // Create a notification for the user
    await createNotification(
      userId,
      'Reward Redeemed', 
      `You successfully redeemed ${reward.name} for ${reward.pointsCost} points.`,
      'INFO'
    );
    
    res.status(200).json({
      message: 'Reward redeemed successfully',
      reward: {
        id: reward.id,
        name: reward.name,
        pointsCost: reward.pointsCost
      },
      user: {
        id: updatedUser.id,
        points: updatedUser.points
      }
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ 
      message: 'Failed to redeem reward', 
      error: error.message 
    });
  }
};

// Admin: Create new reward
const createReward = async (req, res) => {
  try {
    const { name, description, pointsCost, imageUrl } = req.body;
    
    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        pointsCost: parseInt(pointsCost),
        imageUrl
      }
    });
    
    res.status(201).json({
      message: 'Reward created successfully',
      reward
    });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ 
      message: 'Failed to create reward', 
      error: error.message 
    });
  }
};

// Admin: Update reward
const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, pointsCost, imageUrl, isActive } = req.body;
    
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        name,
        description,
        pointsCost: parseInt(pointsCost),
        imageUrl,
        isActive
      }
    });
    
    res.status(200).json({
      message: 'Reward updated successfully',
      reward
    });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ 
      message: 'Failed to update reward', 
      error: error.message 
    });
  }
};

// Admin: Delete reward
const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Instead of hard deleting, just set isActive to false
    const reward = await prisma.reward.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.status(200).json({
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ 
      message: 'Failed to delete reward', 
      error: error.message 
    });
  }
};

module.exports = {
  getAvailableRewards,
  getRewardHistory,
  redeemReward,
  createReward,
  updateReward,
  deleteReward
};
