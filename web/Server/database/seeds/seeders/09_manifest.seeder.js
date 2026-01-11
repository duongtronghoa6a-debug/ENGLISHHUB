/**
 * 09. Manifest Courses Seeder
 * Creates courses and lessons from R2/Cloudflare storage manifest
 * 
 * This imports the existing seedFromManifest.js logic
 */

const fs = require('fs');
const path = require('path');
const db = require('../../../src/app/models');
const bcrypt = require('bcryptjs');
const { TEST_ACCOUNTS } = require('../helpers/seedUtils');

// Teacher name mapping - IIG goes to ENGLISH HUB (02), Study4 stays separate (03)
const TEACHER_MAPPING = {
    'ENGLISH HUB': 'ENGLISH HUB',
    'EnglishHUB': 'ENGLISH HUB',
    'ENGLISHHUB': 'ENGLISH HUB',
    'IIG': 'ENGLISH HUB',
    'Study4': 'Study4 Teacher',
    'study4': 'Study4 Teacher',
    'misc': 'ENGLISH HUB',
    '7.-Tai-lieu-B1-B2-Vstep-20260108T132920Z-3-001': 'ENGLISH HUB',
    'PREP-2023': 'PREP',
    'PREP-2024': 'PREP',
    'PREP': 'PREP',
    'Mai-Phuong': 'Mai Phương',
    'MaiPhuong': 'Mai Phương',
    'KHOA-LAY-GOC-48-NGAY-CO-MAI-PHUONG': 'Mai Phương',
    'Ielts-NguyenHuyen': 'Nguyễn Huyên',
    'NguyenHuyen': 'Nguyễn Huyên',
    'ielts-Prep': 'IELTS Prep',
    'Tham': 'Thầy Tham'
};

const ENGLISH_HUB_CATEGORIES = ['giao-tiep', 'vstep'];

const TEACHER_PRICES = {
    'ENGLISH HUB': 0,
    'Mai Phương': 299000,
    'Nguyễn Huyên': 249000,
    'IELTS Prep': 199000,
    'PREP': 399000,
    'Thầy Tham': 199000
};

const CATEGORY_LABELS = {
    'toeic': 'TOEIC',
    'ielts': 'IELTS',
    'vstep': 'VSTEP',
    'giao-tiep': 'Giao tiếp'
};

const LEVEL_MAPPING = {
    'toeic': 'B1',
    'ielts': 'B2',
    'vstep': 'B2',
    'giao-tiep': 'A2'
};

const COURSE_IMAGES = [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
];

function getRandomImage() {
    return COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)];
}

