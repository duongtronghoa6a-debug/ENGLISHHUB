/**
 * Comprehensive Seed Script - Creates all demo data
 * - Offline courses for teacher 02@gmail.com
 * - Virtual learners with names and achievements
 * - Enrollments and streaks
 * 
 * Run: node scripts/seedComprehensive.js
 */

require('dotenv').config();
const db = require('../src/app/models');
const bcrypt = require('bcryptjs');

// Vietnamese names for virtual learners
const VIRTUAL_LEARNERS = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thị Dung',
    'Hoàng Văn Em', 'Ngô Thị Phương', 'Vũ Minh Giang', 'Đặng Thị Hà',
    'Bùi Quang Huy', 'Đỗ Thị Kim', 'Trịnh Văn Long', 'Mai Thị Loan',
    'Phan Đức Mạnh', 'Lý Thị Ngọc', 'Chu Văn Phong', 'Đinh Thị Quỳnh',
    'Hà Minh Quốc', 'Tạ Thị Sương', 'Nguyễn Đức Thắng', 'Võ Thị Uyên'
];

// Offline class templates
const OFFLINE_CLASSES = [
    { name: 'IELTS Foundation 5.0 - Buổi sáng', room: 'Phòng A101', price: 5500000, capacity: 25 },
    { name: 'IELTS Intermediate 6.0 - Buổi tối', room: 'Phòng A102', price: 7500000, capacity: 20 },
    { name: 'IELTS Advanced 7.0+', room: 'Phòng A201', price: 9500000, capacity: 15 },
    { name: 'TOEIC 500+ cho người mới bắt đầu', room: 'Phòng B101', price: 4500000, capacity: 30 },
    { name: 'TOEIC 700+ Intensive', room: 'Phòng B102', price: 6500000, capacity: 25 },
    { name: 'Speaking Club - Weekly', room: 'Phòng C101', price: 2000000, capacity: 12 },
    { name: 'Business English Professional', room: 'Phòng C201', price: 8000000, capacity: 18 }
];

