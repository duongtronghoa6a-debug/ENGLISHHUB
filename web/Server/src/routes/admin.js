var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const adminController = require('../app/controllers/adminController');

// All admin routes require authentication and admin role
router.use(isAuth);
router.use(restrictTo('admin')); // lowercase

// Dashboard stats
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/pending-actions', adminController.getPendingActions);

// User management
router.get('/users', adminController.getAllAccounts);
router.patch('/users/:id/status', adminController.updateAccountStatus);

// Legacy routes
router.get('/dashboard', adminController.getDashboardStats);
router.get('/accounts', adminController.getAllAccounts);

module.exports = router;