/**
 * COMPREHENSIVE SEED FILE
 * 
 * Creates:
 * - Test accounts (01@gmail.com student, 02@gmail.com teacher, 03@gmail.com admin)
 * - 7000 fake learners with @faker-js/faker
 * - Questions from exam.json + placement_test.json
 * - Offline classes from offline_courses.json
 * - Orders, Enrollments, Reviews (demo data)
 * 
 * Run: cd Server && node database/seeds/seed.js
 * 
 * Prerequisites: npm install @faker-js/faker
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const { sequelize } = require('../../src/config/db/connect');
const db = require('../../src/app/models');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    NUM_FAKE_LEARNERS: 7000,
    NUM_ORDERS_PER_LEARNER_MAX: 5,
    DEFAULT_PASSWORD: '111111',
    BATCH_SIZE: 500 // Insert in batches for performance
};

// Fixed UUIDs for test accounts (for easy reference)
const TEST_ACCOUNTS = {
    STUDENT: { id: '00000000-0000-0000-0000-000000000001', email: '01@gmail.com', role: 'learner' },
    TEACHER: { id: '00000000-0000-0000-0000-000000000002', email: '02@gmail.com', role: 'teacher' },
    ADMIN: { id: '00000000-0000-0000-0000-000000000003', email: '03@gmail.com', role: 'admin' }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

function loadJsonFile(filename) {
    const filePath = path.join(__dirname, '../data/', filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filename}`);
        return null;
    }
    let data = fs.readFileSync(filePath, 'utf8');
    // Strip BOM
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
    return JSON.parse(data);
}

function progressLog(current, total, label) {
    if (current % 1000 === 0 || current === total) {
        console.log(`  ${label}: ${current}/${total} (${Math.round(current / total * 100)}%)`);
    }
}

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedTestAccounts() {
    console.log('\n📌 Creating test accounts...');
    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORD);

    for (const [key, acc] of Object.entries(TEST_ACCOUNTS)) {
        const existing = await db.Account.findByPk(acc.id);
        if (!existing) {
            await db.Account.create({
                id: acc.id,
                email: acc.email,
                password_hash: hashedPassword,
                role: acc.role,
                is_active: true
            });

            // Create role-specific profile record
            if (acc.role === 'learner') {
                await db.Learner.create({
                    account_id: acc.id,
                    full_name: 'Test Student',
                    current_xp: 0,
                    current_streak: 0
                });
            } else if (acc.role === 'teacher') {
                await db.Teacher.create({
                    account_id: acc.id,
                    full_name: 'Giáo viên English Hub'
                });
            } else if (acc.role === 'admin') {
                await db.Admin.create({
                    account_id: acc.id,
                    full_name: 'Administrator'
                });
            }

            console.log(`  ✅ Created ${acc.email} (${acc.role})`);
        } else {
            console.log(`  ⏭️ ${acc.email} already exists`);
        }
    }
}

async function seedFakeLearners() {
    console.log(`\n📌 Creating ${CONFIG.NUM_FAKE_LEARNERS} fake learners with faker...`);
    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORD);
    const learners = [];

    for (let i = 0; i < CONFIG.NUM_FAKE_LEARNERS; i++) {
        learners.push({
            id: faker.string.uuid(),
            email: faker.internet.email().toLowerCase(),
            password_hash: hashedPassword,
            role: 'learner',
            is_active: true,
            created_at: faker.date.between({ from: '2025-01-01', to: '2026-01-09' })
        });

        // Insert in batches
        if (learners.length >= CONFIG.BATCH_SIZE) {
            await db.Account.bulkCreate(learners, { ignoreDuplicates: true });
            progressLog(i + 1, CONFIG.NUM_FAKE_LEARNERS, 'Learners');
            learners.length = 0; // Clear array
        }
    }

    // Insert remaining
    if (learners.length > 0) {
        await db.Account.bulkCreate(learners, { ignoreDuplicates: true });
    }
    console.log(`  ✅ Created ${CONFIG.NUM_FAKE_LEARNERS} learners`);
}

async function seedQuestionsFromExamJson() {
    console.log('\n📌 Importing questions from exam.json (multi-batch)...');
    const examData = loadJsonFile('exam.json');
    if (!examData) return 0;

    let allQuestions = [];
    let allExams = [];

    // exam.json is an array of batches: [{batch: "1/4", data: {...}}, ...]
    const batches = Array.isArray(examData) ? examData : [examData];

    for (const batch of batches) {
        console.log(`  📦 Processing batch: ${batch.batch || 'unknown'}`);
        if (batch.data?.questions) {
            const validQuestions = batch.data.questions.filter(q => q.id && q.content_text);
            allQuestions.push(...validQuestions);
        }
        if (batch.data?.exams) {
            allExams.push(...batch.data.exams);
        }
    }

    console.log(`  📊 Found ${allQuestions.length} questions, ${allExams.length} exams across ${batches.length} batches`);

    const creatorId = TEST_ACCOUNTS.TEACHER.id;
    const idMap = {}; // Map old string IDs to new UUIDs

    // Insert questions with new UUIDs
    for (const q of allQuestions) {
        try {
            const newId = faker.string.uuid();
            idMap[q.id] = newId; // Store mapping

            await db.Question.create({
                id: newId,
                creator_id: creatorId,
                skill: q.skill || 'grammar',
                type: q.type || 'multiple_choice',
                level: q.level || 'B1',
                content_text: q.content_text,
                media_url: q.media_url || null,
                media_type: q.media_type || 'none',
                options: q.options || null,
                correct_answer: q.correct_answer || null,
                explanation: q.explanation || null
            });
        } catch (err) {
            console.warn(`  ⚠️ Could not create question "${q.id}": ${err.message}`);
        }
    }
    console.log(`  ✅ Imported ${allQuestions.length} questions from exam.json`);

    // Insert exams with new UUIDs, mapping question IDs
    for (const e of allExams) {
        try {
            // Map old question IDs to new UUIDs
            const mappedQuestionIds = (e.list_question_ids || []).map(oldId => idMap[oldId] || oldId);

            await db.Exam.create({
                id: faker.string.uuid(),
                creator_id: e.creator_id && e.creator_id.startsWith('00000000') ? e.creator_id : creatorId,
                title: e.title,
                description: e.description,
                duration_minutes: e.duration_minutes || 60,
                grading_method: e.grading_method || 'auto',
                list_question_ids: mappedQuestionIds,
                status: e.status || 'published'
            });
        } catch (err) {
            console.warn(`  ⚠️ Could not create exam "${e.title}": ${err.message}`);
        }
    }
    console.log(`  ✅ Imported ${allExams.length} exams from exam.json`);

    return allQuestions.length;
}

async function seedPlacementTest() {
    console.log('\n📌 Importing placement test from placement_test.json...');
    const data = loadJsonFile('placement_test.json');
    if (!data?.questions) return 0;

    const creatorId = TEST_ACCOUNTS.TEACHER.id;
    const questions = data.questions.filter(q => q.id && q.content_text);
    const questionIds = [];

    for (const q of questions) {
        try {
            const newId = faker.string.uuid();
            questionIds.push(newId);

            await db.Question.create({
                id: newId,
                creator_id: creatorId,
                skill: q.skill || 'grammar',
                type: q.type || 'multiple_choice',
                level: q.level || 'B1',
                content_text: q.content_text,
                media_url: q.media_url || null,
                media_type: q.media_type || 'none',
                options: q.options || null,
                correct_answer: q.correct_answer || null,
                explanation: q.explanation || null
            });
        } catch (err) {
            console.warn(`  ⚠️ Could not create placement question: ${err.message}`);
        }
    }

    // Create the placement test exam
    try {
        await db.Exam.create({
            id: faker.string.uuid(),
            creator_id: creatorId,
            title: 'Comprehensive Placement Test',
            description: 'Kiem tra xep lop tong hop tu A1 den C1',
            duration_minutes: 60,
            grading_method: 'hybrid',
            list_question_ids: questionIds,
            status: 'published'
        });
    } catch (err) {
        console.warn(`  ⚠️ Could not create placement exam: ${err.message}`);
    }

    console.log(`  ✅ Imported ${questions.length} placement test questions`);
    return questions.length;
}

async function seedOfflineClasses() {
    console.log('\n📌 Importing offline classes from offline_courses.json...');
    const classes = loadJsonFile('offline_courses.json');
    if (!classes || !Array.isArray(classes)) return 0;

    for (const c of classes) {
        try {
            await db.OfflineClass.create({
                id: faker.string.uuid(),
                teacher_id: c.teacher_id || TEST_ACCOUNTS.TEACHER.id,
                class_name: c.class_name,
                organizer_name: c.organizer_name,
                address: c.address,
                room: c.room,
                schedule_text: c.schedule_text,
                start_date: c.start_date,
                end_date: c.end_date,
                syllabus_json: c.syllabus_json,
                commitment_text: c.commitment_text,
                price: c.price,
                capacity: c.capacity,
                current_enrolled: c.current_enrolled || 0,
                thumbnail_url: c.thumbnail_url,
                status: c.status || 'open'
            });
        } catch (err) {
            console.warn(`  ⚠️ Could not create class "${c.class_name}": ${err.message}`);
        }
    }

    console.log(`  ✅ Imported ${classes.length} offline classes`);
    return classes.length;
}

async function seedCourses() {
    console.log('\n📌 Importing courses from courses.json...');
    const courses = loadJsonFile('courses.json');
    if (!courses || !Array.isArray(courses)) {
        console.log('  ⚠️ courses.json not found or invalid');
        return 0;
    }

    for (const c of courses) {
        try {
            await db.Course.create({
                id: c.id,
                teacher_id: c.teacher_id || TEST_ACCOUNTS.TEACHER.id,
                title: c.title,
                description: c.description,
                thumbnail_url: c.thumbnail_url,
                price: c.price || 0,
                level: c.level || 'B1',
                category: c.category,
                is_published: c.is_published !== false,
                total_lessons: c.total_lessons || 0,
                total_duration_minutes: c.total_duration_minutes || 0
            });
        } catch (err) {
            console.warn(`  ⚠️ Could not create course "${c.title}": ${err.message}`);
        }
    }

    console.log(`  ✅ Imported ${courses.length} courses`);
    return courses.length;
}

async function seedRubrics() {
    console.log('\n📌 Creating rubrics for Speaking/Writing...');

    const rubrics = [
        {
            name: 'IELTS Speaking Assessment Rubric',
            criteria: [
                { name: 'Fluency & Coherence', max_score: 9 },
                { name: 'Lexical Resource', max_score: 9 },
                { name: 'Grammatical Range', max_score: 9 },
                { name: 'Pronunciation', max_score: 9 }
            ]
        },
        {
            name: 'IELTS Writing Task 2 Rubric',
            criteria: [
                { name: 'Task Achievement', max_score: 9 },
                { name: 'Coherence & Cohesion', max_score: 9 },
                { name: 'Lexical Resource', max_score: 9 },
                { name: 'Grammar Range & Accuracy', max_score: 9 }
            ]
        }
    ];

    for (const r of rubrics) {
        const existing = await db.Rubric.findOne({ where: { name: r.name } });
        if (!existing) {
            await db.Rubric.create(r);
        }
    }

    console.log(`  ✅ Created ${rubrics.length} rubrics`);
}

async function seedSampleOrders() {
    console.log('\n📌 Creating sample orders for demo...');

    // Get some learners
    const learners = await db.Account.findAll({
        where: { role: 'learner' },
        limit: 100 // Sample 100 learners for demo orders
    });

    const courses = await db.Course.findAll({ limit: 20 });
    if (courses.length === 0) {
        console.log('  ⚠️ No courses found, skipping orders');
        return;
    }

    let orderCount = 0;
    for (const learner of learners) {
        const numOrders = faker.number.int({ min: 1, max: 3 });

        for (let i = 0; i < numOrders; i++) {
            const selectedCourses = faker.helpers.arrayElements(courses, { min: 1, max: 3 });
            const totalAmount = selectedCourses.reduce((sum, c) => sum + parseFloat(c.price || 0), 0);

            await db.Order.create({
                id: faker.string.uuid(),
                user_id: learner.id,
                total_amount: totalAmount,
                status: faker.helpers.weightedArrayElement([
                    { value: 'completed', weight: 8 },
                    { value: 'pending', weight: 1 },
                    { value: 'cancelled', weight: 1 }
                ]),
                payment_method: faker.helpers.arrayElement(['vnpay', 'momo', 'bank_transfer']),
                items_json: selectedCourses.map(c => ({ course_id: c.id, price: c.price })),
                created_at: faker.date.between({ from: '2025-06-01', to: '2026-01-09' })
            });
            orderCount++;
        }
    }

    console.log(`  ✅ Created ${orderCount} sample orders`);
}

async function seedSampleReviews() {
    console.log('\n📌 Creating sample reviews...');

    const learners = await db.Account.findAll({
        where: { role: 'learner' },
        limit: 50
    });

    const courses = await db.Course.findAll({ limit: 10 });
    if (courses.length === 0) {
        console.log('  ⚠️ No courses found, skipping reviews');
        return;
    }

    let reviewCount = 0;
    for (const learner of learners) {
        const course = faker.helpers.arrayElement(courses);

        await db.Review.create({
            id: faker.string.uuid(),
            user_id: learner.id,
            course_id: course.id,
            rating: faker.helpers.weightedArrayElement([
                { value: 5, weight: 5 },
                { value: 4, weight: 3 },
                { value: 3, weight: 1 },
                { value: 2, weight: 0.5 },
                { value: 1, weight: 0.5 }
            ]),
            comment: faker.lorem.paragraph(),
            created_at: faker.date.between({ from: '2025-06-01', to: '2026-01-09' })
        });
        reviewCount++;
    }

    console.log(`  ✅ Created ${reviewCount} sample reviews`);
}

// ============================================
// SEED ACHIEVEMENTS & STREAKS
// ============================================

async function seedAchievements() {
    console.log('\n📌 Creating achievement & streak data...');

    // Get all learner accounts
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
    }

    console.log(`  ✅ Created ${createdCount} achievement records`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    console.log('🚀 Starting comprehensive seed process...');
    console.log('='.repeat(50));

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Sync models (force: drop and recreate all tables)
        // WARNING: This will DELETE all existing data!
        await sequelize.sync({ force: true });
        console.log('✅ Database schema synced (tables recreated)');

        // Run seeders in order
        await seedTestAccounts();
        await seedFakeLearners();
        await seedRubrics();
        await seedQuestionsFromExamJson();
        await seedPlacementTest();
        await seedOfflineClasses();
        await seedCourses();
        await seedSampleOrders();
        await seedSampleReviews();
        await seedAchievements();

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Seed completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('  - Student: 01@gmail.com / 111111');
        console.log('  - Teacher: 02@gmail.com / 111111');
        console.log('  - Admin:   03@gmail.com / 111111');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

main();
