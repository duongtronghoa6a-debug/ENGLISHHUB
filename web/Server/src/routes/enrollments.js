var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const enrollmentController = require('../app/controllers/enrollmentController');

// Enroll in a course
router.post('/enroll/:courseId', isAuth, enrollmentController.createEnrollment);

// Check enrollment status
router.get('/check/:courseId', isAuth, enrollmentController.getEnrollmentById);

// Get all my enrollments (my-courses)
router.get('/my-courses', isAuth, enrollmentController.getAllEnrollments);

// Legacy route for creating enrollment
router.post('/', isAuth, enrollmentController.createEnrollment);

module.exports = router;