/**
 * System Controller
 * Handles system settings, sessions, and activity logs
 */

const db = require('../models');
const { SystemSetting, LoginSession, ActivityLog, Account, Teacher } = db;
const { Op } = require('sequelize');

/**
 * Get public system settings (for checking maintenance mode, registration status)
 * GET /api/v1/system/settings/public
 */
exports.getPublicSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll({
            where: {
                key: {
                    [Op.in]: ['maintenance_mode', 'allow_registration', 'site_name']
                }
            }
        });

        const result = {};
        settings.forEach(s => {
            result[s.key] = s.value_type === 'boolean' ? s.value === 'true' : s.value;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('getPublicSettings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all system settings (admin only)
 * GET /api/v1/admin/system/settings
 */
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.findAll({
            order: [['key', 'ASC']]
        });

        // Convert to object
        const result = {};
        settings.forEach(s => {
            if (s.value_type === 'boolean') {
                result[s.key] = s.value === 'true';
            } else if (s.value_type === 'number') {
                result[s.key] = parseFloat(s.value);
            } else if (s.value_type === 'json') {
                try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
            } else {
                result[s.key] = s.value;
            }
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('getAllSettings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update system settings (admin only)
 * PUT /api/v1/admin/system/settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const accountId = req.user.id;

        for (const [key, value] of Object.entries(updates)) {
            const valueType = typeof value === 'boolean' ? 'boolean' :
                typeof value === 'number' ? 'number' : 'string';
            await SystemSetting.setValue(key, value, valueType);
        }

        // Log activity
        await ActivityLog.log({
            account_id: accountId,
            action: 'update_settings',
            action_type: 'success',
            description: 'Cập nhật cài đặt hệ thống',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            metadata: { updates }
        });

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get login sessions for current user or all (admin)
 * GET /api/v1/admin/sessions
 */
exports.getSessions = async (req, res) => {
    try {
        const accountId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const { user_id } = req.query;

        let where = { is_active: true };

        // Admin can view all or specific user's sessions
        if (isAdmin && user_id) {
            where.account_id = user_id;
        } else if (!isAdmin) {
            where.account_id = accountId;
        }

        const sessions = await LoginSession.findAll({
            where,
            include: [{
                model: Account,
                as: 'account',
                attributes: ['id', 'email', 'role']
            }],
            order: [['last_activity', 'DESC']]
        });

        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('getSessions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Logout a specific session
 * DELETE /api/v1/admin/sessions/:id
 */
exports.logoutSession = async (req, res) => {
    try {
        const sessionId = req.params.id;
        const accountId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const session = await LoginSession.findByPk(sessionId);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Non-admin can only logout their own sessions
        if (!isAdmin && session.account_id !== accountId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        session.is_active = false;
        await session.save();

        // Log activity
        await ActivityLog.log({
            account_id: accountId,
            action: 'logout_session',
            action_type: 'info',
            description: `Đăng xuất phiên từ ${session.device_info || 'Unknown device'}`,
            target_type: 'session',
            target_id: sessionId,
            ip_address: req.ip
        });

        res.json({ success: true, message: 'Session logged out' });
    } catch (error) {
        console.error('logoutSession error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get activity logs (admin only)
 * GET /api/v1/admin/activity-logs
 */
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, user_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let where = {};
        if (user_id) {
            where.account_id = user_id;
        }

        const logs = await ActivityLog.findAndCountAll({
            where,
            include: [{
                model: Account,
                as: 'account',
                attributes: ['id', 'email', 'role']
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: logs.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: logs.count,
                totalPages: Math.ceil(logs.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('getActivityLogs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get current user's sessions
 * GET /api/v1/account/sessions
 */
exports.getMySessions = async (req, res) => {
    try {
        const accountId = req.user.id;

        const sessions = await LoginSession.findAll({
            where: { account_id: accountId, is_active: true },
            order: [['last_activity', 'DESC']]
        });

        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('getMySessions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get current user's activity logs
 * GET /api/v1/account/activity-logs
 */
exports.getMyActivityLogs = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { limit = 10 } = req.query;

        const logs = await ActivityLog.findAll({
            where: { account_id: accountId },
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('getMyActivityLogs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
