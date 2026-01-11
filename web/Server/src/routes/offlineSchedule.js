const express = require('express');
const router = express.Router();

const offlineController = require('../app/controllers/offlineScheduleController');

const { isAuth } = require('../app/middlewares/authMiddleware');
const restrictTo = require('../app/middlewares/restrictTo');


router.get('/course/:idCOURSE', offlineController.getScheduleByCourse);

router.post('/', isAuth, restrictTo('TEACHER', 'ADMIN'), offlineController.createSchedule);
router.put('/:idOFFLINE_SCHEDULE', isAuth, restrictTo('TEACHER', 'ADMIN'), offlineController.updateSchedule);

module.exports = router;