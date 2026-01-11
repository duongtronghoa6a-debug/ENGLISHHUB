/**
 * 03. Courses Seeder
 * Creates online courses from courses.json and courses_vid.json
 */

const db = require('../../../src/app/models');
const { loadJsonFile, TEST_ACCOUNTS, hashPassword } = require('../helpers/seedUtils');

async function seedCourses() {
    console.log('\n📌 [03] Seeding Courses...');

    // Get default teacher record (teacher_id in Course references Teacher table)
    const defaultTeacher = await db.Teacher.findOne({ where: { account_id: TEST_ACCOUNTS.TEACHER.id } });
    if (!defaultTeacher) {
        console.log('  ⚠️ Default teacher not found! Make sure profiles are seeded first.');
        return;
    }
    const defaultTeacherId = defaultTeacher.id;

    // Load courses from JSON files
    const coursesData = loadJsonFile('courses.json') || [];
    const videoCoursesData = loadJsonFile('courses_vid.json') || [];

    console.log(`  Found ${coursesData.length} regular courses, ${videoCoursesData.length} video courses`);

    // Cache for teachers by name - map special names to test accounts
    const teacherCache = {};
    teacherCache['ENGLISH HUB'] = defaultTeacherId;
    teacherCache['Giáo viên English Hub'] = defaultTeacherId;

    // Map IIG to 02@gmail.com (default teacher)
    teacherCache['IIG'] = defaultTeacherId;

    // Map study4 to 03@gmail.com (admin)
    const teacher03Account = await db.Account.findOne({ where: { email: TEST_ACCOUNTS.ADMIN.email } });
    if (teacher03Account) {
        // Create teacher profile for 03@gmail.com if not exists
        let teacher03 = await db.Teacher.findOne({ where: { account_id: teacher03Account.id } });
        if (!teacher03) {
            teacher03 = await db.Teacher.create({ account_id: teacher03Account.id, full_name: 'Study4 Teacher' });
        }
        teacherCache['study4'] = teacher03.id;
    }

    let createdCount = 0;

    // Helper to get or create teacher by name
    async function getOrCreateTeacher(teacherName) {
        if (!teacherName) return defaultTeacherId;

        // Check cache
        if (teacherCache[teacherName]) {
            return teacherCache[teacherName];
        }

        // Try to find existing teacher
        let teacher = await db.Teacher.findOne({ where: { full_name: teacherName } });

        if (!teacher) {
            // Create new teacher account and profile
            const email = `${teacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@teacher.edu`;
            const existingAccount = await db.Account.findOne({ where: { email } });

            let accountId;
            if (existingAccount) {
                accountId = existingAccount.id;
            } else {
                const account = await db.Account.create({
                    email,
                    password_hash: await hashPassword('teacher123'),
                    role: 'teacher',
                    is_active: true
                });
                accountId = account.id;
            }

            teacher = await db.Teacher.create({
                account_id: accountId,
                full_name: teacherName
            });
            console.log(`    ✅ Created teacher: ${teacherName}`);
        }

        teacherCache[teacherName] = teacher.id;
        return teacher.id;
    }

    // Seed regular courses - NOW use teacher_name from JSON
    for (const course of coursesData) {
        try {
            // Get teacher based on teacher_name in JSON
            const teacherId = await getOrCreateTeacher(course.teacher_name);

            await db.Course.findOrCreate({
                where: { id: course.id },
                defaults: {
                    id: course.id,
                    title: course.title,
                    description: course.description || '',
                    teacher_id: teacherId,
                    price: course.price || 0,
                    thumbnail_url: course.thumbnail_url || course.image,
                    category: course.category || 'General',
                    level: course.level || 'B1',
                    is_published: course.is_published !== false,
                    total_lessons: course.total_lessons || 0,
                    total_duration_minutes: course.total_duration_minutes || 0,
                    course_type: 'standard',
                    video_playlist_url: course.youtube_playlist_url || null
                }
            });
            createdCount++;
        } catch (error) {
            console.error(`  ⚠️ Error creating course "${course.title}":`, error.message);
        }
    }

    // Seed video courses - use teacher_name from JSON
    for (const course of videoCoursesData) {
        try {
            // Get or create teacher based on teacher_name in JSON
            const teacherId = await getOrCreateTeacher(course.teacher_name);

            await db.Course.findOrCreate({
                where: { title: course.title },
                defaults: {
                    title: course.title,
                    description: course.description || `Khóa học video từ ${course.teacher_name || 'YouTube'}`,
                    teacher_id: teacherId,
                    price: course.price || 0,
                    thumbnail_url: course.thumbnail_url || course.image,
                    category: course.category || 'Video',
                    level: course.level || 'B1',
                    is_published: true,
                    total_lessons: course.total_lessons || 0,
                    total_duration_minutes: course.total_duration_minutes || 0,
                    course_type: 'video',
                    video_playlist_url: course.embed_playlist_url || course.youtubePlaylistUrl || course.youtube_playlist_url || null
                }
            });
            createdCount++;
        } catch (error) {
            console.error(`  ⚠️ Error creating video course "${course.title}":`, error.message);
        }
    }

    console.log(`  ✅ Created/verified ${createdCount} courses`);
}

module.exports = seedCourses;
