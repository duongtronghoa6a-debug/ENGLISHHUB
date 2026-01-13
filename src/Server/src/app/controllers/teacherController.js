/**
 * Teacher Controller
 * Handles teacher-specific operations: dashboard stats, courses, profile
 */

const db = require('../models');
const { Course, Lesson, Teacher, Enrollment, Account, Order, OrderItem, OfflineClass, ClassEnrollment, Learner, Review, Module, Withdrawal } = db;
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
        let lastMonthRevenue = 0;

        if (courseIds.length > 0) {
            // Get all completed order items for teacher's courses
            const orderItems = await OrderItem.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                include: [{
                    model: Order,
                    as: 'order',
                    where: { status: 'completed' },
                    attributes: ['created_at']
                }]
            });

            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            orderItems.forEach(item => {
                const price = parseFloat(item.price || 0);
                totalRevenue += price;

                if (item.order) {
                    const orderDate = new Date(item.order.created_at);
                    if (orderDate >= startOfThisMonth) {
                        thisMonthRevenue += price;
                    } else if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
                        lastMonthRevenue += price;
                    }
                }
            });
        }

        // Get average rating from reviews
        let avgRating = 0;
        let totalReviews = 0;
        if (courseIds.length > 0) {
            const reviews = await Review.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                attributes: ['rating']
            });
            totalReviews = reviews.length;
            if (totalReviews > 0) {
                const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                avgRating = parseFloat((sum / totalReviews).toFixed(1));
            }
        }

        res.status(200).json({
            success: true,
            data: {
                totalCourses,
                totalLessons,
                totalStudents,
                publishedCourses,
                totalRevenue,
                thisMonthRevenue,
                lastMonthRevenue,
                avgRating,
                totalReviews
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
                order: [['enrolled_at', 'DESC']],
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
            timestamp: e.enrolled_at
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

        // Courses.teacher_id stores Teacher.id (from Teachers table), not account_id
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
            include: [
                {
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id']
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id']
                }
            ]
        });

        const coursesWithStats = rows.map(course => ({
            ...course.toJSON(),
            lessonCount: course.lessons?.length || 0,
            enrollmentCount: course.enrollments?.length || 0
        }));

        // DEBUG: Log enrollment counts
        console.log('[getMyCourses] Teacher ID:', teacher.id);
        console.log('[getMyCourses] Courses found:', coursesWithStats.length);
        if (coursesWithStats.length > 0) {
            console.log('[getMyCourses] First 3 courses enrollmentCount:',
                coursesWithStats.slice(0, 3).map(c => `${c.title?.substring(0, 20)}: ${c.enrollmentCount}`));
        }

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

/**
 * Create a new course
 * POST /api/v1/teacher/courses
 */
const createCourse = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const { title, description, price, level, category, thumbnail_url, status } = req.body;

        // Map level values to valid enum values
        const LEVEL_MAP = {
            'beginner': 'B1',
            'intermediate': 'B2',
            'advanced': 'C1',
            'BEGINNER': 'B1',
            'INTERMEDIATE': 'B2',
            'ADVANCED': 'C1'
        };
        const validLevel = LEVEL_MAP[level] || level || 'B1';

        const course = await Course.create({
            teacher_id: teacher.id,
            title,
            description,
            price: price || 0,
            level: validLevel,
            category: category || 'general',
            thumbnail_url,
            status: status || 'draft',
            is_published: status === 'published'
        });

        res.status(201).json({ success: true, data: course });
    } catch (error) {
        console.error('createCourse error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a course
 * PUT /api/v1/teacher/courses/:id
 */
const updateCourse = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const course = await Course.findOne({
            where: { id: courseId, teacher_id: teacher.id }
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        const { title, description, price, level, category, thumbnail_url, status } = req.body;

        await course.update({
            title: title || course.title,
            description: description !== undefined ? description : course.description,
            price: price !== undefined ? price : course.price,
            level: level || course.level,
            category: category || course.category,
            thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : course.thumbnail_url,
            status: status || course.status,
            is_published: status === 'published'
        });

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error('updateCourse error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a course
 * DELETE /api/v1/teacher/courses/:id
 */
const deleteCourse = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const course = await Course.findOne({
            where: { id: courseId, teacher_id: teacher.id }
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        // Check if course has enrollments
        const enrollmentCount = await Enrollment.count({ where: { course_id: courseId } });
        if (enrollmentCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa khóa học có ${enrollmentCount} học viên đã đăng ký`
            });
        }

        // Delete related data first (cascade delete)
        await Lesson.destroy({ where: { course_id: courseId } });
        if (Module) {
            await Module.destroy({ where: { course_id: courseId } });
        }

        await course.destroy();
        res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('deleteCourse error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get lessons for a specific course
 * GET /api/v1/teacher/courses/:id/lessons
 */
const getCourseLessons = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;
        const isAdmin = req.user.role === 'admin';

        let course;

        if (isAdmin) {
            // Admin can access any course
            course = await Course.findOne({
                where: { id: courseId },
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    order: [['order_index', 'ASC']]
                }]
            });
        } else {
            // Teacher can only access their own courses
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });

            if (!teacher) {
                return res.status(400).json({ success: false, message: 'Teacher profile not found' });
            }

            // Find course by either teacher.id or accountId (for compatibility)
            course = await Course.findOne({
                where: {
                    id: courseId,
                    teacher_id: { [Op.in]: [teacher.id, accountId] }
                },
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    order: [['order_index', 'ASC']]
                }]
            });
        }

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: { course, lessons: course.lessons || [] } });
    } catch (error) {
        console.error('getCourseLessons error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new lesson
 * POST /api/v1/teacher/lessons
 */
const createLesson = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const { course_id, title, content_type, content_url, duration_minutes, order_index, is_free } = req.body;

        // Verify teacher owns the course
        const course = await Course.findOne({ where: { id: course_id, teacher_id: teacher.id } });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        const lesson = await Lesson.create({
            course_id,
            title,
            content_type: content_type || 'video',
            content_url,
            duration_minutes: duration_minutes || 0,
            order_index: order_index || 0,
            is_free: is_free || false
        });

        res.status(201).json({ success: true, data: lesson });
    } catch (error) {
        console.error('createLesson error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a lesson
 * PUT /api/v1/teacher/lessons/:id
 */
const updateLesson = async (req, res) => {
    try {
        const accountId = req.user.id;
        const lessonId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const lesson = await Lesson.findByPk(lessonId, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!lesson || lesson.course?.teacher_id !== teacher.id) {
            return res.status(404).json({ success: false, message: 'Lesson not found or not owned by you' });
        }

        const { title, content_type, content_url, duration_minutes, order_index, is_free } = req.body;

        await lesson.update({
            title: title || lesson.title,
            content_type: content_type || lesson.content_type,
            content_url: content_url !== undefined ? content_url : lesson.content_url,
            duration_minutes: duration_minutes !== undefined ? duration_minutes : lesson.duration_minutes,
            order_index: order_index !== undefined ? order_index : lesson.order_index,
            is_free: is_free !== undefined ? is_free : lesson.is_free
        });

        res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        console.error('updateLesson error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a lesson
 * DELETE /api/v1/teacher/lessons/:id
 */
const deleteLesson = async (req, res) => {
    try {
        const accountId = req.user.id;
        const lessonId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const lesson = await Lesson.findByPk(lessonId, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!lesson || lesson.course?.teacher_id !== teacher.id) {
            return res.status(404).json({ success: false, message: 'Lesson not found or not owned by you' });
        }

        await lesson.destroy();
        res.status(200).json({ success: true, message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('deleteLesson error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get teacher's offline classes
 * GET /api/v1/teacher/my-offline-classes
 */
const getMyOfflineClasses = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { limit = 50, page = 1 } = req.query;

        const offset = (page - 1) * limit;
        const { count, rows } = await OfflineClass.findAndCountAll({
            where: { teacher_id: accountId },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['start_date', 'DESC']],
            include: [{
                model: Account,
                as: 'teacher',
                attributes: ['id', 'email']
            }]
        });

        // Get enrollment counts for each class
        const classesWithStats = await Promise.all(rows.map(async (cls) => {
            const enrolledCount = await ClassEnrollment.count({
                where: { class_id: cls.id, status: 'approved' }
            });
            const pendingCount = await ClassEnrollment.count({
                where: { class_id: cls.id, status: 'pending' }
            });
            return {
                ...cls.toJSON(),
                enrolledCount,
                pendingCount
            };
        }));

        res.status(200).json({
            success: true,
            data: classesWithStats,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('getMyOfflineClasses error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get students enrolled in a course with progress
 * GET /api/v1/teacher/courses/:id/students
 */
const getCourseStudents = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;

        // Courses.teacher_id stores Teacher.id (from Teachers table)
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        // Verify teacher owns the course
        const course = await Course.findOne({
            where: { id: courseId, teacher_id: teacher.id },
            include: [{
                model: Lesson,
                as: 'lessons',
                attributes: ['id']
            }]
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        const totalLessons = course.lessons?.length || 0;

        // Get enrollments with learner info
        const enrollments = await Enrollment.findAll({
            where: { course_id: courseId },
            include: [{
                model: Learner,
                as: 'learner',
                include: [{
                    model: Account,
                    as: 'account',
                    attributes: ['id', 'email']
                }]
            }],
            order: [['enrolled_at', 'DESC']]
        });

        const students = enrollments.map(e => ({
            id: e.learner?.id,
            email: e.learner?.account?.email,
            full_name: e.learner?.full_name || 'Chưa cập nhật',
            avatar: e.learner?.avatar,
            enrolled_at: e.enrolled_at,
            progress_percent: e.progress_percent || 0,
            status: e.status,
            last_accessed: e.last_accessed
        }));

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    totalLessons
                },
                students,
                totalStudents: students.length
            }
        });
    } catch (error) {
        console.error('getCourseStudents error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get pending enrollment requests for teacher's offline classes
 * GET /api/v1/teacher/pending-requests
 */
const getPendingEnrollmentRequests = async (req, res) => {
    try {
        const accountId = req.user.id;

        // Get all classes owned by this teacher
        const myClasses = await OfflineClass.findAll({
            where: { teacher_id: accountId },
            attributes: ['id', 'class_name']
        });
        const classIds = myClasses.map(c => c.id);

        if (classIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Get pending requests
        const pendingRequests = await ClassEnrollment.findAll({
            where: {
                class_id: { [Op.in]: classIds },
                status: 'pending'
            },
            include: [
                {
                    model: OfflineClass,
                    as: 'offlineClass',
                    attributes: ['id', 'class_name', 'capacity', 'current_enrolled']
                },
                {
                    model: Account,
                    as: 'learner',
                    attributes: ['id', 'email']
                }
            ],
            order: [['requested_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: pendingRequests });
    } catch (error) {
        console.error('getPendingEnrollmentRequests error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Submit course for admin review
 * PUT /api/v1/teacher/courses/:id/submit-review
 */
const submitCourseForReview = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;
        console.log('[submitCourseForReview] accountId:', accountId, 'courseId:', courseId);

        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }
        console.log('[submitCourseForReview] teacher.id:', teacher.id);

        // Find course by either teacher.id or accountId (for compatibility)
        const course = await Course.findOne({
            where: {
                id: courseId,
                teacher_id: { [Op.in]: [teacher.id, accountId] }
            }
        });
        console.log('[submitCourseForReview] course found:', !!course, course?.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        // Check if course has lessons
        const lessonCount = await Lesson.count({ where: { course_id: courseId } });
        if (lessonCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Khóa học cần có ít nhất 1 bài học trước khi gửi duyệt'
            });
        }

        await course.update({
            approval_status: 'pending_review',
            rejection_reason: null
        });

        // Send notification to all admins
        const { sendNotificationToRole } = require('./notificationController');
        await sendNotificationToRole('admin', {
            title: '📝 Khóa học mới cần duyệt',
            message: `Giáo viên ${teacher.full_name} đã gửi khóa học "${course.title}" để duyệt.`,
            type: 'info',
            category: 'course_review',
            related_id: course.id,
            related_type: 'course',
            action_url: `/admin/courses/${course.id}`
        }, accountId);

        res.status(200).json({
            success: true,
            message: 'Đã gửi khóa học để admin duyệt',
            data: course
        });
    } catch (error) {
        console.error('submitCourseForReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get modules for a course
 * GET /api/v1/teacher/courses/:id/modules
 */
const getCourseModules = async (req, res) => {
    try {
        const accountId = req.user.id;
        const courseId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const course = await Course.findOne({
            where: { id: courseId, teacher_id: teacher.id }
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        const { Module } = db;
        const modules = await Module.findAll({
            where: { course_id: courseId },
            include: [{
                model: Lesson,
                as: 'lessons',
                order: [['order_index', 'ASC']]
            }],
            order: [['order_index', 'ASC']]
        });

        res.status(200).json({ success: true, data: modules });
    } catch (error) {
        console.error('getCourseModules error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a module
 * POST /api/v1/teacher/modules
 */
const createModule = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { course_id, title, description } = req.body;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const course = await Course.findOne({
            where: { id: course_id, teacher_id: teacher.id }
        });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
        }

        const { Module } = db;

        // Get max order_index
        const maxOrder = await Module.max('order_index', { where: { course_id } }) || 0;

        const module = await Module.create({
            course_id,
            title,
            description: description || '',
            order_index: maxOrder + 1
        });

        res.status(201).json({ success: true, data: module });
    } catch (error) {
        console.error('createModule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a module
 * PUT /api/v1/teacher/modules/:id
 */
const updateModule = async (req, res) => {
    try {
        const accountId = req.user.id;
        const moduleId = req.params.id;
        const { title, description, order_index } = req.body;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const { Module } = db;
        const module = await Module.findByPk(moduleId, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!module || module.course.teacher_id !== teacher.id) {
            return res.status(404).json({ success: false, message: 'Module not found or not owned by you' });
        }

        await module.update({
            title: title || module.title,
            description: description !== undefined ? description : module.description,
            order_index: order_index !== undefined ? order_index : module.order_index
        });

        res.status(200).json({ success: true, data: module });
    } catch (error) {
        console.error('updateModule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a module
 * DELETE /api/v1/teacher/modules/:id
 */
const deleteModule = async (req, res) => {
    try {
        const accountId = req.user.id;
        const moduleId = req.params.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        const { Module } = db;
        const module = await Module.findByPk(moduleId, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!module || module.course.teacher_id !== teacher.id) {
            return res.status(404).json({ success: false, message: 'Module not found or not owned by you' });
        }

        // Set lessons in this module to have no module
        await Lesson.update({ module_id: null }, { where: { module_id: moduleId } });

        await module.destroy();

        res.status(200).json({ success: true, message: 'Module deleted' });
    } catch (error) {
        console.error('deleteModule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Submit exam for admin review
 * PUT /api/v1/teacher/exams/:id/submit-review
 */
const submitExamForReview = async (req, res) => {
    try {
        const accountId = req.user.id;
        const examId = req.params.id;

        const { Exam } = require('../models');

        const exam = await Exam.findOne({
            where: { id: examId, creator_id: accountId }
        });

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found or not owned by you' });
        }

        // Check if exam has questions
        if (!exam.list_question_ids || exam.list_question_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Đề thi cần có ít nhất 1 câu hỏi trước khi gửi duyệt'
            });
        }

        await exam.update({
            approval_status: 'pending_review',
            rejection_reason: null
        });

        // Send notification to all admins
        const { sendNotificationToRole } = require('./notificationController');
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });
        await sendNotificationToRole('admin', {
            title: '📝 Đề thi mới cần duyệt',
            message: `Giáo viên ${teacher?.full_name || 'Unknown'} đã gửi đề thi "${exam.title}" để duyệt.`,
            type: 'info',
            category: 'exam_review',
            related_id: exam.id,
            related_type: 'exam',
            action_url: `/admin/exams`
        }, accountId);

        res.status(200).json({
            success: true,
            message: 'Đã gửi đề thi để admin duyệt',
            data: exam
        });
    } catch (error) {
        console.error('submitExamForReview error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get detailed revenue stats for teacher
 * GET /api/v1/teacher/revenue-stats
 */
const getRevenueStats = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(200).json({
                success: true,
                data: {
                    totalRevenue: 0,
                    withdrawnAmount: 0,
                    pendingWithdrawal: 0,
                    availableBalance: 0,
                    monthlyRevenue: []
                }
            });
        }

        // Get all courses by teacher
        const courses = await Course.findAll({
            where: { teacher_id: teacher.id },
            attributes: ['id']
        });
        const courseIds = courses.map(c => c.id);

        // Calculate total revenue from completed orders
        let totalRevenue = 0;
        const monthlyRevenue = {};

        if (courseIds.length > 0) {
            const orderItems = await OrderItem.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                include: [{
                    model: Order,
                    as: 'order',
                    where: { status: 'completed' },
                    attributes: ['created_at']
                }]
            });

            orderItems.forEach(item => {
                const price = parseFloat(item.price || 0);
                totalRevenue += price;

                if (item.order) {
                    const date = new Date(item.order.created_at);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + price;
                }
            });
        }

        // Get withdrawal stats
        const withdrawnAmount = await Withdrawal.sum('amount', {
            where: {
                teacher_id: teacher.id,
                status: { [Op.in]: ['approved', 'paid'] }
            }
        }) || 0;

        const pendingWithdrawal = await Withdrawal.sum('amount', {
            where: {
                teacher_id: teacher.id,
                status: 'pending'
            }
        }) || 0;

        const availableBalance = totalRevenue - withdrawnAmount - pendingWithdrawal;

        // Format monthly revenue as array for charts
        const monthlyRevenueArray = Object.entries(monthlyRevenue)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12); // Last 12 months

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                withdrawnAmount,
                pendingWithdrawal,
                availableBalance,
                monthlyRevenue: monthlyRevenueArray
            }
        });
    } catch (error) {
        console.error('getRevenueStats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Request a withdrawal
 * POST /api/v1/teacher/withdrawals
 */
const requestWithdrawal = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { amount, bank_name, bank_account, bank_holder_name } = req.body;

        const teacher = await Teacher.findOne({ where: { account_id: accountId } });
        if (!teacher) {
            return res.status(400).json({ success: false, message: 'Teacher profile not found' });
        }

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Số tiền rút phải lớn hơn 0' });
        }

        // Calculate available balance
        const courses = await Course.findAll({
            where: { teacher_id: teacher.id },
            attributes: ['id']
        });
        const courseIds = courses.map(c => c.id);

        let totalRevenue = 0;
        if (courseIds.length > 0) {
            const orderItems = await OrderItem.findAll({
                where: { course_id: { [Op.in]: courseIds } },
                include: [{
                    model: Order,
                    as: 'order',
                    where: { status: 'completed' }
                }]
            });
            orderItems.forEach(item => {
                totalRevenue += parseFloat(item.price || 0);
            });
        }

        const withdrawnAmount = await Withdrawal.sum('amount', {
            where: {
                teacher_id: teacher.id,
                status: { [Op.in]: ['approved', 'paid', 'pending'] }
            }
        }) || 0;

        const availableBalance = totalRevenue - withdrawnAmount;

        if (amount > availableBalance) {
            return res.status(400).json({
                success: false,
                message: `Số dư khả dụng không đủ. Bạn có thể rút tối đa ${availableBalance.toLocaleString('vi-VN')}đ`
            });
        }

        // Create withdrawal request
        const withdrawal = await Withdrawal.create({
            teacher_id: teacher.id,
            amount,
            bank_name: bank_name || '',
            bank_account: bank_account || '',
            bank_holder_name: bank_holder_name || '',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Yêu cầu rút tiền đã được gửi, chờ admin xét duyệt',
            data: withdrawal
        });
    } catch (error) {
        console.error('requestWithdrawal error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get withdrawal history
 * GET /api/v1/teacher/withdrawals
 */
const getWithdrawals = async (req, res) => {
    try {
        const accountId = req.user.id;
        const teacher = await Teacher.findOne({ where: { account_id: accountId } });

        if (!teacher) {
            return res.status(200).json({ success: true, data: [] });
        }

        const withdrawals = await Withdrawal.findAll({
            where: { teacher_id: teacher.id },
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: withdrawals });
    } catch (error) {
        console.error('getWithdrawals error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getMyCourses,
    getTeacherProfile,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    getMyOfflineClasses,
    getCourseStudents,
    getPendingEnrollmentRequests,
    submitCourseForReview,
    submitExamForReview,
    getCourseModules,
    createModule,
    updateModule,
    deleteModule,
    getRevenueStats,
    requestWithdrawal,
    getWithdrawals
};
