const db = require('../models');
const { OfflineClass, Account, Attendance } = db;
const HttpError = require('http-errors');

// 1. [POST] /offline-classes - Create new offline class
exports.createClass = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const {
            class_name,
            organizer_name,
            address,
            room,
            schedule_text,
            start_date,
            end_date,
            syllabus_json,
            commitment_text,
            price,
            capacity,
            thumbnail_url,
            status
        } = req.body;

        if (!class_name) {
            throw HttpError(400, 'class_name is required');
        }

        // Parse syllabus if string
        let parsedSyllabus = null;
        if (syllabus_json) {
            try {
                parsedSyllabus = typeof syllabus_json === 'string'
                    ? JSON.parse(syllabus_json)
                    : syllabus_json;
            } catch (e) {
                throw HttpError(400, 'syllabus_json must be valid JSON');
            }
        }

        const newClass = await OfflineClass.create({
            teacher_id: accountId,
            class_name,
            organizer_name,
            address,
            room,
            schedule_text,
            start_date,
            end_date,
            syllabus_json: parsedSyllabus,
            commitment_text,
            price: price || 0,
            capacity: capacity || 30,
            current_enrolled: 0,
            thumbnail_url,
            status: status || 'open'
        });

        res.status(201).json({
            success: true,
            message: 'Offline class created successfully',
            data: newClass
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /offline-classes - List all classes
exports.getAllClasses = async (req, res, next) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;

        const classes = await OfflineClass.findAndCountAll({
            where,
            include: [
                { model: Account, as: 'teacher', attributes: ['id', 'email'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['start_date', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: classes.count,
            data: classes.rows
        });

    } catch (error) {
        next(error);
    }
};

// 3. [GET] /offline-classes/:id - Get class detail
exports.getClassById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const offlineClass = await OfflineClass.findByPk(id, {
            include: [
                { model: Account, as: 'teacher', attributes: ['id', 'email'] },
                {
                    model: Attendance,
                    as: 'attendances',
                    include: [{ model: Account, as: 'learner', attributes: ['id', 'email'] }]
                }
            ]
        });

        if (!offlineClass) throw HttpError(404, 'Offline class not found');

        res.status(200).json({ success: true, data: offlineClass });

    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /offline-classes/:id - Update class
exports.updateClass = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;
        const updates = req.body;

        const offlineClass = await OfflineClass.findByPk(id);
        if (!offlineClass) throw HttpError(404, 'Offline class not found');

        // Check ownership
        if (role === 'teacher' && offlineClass.teacher_id !== accountId) {
            throw HttpError(403, 'You can only edit your own classes');
        }

        // Parse syllabus if provided
        if (updates.syllabus_json) {
            try {
                updates.syllabus_json = typeof updates.syllabus_json === 'string'
                    ? JSON.parse(updates.syllabus_json)
                    : updates.syllabus_json;
            } catch (e) {
                throw HttpError(400, 'Invalid syllabus_json format');
            }
        }

        await offlineClass.update(updates);

        res.status(200).json({
            success: true,
            message: 'Offline class updated successfully',
            data: offlineClass
        });

    } catch (error) {
        next(error);
    }
};

// 5. [DELETE] /offline-classes/:id - Delete class
exports.deleteClass = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;

        const offlineClass = await OfflineClass.findByPk(id);
        if (!offlineClass) throw HttpError(404, 'Offline class not found');

        // Check ownership
        if (role === 'teacher' && offlineClass.teacher_id !== accountId) {
            throw HttpError(403, 'You can only delete your own classes');
        }

        await offlineClass.destroy();

        res.status(200).json({ success: true, message: 'Offline class deleted successfully' });

    } catch (error) {
        next(error);
    }
};

// 6. [GET] /offline-classes/open - Get open classes for enrollment
exports.getOpenClasses = async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const classes = await OfflineClass.findAndCountAll({
            where: { status: 'open' },
            include: [
                { model: Account, as: 'teacher', attributes: ['id', 'email'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['start_date', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: classes.count,
            data: classes.rows
        });

    } catch (error) {
        next(error);
    }
};

// 7. [POST] /offline-classes/:id/enroll - Enroll in class
exports.enrollInClass = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: learnerId } = req.user;

        const offlineClass = await OfflineClass.findByPk(id);
        if (!offlineClass) throw HttpError(404, 'Offline class not found');

        if (offlineClass.status !== 'open') {
            throw HttpError(400, 'This class is not open for enrollment');
        }

        if (offlineClass.current_enrolled >= offlineClass.capacity) {
            throw HttpError(400, 'This class is full');
        }

        // Check if already enrolled
        const existingAttendance = await Attendance.findOne({
            where: { class_id: id, learner_id: learnerId }
        });
        if (existingAttendance) {
            throw HttpError(400, 'You are already enrolled in this class');
        }

        // Create attendance record
        await Attendance.create({
            class_id: id,
            learner_id: learnerId,
            status: 'enrolled'
        });

        // Update enrolled count
        await offlineClass.update({
            current_enrolled: offlineClass.current_enrolled + 1
        });

        // Check if full
        if (offlineClass.current_enrolled + 1 >= offlineClass.capacity) {
            await offlineClass.update({ status: 'full' });
        }

        res.status(200).json({ success: true, message: 'Enrolled successfully' });

    } catch (error) {
        next(error);
    }
};
