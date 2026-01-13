var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const lessonController = require('../app/controllers/lessonController');
const upload = require('../app/middlewares/uploadMiddleware');

// GET lesson by ID (public - allow preview)
router.get('/:id', lessonController.getLessonById);

// Teacher/Admin routes
router.put('/:id', isAuth, restrictTo('teacher', 'admin'), upload.single('video'), lessonController.updateLesson);
router.delete('/:id', isAuth, restrictTo('teacher', 'admin'), lessonController.deleteLesson);
router.post('/:courseId', isAuth, restrictTo('teacher', 'admin'), upload.single('video'), lessonController.createLesson);

module.exports = router;