/**
 * Notification Controller
 * Handles notification CRUD and sending notifications
 */

const db = require('../models');
const { Notification, Account } = db;
const { Op } = require('sequelize');

/**
 * Get current user's notifications
 * GET /api/v1/notifications
 */
const getMyNotifications = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { limit = 50, unreadOnly = false } = req.query;

        const where = { account_id: accountId };
        if (unreadOnly === 'true') {
            where.is_read = false;
        }

        const notifications = await Notification.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        const unreadCount = await Notification.count({
            where: { account_id: accountId, is_read: false }
        });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error('getMyNotifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, account_id: accountId }
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.update({ is_read: true });

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const accountId = req.user.id;

        await Notification.update(
            { is_read: true },
            { where: { account_id: accountId, is_read: false } }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a notification
 * DELETE /api/v1/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, account_id: accountId }
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.destroy();

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Clear all notifications
 * DELETE /api/v1/notifications
 */
const clearAll = async (req, res) => {
    try {
        const accountId = req.user.id;

        await Notification.destroy({
            where: { account_id: accountId }
        });

        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error('clearAll error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Send notification to a specific user
 * @param {string} targetAccountId - Recipient's account ID
 * @param {object} notificationData - { title, message, type, category, related_id, related_type, action_url }
 * @param {string} senderAccountId - Sender's account ID (optional)
 */
const sendNotification = async (targetAccountId, notificationData, senderAccountId = null) => {
    try {
        const notification = await Notification.create({
            account_id: targetAccountId,
            sender_id: senderAccountId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'info',
            category: notificationData.category || 'system',
            related_id: notificationData.related_id || null,
            related_type: notificationData.related_type || null,
            action_url: notificationData.action_url || null
        });
        return notification;
    } catch (error) {
        console.error('sendNotification error:', error);
        return null;
    }
};

/**
 * Send notification to all users with a specific role
 * @param {string} role - 'admin', 'teacher', 'learner'
 * @param {object} notificationData
 */
const sendNotificationToRole = async (role, notificationData, senderAccountId = null) => {
    try {
        const accounts = await Account.findAll({
            where: { role, is_active: true },
            attributes: ['id']
        });

        const notifications = await Promise.all(
            accounts.map(account =>
                sendNotification(account.id, notificationData, senderAccountId)
            )
        );

        return notifications.filter(n => n !== null);
    } catch (error) {
        console.error('sendNotificationToRole error:', error);
        return [];
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    // Export helper functions for use in other controllers
    sendNotification,
    sendNotificationToRole
};
