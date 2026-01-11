var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo  = require('../app/middlewares/restrictTo');

const reviewController = require('../app/controllers/reviewController');

router.post('/', isAuth, restrictTo('LEARNER'), reviewController.createReview);
router.get('/course/:courseId/reviews', reviewController.getReviewsByCourse);
router.put('/:reviewId', isAuth, restrictTo('LEARNER'), reviewController.updateReview);
router.delete('/:reviewId', isAuth, restrictTo('LEARNER', 'TEACHER', 'ADMIN'), reviewController.deleteReview);

module.exports = router;