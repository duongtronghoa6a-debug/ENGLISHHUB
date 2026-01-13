var express = require('express');
var router = express.Router();

const { isAuth } = require('../app/middlewares/authMiddleware');

const authController = require('../app/controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);
// refresh trang, muốn biết token của ai -> frontend vô đây gọi để lấy thông tin user
router.get('/me', isAuth, authController.getMe);


module.exports = router;