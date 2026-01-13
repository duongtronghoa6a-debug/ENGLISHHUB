var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');

const orderController = require('../app/controllers/orderController');

router.use(isAuth, restrictTo('LEARNER')); 
// tạo đơn hàng mới
router.post('/', orderController.createOrder);
// Xem lich su don hang
router.get('/', orderController.getMyOrders); 
// thanh toan don hang
router.put('/:orderId/pay', orderController.processPayment); 


module.exports = router;
