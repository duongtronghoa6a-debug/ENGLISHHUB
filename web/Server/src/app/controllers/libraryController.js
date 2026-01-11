const db = require('../models');
const { Course, Teacher, Lesson, Account } = db;
const { Op, fn, col } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 1. [GET] /library/stats - Get library statistics
exports.getStats = async (req, res, next) => {
    try {
        const [totalCourses, totalTeachers, totalLessons] = await Promise.all([
            Course.count({ where: { is_published: true } }),
            Teacher.count(),
            Lesson.count()
        ]);

        // Get unique categories
        const categories = await Course.findAll({
            attributes: [[fn('DISTINCT', col('category')), 'category']],
            where: { is_published: true },
            raw: true
        });

        res.status(200).json({
            success: true,
            totalFiles: totalLessons,
            categories: categories.length,
            teachers: totalTeachers,
            courses: totalCourses,
            totalSize: 'N/A',
            totalSizeBytes: 0
        });
    } catch (error) {
        next(error);
    }
};

// 2. [GET] /library/categories - Get all categories
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Course.findAll({
            attributes: [[fn('DISTINCT', col('category')), 'category']],
            where: { is_published: true },
            raw: true
        });

        res.status(200).json(categories.map(c => c.category).filter(Boolean));
    } catch (error) {
        next(error);
    }
};

// 3. [GET] /library/teachers - Get all teachers (optionally filtered by category)
exports.getTeachers = async (req, res, next) => {
    try {
        const { exam } = req.query;

        let teacherIds = [];
        if (exam) {
            // Get teachers who have courses in this category
            const courses = await Course.findAll({
                where: { category: exam, is_published: true },
                attributes: ['teacher_id'],
                raw: true
            });
            teacherIds = [...new Set(courses.map(c => c.teacher_id))];
        }

        const whereClause = teacherIds.length > 0 ? { id: { [Op.in]: teacherIds } } : {};

        const teachers = await Teacher.findAll({
            where: whereClause,
            attributes: ['id', 'full_name'],
            raw: true
        });

        res.status(200).json(teachers.map(t => t.full_name));
    } catch (error) {
        next(error);
    }
};

// 4. [GET] /library/courses - Get courses filtered by category and teacher
exports.getCourses = async (req, res, next) => {
    try {
        const { exam, teacher } = req.query;

        const whereClause = { is_published: true };
        if (exam) whereClause.category = exam;

        if (teacher) {
            const teacherRecord = await Teacher.findOne({
                where: { full_name: teacher },
                attributes: ['id']
            });
            if (teacherRecord) {
                whereClause.teacher_id = teacherRecord.id;
            }
        }

        const courses = await Course.findAll({
            where: whereClause,
            attributes: ['id', 'title'],
            raw: true
        });

        res.status(200).json(courses.map(c => c.title));
    } catch (error) {
        next(error);
    }
};

// 5. [GET] /library/sections - Get sections within a course (lessons)
exports.getSections = async (req, res, next) => {
    try {
        const { course } = req.query;

        // Find course by title
        const courseRecord = await Course.findOne({
            where: { title: course },
            attributes: ['id']
        });

        if (!courseRecord) {
            return res.status(200).json([]);
        }

        // Get unique content_types as "sections"
        const contentTypes = await Lesson.findAll({
            where: { course_id: courseRecord.id },
            attributes: [[fn('DISTINCT', col('content_type')), 'content_type']],
            raw: true
        });

        res.status(200).json(contentTypes.map(c => c.content_type).filter(Boolean));
    } catch (error) {
        next(error);
    }
};

// 6. [GET] /library/files - Get files with pagination and filtering
exports.getFiles = async (req, res, next) => {
    try {
        const { exam, teacher, course, section, search, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build course filter
        const courseWhere = { is_published: true };
        if (exam) courseWhere.category = exam;

        if (teacher) {
            const teacherRecord = await Teacher.findOne({
                where: { full_name: teacher },
                attributes: ['id']
            });
            if (teacherRecord) {
                courseWhere.teacher_id = teacherRecord.id;
            }
        }

        if (course) {
            const courseRecord = await Course.findOne({
                where: { title: course },
                attributes: ['id']
            });
            if (courseRecord) {
                courseWhere.id = courseRecord.id;
            }
        }

        // Get matching courses
        const courses = await Course.findAll({
            where: courseWhere,
            attributes: ['id', 'title', 'category'],
            include: [{
                model: Teacher,
                as: 'teacher',
                attributes: ['full_name']
            }],
            raw: true,
            nest: true
        });

        const courseIds = courses.map(c => c.id);

        // Build lesson filter
        const lessonWhere = { course_id: { [Op.in]: courseIds } };
        if (section) lessonWhere.content_type = section;
        if (search) lessonWhere.title = { [Op.iLike]: `%${search}%` };

        const { count, rows: lessons } = await Lesson.findAndCountAll({
            where: lessonWhere,
            limit: parseInt(limit),
            offset,
            order: [['order_index', 'ASC']],
            include: [{
                model: Course,
                as: 'course',
                attributes: ['title', 'category'],
                include: [{
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['full_name']
                }]
            }]
        });

        const files = lessons.map(lesson => ({
            exam: lesson.course?.category || 'Unknown',
            teacher: lesson.course?.teacher?.full_name || 'Unknown',
            course: lesson.course?.title || 'Unknown',
            section: lesson.content_type || 'main',
            file: lesson.title,
            ext: lesson.content_type || 'pdf',
            sizeBytes: 0,
            path: lesson.content_url || '',
            urlPath: lesson.content_url || '',
            url: lesson.content_url || '',
            sizeFormatted: 'N/A'
        }));

        res.status(200).json({
            success: true,
            files,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};