async function seedManifestCourses() {
    console.log('\n📌 [09] Seeding Courses from Manifest (Cloudflare R2)...');

    const manifestPath = path.join(__dirname, '../../../storage/manifest/_manifest.json');

    if (!fs.existsSync(manifestPath)) {
        console.log('  ⚠️ Manifest file not found, skipping...');
        return;
    }

    let data = fs.readFileSync(manifestPath, 'utf8');
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);

    const manifest = JSON.parse(data);
    console.log(`  Found ${manifest.length} files in manifest`);

    // Normalize and group by course
    const courseMap = {};

    for (const item of manifest) {
        let teacher = TEACHER_MAPPING[item.teacher] || item.teacher.replace(/-/g, ' ');
        if (ENGLISH_HUB_CATEGORIES.includes(item.exam)) {
            teacher = 'ENGLISH HUB';
        }

        const courseKey = `${item.exam}/${teacher}/${item.course}`;

        if (!courseMap[courseKey]) {
            courseMap[courseKey] = {
                exam: item.exam,
                teacher: teacher,
                courseName: item.course.replace(/-/g, ' '),
                sections: {},
                files: []
            };
        }

        if (!courseMap[courseKey].sections[item.section]) {
            courseMap[courseKey].sections[item.section] = [];
        }
        courseMap[courseKey].sections[item.section].push({
            file: item.file,
            url: item.url,
            sizeBytes: item.sizeBytes
        });
        courseMap[courseKey].files.push(item);
    }

    console.log(`  Grouped into ${Object.keys(courseMap).length} courses`);

    // Create teacher accounts and courses
    const teacherCache = {};
    let createdCourses = 0;
    let createdLessons = 0;

    for (const [key, courseData] of Object.entries(courseMap)) {
        try {
            // Get or create teacher
            let teacherId;
            if (!teacherCache[courseData.teacher]) {
                // Check if teacher exists
                let teacherProfile = await db.Teacher.findOne({
                    where: { full_name: courseData.teacher }
                });

                if (!teacherProfile) {
                    // ENGLISH HUB uses teacher account (02), Study4 uses admin account (03)
                    let accountId = null;
                    if (courseData.teacher === 'ENGLISH HUB') {
                        accountId = TEST_ACCOUNTS.TEACHER.id;
                    } else if (courseData.teacher === 'Study4 Teacher') {
                        accountId = TEST_ACCOUNTS.ADMIN.id;
                    }

                    if (accountId) {
                        teacherProfile = await db.Teacher.findOne({ where: { account_id: accountId } });
                    }

                    if (!teacherProfile) {
                        // Create new teacher account and profile
                        const account = await db.Account.create({
                            email: `${courseData.teacher.toLowerCase().replace(/\s/g, '.')}@teacher.edu`,
                            password_hash: await bcrypt.hash('teacher123', 10),
                            role: 'teacher',
                            is_active: true
                        });
                        teacherProfile = await db.Teacher.create({
                            account_id: account.id,
                            full_name: courseData.teacher
                        });
                    }
                }
                teacherCache[courseData.teacher] = teacherProfile.id;
            }
            teacherId = teacherCache[courseData.teacher];

            // Create course
            const price = TEACHER_PRICES[courseData.teacher] || 199000;
            const category = CATEGORY_LABELS[courseData.exam] || courseData.exam;
            const level = LEVEL_MAPPING[courseData.exam] || 'B1';

            const [course, created] = await db.Course.findOrCreate({
                where: { title: courseData.courseName },
                defaults: {
                    title: courseData.courseName,
                    description: `Khóa học ${category} - ${courseData.teacher}`,
                    teacher_id: teacherId,
                    price: price,
                    thumbnail_url: getRandomImage(),
                    category: category,
                    level: level,
                    is_published: true,
                    course_type: 'standard',
                    total_lessons: courseData.files.length
                }
            });

            if (created) createdCourses++;

            // Create lessons for each section
            let lessonOrder = 0;
            for (const [sectionName, files] of Object.entries(courseData.sections)) {
                for (const file of files) {
                    try {
                        // Determine content type based on file extension
                        let contentType = 'pdf';
                        if (file.file.endsWith('.mp4') || file.file.endsWith('.mp3') || file.file.endsWith('.webm')) {
                            contentType = 'video';
                        } else if (file.file.endsWith('.mp3') || file.file.endsWith('.wav')) {
                            contentType = 'audio';
                        } else if (file.file.endsWith('.pdf')) {
                            contentType = 'pdf';
                        } else {
                            contentType = 'link';
                        }

                        await db.Lesson.findOrCreate({
                            where: {
                                course_id: course.id,
                                title: file.file.substring(0, 250)
                            },
                            defaults: {
                                course_id: course.id,
                                title: file.file.substring(0, 250),
                                description: `Section: ${sectionName}`,
                                content_url: file.url,
                                content_type: contentType,
                                order_index: lessonOrder++,
                                is_free: price === 0
                            }
                        });
                        createdLessons++;
                    } catch (e) {
                        // Ignore duplicate lessons
                    }
                }
            }
        } catch (error) {
            console.error(`  ⚠️ Error with course ${key}:`, error.message);
        }
    }

    console.log(`  ✅ Created ${createdCourses} courses from manifest`);
    console.log(`  ✅ Created ${createdLessons} lessons from manifest`);
}

module.exports = seedManifestCourses;
