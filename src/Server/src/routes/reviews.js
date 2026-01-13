var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const reviewController = require('../app/controllers/reviewController');

router.post('/', isAuth, restrictTo('learner'), reviewController.createReview);
router.get('/my', isAuth, reviewController.getMyReviews);
router.get('/course/:courseId', reviewController.getReviewsByCourse);
router.put('/:reviewId', isAuth, restrictTo('learner'), reviewController.updateReview);
router.delete('/:reviewId', isAuth, restrictTo('learner', 'teacher', 'admin'), reviewController.deleteReview);

module.exports = router;