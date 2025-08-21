
const { PrismaClient } = require('@prisma/client');

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify that prisma is available
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return res.status(500).json({ 
        message: 'Database connection error', 
      });
    }
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to get notifications', 
      error: error.message 
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find notification to ensure it belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this notification' });
    }
    
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    
    res.status(200).json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      message: 'Failed to update notification', 
      error: error.message 
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });
    
    res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      message: 'Failed to update notifications', 
      error: error.message 
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find notification to ensure it belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this notification' });
    }
    
    await prisma.notification.delete({
      where: { id }
    });
    
    res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification', 
      error: error.message 
    });
  }
};

// Create notification (internal function for other controllers to use)
const createNotification = async (userId, title, message, type) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        read: false
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification
};
