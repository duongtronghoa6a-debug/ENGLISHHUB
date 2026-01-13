/**
 * Seed Achievement & Activity Data
 * Creates realistic streak and leaderboard data for existing users
 * 
 * Run: node scripts/seedAchievementData.js
 */

require('dotenv').config();
const db = require('../src/app/models');

async function seedAchievementData() {
    try {
        console.log('🎯 Starting Achievement & Activity Data Seeding...\n');

        // Sync new tables
        await db.sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        // Get all learner accounts
        const learners = await db.Account.findAll({
            where: { role: 'learner' },
            include: [{
                model: db.Learner,
                as: 'learnerInfo',
                attributes: ['full_name']
            }],
            limit: 500 // Process top 500 for performance
        });

        console.log(`📊 Found ${learners.length} learner accounts\n`);

        let createdAchievements = 0;
        let createdActivities = 0;

        for (const account of learners) {
            // Generate random achievement data
            const isActive = Math.random() > 0.3; // 70% chance of being active

            if (!isActive) continue;

            // Random streak between 0 and 30
            const currentStreak = Math.floor(Math.random() * 30);
            const maxStreak = Math.max(currentStreak, Math.floor(Math.random() * 45));

            // Random completion stats
            const lessonsCompleted = Math.floor(Math.random() * 100);
            const coursesCompleted = Math.floor(Math.random() * 10);
            const examsPassed = Math.floor(Math.random() * 20);

            // Calculate total score
            const totalScore = (lessonsCompleted * 10) + (coursesCompleted * 100) + (examsPassed * 50) + (currentStreak * 5);
            const weeklyScore = Math.floor(totalScore * Math.random() * 0.3);
            const monthlyScore = Math.floor(totalScore * Math.random() * 0.6);

            // Set last activity date within last week for active users
            const daysAgo = currentStreak > 0 ? 0 : Math.floor(Math.random() * 30);
            const lastActivityDate = new Date();
            lastActivityDate.setDate(lastActivityDate.getDate() - daysAgo);

            // Create or update achievement
            const [achievement, created] = await db.Achievement.findOrCreate({
                where: { account_id: account.id },
                defaults: {
                    account_id: account.id,
                    total_score: totalScore,
                    courses_completed: coursesCompleted,
                    lessons_completed: lessonsCompleted,
                    exams_passed: examsPassed,
                    current_streak: currentStreak,
                    max_streak: maxStreak,
                    last_activity_date: lastActivityDate.toISOString().split('T')[0],
                    weekly_score: weeklyScore,
                    monthly_score: monthlyScore
                }
            });

            if (created) {
                createdAchievements++;
            }

            // Create activity records for past days (for streak history)
            if (currentStreak > 0) {
                for (let i = 0; i < currentStreak; i++) {
                    const activityDate = new Date();
                    activityDate.setDate(activityDate.getDate() - i);
                    const dateStr = activityDate.toISOString().split('T')[0];

                    try {
                        await db.UserActivity.findOrCreate({
                            where: {
                                account_id: account.id,
                                activity_date: dateStr
                            },
                            defaults: {
                                account_id: account.id,
                                activity_date: dateStr,
                                login_count: Math.floor(Math.random() * 3) + 1,
                                lessons_completed: Math.floor(Math.random() * 5),
                                exams_taken: Math.random() > 0.8 ? 1 : 0,
                                minutes_studied: Math.floor(Math.random() * 60) + 10
                            }
                        });
                        createdActivities++;
                    } catch (e) {
                        // Ignore duplicate key errors
                    }
                }
            }

            if (createdAchievements % 50 === 0 && createdAchievements > 0) {
                console.log(`  📈 Progress: ${createdAchievements} achievements created...`);
            }
        }

        console.log(`\n✨ Seeding Complete!`);
        console.log(`  - Achievements created: ${createdAchievements}`);
        console.log(`  - Activity records created: ${createdActivities}`);

        // Show top 10 leaderboard
        const topUsers = await db.Achievement.findAll({
            order: [['total_score', 'DESC']],
            limit: 10,
            include: [{
                model: db.Account,
                as: 'account',
                include: [{
                    model: db.Learner,
                    as: 'learnerInfo',
                    attributes: ['full_name']
                }]
            }]
        });

        console.log(`\n🏆 Top 10 Leaderboard:`);
        topUsers.forEach((user, index) => {
            const name = user.account?.learnerInfo?.full_name || user.account?.email?.split('@')[0] || 'Unknown';
            console.log(`  ${index + 1}. ${name} - ${user.total_score} pts (🔥 ${user.current_streak} day streak)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAchievementData();
