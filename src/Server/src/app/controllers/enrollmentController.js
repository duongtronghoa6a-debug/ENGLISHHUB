const db = require('../models');
const { Course, Learner, Enrollment, Teacher, Order, OrderItem } = db;
const HttpError = require('http-errors');

// 1. [POST] /enrollments or /enrollments/enroll/:courseId - Enroll in a course
exports.createEnrollment = async (req, res, next) => {
    try {
        // Accept courseId from URL params or body
        const courseId = req.params.courseId || req.body.courseId;
        const accountId = req.user.id;

        if (!courseId) {
            throw HttpError(400, 'Course ID is required');
        }

        const course = await Course.findByPk(courseId, {
            include: [{ model: Teacher, as: 'teacher' }]
        });
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        // Find or create learner profile
        let learner = await Learner.findOne({
            where: { account_id: accountId }
        });

        if (!learner) {
            // Auto-create learner profile for this account
            learner = await Learner.create({
                account_id: accountId,
                full_name: req.user.email?.split('@')[0] || 'Learner',
                study_goal: 'General English'
            });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: { learner_id: learner.id, course_id: courseId }
        });
        if (existingEnrollment) {
            throw HttpError(409, 'Already enrolled in this course');
        }

        const newEnrollment = await Enrollment.create({
            learner_id: learner.id,
            course_id: courseId,
            status: 'active'
        });

        // === CREATE ORDER FOR REVENUE TRACKING ===
        const coursePrice = parseFloat(course.price) || 0;

        // Create order (completed = auto payment success for now)
        const order = await Order.create({
            learner_id: learner.id,
            user_id: accountId,
            total_amount: coursePrice,
            status: 'completed',  // Auto-complete for instant enroll
            payment_method: 'bank_transfer',
            items_json: [{
                course_id: course.id,
                title: course.title,
                price: coursePrice
            }]
        });

        // Create order item for revenue calculation
        await OrderItem.create({
            order_id: order.id,
            course_id: course.id,
            price: coursePrice
        });
        // === END ORDER CREATION ===

        // Send notification to teacher
        if (course.teacher?.account_id) {
            const { sendNotification } = require('./notificationController');
            await sendNotification(course.teacher.account_id, {
                title: '📚 Học viên mới đăng ký!',
                message: `${learner.full_name} đã đăng ký khóa học "${course.title}" của bạn.`,
                type: 'info',
                category: 'enrollment',
                related_id: course.id,
                related_type: 'course',
                action_url: `/teacher/courses/${course.id}/students`
            }, accountId);
        }

        res.status(201).json({
            success: true,
            message: 'Enrollment created successfully',
            data: newEnrollment
        });
    } catch (error) {
        next(error);
    }
};

// 2. [GET] /enrollments/check/:courseId - Check enrollment status
exports.getEnrollmentById = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const accountId = req.user.id;

        const learner = await Learner.findOne({
            where: { account_id: accountId }
        });
        if (!learner) {
            throw HttpError(404, 'Learner profile not found');
        }

        const course = await Course.findByPk(courseId);
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        const enrollment = await Enrollment.findOne({
            where: { learner_id: learner.id, course_id: courseId }
        });

        res.status(200).json({
            success: true,
            isEnrolled: !!enrollment,
            status: enrollment ? enrollment.status : null
        });
    } catch (error) {
        next(error);
    }
};

// 3. [GET] /enrollments/my-courses - Get all enrolled courses
exports.getAllEnrollments = async (req, res, next) => {
    try {
        const accountId = req.user.id;

        const learner = await Learner.findOne({
            where: { account_id: accountId }
        });

        // If no learner profile, return empty array
        if (!learner) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const enrollments = await Enrollment.findAll({
            where: { learner_id: learner.id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    include: [
                        {
                            model: Teacher,
                            as: 'teacher',
                            attributes: ['id', 'full_name', 'avatar_url']
                        }
                    ]
                }
            ],
            order: [['enrolled_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Enrollments retrieved successfully',
            data: enrollments
        });
    } catch (error) {
        next(error);
    }
};