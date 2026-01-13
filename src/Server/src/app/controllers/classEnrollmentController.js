/**
 * Class Enrollment Controller
 * Handles offline class enrollment requests and approvals
 */

const db = require('../models');
const { ClassEnrollment, OfflineClass, Account, Learner } = db;
const { Op } = require('sequelize');

/**
 * Request to join an offline class
 * POST /api/v1/class-enrollments/request
 */
const requestEnrollment = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { classId, note } = req.body;

        if (!classId) {
            return res.status(400).json({ success: false, message: 'classId is required' });
        }

        // Check if class exists
        const offlineClass = await OfflineClass.findByPk(classId);
        if (!offlineClass) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        }

        // Check if already enrolled or pending
        const existing = await ClassEnrollment.findOne({
            where: { class_id: classId, learner_account_id: accountId }
        });

        if (existing) {
            if (existing.status === 'approved') {
                return res.status(400).json({ success: false, message: 'Bạn đã tham gia lớp học này' });
            } else if (existing.status === 'pending') {
                return res.status(400).json({ success: false, message: 'Yêu cầu của bạn đang chờ duyệt' });
            } else if (existing.status === 'rejected') {
                // Allow re-request if previously rejected
                await existing.update({ status: 'pending', requested_at: new Date(), note });
                return res.status(200).json({
                    success: true,
                    message: 'Đã gửi lại yêu cầu tham gia',
                    data: existing
                });
            }
        }

        // Create new enrollment request
        const enrollment = await ClassEnrollment.create({
            class_id: classId,
            learner_account_id: accountId,
            note
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu tham gia lớp học',
            data: enrollment
        });
    } catch (error) {
        console.error('requestEnrollment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get my enrollment requests (for learner)
 * GET /api/v1/class-enrollments/my-requests
 */
const getMyRequests = async (req, res) => {
    try {
        const accountId = req.user.id;

        const enrollments = await ClassEnrollment.findAll({
            where: { learner_account_id: accountId },
            include: [{
                model: OfflineClass,
                as: 'offlineClass',
                attributes: ['id', 'class_name', 'address', 'schedule_text', 'price', 'thumbnail_url', 'status']
            }],
            order: [['requested_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: enrollments.map(e => ({
                id: e.id,
                classId: e.class_id,
                status: e.status,
                requestedAt: e.requested_at,
                reviewedAt: e.reviewed_at,
                offlineClass: e.offlineClass
            }))
        });
    } catch (error) {
        console.error('getMyRequests error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get enrollment requests for teacher's classes
 * GET /api/v1/class-enrollments/teacher-pending
 */
const getTeacherPendingRequests = async (req, res) => {
    try {
        const accountId = req.user.id;

        // Get all pending enrollments for classes taught by this teacher
        const enrollments = await ClassEnrollment.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: OfflineClass,
                    as: 'offlineClass',
                    where: { teacher_id: accountId },
                    attributes: ['id', 'class_name', 'thumbnail_url']
                },
                {
                    model: Account,
                    as: 'learner',
                    attributes: ['id', 'email'],
                    include: [{
                        model: Learner,
                        as: 'learnerInfo',
                        attributes: ['full_name', 'avatar_url', 'phone_number']
                    }]
                }
            ],
            order: [['requested_at', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: enrollments.map(e => ({
                id: e.id,
                classId: e.class_id,
                className: e.offlineClass?.class_name,
                classThumbnail: e.offlineClass?.thumbnail_url,
                learner: {
                    accountId: e.learner?.id,
                    email: e.learner?.email,
                    name: e.learner?.learnerInfo?.full_name || 'Unknown',
                    avatar: e.learner?.learnerInfo?.avatar_url,
                    phone: e.learner?.learnerInfo?.phone_number
                },
                note: e.note,
                requestedAt: e.requested_at
            }))
        });
    } catch (error) {
        console.error('getTeacherPendingRequests error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Approve enrollment request
 * PUT /api/v1/class-enrollments/:id/approve
 */
const approveEnrollment = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { id } = req.params;

        const enrollment = await ClassEnrollment.findByPk(id, {
            include: [{
                model: OfflineClass,
                as: 'offlineClass'
            }]
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        // Check if teacher owns this class
        if (enrollment.offlineClass.teacher_id !== accountId) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền duyệt yêu cầu này' });
        }

        // Check if class has capacity
        const offlineClass = enrollment.offlineClass;
        if (offlineClass.current_enrolled >= offlineClass.capacity) {
            return res.status(400).json({
                success: false,
                message: `Lớp đã đạt sĩ số tối đa (${offlineClass.capacity} học viên). Không thể duyệt thêm.`
            });
        }

        await enrollment.update({
            status: 'approved',
            reviewed_at: new Date()
        });

        // Increment current_enrolled count
        await enrollment.offlineClass.increment('current_enrolled');

        // Send notification to learner
        const { sendNotification } = require('./notificationController');
        await sendNotification(enrollment.learner_account_id, {
            title: '✅ Đã được duyệt tham gia lớp học!',
            message: `Yêu cầu tham gia lớp "${offlineClass.class_name}" đã được chấp nhận. Hãy chuẩn bị đến lớp đúng giờ!`,
            type: 'success',
            category: 'enrollment',
            related_id: enrollment.class_id,
            related_type: 'offline_class',
            action_url: '/my-classes'
        }, accountId);

        res.status(200).json({
            success: true,
            message: 'Đã duyệt yêu cầu tham gia',
            data: enrollment
        });
    } catch (error) {
        console.error('approveEnrollment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reject enrollment request
 * PUT /api/v1/class-enrollments/:id/reject
 */
const rejectEnrollment = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { id } = req.params;

        const enrollment = await ClassEnrollment.findByPk(id, {
            include: [{
                model: OfflineClass,
                as: 'offlineClass'
            }]
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        // Check if teacher owns this class
        if (enrollment.offlineClass.teacher_id !== accountId) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền từ chối yêu cầu này' });
        }

        await enrollment.update({
            status: 'rejected',
            reviewed_at: new Date()
        });

        // Send notification to learner
        const { sendNotification } = require('./notificationController');
        await sendNotification(enrollment.learner_account_id, {
            title: '❌ Yêu cầu tham gia bị từ chối',
            message: `Yêu cầu tham gia lớp "${enrollment.offlineClass.class_name}" đã bị từ chối.`,
            type: 'warning',
            category: 'enrollment',
            related_id: enrollment.class_id,
            related_type: 'offline_class',
            action_url: '/offline-classes'
        }, accountId);

        res.status(200).json({
            success: true,
            message: 'Đã từ chối yêu cầu tham gia',
            data: enrollment
        });
    } catch (error) {
        console.error('rejectEnrollment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get approved enrollments (classes user is enrolled in)
 * GET /api/v1/class-enrollments/enrolled
 */
const getEnrolledClasses = async (req, res) => {
    try {
        const accountId = req.user.id;

        const enrollments = await ClassEnrollment.findAll({
            where: {
                learner_account_id: accountId,
                status: 'approved'
            },
            include: [{
                model: OfflineClass,
                as: 'offlineClass',
                include: [{
                    model: Account,
                    as: 'teacher',
                    attributes: ['id', 'email']
                }]
            }],
            order: [['reviewed_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: enrollments.map(e => ({
                id: e.id,
                enrolledAt: e.reviewed_at,
                offlineClass: e.offlineClass
            }))
        });
    } catch (error) {
        console.error('getEnrolledClasses error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    requestEnrollment,
    getMyRequests,
    getTeacherPendingRequests,
    approveEnrollment,
    rejectEnrollment,
    getEnrolledClasses
};
