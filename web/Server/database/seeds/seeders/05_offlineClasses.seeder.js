/**
 * 05. Offline Classes Seeder
 * Creates offline classes from offline_courses.json
 * Also creates ClassEnrollment and Attendance records based on current_enrolled
 */

const db = require('../../../src/app/models');
const { loadJsonFile, TEST_ACCOUNTS } = require('../helpers/seedUtils');
const { v4: uuidv4 } = require('uuid');

async function seedOfflineClasses() {
    console.log('\n📌 [05] Seeding Offline Classes...');

    const offlineData = loadJsonFile('offline_courses.json');
    if (!offlineData || !Array.isArray(offlineData)) {
        console.log('  ⚠️ No offline courses data found');
        return;
    }

    let createdCount = 0;
    let enrollmentCount = 0;
    let attendanceCount = 0;

    // Get some learner accounts for enrollment
    const learnerAccounts = await db.Account.findAll({
        where: { role: 'learner' },
        limit: 50
    });

    for (const cls of offlineData) {
        try {
            const [offlineClass, created] = await db.OfflineClass.findOrCreate({
                where: { class_name: cls.class_name },
                defaults: {
                    teacher_id: TEST_ACCOUNTS.TEACHER.id,
                    class_name: cls.class_name,
                    organizer_name: cls.organizer_name || 'Giáo viên English Hub',
                    address: cls.address,
                    room: cls.room,
                    schedule_text: cls.schedule_text,
                    start_date: cls.start_date,
                    end_date: cls.end_date,
                    syllabus_json: JSON.stringify(cls.syllabus_json || []),
                    commitment_text: cls.commitment_text,
                    price: cls.price || 0,
                    capacity: cls.capacity || 20,
                    current_enrolled: cls.current_enrolled || 0,
                    thumbnail_url: cls.thumbnail_url,
                    status: cls.status || 'open'
                }
            });
            createdCount++;

            // Create ClassEnrollment records (đăng ký lớp) for each current_enrolled
            const enrolledCount = cls.current_enrolled || 0;
            for (let i = 0; i < enrolledCount && i < learnerAccounts.length; i++) {
                try {
                    // Create ClassEnrollment (đăng ký lớp)
                    const [enrollment, enrollCreated] = await db.ClassEnrollment.findOrCreate({
                        where: {
                            class_id: offlineClass.id,
                            learner_account_id: learnerAccounts[i].id
                        },
                        defaults: {
                            id: uuidv4(),
                            class_id: offlineClass.id,
                            learner_account_id: learnerAccounts[i].id,
                            status: 'approved',
                            requested_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                            reviewed_at: new Date(),
                            note: null
                        }
                    });
                    if (enrollCreated) enrollmentCount++;

                    // Also create Attendance (điểm danh) 
                    await db.Attendance.findOrCreate({
                        where: {
                            class_id: offlineClass.id,
                            learner_account_id: learnerAccounts[i].id
                        },
                        defaults: {
                            id: uuidv4(),
                            class_id: offlineClass.id,
                            learner_account_id: learnerAccounts[i].id,
                            attended_date: new Date(),
                            status: 'present'
                        }
                    });
                    attendanceCount++;
                } catch (attErr) {
                    // Ignore duplicate key errors
                }
            }
        } catch (error) {
            console.error(`  ⚠️ Error creating offline class "${cls.class_name}":`, error.message);
        }
    }

    console.log(`  ✅ Created ${createdCount} offline classes`);
    console.log(`  ✅ Created ${enrollmentCount} class enrollments`);
    console.log(`  ✅ Created ${attendanceCount} attendance records`);
}

module.exports = seedOfflineClasses;

