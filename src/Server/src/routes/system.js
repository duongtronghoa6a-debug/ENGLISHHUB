/**
 * System Routes
 * Routes for system settings, sessions, and activity logs
 */

const express = require('express');
const router = express.Router();
const systemController = require('../app/controllers/systemController');
const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

// Public routes
router.get('/settings/public', systemController.getPublicSettings);

// Authenticated user routes
router.get('/account/sessions', isAuth, systemController.getMySessions);
router.get('/account/activity-logs', isAuth, systemController.getMyActivityLogs);
router.delete('/account/sessions/:id', isAuth, systemController.logoutSession);

// Admin only routes
router.get('/admin/settings', isAuth, restrictTo('admin'), systemController.getAllSettings);
router.put('/admin/settings', isAuth, restrictTo('admin'), systemController.updateSettings);
router.get('/admin/sessions', isAuth, restrictTo('admin'), systemController.getSessions);
router.delete('/admin/sessions/:id', isAuth, restrictTo('admin'), systemController.logoutSession);
router.get('/admin/activity-logs', isAuth, restrictTo('admin'), systemController.getActivityLogs);

module.exports = router;
