const db = require('../models');
const { Account, Course, Teacher, Learner, Enrollment, Exam, Order } = db;
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
            where: { payment_status: 'completed' },
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

        const { count, rows } = await Account.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: { exclude: ['password_hash'] },
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            data: rows
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