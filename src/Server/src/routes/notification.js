/**
 * Notification Routes
 * /api/v1/notifications/*
 */

const router = require('express').Router();
const notificationController = require('../app/controllers/notificationController');
const { isAuth } = require('../app/middlewares/authMiddleware');

// All routes require authentication
router.use(isAuth);

// Get current user's notifications
router.get('/', notificationController.getMyNotifications);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Mark single notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete single notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/', notificationController.clearAll);

module.exports = router;
