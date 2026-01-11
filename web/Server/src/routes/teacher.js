/**
 * Teacher Routes
 * /api/v1/teacher/*
 */

const express = require('express');
const router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const teacherController = require('../app/controllers/teacherController');

// All routes require authentication and teacher role
router.use(isAuth);
router.use(restrictTo('teacher', 'admin'));

// Dashboard stats
router.get('/dashboard-stats', teacherController.getDashboardStats);

// Recent activity
router.get('/recent-activity', teacherController.getRecentActivity);

// My courses
router.get('/my-courses', teacherController.getMyCourses);

// Profile
router.get('/profile', teacherController.getTeacherProfile);

module.exports = router;
