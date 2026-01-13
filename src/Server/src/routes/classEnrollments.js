var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const classEnrollmentController = require('../app/controllers/classEnrollmentController');

// Learner endpoints
router.post('/request', isAuth, classEnrollmentController.requestEnrollment);
router.get('/my-requests', isAuth, classEnrollmentController.getMyRequests);
router.get('/enrolled', isAuth, classEnrollmentController.getEnrolledClasses);

// Teacher endpoints
router.get('/teacher-pending', isAuth, restrictTo('teacher', 'admin'), classEnrollmentController.getTeacherPendingRequests);
router.put('/:id/approve', isAuth, restrictTo('teacher', 'admin'), classEnrollmentController.approveEnrollment);
router.put('/:id/reject', isAuth, restrictTo('teacher', 'admin'), classEnrollmentController.rejectEnrollment);

module.exports = router;
