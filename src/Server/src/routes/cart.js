const express = require('express');
const router = express.Router();

const cartController = require('../app/controllers/cartController');

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

router.use(isAuth, restrictTo('LEARNER'));

router.post('/', cartController.addToCart);           
router.get('/', cartController.getMyCart);           
router.delete('/:idCART_ITEM', cartController.removeFromCart); 
// chọn hoặc bỏ chọn 1 món trong giỏ hàng
router.patch('/:idCART_ITEM/select', cartController.toggleSelection); 

module.exports = router;