async function seedComprehensive() {
    try {
        console.log('🌱 =============================================');
        console.log('🌱 COMPREHENSIVE SEED - Virtual Data Generator');
        console.log('🌱 =============================================\n');

        await db.sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        // 1. Get or create teacher account (02@gmail.com)
        console.log('👨‍🏫 Setting up teacher account...');
        const teacherEmail = '02@gmail.com';
        const hashedPassword = await bcrypt.hash('123456', 10);

        let [teacherAccount] = await db.Account.findOrCreate({
            where: { email: teacherEmail },
            defaults: {
                email: teacherEmail,
                password_hash: hashedPassword,
                role: 'teacher',
                is_active: true
            }
        });

        // Update role to teacher if it was learner
        if (teacherAccount.role !== 'teacher') {
            await teacherAccount.update({ role: 'teacher' });
            console.log('  ✅ Updated account role to teacher');
        }

        // Find or create Teacher profile
        let [teacher] = await db.Teacher.findOrCreate({
            where: { account_id: teacherAccount.id },
            defaults: {
                account_id: teacherAccount.id,
                full_name: 'Nguyễn Văn Demo',
                bio: 'Giảng viên IELTS với 10 năm kinh nghiệm'
            }
        });
        console.log(`  ✅ Teacher: ${teacher.full_name} (ID: ${teacher.id})\n`);

        // 2. Create Offline Classes for this teacher
        console.log('📅 Creating offline classes...');
        let createdClasses = 0;

        for (const classData of OFFLINE_CLASSES) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 3);

            try {
                const [offlineClass, created] = await db.OfflineClass.findOrCreate({
                    where: {
                        class_name: classData.name,
                        teacher_id: teacherAccount.id
                    },
                    defaults: {
                        teacher_id: teacherAccount.id,
                        class_name: classData.name,
                        organizer_name: 'English Hub Center',
                        address: '123 Nguyễn Huệ, Q.1, TP.HCM',
                        room: classData.room,
                        schedule_text: 'Thứ 2, 4, 6 - 19:00-21:00',
                        start_date: startDate,
                        end_date: endDate,
                        price: classData.price,
                        capacity: classData.capacity,
                        current_enrolled: 0,
                        thumbnail_url: `https://picsum.photos/seed/${Date.now()}/400/300`,
                        status: 'open'
                    }
                });
                if (created) {
                    createdClasses++;
                    console.log(`  ✅ Created: ${classData.name}`);
                } else {
                    console.log(`  ℹ️ Exists: ${classData.name}`);
                }
            } catch (e) {
                console.error(`  ❌ Error creating ${classData.name}:`, e.message);
            }
        }
        console.log(`  Created ${createdClasses} offline classes\n`);

        // 3. Create Virtual Learners with achievements
        console.log('👥 Creating virtual learners...');
        let createdLearners = 0;
        const learnerAccounts = [];

        for (let i = 0; i < VIRTUAL_LEARNERS.length; i++) {
            const name = VIRTUAL_LEARNERS[i];
            const email = `learner${i + 1}@demo.com`;

            try {
                const [account, acctCreated] = await db.Account.findOrCreate({
                    where: { email },
                    defaults: {
                        email,
                        password_hash: hashedPassword,
                        role: 'learner',
                        is_active: true
                    }
                });

                const [learner, learnerCreated] = await db.Learner.findOrCreate({
                    where: { account_id: account.id },
                    defaults: {
                        account_id: account.id,
                        full_name: name
                    }
                });

                learnerAccounts.push({ account, learner, name });

                if (acctCreated || learnerCreated) {
                    createdLearners++;
                }

                // Create random achievement data
                const currentStreak = Math.floor(Math.random() * 45) + 1;
                const maxStreak = Math.max(currentStreak, Math.floor(Math.random() * 60) + currentStreak);
                const lessonsCompleted = Math.floor(Math.random() * 150) + 10;
                const coursesCompleted = Math.floor(Math.random() * 12);
                const examsPassed = Math.floor(Math.random() * 25);
                const totalScore = (lessonsCompleted * 10) + (coursesCompleted * 100) + (examsPassed * 50) + (currentStreak * 5);

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
                        last_activity_date: new Date().toISOString().split('T')[0],
                        weekly_score: Math.floor(totalScore * Math.random() * 0.3),
                        monthly_score: Math.floor(totalScore * Math.random() * 0.7)
                    }
                });

                // Create streak activity records
                for (let j = 0; j < Math.min(currentStreak, 14); j++) {
                    const activityDate = new Date();
                    activityDate.setDate(activityDate.getDate() - j);
                    const dateStr = activityDate.toISOString().split('T')[0];

                    try {
                        await db.UserActivity.findOrCreate({
                            where: { account_id: account.id, activity_date: dateStr },
                            defaults: {
                                account_id: account.id,
                                activity_date: dateStr,
                                login_count: Math.floor(Math.random() * 3) + 1
                            }
                        });
                    } catch (e) { /* ignore */ }
                }

            } catch (e) {
                console.error(`  ❌ Error creating ${name}:`, e.message);
            }
        }
        console.log(`  Created ${createdLearners} virtual learners with achievements\n`);

        // 4. Enroll some learners in courses
        console.log('📚 Creating enrollments...');
        const courses = await db.Course.findAll({ where: { is_published: true }, limit: 10 });
        let enrollmentCount = 0;

        for (const { learner } of learnerAccounts.slice(0, 10)) {
            const numEnroll = Math.floor(Math.random() * 3) + 1;
            const randomCourses = courses.sort(() => 0.5 - Math.random()).slice(0, numEnroll);

            for (const course of randomCourses) {
                try {
                    const [, created] = await db.Enrollment.findOrCreate({
                        where: { learner_id: learner.id, course_id: course.id },
                        defaults: {
                            learner_id: learner.id,
                            course_id: course.id,
                            status: 'active',
                            enrolled_at: new Date()
                        }
                    });
                    if (created) enrollmentCount++;
                } catch (e) { /* ignore */ }
            }
        }
        console.log(`  Created ${enrollmentCount} enrollments\n`);

        // 5. Show leaderboard
        console.log('🏆 TOP 10 LEADERBOARD:');
        const topUsers = await db.Achievement.findAll({
            order: [['total_score', 'DESC']],
            limit: 10,
            include: [{
                model: db.Account,
                as: 'account',
                include: [{ model: db.Learner, as: 'learnerInfo', attributes: ['full_name'] }]
            }]
        });

        topUsers.forEach((user, idx) => {
            const name = user.account?.learnerInfo?.full_name || user.account?.email?.split('@')[0];
            console.log(`  ${idx + 1}. ${name} - ${user.total_score} pts (🔥${user.current_streak} days)`);
        });

        console.log('\n✨ COMPREHENSIVE SEED COMPLETE!');
        console.log('  - Offline classes created for 02@gmail.com');
        console.log('  - 20 virtual learners with achievements');
        console.log('  - Random enrollments and streaks');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedComprehensive();
