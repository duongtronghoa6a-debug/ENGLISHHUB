var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const libraryController = require('../app/controllers/libraryController');

// All library routes require admin authentication
router.use(isAuth);
router.use(restrictTo('admin'));

// Library endpoints
router.get('/stats', libraryController.getStats);
router.get('/categories', libraryController.getCategories);
router.get('/teachers', libraryController.getTeachers);
router.get('/courses', libraryController.getCourses);
router.get('/sections', libraryController.getSections);
router.get('/files', libraryController.getFiles);

module.exports = router;
