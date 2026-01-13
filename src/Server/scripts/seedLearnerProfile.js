/**
 * SEED LEARNER PROFILE DATA
 * Seeds achievements, streaks, enrollments, and leaderboard for 01@gmail.com
 * 
 * Run: cd Server && node scripts/seedLearnerProfile.js
 */

const { sequelize } = require('../src/config/db/connect');
const db = require('../src/app/models');

const LEARNER_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

async function seedLearnerProfile() {
    console.log('📌 Seeding learner profile for 01@gmail.com...\n');

    try {
        // 1. Create or update Achievement record
        console.log('  🏆 Creating achievement record...');
        const [achievement, created] = await db.Achievement.findOrCreate({
            where: { account_id: LEARNER_ACCOUNT_ID },
            defaults: {
                total_score: 2500,
                courses_completed: 3,
                lessons_completed: 45,
                exams_passed: 8,
                current_streak: 7,
                max_streak: 15,
                weekly_score: 450,
                monthly_score: 1800,
                last_activity_date: new Date().toISOString().split('T')[0]
            }
        });

        if (!created) {
            await achievement.update({
                total_score: 2500,
                courses_completed: 3,
                lessons_completed: 45,
                exams_passed: 8,
                current_streak: 7,
                max_streak: 15,
                weekly_score: 450,
                monthly_score: 1800,
                last_activity_date: new Date().toISOString().split('T')[0]
            });
        }
        console.log(`  ✅ Achievement record ${created ? 'created' : 'updated'}`);

        // 2. Create UserActivity records for last 10 days (streak)
        console.log('\n  📅 Creating activity history for streak...');
        const today = new Date();
        const activities = [];

        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            activities.push({
                account_id: LEARNER_ACCOUNT_ID,
                activity_date: dateStr,
                login_count: Math.floor(Math.random() * 3) + 1,
                lessons_completed: Math.floor(Math.random() * 5) + 1,
                exams_taken: i % 3 === 0 ? 1 : 0,
                minutes_studied: Math.floor(Math.random() * 60) + 30
            });
        }

        // Upsert activities
        for (const act of activities) {
            await db.UserActivity.upsert(act);
        }
        console.log(`  ✅ Created ${activities.length} activity records`);

        // 3. Create enrollments with progress
        console.log('\n  📚 Creating course enrollments with progress...');

        // Get some existing courses
        const courses = await db.Course.findAll({
            where: { is_published: true },
            limit: 5,
            order: [['created_at', 'DESC']]
        });

        if (courses.length > 0) {
            const progressValues = [100, 75, 45, 20, 0]; // Different progress levels

            for (let i = 0; i < courses.length; i++) {
                const [enrollment, created] = await db.Enrollment.findOrCreate({
                    where: {
                        account_id: LEARNER_ACCOUNT_ID,
                        course_id: courses[i].id
                    },
                    defaults: {
                        progress: progressValues[i] || 0,
                        is_completed: progressValues[i] === 100,
                        score: progressValues[i] === 100 ? 85 : null,
                        completed_at: progressValues[i] === 100 ? new Date() : null
                    }
                });

                if (!created) {
                    await enrollment.update({
                        progress: progressValues[i] || 0,
                        is_completed: progressValues[i] === 100
                    });
                }
                console.log(`    - ${courses[i].title}: ${progressValues[i]}% progress`);
            }
        }

        // 4. Seed leaderboard with fake users having achievements
        console.log('\n  🏅 Seeding leaderboard with sample data...');

        // Find some existing accounts to add achievements
        const existingAccounts = await db.Account.findAll({
            where: { role: 'learner' },
            limit: 20,
            order: sequelize.random()
        });

        let leaderboardCount = 0;
        for (const acc of existingAccounts) {
            if (acc.id === LEARNER_ACCOUNT_ID) continue;

            const randomScore = Math.floor(Math.random() * 3000) + 500;
            const randomStreak = Math.floor(Math.random() * 20) + 1;

            await db.Achievement.upsert({
                account_id: acc.id,
                total_score: randomScore,
                courses_completed: Math.floor(Math.random() * 5),
                lessons_completed: Math.floor(Math.random() * 50),
                exams_passed: Math.floor(Math.random() * 10),
                current_streak: randomStreak,
                max_streak: randomStreak + Math.floor(Math.random() * 10),
                weekly_score: Math.floor(randomScore * 0.2),
                monthly_score: Math.floor(randomScore * 0.7),
                last_activity_date: new Date().toISOString().split('T')[0]
            });
            leaderboardCount++;
        }
        console.log(`  ✅ Created ${leaderboardCount} leaderboard entries`);

        // 5. Create lesson progress records
        console.log('\n  📖 Creating lesson progress records...');

        // Get lessons from enrolled courses
        for (const course of courses.slice(0, 2)) {
            const lessons = await db.Lesson.findAll({
                where: { course_id: course.id },
                limit: 10
            });

            for (let j = 0; j < lessons.length; j++) {
                // Mark first half as completed
                const isCompleted = j < lessons.length / 2;

                await db.LessonProgress.upsert({
                    account_id: LEARNER_ACCOUNT_ID,
                    lesson_id: lessons[j].id,
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date() : null,
                    time_spent: isCompleted ? Math.floor(Math.random() * 30 * 60) + 300 : 0
                });
            }
            console.log(`    - ${course.title}: ${Math.ceil(lessons.length / 2)} lessons completed`);
        }

        console.log('\n✅ Learner profile seeding complete!');
        console.log('\n📊 Summary:');
        console.log(`   - Account: 01@gmail.com`);
        console.log(`   - Total Score: 2500 points`);
        console.log(`   - Current Streak: 7 days`);
        console.log(`   - Max Streak: 15 days`);
        console.log(`   - Courses with progress: ${courses.length}`);
        console.log(`   - Leaderboard entries: ${leaderboardCount + 1}`);

    } catch (error) {
        console.error('❌ Error seeding learner profile:', error);
        throw error;
    }
}

async function main() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected!\n');

        await seedLearnerProfile();

        console.log('\n🎉 All done! Restart the backend server to see changes.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
