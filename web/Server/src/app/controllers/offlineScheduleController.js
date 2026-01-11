const { OfflineSchedule, Course, Teacher } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /offline-schedules 
exports.createSchedule = async (req, res, next) => {
    try {
        const { id: accountId, role } = req.user;
        const { idCOURSE, location, startTime, maxStudents, syllabus } = req.body;

        if (!idCOURSE || !location || !startTime) {
            throw HttpError(400, 'idCOURSE, location, and startTime are required');
        }

        // Tìm khóa học và check quyền
        const course = await Course.findByPk(idCOURSE);
        if (!course) throw HttpError(404, 'Course not found');

        if (role === 'TEACHER') {
            const teacher = await Teacher.findOne({ where: { idACCOUNT: accountId } });
            if (!teacher || course.idTEACHER !== teacher.idTEACHER) {
                throw HttpError(403, 'You can only create schedule for your own course');
            }
        }

        const schedule = await OfflineSchedule.create({
            idCOURSE,
            location,
            startTime,
            maxStudents,
            syllabus
        });

        res.status(201).json({
            message: 'Offline schedule created successfully',
            data: schedule
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(HttpError(409, 'This course already has an offline schedule'));
        }
        next(error);
    }
};

// 2. [GET] /offline-schedules/course/:idCOURSE (Lấy lịch của 1 khóa học)
exports.getScheduleByCourse = async (req, res, next) => {
    try {
        const { idCOURSE } = req.params;

        const schedule = await OfflineSchedule.findOne({
            where: { idCOURSE: idCOURSE },
            include: [{ model: Course, as: 'course', attributes: ['title', 'price'] }]
        });

        if (!schedule) throw HttpError(404, 'No offline schedule found for this course');

        res.status(200).json({ data: schedule });
    } catch (error) {
        next(error);
    }
};

// 3. [PUT] /offline-schedules/:idOFFLINE_SCHEDULE 
exports.updateSchedule = async (req, res, next) => {
    try {
        const { idOFFLINE_SCHEDULE } = req.params; 
        const { id: accountId, role } = req.user;
        const updates = req.body;

        const schedule = await OfflineSchedule.findByPk(idOFFLINE_SCHEDULE, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!schedule) throw HttpError(404, 'Schedule not found');

        // Check quyền
        if (role === 'TEACHER') {
            const teacher = await Teacher.findOne({ where: { idACCOUNT: accountId } });
            if (!teacher || schedule.course.idTEACHER !== teacher.idTEACHER) {
                throw HttpError(403, 'Unauthorized to update this schedule');
            }
        }

        await schedule.update(updates);
        res.status(200).json({ message: 'Schedule updated', data: schedule });
    } catch (error) {
        next(error);
    }
};