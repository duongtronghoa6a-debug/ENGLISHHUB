var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const examController = require('../app/controllers/examController');

// GET published exams (PUBLIC - for browsing)
router.get('/published', examController.getPublishedExams);

// GET user's exam submissions (must be before /:id route)
router.get('/my-submissions', isAuth, examController.getMySubmissions);

// GET all exams (with filters)
router.get('/', isAuth, examController.getAllExams);

// GET single exam by ID (PUBLIC - for preview)
router.get('/:id', examController.getExamById);

// POST create new exam (teacher/admin only)
router.post('/', isAuth, restrictTo('teacher', 'admin'), examController.createExam);

// PUT update exam (teacher/admin only)
router.put('/:id', isAuth, restrictTo('teacher', 'admin'), examController.updateExam);

// DELETE exam (teacher/admin only)
router.delete('/:id', isAuth, restrictTo('teacher', 'admin'), examController.deleteExam);

// POST submit exam (learner)
router.post('/:id/submit', isAuth, examController.submitExam);

module.exports = router;
