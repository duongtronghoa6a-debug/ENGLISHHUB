/**
 * Seed Courses from Manifest (R2 Storage)
 * 
 * This script reads _manifest.json and creates:
 * - Teachers (accounts with role=teacher)
 * - Courses (grouped by exam/teacher/course)
 * - Lessons (each PDF file)
 * 
 * Pricing: ENGLISH HUB = FREE, others = PAID
 * 
 * Prerequisites:
 * 1. Run: node scripts/generateManifest.js (to create _manifest.json from R2)
 * 2. Run: node scripts/seedFromManifest.js (this file)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/db/connect');
const db = require('../src/app/models');
const bcrypt = require('bcryptjs');

// Teacher name mapping (normalize folder names to teacher names)
// ENGLISH HUB = Admin account (03@gmail.com) owns:
// - All giao-tiep courses
// - All vstep courses  
// - IIG folder in toeic
// - Study4 folder in toeic
const TEACHER_MAPPING = {
    // ENGLISH HUB owned folders (admin-owned, free courses)
    'ENGLISH HUB': 'ENGLISH HUB',
    'EnglishHUB': 'ENGLISH HUB',
    'ENGLISHHUB': 'ENGLISH HUB',
    'IIG': 'ENGLISH HUB',           // toeic/IIG -> ENGLISH HUB
    'Study4': 'ENGLISH HUB',        // toeic/Study4 -> ENGLISH HUB
    'misc': 'ENGLISH HUB',
    '7.-Tai-lieu-B1-B2-Vstep-20260108T132920Z-3-001': 'ENGLISH HUB', // vstep folder
    // PREP - consolidated (both PREP-2023 and PREP-2024)
    'PREP-2023': 'PREP',
    'PREP-2024': 'PREP',
    'PREP': 'PREP',
    // Other teachers
    'Mai-Phuong': 'Mai Phương',
    'MaiPhuong': 'Mai Phương',
    'KHOA-LAY-GOC-48-NGAY-CO-MAI-PHUONG': 'Mai Phương',
    'Ielts-NguyenHuyen': 'Nguyễn Huyên',
    'NguyenHuyen': 'Nguyễn Huyên',
    'ielts-Prep': 'IELTS Prep',
    'Tham': 'Thầy Tham'
};

// Categories that belong to ENGLISH HUB (admin) regardless of teacher folder
const ENGLISH_HUB_CATEGORIES = ['giao-tiep', 'vstep'];

// Pricing by teacher
const TEACHER_PRICES = {
    'ENGLISH HUB': 0,        // FREE
    'Mai Phương': 299000,
    'Nguyễn Huyên': 249000,
    'IELTS Prep': 199000,
    'PREP': 399000,          // Combined PREP
    'Thầy Tham': 199000
};

// Category labels
const CATEGORY_LABELS = {
    'toeic': 'TOEIC',
    'ielts': 'IELTS',
    'vstep': 'VSTEP',
    'giao-tiep': 'Giao tiếp',
    'grammar': 'Grammar',
    'vocabulary': 'Vocabulary'
};

// Level mapping
const LEVEL_MAPPING = {
    'toeic': 'B1',
    'ielts': 'B2',
    'vstep': 'B2',
    'giao-tiep': 'A2',
    'grammar': 'A2',
    'vocabulary': 'B1'
};

// Curated Course Thumbnail Images
const COURSE_IMAGES = [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513258496098-916d97a0fe1a?q=80&w=800&auto=format&fit=crop'
];

function getRandomImage() {
    return COURSE_IMAGES[Math.floor(Math.random() * COURSE_IMAGES.length)];
}

async function seedFromManifest() {
    try {
        // Load manifest
        const manifestPath = path.join(__dirname, '../storage/manifest/_manifest.json');

        if (!fs.existsSync(manifestPath)) {
            console.error('❌ Manifest file not found at:', manifestPath);
            console.log('\n📝 Please run first: node scripts/generateManifest.js');
            return;
        }

        let data = fs.readFileSync(manifestPath, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);

        const manifest = JSON.parse(data);
        console.log(`📂 Loaded ${manifest.length} files from manifest`);

        // Normalize teacher names
        const normalizedManifest = manifest.map(item => {
            let teacher = TEACHER_MAPPING[item.teacher] || item.teacher.replace(/-/g, ' ');

            // If category is giao-tiep or vstep, assign to ENGLISH HUB
            if (ENGLISH_HUB_CATEGORIES.includes(item.exam)) {
                teacher = 'ENGLISH HUB';
            }

            return {
                ...item,
                teacherOriginal: item.teacher,
                teacher: teacher
            };
        });

        // Group by exam -> teacher -> course -> section
        const structure = {};
        for (const item of normalizedManifest) {
            const { exam, teacher, course, section, file, url, sizeBytes } = item;

            if (!structure[exam]) structure[exam] = {};
            if (!structure[exam][teacher]) structure[exam][teacher] = {};
            if (!structure[exam][teacher][course]) structure[exam][teacher][course] = {};
            if (!structure[exam][teacher][course][section]) {
                structure[exam][teacher][course][section] = [];
            }

            structure[exam][teacher][course][section].push({
                file,
                url,
                sizeBytes
            });
        }

        // Count statistics
        const allTeachers = new Set();
        let courseCount = 0;
        let lessonCount = 0;

        for (const exam of Object.keys(structure)) {
            for (const teacher of Object.keys(structure[exam])) {
                allTeachers.add(teacher);
                for (const course of Object.keys(structure[exam][teacher])) {
                    courseCount++;
                    for (const section of Object.keys(structure[exam][teacher][course])) {
                        lessonCount += structure[exam][teacher][course][section].length;
                    }
                }
            }
        }

        console.log(`\n📊 Will create:`);
        console.log(`  - ${allTeachers.size} teachers`);
        console.log(`  - ${courseCount} courses`);
        console.log(`  - ${lessonCount} lessons`);

        // Connect to database
        await sequelize.authenticate();
        console.log('\n✅ Connected to database');

        // Get or create teacher accounts
        const teacherMap = {};
        const hashedPassword = await bcrypt.hash('teacher123', 10);

        // Admin account ID for ENGLISH HUB
        const ADMIN_ACCOUNT_ID = '00000000-0000-0000-0000-000000000003';

        for (const teacherName of allTeachers) {
            // ENGLISH HUB uses admin account (03@gmail.com)
            if (teacherName === 'ENGLISH HUB') {
                const adminAccount = await db.Account.findByPk(ADMIN_ACCOUNT_ID);
                if (adminAccount) {
                    // Check if admin has teacher profile
                    let teacherProfile = await db.Teacher.findOne({ where: { account_id: ADMIN_ACCOUNT_ID } });
                    if (!teacherProfile) {
                        teacherProfile = await db.Teacher.create({
                            account_id: ADMIN_ACCOUNT_ID,
                            full_name: 'ENGLISH HUB',
                            bio: 'Tài liệu miễn phí từ ENGLISH HUB',
                            specialization: 'IELTS, TOEIC, VSTEP, Giao tiếp'
                        });
                    }
                    teacherMap[teacherName] = teacherProfile.id;
                    console.log(`  ✨ ENGLISH HUB linked to admin account (03@gmail.com)`);
                }
                continue;
            }

            const email = `${teacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@englishhub.edu.vn`;

            let account = await db.Account.findOne({ where: { email } });

            if (!account) {
                account = await db.Account.create({
                    email,
                    password_hash: hashedPassword,
                    role: 'teacher',
                    is_active: true
                });

                await db.Teacher.create({
                    account_id: account.id,
                    full_name: teacherName,
                    bio: `Giáo viên tiếng Anh tại English Hub`,
                    specialization: 'IELTS, TOEIC, VSTEP'
                });

                console.log(`  ✨ Created teacher: ${teacherName}`);
            } else {
                // Find or create teacher profile
                let teacher = await db.Teacher.findOne({ where: { account_id: account.id } });
                if (!teacher) {
                    teacher = await db.Teacher.create({
                        account_id: account.id,
                        full_name: teacherName,
                        bio: `Giáo viên tiếng Anh tại English Hub`
                    });
                }
            }

            // Get teacher profile ID
            const teacherProfile = await db.Teacher.findOne({ where: { account_id: account.id } });
            teacherMap[teacherName] = teacherProfile.id;
        }

        // Create courses and lessons
        for (const exam of Object.keys(structure)) {
            console.log(`\n📁 Category: ${CATEGORY_LABELS[exam] || exam}`);

            for (const teacher of Object.keys(structure[exam])) {
                // Map the folder teacher name to display name for price lookup
                const mappedTeacherName = TEACHER_MAPPING[teacher] || teacher;
                const teacherId = teacherMap[mappedTeacherName];
                const price = TEACHER_PRICES[mappedTeacherName] ?? 299000;

                for (const courseName of Object.keys(structure[exam][teacher])) {
                    const courseTitle = courseName.replace(/-/g, ' ').trim();

                    // Check if course exists
                    let course = await db.Course.findOne({
                        where: {
                            teacher_id: teacherId,
                            title: courseTitle
                        }
                    });

                    const sections = structure[exam][teacher][courseName];
                    let totalLessons = 0;
                    for (const section of Object.keys(sections)) {
                        totalLessons += sections[section].length;
                    }

                    if (!course) {
                        course = await db.Course.create({
                            teacher_id: teacherId,
                            title: courseTitle,
                            description: `Khóa học ${CATEGORY_LABELS[exam] || exam} - ${teacher}. Bao gồm ${totalLessons} bài học.`,
                            price: price,
                            level: LEVEL_MAPPING[exam] || 'B1',
                            category: CATEGORY_LABELS[exam] || exam,
                            is_published: true,
                            thumbnail_url: getRandomImage(),
                            total_lessons: totalLessons,
                            total_duration_minutes: totalLessons * 30 // Estimate 30min per lesson
                        });
                        console.log(`    📚 Course: ${courseTitle} (${price === 0 ? 'FREE' : price.toLocaleString() + 'đ'}) - ${totalLessons} lessons`);
                    }

                    // Create lessons for each section
                    let lessonOrder = 0;
                    for (const sectionName of Object.keys(sections)) {
                        const files = sections[sectionName];

                        for (const fileInfo of files) {
                            const lessonTitle = fileInfo.file
                                .replace('.pdf', '')
                                .replace('.mp3', '')
                                .replace('.mp4', '')
                                .replace(/-/g, ' ')
                                .trim();

                            // Check if lesson exists
                            const existingLesson = await db.Lesson.findOne({
                                where: {
                                    course_id: course.id,
                                    title: lessonTitle
                                }
                            });

                            if (!existingLesson) {
                                // Determine content_type from URL
                                let contentType = 'pdf';
                                if (fileInfo.url.endsWith('.mp3')) contentType = 'audio';
                                else if (fileInfo.url.endsWith('.mp4')) contentType = 'video';

                                await db.Lesson.create({
                                    course_id: course.id,
                                    title: lessonTitle,
                                    content_url: fileInfo.url,
                                    content_type: contentType,
                                    order_index: lessonOrder++,
                                    duration_minutes: 30,
                                    is_free: price === 0
                                });
                            }
                        }
                    }
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Seeding from manifest completed successfully!');
        console.log('\n📋 Teacher Accounts: (password: teacher123)');
        for (const teacher of allTeachers) {
            const email = `${teacher.toLowerCase().replace(/[^a-z0-9]/g, '')}@englishhub.edu.vn`;
            console.log(`  - ${teacher}: ${email}`);
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedFromManifest();
