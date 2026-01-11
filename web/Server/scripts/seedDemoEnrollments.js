/**
 * Seed Demo Data for account 02@gmail.com
 * Creates enrollments for paid/free courses and offline classes
 * 
 * Run: node scripts/seedDemoEnrollments.js
 */

require('dotenv').config();
const db = require('../src/app/models');

async function seedDemoEnrollments() {
    try {
        console.log('📚 Starting Demo Enrollments Seeding...\n');

        await db.sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        // Find the learner account - or create if not exists
        const targetEmail = '02@gmail.com';
        let [account, accountCreated] = await db.Account.findOrCreate({
            where: { email: targetEmail },
            defaults: {
                email: targetEmail,
                password_hash: '$2b$10$demo_account_placeholder_hash',
                role: 'learner',
                is_active: true
            }
        });

        if (accountCreated) {
            console.log(`✨ Created new account: ${targetEmail}`);
        }

        // Find or create learner profile
        let [learner, learnerCreated] = await db.Learner.findOrCreate({
            where: { account_id: account.id },
            defaults: {
                account_id: account.id,
                full_name: 'Demo Learner',
                phone: '0900000002'
            }
        });

        if (learnerCreated) {
            console.log(`✨ Created learner profile for ${targetEmail}`);
        }

        console.log(`👤 Found learner: ${learner.full_name || targetEmail} (ID: ${learner.id})\n`);

        // Get all courses
        const allCourses = await db.Course.findAll({
            where: { is_published: true },
            limit: 30
        });

        const freeCourses = allCourses.filter(c => parseFloat(c.price) === 0);
        const paidCourses = allCourses.filter(c => parseFloat(c.price) > 0);

        console.log(`📊 Found ${freeCourses.length} free courses, ${paidCourses.length} paid courses\n`);

        // Enroll in some free courses
        const freeToEnroll = freeCourses.slice(0, 5);
        let enrollmentCount = 0;

        for (const course of freeToEnroll) {
            try {
                const [enrollment, created] = await db.Enrollment.findOrCreate({
                    where: {
                        learner_id: learner.id,
                        course_id: course.id
                    },
                    defaults: {
                        learner_id: learner.id,
                        course_id: course.id,
                        status: 'active',
                        enrolled_at: new Date(),
                        progress: Math.floor(Math.random() * 80)
                    }
                });
                if (created) {
                    enrollmentCount++;
                    console.log(`  ✅ Enrolled (FREE): ${course.title}`);
                } else {
                    console.log(`  ℹ️ Already enrolled: ${course.title}`);
                }
            } catch (e) {
                console.error(`  ❌ Error enrolling ${course.title}:`, e.message);
            }
        }

        // Enroll in some paid courses (simulate purchase)
        const paidToEnroll = paidCourses.slice(0, 3);

        for (const course of paidToEnroll) {
            try {
                const [enrollment, created] = await db.Enrollment.findOrCreate({
                    where: {
                        learner_id: learner.id,
                        course_id: course.id
                    },
                    defaults: {
                        learner_id: learner.id,
                        course_id: course.id,
                        status: 'active',
                        enrolled_at: new Date(),
                        progress: Math.floor(Math.random() * 50)
                    }
                });
                if (created) {
                    enrollmentCount++;
                    console.log(`  ✅ Enrolled (PAID): ${course.title} - ${course.price}đ`);
                } else {
                    console.log(`  ℹ️ Already enrolled: ${course.title}`);
                }
            } catch (e) {
                console.error(`  ❌ Error enrolling ${course.title}:`, e.message);
            }
        }

        // Enroll in offline classes
        console.log('\n📅 Enrolling in offline classes...');
        const offlineClasses = await db.OfflineClass.findAll({
            where: { status: 'open' },
            limit: 3
        });

        for (const offClass of offlineClasses) {
            try {
                const [attendance, created] = await db.Attendance.findOrCreate({
                    where: {
                        learner_id: learner.id,
                        offline_class_id: offClass.id
                    },
                    defaults: {
                        learner_id: learner.id,
                        offline_class_id: offClass.id,
                        status: 'pending'
                    }
                });
                if (created) {
                    console.log(`  ✅ Registered: ${offClass.class_name}`);
                } else {
                    console.log(`  ℹ️ Already registered: ${offClass.class_name}`);
                }
            } catch (e) {
                console.error(`  ❌ Error registering:`, e.message);
            }
        }

        // Create some test results
        console.log('\n📝 Creating test results...');
        const exams = await db.Exam.findAll({ limit: 3 });

        for (const exam of exams) {
            try {
                await db.TestSession.findOrCreate({
                    where: {
                        account_id: account.id,
                        exam_id: exam.id
                    },
                    defaults: {
                        account_id: account.id,
                        exam_id: exam.id,
                        started_at: new Date(Date.now() - 3600000),
                        completed_at: new Date(),
                        score: 70 + Math.floor(Math.random() * 30),
                        is_completed: true
                    }
                });
                console.log(`  ✅ Test result created for: ${exam.title}`);
            } catch (e) {
                // Ignore if TestSession model doesn't exist or other errors
            }
        }

        // Create streak data
        console.log('\n🔥 Creating streak data...');
        try {
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                await db.UserActivity.findOrCreate({
                    where: {
                        account_id: account.id,
                        activity_date: date.toISOString().split('T')[0]
                    },
                    defaults: {
                        account_id: account.id,
                        activity_date: date.toISOString().split('T')[0],
                        login_count: 1 + Math.floor(Math.random() * 3)
                    }
                });
            }
            console.log('  ✅ 7-day streak created');
        } catch (e) {
            console.log('  ⚠️ Could not create streak data:', e.message);
        }

        console.log(`\n✨ Demo Seeding Complete!`);
        console.log(`  - Enrollments created: ${enrollmentCount}`);
        console.log(`  - Total enrollments for ${targetEmail}: ${await db.Enrollment.count({ where: { learner_id: learner.id } })}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDemoEnrollments();
