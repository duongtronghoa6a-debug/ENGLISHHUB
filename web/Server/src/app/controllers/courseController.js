const db = require('../models');
const { Course, Teacher, Account, Lesson } = db;
const HttpError = require('http-errors');

// 1. [POST] /courses - Create new course
exports.createCourse = async (req, res, next) => {
    try {
        const accountId = req.user.id;
        const { title, description, price, level, category } = req.body;
        const thumbnail_url = req.file ? req.file.path : null;

        if (!title) {
            throw HttpError(400, 'Missing required field: title');
        }

        // Find teacher by account_id
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });
        if (!teacher) {
            throw HttpError(404, 'Teacher profile not found');
        }

        const newCourse = await Course.create({
            teacher_id: teacher.id,
            title,
            description,
            price: price || 0,
            level: level || 'B1',
            category,
            thumbnail_url,
            is_published: false
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse
        });
    } catch (error) {
        next(error);
    }
};

// 2. [GET] /courses - Get all courses
exports.getAllCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, is_free, level, category, is_published } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {};

        // Filter by price
        if (is_free === 'true') {
            where.price = 0;
        } else if (is_free === 'false') {
            where.price = { [db.Sequelize.Op.gt]: 0 };
        }

        // Filter by level
        if (level) where.level = level;

        // Filter by category
        if (category) where.category = category;

        // Filter by published status (default: show only published for public)
        // 'all' means no filter (for admin), 'true'/'false' filter accordingly
        if (is_published === 'all') {
            // Don't filter by published status - show all
        } else if (is_published !== undefined) {
            where.is_published = is_published === 'true';
        } else {
            where.is_published = true; // Default to published only
        }

        const courses = await Course.findAndCountAll({
            where,
            include: [
                {
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'full_name', 'avatar_url', 'bio'],
                    include: [{
                        model: Account,
                        as: 'account',
                        attributes: ['email']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: courses.count,
            data: courses.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: courses.count,
                totalPages: Math.ceil(courses.count / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// 3. [GET] /courses/:id
exports.getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [
                {
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'full_name', 'avatar_url', 'bio'],
                    include: [{
                        model: Account,
                        as: 'account',
                        attributes: ['email']
                    }]
                },
                {
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id', 'title', 'order_index', 'duration_minutes', 'is_free']
                }
            ]
        });

        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /courses/:id
exports.updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const accountId = req.user.id;
        const userRole = req.user.role;
        const updates = req.body;

        const course = await Course.findByPk(id);
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        // Check permission
        if (userRole !== 'admin') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher || course.teacher_id !== teacher.id) {
                throw HttpError(403, 'You do not have permission to update this course');
            }
        }

        // Handle thumbnail
        if (req.file) {
            updates.thumbnail_url = req.file.path;
        }

        // Safe update fields
        const allowedFields = ['title', 'description', 'price', 'level', 'category', 'thumbnail_url'];
        const safeUpdates = {};
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field];
            }
        });

        await course.update(safeUpdates);

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// 5. [DELETE] /courses/:id
exports.deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const accountId = req.user.id;
        const userRole = req.user.role;

        const course = await Course.findByPk(id);
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        // Check permission
        if (userRole !== 'admin') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher || course.teacher_id !== teacher.id) {
                throw HttpError(403, 'You do not have permission to delete this course');
            }
        }

        await course.destroy();

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// 6. [PUT] /courses/:id/publish - Publish/Unpublish course
exports.publishCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_published } = req.body;

        const course = await Course.findByPk(id);
        if (!course) throw HttpError(404, 'Course not found');

        await course.update({ is_published: is_published === true });

        res.status(200).json({
            success: true,
            message: `Course is now ${is_published ? 'published' : 'unpublished'}`
        });
    } catch (error) {
        next(error);
    }
};

// 7. [GET] /courses/teachers - Get unique teachers for filter dropdown (PUBLIC)
exports.getTeachersPublic = async (req, res, next) => {
    try {
        // Get all unique teachers who have published courses
        const teachers = await Teacher.findAll({
            include: [{
                model: Course,
                as: 'courses',
                where: { is_published: true },
                attributes: [],
                required: true
            }],
            attributes: ['full_name'],
            group: ['Teacher.id', 'Teacher.full_name']
        });

        const teacherNames = teachers.map(t => t.full_name).filter(Boolean);

        res.status(200).json(teacherNames);
    } catch (error) {
        next(error);
    }
};