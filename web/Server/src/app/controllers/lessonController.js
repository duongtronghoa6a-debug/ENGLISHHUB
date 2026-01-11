const { Teacher, Lesson, Course, Account } = require('../models');
const HttpError = require('http-errors');

// 1. POST /api/v1/lessons/:courseId (Tạo bài học mới)
exports.createLesson = async (req, res, next) => {
    try {
        const { id: accountId, role } = req.user;
        const { courseId } = req.params;
        const { title, content_url, duration_minutes, is_free, order_index } = req.body;

        if (!title) throw HttpError(400, 'Title is required');

        const course = await Course.findByPk(courseId);
        if (!course) throw HttpError(404, 'Course not found');

        // Check ownership if not admin
        if (role !== 'admin') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher) throw HttpError(404, 'Teacher not found');
            if (course.teacher_id !== teacher.id) {
                throw HttpError(403, 'You are not the owner of this course');
            }
        }

        // Auto calculate order_index
        const lastLesson = await Lesson.findOne({
            where: { course_id: courseId },
            order: [['order_index', 'DESC']]
        });
        const newOrderIndex = order_index || (lastLesson ? lastLesson.order_index + 1 : 1);

        const newLesson = await Lesson.create({
            course_id: courseId,
            title,
            content_url: content_url || null,
            duration_minutes: duration_minutes || 30,
            is_free: is_free || false,
            order_index: newOrderIndex
        });

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: newLesson
        });
    } catch (error) {
        next(error);
    }
};

// 2. PUT /api/v1/lessons/:id
exports.updateLesson = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { id: accountId, role } = req.user;

        const lesson = await Lesson.findByPk(id, {
            include: [{
                model: Course,
                as: 'course',
            }]
        });
        if (!lesson) throw HttpError(404, 'Lesson not found');

        // Check ownership if teacher role
        if (role === 'teacher') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher) throw HttpError(404, 'Teacher not found');
            if (!lesson.course || lesson.course.teacher_id !== teacher.id) {
                throw HttpError(403, 'You are not the owner of this course');
            }
        }

        await lesson.update({
            title: updates.title !== undefined ? updates.title : lesson.title,
            content_url: updates.content_url !== undefined ? updates.content_url : lesson.content_url,
            duration_minutes: updates.duration_minutes !== undefined ? updates.duration_minutes : lesson.duration_minutes,
            is_free: updates.is_free !== undefined ? updates.is_free : lesson.is_free,
            order_index: updates.order_index !== undefined ? updates.order_index : lesson.order_index
        });

        res.status(200).json({
            success: true,
            message: 'Lesson updated successfully',
            data: lesson
        });
    } catch (error) {
        next(error);
    }
};

// 3. DELETE /api/v1/lessons/:id
exports.deleteLesson = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;

        const lesson = await Lesson.findByPk(id, {
            include: [{
                model: Course,
                as: 'course',
            }]
        });
        if (!lesson) throw HttpError(404, 'Lesson not found');

        // Check ownership if teacher role
        if (role === 'teacher') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher) throw HttpError(404, 'Teacher not found');
            if (lesson.course.teacher_id !== teacher.id) {
                throw HttpError(403, 'You are not the owner of this course');
            }
        }

        await lesson.destroy();

        res.status(200).json({
            success: true,
            message: 'Lesson deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// 4. GET /api/v1/lessons/:id
exports.getLessonById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findByPk(id, {
            include: [{
                model: Course,
                as: 'course',
                attributes: ['id', 'title', 'teacher_id']
            }]
        });
        if (!lesson) throw HttpError(404, 'Lesson not found');

        res.status(200).json({
            success: true,
            message: 'Lesson retrieved successfully',
            data: lesson
        });
    } catch (error) {
        next(error);
    }
};

// 5. GET /api/v1/courses/:courseId/lessons
exports.getLessonsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // Verify course exists
        const course = await Course.findByPk(courseId);
        if (!course) throw HttpError(404, 'Course not found');

        const lessons = await Lesson.findAll({
            where: { course_id: courseId },
            order: [['order_index', 'ASC']]
        });

        res.status(200).json({
            success: true,
            message: 'Lessons retrieved successfully',
            count: lessons.length,
            data: lessons
        });
    } catch (error) {
        next(error);
    }
};