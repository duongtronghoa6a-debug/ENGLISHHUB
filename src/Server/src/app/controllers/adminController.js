const db = require('../models');
const { Account, Course, Teacher, Learner, Enrollment, Exam, Order, Question, Lesson } = db;
const HttpError = require('http-errors');
const { Op } = require('sequelize');

// 1. [GET] /admin/dashboard-stats - Dashboard stats
exports.getDashboardStats = async (req, res, next) => {
    try {
        const [totalUsers, totalCourses, totalTeachers, totalLearners, totalExams] = await Promise.all([
            Account.count(),
            Course.count({ where: { is_published: true } }),
            Teacher.count(),
            Learner.count(),
            Exam.count()
        ]);

        // Count pending teachers (accounts waiting to be approved as teacher)
        const pendingTeachers = await Account.count({
            where: { role: 'teacher', is_active: false }
        });

        // Calculate total revenue from completed orders
        const completedOrders = await Order.findAll({
            where: { status: 'completed' },
            attributes: ['total_amount', 'created_at']
        });

        const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        // This month revenue
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthRevenue = completedOrders
            .filter(order => new Date(order.created_at) >= startOfMonth)
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalCourses,
                totalTeachers,
                totalLearners,
                totalExams,
                pendingTeachers,
                pendingRefunds: 0, // Future feature
                pendingActions: pendingTeachers,
                totalRevenue,
                thisMonthRevenue
            }
        });
    } catch (error) {
        next(error);
    }
};

// 2. [GET] /admin/pending-actions - Get pending actions
exports.getPendingActions = async (req, res, next) => {
    try {
        // Get pending teacher approvals
        const pendingTeacherAccounts = await Account.findAll({
            where: { role: 'teacher', is_active: false },
            limit: 10,
            order: [['created_at', 'DESC']]
        });

        const actions = pendingTeacherAccounts.map(account => ({
            type: 'TEACHER_APPROVAL',
            id: account.id,
            title: `Yêu cầu duyệt giáo viên: ${account.email}`,
            date: account.created_at
        }));

        res.status(200).json({
            success: true,
            actions
        });
    } catch (error) {
        next(error);
    }
};

// 3. [GET] /admin/users - User management with pagination
exports.getAllAccounts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (search) {
            whereClause.email = { [Op.iLike]: `%${search}%` };
        }
        if (role) {
            whereClause.role = role;
        }

        // Get paginated data
        const { count, rows } = await Account.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: { exclude: ['password_hash'] },
            order: [['created_at', 'DESC']],
            include: [
                { model: Learner, as: 'learnerInfo', attributes: ['full_name'] },
                { model: Teacher, as: 'teacherInfo', attributes: ['full_name'] }
            ]
        });

        // Get role counts for stats (always from entire database)
        const [learnerCount, teacherCount, adminCount, activeCount] = await Promise.all([
            Account.count({ where: { role: 'learner' } }),
            Account.count({ where: { role: 'teacher' } }),
            Account.count({ where: { role: 'admin' } }),
            Account.count({ where: { is_active: true } })
        ]);

        // Map data to include full_name from profile
        const mappedData = rows.map(account => {
            const accountJson = account.toJSON();
            const profile = accountJson.learnerInfo || accountJson.teacherInfo;
            return {
                ...accountJson,
                full_name: profile?.full_name || null
            };
        });

        res.status(200).json({
            success: true,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            stats: {
                learners: learnerCount,
                teachers: teacherCount,
                admins: adminCount,
                active: activeCount
            },
            data: mappedData
        });
    } catch (error) {
        next(error);
    }
};

