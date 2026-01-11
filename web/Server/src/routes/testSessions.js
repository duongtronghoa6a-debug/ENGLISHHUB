const express = require('express');
const router = express.Router();

const testSessionController = require('../app/controllers/testSessionController');

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo  = require('../app/middlewares/restrictTo');


router.use(isAuth, restrictTo('LEARNER'));

router.post('/submit', testSessionController.submitTest); 
// xem lich su lam test theo lesson
router.get('/lesson/:lessonId', testSessionController.getHistoryByLesson); 
router.get('/:id', testSessionController.getSessionDetail); 

module.exports = router;