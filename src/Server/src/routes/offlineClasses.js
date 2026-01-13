var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');
const offlineClassController = require('../app/controllers/offlineClassController');

// GET open classes (for enrollment)
router.get('/open', offlineClassController.getOpenClasses);

// GET all offline classes
router.get('/', offlineClassController.getAllClasses);

// GET single class by ID
router.get('/:id', offlineClassController.getClassById);

// POST create new class (teacher/admin only)
router.post('/', isAuth, restrictTo('teacher', 'admin'), offlineClassController.createClass);

// PUT update class (teacher/admin only)
router.put('/:id', isAuth, restrictTo('teacher', 'admin'), offlineClassController.updateClass);

// DELETE class (teacher/admin only)
router.delete('/:id', isAuth, restrictTo('teacher', 'admin'), offlineClassController.deleteClass);

// POST enroll in class (learner)
router.post('/:id/enroll', isAuth, restrictTo('learner'), offlineClassController.enrollInClass);

module.exports = router;
