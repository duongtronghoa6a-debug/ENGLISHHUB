/**
 * Streak & Leaderboard Controller
 * Handles user activity tracking, streak calculation, and leaderboard
 */

const db = require('../models');
const { UserActivity, Achievement, Account, Learner } = db;
const { Op } = require('sequelize');

/**
 * Record daily activity (called on login/page load)
 * POST /api/v1/streak/record
 */
const recordActivity = async (req, res) => {
    try {
        const accountId = req.user.id;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Find or create today's activity record
        const [activity, created] = await UserActivity.findOrCreate({
            where: { account_id: accountId, activity_date: today },
            defaults: { account_id: accountId, activity_date: today, login_count: 1 }
        });

        if (!created) {
            await activity.increment('login_count');
        }

        // Update achievement streak
        let achievement = await Achievement.findOne({ where: { account_id: accountId } });

        if (!achievement) {
            achievement = await Achievement.create({
                account_id: accountId,
                current_streak: 1,
                max_streak: 1,
                last_activity_date: today
            });
        } else {
            const lastDate = achievement.last_activity_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === today) {
                // Already recorded today, no change
            } else if (lastDate === yesterdayStr) {
                // Consecutive day - increment streak
                achievement.current_streak += 1;
                if (achievement.current_streak > achievement.max_streak) {
                    achievement.max_streak = achievement.current_streak;
                }
                achievement.last_activity_date = today;
                await achievement.save();
            } else {
                // Streak broken - reset to 1
                achievement.current_streak = 1;
                achievement.last_activity_date = today;
                await achievement.save();
            }
        }

        res.status(200).json({
            success: true,
            data: {
                currentStreak: achievement.current_streak,
                maxStreak: achievement.max_streak,
                lastActivity: achievement.last_activity_date
            }
        });
    } catch (error) {
        console.error('recordActivity error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get user's streak info
 * GET /api/v1/streak/me
 */
const getMyStreak = async (req, res) => {
    try {
        const accountId = req.user.id;

        const achievement = await Achievement.findOne({ where: { account_id: accountId } });

        // Get activity history for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activities = await UserActivity.findAll({
            where: {
                account_id: accountId,
                activity_date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
            },
            order: [['activity_date', 'DESC']]
        });

        const activeDays = activities.map(a => a.activity_date);

        res.status(200).json({
            success: true,
            data: {
                currentStreak: achievement?.current_streak || 0,
                maxStreak: achievement?.max_streak || 0,
                lastActivity: achievement?.last_activity_date || null,
                totalScore: achievement?.total_score || 0,
                lessonsCompleted: achievement?.lessons_completed || 0,
                coursesCompleted: achievement?.courses_completed || 0,
                examsPassed: achievement?.exams_passed || 0,
                activeDays // Array of dates for calendar display
            }
        });
    } catch (error) {
        console.error('getMyStreak error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get weekly leaderboard
 * GET /api/v1/streak/leaderboard
 */
const getLeaderboard = async (req, res) => {
    try {
        const { period = 'all', limit = 20 } = req.query;
        const accountId = req.user?.id;

        let orderField = 'total_score';
        if (period === 'weekly') orderField = 'weekly_score';
        if (period === 'monthly') orderField = 'monthly_score';
        if (period === 'streak') orderField = 'current_streak';

        const topUsers = await Achievement.findAll({
            where: { [orderField]: { [Op.gt]: 0 } },
            order: [[orderField, 'DESC']],
            limit: parseInt(limit),
            include: [{
                model: Account,
                as: 'account',
                attributes: ['id', 'email'],
                include: [{
                    model: Learner,
                    as: 'learnerInfo',
                    attributes: ['full_name', 'avatar_url']
                }]
            }]
        });

        const leaderboard = topUsers.map((user, index) => ({
            rank: index + 1,
            accountId: user.account_id,
            name: user.account?.learnerInfo?.full_name || user.account?.email?.split('@')[0] || 'Unknown',
            avatar: user.account?.learnerInfo?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.account?.learnerInfo?.full_name || 'U')}&background=random`,
            score: user[orderField],
            streak: user.current_streak,
            lessonsCompleted: user.lessons_completed,
            isCurrentUser: user.account_id === accountId
        }));

        // Get current user's rank if not in top
        let currentUserRank = null;
        if (accountId) {
            const currentUser = await Achievement.findOne({ where: { account_id: accountId } });
            if (currentUser) {
                const higherRanked = await Achievement.count({
                    where: { [orderField]: { [Op.gt]: currentUser[orderField] } }
                });
                currentUserRank = {
                    rank: higherRanked + 1,
                    score: currentUser[orderField],
                    streak: currentUser.current_streak
                };
            }
        }

        res.status(200).json({
            success: true,
            data: {
                leaderboard,
                currentUserRank,
                period
            }
        });
    } catch (error) {
        console.error('getLeaderboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update achievement scores (called after lesson/exam completion)
 * POST /api/v1/streak/update-score
 */
const updateScore = async (req, res) => {
    try {
        const accountId = req.user.id;
        const { lessonCompleted, examPassed, courseCompleted, scoreAdd } = req.body;

        let achievement = await Achievement.findOne({ where: { account_id: accountId } });

        if (!achievement) {
            achievement = await Achievement.create({ account_id: accountId });
        }

        // Update counts
        if (lessonCompleted) {
            achievement.lessons_completed = (achievement.lessons_completed || 0) + 1;
            achievement.total_score = (achievement.total_score || 0) + 10; // 10 points per lesson
            achievement.weekly_score = (achievement.weekly_score || 0) + 10;
            achievement.monthly_score = (achievement.monthly_score || 0) + 10;
        }

        if (examPassed) {
            achievement.exams_passed = (achievement.exams_passed || 0) + 1;
            achievement.total_score = (achievement.total_score || 0) + 50; // 50 points per exam
            achievement.weekly_score = (achievement.weekly_score || 0) + 50;
            achievement.monthly_score = (achievement.monthly_score || 0) + 50;
        }

        if (courseCompleted) {
            achievement.courses_completed = (achievement.courses_completed || 0) + 1;
            achievement.total_score = (achievement.total_score || 0) + 100; // 100 points per course
            achievement.weekly_score = (achievement.weekly_score || 0) + 100;
            achievement.monthly_score = (achievement.monthly_score || 0) + 100;
        }

        if (scoreAdd) {
            achievement.total_score = (achievement.total_score || 0) + scoreAdd;
            achievement.weekly_score = (achievement.weekly_score || 0) + scoreAdd;
            achievement.monthly_score = (achievement.monthly_score || 0) + scoreAdd;
        }

        await achievement.save();

        res.status(200).json({
            success: true,
            data: achievement
        });
    } catch (error) {
        console.error('updateScore error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    recordActivity,
    getMyStreak,
    getLeaderboard,
    updateScore
};
