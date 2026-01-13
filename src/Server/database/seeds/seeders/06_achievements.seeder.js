/**
 * 06. Achievements & Streaks Seeder
 * Creates achievement records for leaderboard and streak data
 */

const db = require('../../../src/app/models');

async function seedAchievements() {
    console.log('\n📌 [06] Seeding Achievements & Streaks...');

    // Get all learner accounts (limit for performance)
    const learners = await db.Account.findAll({
        where: { role: 'learner' },
        limit: 500
    });

    console.log(`  Found ${learners.length} learner accounts`);

    let createdCount = 0;

    for (const account of learners) {
        const isActive = Math.random() > 0.3; // 70% active
        if (!isActive) continue;

        // Random streak between 1 and 30
        const currentStreak = Math.floor(Math.random() * 30) + 1;
        const maxStreak = Math.max(currentStreak, Math.floor(Math.random() * 45));

        // Random stats
        const lessonsCompleted = Math.floor(Math.random() * 100);
        const coursesCompleted = Math.floor(Math.random() * 10);
        const examsPassed = Math.floor(Math.random() * 20);

        // Calculate scores
        const totalScore = (lessonsCompleted * 10) + (coursesCompleted * 100) + (examsPassed * 50) + (currentStreak * 5);
        const weeklyScore = Math.floor(totalScore * Math.random() * 0.3);
        const monthlyScore = Math.floor(totalScore * Math.random() * 0.6);

        const today = new Date().toISOString().split('T')[0];

        try {
            await db.Achievement.findOrCreate({
                where: { account_id: account.id },
                defaults: {
                    account_id: account.id,
                    total_score: totalScore,
                    courses_completed: coursesCompleted,
                    lessons_completed: lessonsCompleted,
                    exams_passed: examsPassed,
                    current_streak: currentStreak,
                    max_streak: maxStreak,
                    last_activity_date: today,
                    weekly_score: weeklyScore,
                    monthly_score: monthlyScore
                }
            });
            createdCount++;
        } catch (error) {
            // Ignore duplicates
        }
    }

    console.log(`  ✅ Created ${createdCount} achievement records`);
}

module.exports = seedAchievements;
