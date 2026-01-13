/**
 * Seed Video Courses with Teacher Accounts
 * Creates proper teacher accounts for each video course teacher
 * 
 * Run: node scripts/seedVideoCourses.js
 */

require('dotenv').config();
const db = require('../src/app/models');
const fs = require('fs');
const path = require('path');

// Map of teacher_name to account info
const teacherAccounts = {
    'IELTS Liz': { email: 'ielts.liz@englishhub.com', fullName: 'IELTS Liz', specialization: 'IELTS' },
    'IELTS Advantage': { email: 'ielts.advantage@englishhub.com', fullName: 'IELTS Advantage', specialization: 'IELTS' },
    'Fastrack IELTS': { email: 'fastrack.ielts@englishhub.com', fullName: 'Fastrack IELTS', specialization: 'IELTS' },
    'AcademicEnglishHelp': { email: 'academic.help@englishhub.com', fullName: 'Academic English Help', specialization: 'IELTS & TOEFL' },
    'TOEIC Tham': { email: 'toeic.tham@englishhub.com', fullName: 'Thầy Tham TOEIC', specialization: 'TOEIC' },
    'Ms Hoa TOEIC': { email: 'mshoa.toeic@englishhub.com', fullName: 'Ms Hoa TOEIC', specialization: 'TOEIC' },
    'Thảo TOEIC Academy': { email: 'thao.toeic@englishhub.com', fullName: 'Thảo TOEIC Academy', specialization: 'TOEIC' },
    'TST Prep': { email: 'tst.prep@englishhub.com', fullName: 'TST Prep', specialization: 'TOEFL' },
    'BBC Learning English': { email: 'bbc.english@englishhub.com', fullName: 'BBC Learning English', specialization: 'General English' },
};

// Thumbnail for each category
const categoryThumbnails = {
    'IELTS': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
    'TOEIC': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
    'TOEFL': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
    'General English': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=450&fit=crop',
};

async function seedVideoCourses() {
    try {
        console.log('🎬 Starting Video Courses Seeding...\n');

        // Sync tables
        await db.sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        // Load video courses JSON
        const dataPath = path.join(__dirname, '../database/data/courses_vid.json');
        const coursesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        console.log(`📊 Found ${coursesData.length} video courses to seed\n`);

        // Create teacher accounts
        console.log('👨‍🏫 Creating teacher accounts...\n');
        const teacherMap = {};

        for (const [teacherName, info] of Object.entries(teacherAccounts)) {
            try {
                const [account, accountCreated] = await db.Account.findOrCreate({
                    where: { email: info.email },
                    defaults: {
                        email: info.email,
                        password_hash: '$2b$10$videoteacher_placeholder_hash',
                        role: 'teacher',
                        is_active: true
                    }
                });

                const [teacher, teacherCreated] = await db.Teacher.findOrCreate({
                    where: { account_id: account.id },
                    defaults: {
                        account_id: account.id,
                        full_name: info.fullName,
                        specialization: info.specialization,
                        bio: `${info.fullName} - Expert in ${info.specialization}`
                    }
                });

                teacherMap[teacherName] = teacher.id;
                console.log(`  ${accountCreated ? '✨ Created' : '✅ Found'} teacher: ${info.fullName} (${info.email})`);
            } catch (e) {
                console.error(`  ❌ Error creating teacher ${teacherName}:`, e.message);
            }
        }

        console.log('\n📺 Seeding video courses...\n');

        let created = 0;
        let updated = 0;
        let errors = 0;

        for (const course of coursesData) {
            try {
                // Get teacher_id from map, or null
                const teacherId = teacherMap[course.teacher_name] || null;

                // Get thumbnail based on category
                const thumbnail = categoryThumbnails[course.category] ||
                    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop';

                const existing = await db.Course.findByPk(course.id);

                const courseData = {
                    id: course.id,
                    title: course.title,
                    description: `${course.category} video course by ${course.teacher_name}. Level: ${course.level}. Includes ${course.total_lessons} video lessons (${course.total_duration_minutes} minutes total).`,
                    price: course.price || 0,
                    level: course.level || 'INTERMEDIATE',
                    category: course.category || 'General English',
                    thumbnail_url: thumbnail,
                    is_published: course.is_published !== false,
                    course_type: 'video',
                    video_playlist_url: course.embed_playlist_url,
                    teacher_id: teacherId,
                    total_lessons: course.total_lessons || 10,
                    total_duration_minutes: course.total_duration_minutes || 120
                };

                if (existing) {
                    await existing.update(courseData);
                    updated++;
                } else {
                    await db.Course.create(courseData);
                    created++;
                }

                if ((created + updated) % 10 === 0) {
                    console.log(`  📈 Progress: ${created + updated}/${coursesData.length} processed...`);
                }
            } catch (e) {
                console.error(`  ❌ Error with course "${course.title}":`, e.message);
                errors++;
            }
        }

        console.log(`\n✨ Video Courses Seeding Complete!`);
        console.log(`  - Created: ${created}`);
        console.log(`  - Updated: ${updated}`);
        console.log(`  - Errors: ${errors}`);

        // Show teacher accounts created
        console.log(`\n👨‍🏫 Teacher Account Credentials (password: videoteacher123):`);
        for (const [teacherName, info] of Object.entries(teacherAccounts)) {
            console.log(`  - ${info.fullName}: ${info.email}`);
        }

        // Show sample courses
        const samples = await db.Course.findAll({
            where: { course_type: 'video' },
            limit: 5,
            include: [{ model: db.Teacher, as: 'teacher', attributes: ['full_name'] }],
            order: [['created_at', 'DESC']]
        });

        console.log(`\n📺 Sample Video Courses:`);
        samples.forEach(c => {
            console.log(`  - ${c.title} by ${c.teacher?.full_name || 'N/A'} (${c.category})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedVideoCourses();
