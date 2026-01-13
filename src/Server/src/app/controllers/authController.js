const { Account, Learner, Teacher, Admin, SystemSetting, LoginSession, ActivityLog } = require('../models');
const HttpError = require('http-errors');
const { signAuth } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../../utils/emailService');

// Helper to parse device info from user-agent
const parseDeviceInfo = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'Tablet';
    }

    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    // Detect OS
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os') || ua.includes('macos')) os = 'MacOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { deviceType, browser, os, device_info: `${browser} on ${os}` };
};

exports.register = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        // 1. Check if registration is allowed
        if (SystemSetting) {
            const allowRegistration = await SystemSetting.getValue('allow_registration', true);
            if (!allowRegistration) {
                throw HttpError(403, 'Đăng ký tạm thời bị tắt. Vui lòng liên hệ admin.');
            }
        }

        // 2. Validate 
        if (!email || !password) throw HttpError(400, 'Email and Password are required');

        const existingUser = await Account.findOne({ where: { email } });
        if (existingUser) throw HttpError(409, 'Email already exists');

        // 3. ma hoa mk -> tao account
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Xác định vai trò và bảng profile tương ứng
        let finalRole;
        let userRole = role ? role.toUpperCase() : 'LEARNER';
        if (userRole === 'TEACHER') {
            finalRole = 'TEACHER';
        } else if (userRole === 'ADMIN') {
            finalRole = 'ADMIN';
        } else {
            finalRole = 'LEARNER';
        }

        // Check auto-approve teacher setting
        let isActive = true;
        if (userRole === 'TEACHER' && SystemSetting) {
            const autoApprove = await SystemSetting.getValue('auto_approve_teachers', false);
            if (!autoApprove) {
                isActive = false; // Teacher needs admin approval
            }
        }

        const newUser = await Account.create({
            email,
            password_hash: hashedPassword,
            role: finalRole.toLowerCase(),
            is_active: isActive
        });

        // 4. tao profile
        let userProfile = null;
        if (userRole === 'LEARNER') {
            userProfile = await Learner.create({
                account_id: newUser.id,
                full_name: email.split('@')[0],
                english_level: 'A2'
            });
        } else if (userRole === 'TEACHER') {
            userProfile = await Teacher.create({
                account_id: newUser.id,
                full_name: email.split('@')[0],
                bio: 'New teacher'
            });
        } else if (userRole === 'ADMIN') {
            userProfile = await Admin.create({
                account_id: newUser.id,
                full_name: email.split('@')[0]
            });
        }

        // Log activity
        if (ActivityLog) {
            await ActivityLog.log({
                account_id: newUser.id,
                action: 'register',
                action_type: 'success',
                description: `Đăng ký tài khoản mới - ${userRole}${!isActive ? ' (chờ duyệt)' : ''}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
        }

        // 5. tao token (chỉ nếu active)
        const token = isActive ? signAuth(newUser) : null;

        res.status(201).json({
            success: true,
            message: isActive
                ? 'Registration successful'
                : 'Đăng ký thành công! Tài khoản của bạn đang chờ admin duyệt.',
            user: { id: newUser.id, email: newUser.email, role: newUser.role, is_active: isActive },
            profile: userProfile,
            token,
            pending_approval: !isActive
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await Account.findOne({ where: { email } });

        if (!user) {
            throw HttpError(401, 'Invalid email or password');
        }

        // Check maintenance mode
        if (SystemSetting && user.role !== 'admin') {
            const maintenanceMode = await SystemSetting.getValue('maintenance_mode', false);
            if (maintenanceMode) {
                throw HttpError(503, 'Hệ thống đang bảo trì. Vui lòng quay lại sau.');
            }
        }

        if (!user.is_active) {
            throw HttpError(403, 'Your account has been locked or is pending approval.');
        }

        // 4. Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw HttpError(401, 'Invalid email or password');
        }

        // 5. Tạo token và trả về
        const token = signAuth(user);

        // 6. Create login session
        if (LoginSession) {
            const userAgent = req.headers['user-agent'] || '';
            const deviceInfo = parseDeviceInfo(userAgent);
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 32);

            try {
                // Mark all other sessions as not current
                await LoginSession.update(
                    { is_current: false },
                    { where: { account_id: user.id } }
                );

                await LoginSession.create({
                    account_id: user.id,
                    token_hash: tokenHash,
                    device_info: deviceInfo.device_info,
                    device_type: deviceInfo.deviceType,
                    browser: deviceInfo.browser,
                    os: deviceInfo.os,
                    ip_address: req.ip || req.connection?.remoteAddress,
                    is_active: true,
                    is_current: true,
                    last_activity: new Date()
                });
            } catch (sessionError) {
                console.error('Failed to create login session:', sessionError);
            }
        }

        // 7. Log activity
        if (ActivityLog) {
            await ActivityLog.log({
                account_id: user.id,
                action: 'login',
                action_type: 'success',
                description: 'Đăng nhập thành công',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        // req.user chỉ có {id, role} do middleware giải mã token
        // Ta phải dùng ID đó để hỏi Database thông tin chi tiết
        // để lấy thông tin mới nhất của account từ Database

        const { id, role } = req.user;

        // cau hinh join bang de lay profile
        let includeOptions = [];
        if (role === 'LEARNER') {
            includeOptions = [{ model: Learner, as: 'learnerProfile' }];
        } else if (role === 'TEACHER') {
            includeOptions = [{ model: Teacher, as: 'teacherProfile' }];
        } else if (role === 'ADMIN') {
            includeOptions = [{ model: Admin, as: 'adminProfile' }];
        }

        const user = await Account.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: includeOptions // kem them profile
        });

        if (!user) throw HttpError(404, 'User not found');

        res.status(200).json({
            message: 'User profile fetched successfully',
            profile: user
        });

    } catch (error) {
        next(error);
    }
};


exports.logout = async (req, res, next) => {
    try {
        // Deactivate current session if available
        if (LoginSession && req.user) {
            await LoginSession.update(
                { is_active: false },
                { where: { account_id: req.user.id, is_current: true } }
            );
        }

        // Log activity
        if (ActivityLog && req.user) {
            await ActivityLog.log({
                account_id: req.user.id,
                action: 'logout',
                action_type: 'info',
                description: 'Đăng xuất',
                ip_address: req.ip
            });
        }

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await Account.findOne({ where: { email } });

        if (!user) {
            throw HttpError(404, 'User not found with that email');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Hash token to save in DB
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // Token expires in 10 minutes
        const passwordResetExpires = Date.now() + 10 * 60 * 1000;

        user.reset_password_token = passwordResetToken;
        user.reset_password_expires = passwordResetExpires;
        await user.save();

        // Create reset URL (Frontend URL)
        // Assuming client runs on localhost:5173 or process.env.CLIENT_URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        const message = `
            You have requested a password reset. 
            Please make a PUT request to: \n\n ${resetUrl} \n\n
            This link covers 10 minutes.
        `;

        const html = `
            <h1>Password Reset</h1>
            <p>You have requested a password reset.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'EnglishHub - Password Reset Token',
                message,
                html
            });

            res.status(200).json({
                success: true,
                message: 'Token sent to email!'
            });
        } catch (err) {
            user.reset_password_token = null;
            user.reset_password_expires = null;
            await user.save();
            console.error('Email send error:', err);
            throw HttpError(500, 'There was an error sending the email. Try again later!');
        }
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash the token from param to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await Account.findOne({
            where: {
                reset_password_token: hashedToken,
                reset_password_expires: { [require('sequelize').Op.gt]: Date.now() } // Expires > Now
            }
        });

        if (!user) {
            throw HttpError(400, 'Token is invalid or has expired');
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        // Log activity
        if (ActivityLog) {
            await ActivityLog.log({
                account_id: user.id,
                action: 'reset_password',
                action_type: 'success',
                description: 'Khôi phục mật khẩu thành công',
                ip_address: req.ip
            });
        }

        // Log user in directly? Or just send success. Let's send success and token.
        const newToken = signAuth(user);

        res.status(200).json({
            success: true,
            message: 'Password reset successful!',
            token: newToken,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (error) {
        next(error);
    }
};
