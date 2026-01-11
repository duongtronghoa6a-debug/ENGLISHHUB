/**
 * Teacher Controller
 * Handles teacher-specific operations: dashboard stats, courses, profile
 */

const db = require('../models');
const { Course, Lesson, Teacher, Enrollment, Account, Order, OrderItem } = db;
const { Op } = require('sequelize');

/**
 * Get teacher dashboard stats
 * GET /api/v1/teacher/dashboard-stats
 */
const getDashboardStats = async (req, res) => {
    try {
        const accountId = req.user.id;

        // Find teacher profile
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(200).json({
                success: true,
                data: {
                    totalCourses: 0,
                    totalLessons: 0,
                    totalStudents: 0,
                    publishedCourses: 0,
                    totalRevenue: 0,
                    thisMonthRevenue: 0
                }
            });
        }

        // Get course stats
        const totalCourses = await Course.count({ where: { teacher_id: teacher.id } });
        const publishedCourses = await Course.count({
            where: { teacher_id: teacher.id, is_published: true }
        });

        // Get lessons count
        const courses = await Course.findAll({
            where: { teacher_id: teacher.id },
            attributes: ['id']
        });
        const courseIds = courses.map(c => c.id);

        const totalLessons = courseIds.length > 0
            ? await Lesson.count({ where: { course_id: { [Op.in]: courseIds } } })
            : 0;

        // Get students count
        const totalStudents = courseIds.length > 0
            ? await Enrollment.count({
                where: { course_id: { [Op.in]: courseIds } },
                distinct: true,
                col: 'learner_id'
            })
            : 0;

        // Calculate revenue from orders
        let totalRevenue = 0;
        let thisMonthRevenue = 0;

        if (courseIds.length > 0) {
            // Get all completed order items for teacher's courses
            const orderItems = await OrderItem.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                include: [{
                    model: Order,
                    as: 'order',
                    where: { payment_status: 'completed' },
                    attributes: ['created_at']
                }]
            });

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            orderItems.forEach(item => {
                const price = parseFloat(item.price_at_purchase || 0);
                totalRevenue += price;

                if (item.order && new Date(item.order.created_at) >= startOfMonth) {
                    thisMonthRevenue += price;
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                totalCourses,
                totalLessons,
                totalStudents,
                publishedCourses,
                totalRevenue,
                thisMonthRevenue
            }
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get teacher's recent activity
 * GET /api/v1/teacher/recent-activity
 */
const getRecentActivity = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Get recent enrollments for teacher's courses
        const courses = await Course.findAll({
            where: { teacher_id: teacher.id },
            attributes: ['id', 'title']
        });
        const courseIds = courses.map(c => c.id);

        const recentEnrollments = courseIds.length > 0
            ? await Enrollment.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                order: [['created_at', 'DESC']],
                limit: 10,
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['title']
                }]
            })
            : [];

        const activity = recentEnrollments.map(e => ({
            type: 'enrollment',
            message: `Học viên mới đăng ký khóa "${e.course?.title}"`,
            timestamp: e.created_at
        }));

        res.status(200).json({ success: true, data: activity });
    } catch (error) {
        console.error('getRecentActivity error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get teacher's courses
 * GET /api/v1/teacher/my-courses
 */
const getMyCourses = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { limit = 50, page = 1 } = req.query;

        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(200).json({
                success: true,
                data: { courses: [], total: 0, page: 1, totalPages: 0 }
            });
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await Course.findAndCountAll({
            where: { teacher_id: teacher.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [{
                model: Lesson,
                as: 'lessons',
                attributes: ['id']
            }]
        });

        const coursesWithStats = rows.map(course => ({
            ...course.toJSON(),
            lessonCount: course.lessons?.length || 0
        }));

        res.status(200).json({
            success: true,
            data: {
                courses: coursesWithStats,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('getMyCourses error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get teacher profile
 * GET /api/v1/teacher/profile
 */
const getTeacherProfile = async (req, res) => {
    try {
        const accountId = req.user.id;

        const account = await Account.findByPk(accountId, {
            attributes: ['id', 'email', 'role', 'created_at']
        });

        const teacher = await Teacher.findOne({
            where: { account_id: accountId }
        });

        if (!teacher) {
            return res.status(200).json({
                success: true,
                data: {
                    email: account?.email,
                    full_name: 'Chưa cập nhật',
                    phone: null,
                    bio: null,
                    specialization: null,
                    avatar: null
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: teacher.id,
                email: account?.email,
                full_name: teacher.full_name,
                phone: teacher.phone,
                bio: teacher.bio,
                specialization: teacher.specialization,
                avatar: teacher.avatar,
                created_at: account?.created_at
            }
        });
    } catch (error) {
        console.error('getTeacherProfile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getMyCourses,
    getTeacherProfile
};
