var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const courseController = require('../app/controllers/courseController');
const lessonController = require('../app/controllers/lessonController');
const upload = require('../app/middlewares/uploadMiddleware');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/teachers', courseController.getTeachersPublic); // For filter dropdown
router.get('/:id', courseController.getCourseById);
router.get('/:courseId/lessons', lessonController.getLessonsByCourse);

// Teacher routes
router.post('/', isAuth, restrictTo('teacher'), upload.single('thumbnail'), courseController.createCourse);
router.put('/:id', isAuth, restrictTo('teacher', 'admin'), upload.single('thumbnail'), courseController.updateCourse);
router.delete('/:id', isAuth, restrictTo('teacher', 'admin'), courseController.deleteCourse);

// Admin routes
router.put('/:id/publish', isAuth, restrictTo('admin'), courseController.publishCourse);

module.exports = router;