// 4. [PATCH] /admin/users/:id/status - Update account status
exports.updateAccountStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            throw HttpError(400, 'is_active must be a boolean');
        }

        // Prevent admin from locking themselves
        if (req.user && id === req.user.id) {
            throw HttpError(403, 'You cannot modify your own account status');
        }

        const account = await Account.findByPk(id);
        if (!account) {
            throw HttpError(404, 'Account not found');
        }

        await account.update({ is_active });

        res.status(200).json({
            success: true,
            message: `Account has been ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: {
                id,
                is_active
            }
        });
    } catch (error) {
        next(error);
    }
};

// 5. [GET] /admin/pending-reviews - Get pending course, exam, and offline class reviews
exports.getPendingReviews = async (req, res, next) => {
    try {
        const { OfflineClass } = db;

        // Get courses pending review
        const pendingCourses = await Course.findAll({
            where: { approval_status: 'pending_review' },
            include: [{
                model: Teacher,
                as: 'teacher',
                include: [{
                    model: Account,
                    as: 'account',
                    attributes: ['email']
                }]
            }],
            order: [['updated_at', 'DESC']]
        });

        // Get exams pending review (if exam has approval_status)
        let pendingExams = [];
        try {
            pendingExams = await Exam.findAll({
                where: { approval_status: 'pending_review' },
                limit: 20
            });
        } catch (e) {
            // approval_status may not exist on Exam model
        }

        // Get offline classes pending review (if has approval_status)
        let pendingOffline = [];
        try {
            pendingOffline = await OfflineClass.findAll({
                where: { approval_status: 'pending_review' },
                limit: 20
            });
        } catch (e) {
            // approval_status may not exist on OfflineClass model
        }

        res.status(200).json({
            success: true,
            data: {
                courses: pendingCourses.map(c => ({
                    id: c.id,
                    title: c.title,
                    type: 'course',
                    teacherEmail: c.teacher?.account?.email || 'N/A',
                    teacherName: c.teacher?.full_name || 'N/A',
                    submittedAt: c.updated_at,
                    thumbnail: c.thumbnail_url
                })),
                exams: pendingExams,
                offlineClasses: pendingOffline
            }
        });
    } catch (error) {
        next(error);
    }
};

// 6. [PUT] /admin/courses/:id/approve - Approve course
exports.approveCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [{ model: Teacher, as: 'teacher' }]
        });
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        await course.update({
            approval_status: 'approved',
            is_published: true,
            rejection_reason: null
        });

        // Send notification to teacher
        if (course.teacher?.account_id) {
            const { sendNotification } = require('./notificationController');
            await sendNotification(course.teacher.account_id, {
                title: '✅ Khóa học đã được duyệt!',
                message: `Khóa học "${course.title}" của bạn đã được admin duyệt và xuất bản thành công.`,
                type: 'success',
                category: 'course_review',
                related_id: course.id,
                related_type: 'course',
                action_url: `/teacher/courses/${course.id}`
            }, req.user.id);
        }

        res.status(200).json({
            success: true,
            message: 'Khóa học đã được duyệt và xuất bản',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// 7. [PUT] /admin/courses/:id/reject - Reject course
exports.rejectCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const course = await Course.findByPk(id, {
            include: [{ model: Teacher, as: 'teacher' }]
        });
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        const rejectionReason = reason || 'Không đạt yêu cầu';
        await course.update({
            approval_status: 'rejected',
            rejection_reason: rejectionReason
        });

        // Send notification to teacher
        if (course.teacher?.account_id) {
            const { sendNotification } = require('./notificationController');
            await sendNotification(course.teacher.account_id, {
                title: '❌ Khóa học bị từ chối',
                message: `Khóa học "${course.title}" đã bị từ chối. Lý do: ${rejectionReason}`,
                type: 'warning',
                category: 'course_review',
                related_id: course.id,
                related_type: 'course',
                action_url: `/teacher/courses/${course.id}`
            }, req.user.id);
        }

        res.status(200).json({
            success: true,
            message: 'Khóa học đã bị từ chối',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// ========== COURSE CRUD ==========

// 8. [POST] /admin/courses - Create course
exports.createCourse = async (req, res, next) => {
    try {
        const { title, description, price, level, teacher_id, thumbnail_url, is_published } = req.body;

        if (!title) {
            throw HttpError(400, 'Title is required');
        }

        const course = await Course.create({
            title,
            description: description || '',
            price: price || 0,
            level: level || 'A1',
            teacher_id: teacher_id || null,
            created_by: req.user.id,
            thumbnail_url: thumbnail_url || null,
            is_published: is_published !== undefined ? is_published : true,
            status: 'published',
            approval_status: 'approved'
        });

        res.status(201).json({ success: true, message: 'Course created', data: course });
    } catch (error) {
        next(error);
    }
};

// 9. [PUT] /admin/courses/:id - Update course
exports.updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const course = await Course.findByPk(id);
        if (!course) {
            throw HttpError(404, 'Course not found');
        }

        await course.update(updates);
        res.status(200).json({ success: true, message: 'Course updated', data: course });
    } catch (error) {
        next(error);
    }
};

// 10. [DELETE] /admin/courses/:id - Delete course
exports.deleteCourse = async (req, res, next) => {
    let t;
    try {
        t = await db.sequelize.transaction();
        const { id } = req.params;

        const course = await Course.findByPk(id);
        if (!course) {
            await t.rollback();
            throw HttpError(404, 'Course not found');
        }

        // Check if course has been ordered (OrderItem)
        const orderCount = await db.OrderItem.count({ where: { course_id: id } });
        if (orderCount > 0) {
            await t.rollback();
            throw HttpError(400, 'Cannot delete course that has been ordered. Please archive it instead.');
        }

        // Get lesson IDs for this course
        const lessons = await db.Lesson.findAll({ where: { course_id: id }, attributes: ['id'], transaction: t });
        const lessonIds = lessons.map(l => l.id);

        // Get enrollment IDs for this course
        const enrollments = await db.Enrollment.findAll({ where: { course_id: id }, attributes: ['id'], transaction: t });
        const enrollmentIds = enrollments.map(e => e.id);

        // Delete LearningProgress (depends on lesson_id and enrollment_id)
        if (lessonIds.length > 0) {
            await db.LearningProgress.destroy({ where: { lesson_id: lessonIds }, transaction: t });
            // Delete TestSession and SpeakingResult (depend on lesson_id)
            await db.TestSession.destroy({ where: { lesson_id: lessonIds }, transaction: t });
            await db.SpeakingResult.destroy({ where: { lesson_id: lessonIds }, transaction: t });
        }
        if (enrollmentIds.length > 0) {
            await db.LearningProgress.destroy({ where: { enrollment_id: enrollmentIds }, transaction: t });
        }

        // Note: Exams are NOT linked to courses via course_id - they are standalone entities
        // So we don't need to delete exams when deleting a course

        // Now delete direct dependencies
        await Promise.all([
            db.Lesson.destroy({ where: { course_id: id }, transaction: t }),
            db.Enrollment.destroy({ where: { course_id: id }, transaction: t }),
            db.Review.destroy({ where: { course_id: id }, transaction: t }),
            db.CartItem.destroy({ where: { course_id: id }, transaction: t })
        ]);

        // Delete Modules
        await db.Module.destroy({ where: { course_id: id }, transaction: t });

        // Delete OfflineSchedule (has course_id FK)
        await db.OfflineSchedule.destroy({ where: { course_id: id }, transaction: t });

        // Finally delete the course
        await course.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: 'Course and all related data deleted successfully' });
    } catch (error) {
        console.error('[deleteCourse] Error:', error.message);
        console.error('[deleteCourse] Stack:', error.stack);
        console.error('[deleteCourse] Full error:', error);
        if (t) await t.rollback();
        next(error);
    }
};

// 11. [GET] /admin/courses - Get all courses with pagination
exports.getAllCourses = async (req, res, next) => {
    try {
        const { limit = 20, page = 1, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status === 'published') where.approval_status = 'approved';
        if (status === 'draft') where.approval_status = 'draft';
        if (status === 'pending') where.approval_status = 'pending_review';
        if (status === 'approved') where.approval_status = 'approved';
        // Note: tab "all" (status undefined) returns ALL courses including drafts for admin

        const { count, rows } = await Course.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name'] }
            ]
        });

        // Get stats for all courses (not filtered)
        const [totalAll, totalPending, totalApproved, totalDraft] = await Promise.all([
            Course.count(),
            Course.count({ where: { approval_status: 'pending_review' } }),
            Course.count({ where: { approval_status: 'approved' } }),
            Course.count({ where: { approval_status: 'draft' } })
        ]);

        // Map rows to include teacher name (fallback to 'Admin' if no teacher)
        const coursesWithTeacher = rows.map(course => {
            const courseData = course.toJSON();
            if (!courseData.teacher) {
                courseData.teacher = { full_name: 'ENGLISH HUB' };
            }
            return courseData;
        });

        res.status(200).json({
            success: true,
            data: coursesWithTeacher,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            stats: {
                total: totalAll,
                pending: totalPending,
                published: totalApproved,
                draft: totalDraft
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========== USER CRUD ==========

// 12. [POST] /admin/users - Create user
exports.createUser = async (req, res, next) => {
    try {
        const { email, password, role, full_name } = req.body;

        if (!email || !password) {
            throw HttpError(400, 'Email and password are required');
        }

        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(password, 10);

        const account = await Account.create({
            email,
            password_hash: hash,
            role: role || 'learner',
            is_active: true
        });

        // Create profile based on role
        if (role === 'teacher') {
            await Teacher.create({ account_id: account.id, full_name: full_name || email.split('@')[0] });
        } else if (role === 'learner') {
            await Learner.create({ account_id: account.id, full_name: full_name || email.split('@')[0], current_xp: 0, current_streak: 0 });
        }

        res.status(201).json({ success: true, message: 'User created', data: { id: account.id, email: account.email, role: account.role } });
    } catch (error) {
        next(error);
    }
};

// 13. [DELETE] /admin/users/:id - Delete user
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const account = await Account.findByPk(id);
        if (!account) {
            throw HttpError(404, 'User not found');
        }

        await account.destroy();
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};

// 14. [PUT] /admin/users/:id - Update user
exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, is_active } = req.body;

        const account = await Account.findByPk(id);
        if (!account) {
            throw HttpError(404, 'User not found');
        }

        await account.update({
            role: role !== undefined ? role : account.role,
            is_active: is_active !== undefined ? is_active : account.is_active
        });

        res.status(200).json({ success: true, message: 'User updated', data: account });
    } catch (error) {
        next(error);
    }
};

// ========== EXAM CRUD ==========

// 14. [POST] /admin/exams - Create exam
exports.createExam = async (req, res, next) => {
    try {
        const { title, description, duration_minutes, course_id, skill } = req.body;

        if (!title) {
            throw HttpError(400, 'Title is required');
        }

        const exam = await Exam.create({
            title,
            description: description || '',
            duration_minutes: duration_minutes || 60,
            course_id: course_id || null,
            skill: skill || 'reading',
            creator_id: req.user.id  // Add creator_id from current logged in user
        });

        res.status(201).json({ success: true, message: 'Exam created', data: exam });
    } catch (error) {
        next(error);
    }
};

// 15. [DELETE] /admin/exams/:id - Delete exam
exports.deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            throw HttpError(404, 'Exam not found');
        }

        await exam.destroy();
        res.status(200).json({ success: true, message: 'Exam deleted' });
    } catch (error) {
        next(error);
    }
};

// 16. [GET] /admin/exams - Get all exams
exports.getAllExams = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause.title = { [Op.iLike]: `%${search}%` };
        }
        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Exam.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// 17. [PUT] /admin/exams/:id - Update exam
exports.updateExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, duration_minutes, status } = req.body;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            throw HttpError(404, 'Exam not found');
        }

        await exam.update({
            title: title !== undefined ? title : exam.title,
            description: description !== undefined ? description : exam.description,
            duration_minutes: duration_minutes !== undefined ? duration_minutes : exam.duration_minutes,
            status: status !== undefined ? status : exam.status
        });

        res.status(200).json({ success: true, message: 'Exam updated', data: exam });
    } catch (error) {
        next(error);
    }
};

// 17b. [PUT] /admin/exams/:id/approve - Approve exam
exports.approveExam = async (req, res, next) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            throw HttpError(404, 'Exam not found');
        }

        await exam.update({
            approval_status: 'approved',
            status: 'published',
            rejection_reason: null
        });

        // Send notification to creator
        const { sendNotification } = require('./notificationController');
        await sendNotification(exam.creator_id, {
            title: '✅ Đề thi đã được duyệt!',
            message: `Đề thi "${exam.title}" của bạn đã được admin duyệt và xuất bản thành công.`,
            type: 'success',
            category: 'exam_review',
            related_id: exam.id,
            related_type: 'exam',
            action_url: `/teacher/exams`
        }, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Đề thi đã được duyệt và xuất bản',
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// 17c. [PUT] /admin/exams/:id/reject - Reject exam
exports.rejectExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            throw HttpError(404, 'Exam not found');
        }

        const rejectionReason = reason || 'Không đạt yêu cầu';
        await exam.update({
            approval_status: 'rejected',
            rejection_reason: rejectionReason
        });

        // Send notification to creator
        const { sendNotification } = require('./notificationController');
        await sendNotification(exam.creator_id, {
            title: '❌ Đề thi bị từ chối',
            message: `Đề thi "${exam.title}" đã bị từ chối. Lý do: ${rejectionReason}`,
            type: 'warning',
            category: 'exam_review',
            related_id: exam.id,
            related_type: 'exam',
            action_url: `/teacher/exams`
        }, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Đề thi đã bị từ chối',
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// ========== QUESTION CRUD ==========

// 18. [GET] /admin/exams/:examId/questions - Get questions for an exam
exports.getExamQuestions = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await Exam.findByPk(examId);
        if (!exam) throw HttpError(404, 'Exam not found');

        const questionIds = exam.list_question_ids || [];
        const questions = await Question.findAll({
            where: { id: questionIds },
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

// 19. [POST] /admin/exams/:examId/questions - Add question to exam
exports.addQuestionToExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { content_text, skill, type, level, options, correct_answer } = req.body;

        const exam = await Exam.findByPk(examId);
        if (!exam) throw HttpError(404, 'Exam not found');

        // Create question
        const question = await Question.create({
            creator_id: req.user.id,
            content_text,
            skill: skill || 'reading',
            type: type || 'multiple_choice',
            level: level || 'B1',
            options: options || [],
            correct_answer: correct_answer || '0'
        });

        // Add to exam's question list
        const currentIds = exam.list_question_ids || [];
        await exam.update({
            list_question_ids: [...currentIds, question.id]
        });

        res.status(201).json({ success: true, message: 'Question added', data: question });
    } catch (error) {
        next(error);
    }
};

// 20. [DELETE] /admin/exams/:examId/questions/:questionId - Remove question from exam
exports.removeQuestionFromExam = async (req, res, next) => {
    try {
        const { examId, questionId } = req.params;

        const exam = await Exam.findByPk(examId);
        if (!exam) throw HttpError(404, 'Exam not found');

        // Remove from list
        const currentIds = exam.list_question_ids || [];
        await exam.update({
            list_question_ids: currentIds.filter(id => id !== questionId)
        });

        // Optionally delete the question itself
        await Question.destroy({ where: { id: questionId } });

        res.status(200).json({ success: true, message: 'Question removed' });
    } catch (error) {
        next(error);
    }
};

// ========== COURSE LESSONS ==========

// 21. [GET] /admin/courses/:courseId/lessons - Get any course's lessons (admin only)
exports.getCourseLessons = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // Fetch course with teacher and creator
        const course = await Course.findByPk(courseId, {
            include: [
                { model: Teacher, as: 'teacher' }
            ]
        });

        if (!course) throw HttpError(404, 'Course not found');

        // Fetch lessons separately
        const lessons = await Lesson.findAll({
            where: { course_id: courseId },
            order: [['order_index', 'ASC']]
        });

        // Get teacher name or fallback to 'Admin'
        const teacherName = course.teacher?.full_name || 'ENGLISH HUB';

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    teacher: {
                        full_name: teacherName
                    }
                },
                lessons: lessons || []
            }
        });
    } catch (error) {
        console.error('getCourseLessons error:', error);
        next(error);
    }
};

// 22. [POST] /admin/courses/:courseId/lessons - Add lesson to any course
exports.addLessonToCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { title, content_type, content_url, duration, order_index } = req.body;

        const course = await Course.findByPk(courseId);
        if (!course) throw HttpError(404, 'Course not found');

        const lesson = await Lesson.create({
            course_id: courseId,
            title,
            content_type: content_type || 'video',
            content_url: content_url || '',
            duration: duration || 0,
            order_index: order_index || 0
        });

        res.status(201).json({ success: true, data: lesson });
    } catch (error) {
        console.error('addLessonToCourse error:', error);
        next(error);
    }
};

// 23. [DELETE] /admin/courses/:courseId/lessons/:lessonId - Delete lesson
exports.deleteLesson = async (req, res, next) => {
    try {
        const { courseId, lessonId } = req.params;

        const lesson = await Lesson.findOne({
            where: { id: lessonId, course_id: courseId }
        });

        if (!lesson) throw HttpError(404, 'Lesson not found');

        await lesson.destroy();

        res.status(200).json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        console.error('deleteLesson error:', error);
        next(error);
    }
};