var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const questionController = require('../app/controllers/questionController');
const upload = require('../app/middlewares/uploadMiddleware');

// GET all questions (with filters: skill, type, level)
router.get('/', isAuth, questionController.getAllQuestions);

// GET single question by ID
router.get('/:id', isAuth, questionController.getQuestionById);

// POST create new question (teacher/admin only)
router.post('/', isAuth, restrictTo('teacher', 'admin'), upload.single('media'), questionController.createQuestion);

// PUT update question (teacher/admin only)
router.put('/:id', isAuth, restrictTo('teacher', 'admin'), upload.single('media'), questionController.updateQuestion);

// DELETE question (teacher/admin only)
router.delete('/:id', isAuth, restrictTo('teacher', 'admin'), questionController.deleteQuestion);

module.exports = router;
