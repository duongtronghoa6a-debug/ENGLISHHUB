const { Account, Learner, Admin, Teacher, Achievement } = require('../models');
const HttpError = require('http-errors');

exports.getProfile = async (req, res, next) => {
    try {
        const { id, role } = req.user;

        let account = await Account.findByPk(id, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!account) {
            throw HttpError(404, 'User not found');
        }

        // Use lowercase role comparison to match JWT token format
        const lowerRole = role?.toLowerCase();

        // Build profile object that frontend expects
        let profileInfo = null;
        let stats = null;

        if (lowerRole === 'learner') {
            const learnerDetails = await Learner.findOne({ where: { account_id: id } });

            if (learnerDetails) {
                // Get stats from Achievement table (same source as GamificationPage)
                // Achievement uses account_id, not learner_id
                const achievement = await Achievement.findOne({ where: { account_id: id } });

                profileInfo = {
                    full_name: learnerDetails.full_name,
                    phone: learnerDetails.phone_number,
                    address: learnerDetails.address,
                    avatar_url: learnerDetails.avatar_url
                };
                stats = {
                    total_xp: achievement?.total_score || learnerDetails.current_xp || 0,
                    current_streak: achievement?.current_streak || learnerDetails.current_streak || 0,
                    longest_streak: achievement?.max_streak || 0
                };
            }
        } else if (lowerRole === 'teacher') {
            const teacherDetails = await Teacher.findOne({ where: { account_id: id } });
            if (teacherDetails) {
                profileInfo = {
                    full_name: teacherDetails.full_name,
                    phone: teacherDetails.phone,
                    bio: teacherDetails.bio,
                    specialization: teacherDetails.specialization,
                    avatar_url: teacherDetails.avatar_url
                };
            }
        } else if (lowerRole === 'admin') {
            const adminDetails = await Admin.findOne({ where: { account_id: id } });
            if (adminDetails) {
                profileInfo = {
                    full_name: adminDetails.full_name,
                    avatar_url: adminDetails.avatar_url
                };
            }
        }

        res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: {
                id: account.id,
                email: account.email,
                role: account.role,
                status: account.is_active ? 'active' : 'inactive',
                profile: profileInfo,
                stats: stats
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { id, role } = req.user;
        const { full_name, phone, bio, specialization, avatar } = req.body;

        console.log('=== UPDATE PROFILE DEBUG ===');
        console.log('User ID:', id);
        console.log('Role from JWT:', role);
        console.log('Request body:', req.body);

        let account = await Account.findByPk(id);

        if (!account) {
            throw HttpError(404, 'User not found');
        }

        // Normalize role to lowercase
        const lowerRole = role?.toLowerCase();
        console.log('Normalized role:', lowerRole);

        // Profile data goes to role-specific table, not Account table
        // Map request fields to actual model column names
        const profileUpdates = {};
        if (full_name !== undefined) profileUpdates.full_name = full_name;
        if (phone !== undefined) profileUpdates.phone_number = phone; // Learner uses phone_number
        if (avatar !== undefined) profileUpdates.avatar_url = avatar; // Learner uses avatar_url

        console.log('Profile updates:', profileUpdates);

        // Update the role-specific profile table
        let updateResult;
        if (Object.keys(profileUpdates).length > 0) {
            if (lowerRole === 'learner') {
                // First, ensure Learner record exists (create if not)
                const [learner, created] = await Learner.findOrCreate({
                    where: { account_id: id },
                    defaults: { account_id: id, full_name: full_name || '', current_xp: 0, current_streak: 0 }
                });
                if (created) {
                    console.log('Created new Learner record for account:', id);
                }
                // Now update the Learner record
                updateResult = await Learner.update(profileUpdates, { where: { account_id: id } });
                console.log('Learner update result:', updateResult);
            } else if (lowerRole === 'teacher') {
                const teacherUpdates = {};
                if (full_name !== undefined) teacherUpdates.full_name = full_name;
                if (phone !== undefined) teacherUpdates.phone = phone;
                if (bio !== undefined) teacherUpdates.bio = bio;
                if (specialization !== undefined) teacherUpdates.specialization = specialization;
                if (avatar !== undefined) teacherUpdates.avatar_url = avatar;
                // First, ensure Teacher record exists
                await Teacher.findOrCreate({
                    where: { account_id: id },
                    defaults: { account_id: id, full_name: full_name || '' }
                });
                updateResult = await Teacher.update(teacherUpdates, { where: { account_id: id } });
                console.log('Teacher update result:', updateResult);
            } else if (lowerRole === 'admin') {
                // First, ensure Admin record exists
                await Admin.findOrCreate({
                    where: { account_id: id },
                    defaults: { account_id: id, full_name: full_name || '' }
                });
                updateResult = await Admin.update(profileUpdates, { where: { account_id: id } });
                console.log('Admin update result:', updateResult);
            } else {
                console.log('No matching role found! Role was:', lowerRole);
            }
        } else {
            console.log('No updates to apply (profileUpdates is empty)');
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        next(error);
    }
};