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

// Content review/approval routes
router.get('/pending-reviews', adminController.getPendingReviews);
router.put('/courses/:id/approve', adminController.approveCourse);
router.put('/courses/:id/reject', adminController.rejectCourse);

// Course CRUD
router.get('/courses', adminController.getAllCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// User CRUD
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Exam CRUD
router.get('/exams', adminController.getAllExams);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);

// Question CRUD (within exams)
router.get('/exams/:examId/questions', adminController.getExamQuestions);
router.post('/exams/:examId/questions', adminController.addQuestionToExam);
router.delete('/exams/:examId/questions/:questionId', adminController.removeQuestionFromExam);

// Course lessons (for viewing any course)
router.get('/courses/:courseId/lessons', adminController.getCourseLessons);
router.post('/courses/:courseId/lessons', adminController.addLessonToCourse);
router.delete('/courses/:courseId/lessons/:lessonId', adminController.deleteLesson);

module.exports = router;