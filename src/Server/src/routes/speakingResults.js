const express = require('express');
const router = express.Router();

const speakingController = require('../app/controllers/speakingResultController');
const upload = require('../app/middlewares/uploadMiddleware');

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

router.post('/', isAuth, restrictTo('LEARNER'), upload.single('voice'), speakingController.submitSpeakingResult);

router.get('/lesson/:lessonId', isAuth, restrictTo('LEARNER'), speakingController.getMySpeakingHistory);

module.exports = router;