/**
 * 02. Profiles Seeder
 * Creates Learner, Teacher, Admin profile records for ALL accounts
 */

const db = require('../../../src/app/models');
const { TEST_ACCOUNTS } = require('../helpers/seedUtils');
const { faker } = require('@faker-js/faker');

// Vietnamese name parts for realistic names
const VN_FIRST_NAMES = ['Minh', 'Anh', 'Hùng', 'Dũng', 'Tuấn', 'Hải', 'Nam', 'Long', 'Phúc', 'Đức', 'Thành', 'Hoàng', 'Quang', 'Việt', 'Trung', 'Huy', 'Bảo', 'Khoa', 'Phong', 'Tùng'];
const VN_MIDDLE_NAMES = ['Văn', 'Thị', 'Hữu', 'Đình', 'Xuân', 'Ngọc', 'Kim', 'Thanh', 'Quốc', 'Công'];
const VN_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];

function generateVietnameseName() {
    const lastName = VN_LAST_NAMES[Math.floor(Math.random() * VN_LAST_NAMES.length)];
    const middleName = VN_MIDDLE_NAMES[Math.floor(Math.random() * VN_MIDDLE_NAMES.length)];
    const firstName = VN_FIRST_NAMES[Math.floor(Math.random() * VN_FIRST_NAMES.length)];
    return `${lastName} ${middleName} ${firstName}`;
}

async function seedProfiles() {
    console.log('\n📌 [02] Seeding Profiles (Learner/Teacher/Admin)...');

    // Create Learner profile for student test account
    const existingLearner = await db.Learner.findOne({ where: { account_id: TEST_ACCOUNTS.STUDENT.id } });
    if (!existingLearner) {
        await db.Learner.create({
            account_id: TEST_ACCOUNTS.STUDENT.id,
            full_name: 'Nguyễn Văn An',
            current_xp: 0,
            current_streak: 0
        });
        console.log('  ✅ Created Learner profile for 01@gmail.com');
    }

    // Create Teacher profile
    const existingTeacher = await db.Teacher.findOne({ where: { account_id: TEST_ACCOUNTS.TEACHER.id } });
    if (!existingTeacher) {
        await db.Teacher.create({
            account_id: TEST_ACCOUNTS.TEACHER.id,
            full_name: 'Minh Dương',
            specialization: 'IELTS, TOEIC, Giao tiếp',
            bio: 'Giảng viên tiếng Anh với 10 năm kinh nghiệm'
        });
        console.log('  ✅ Created Teacher profile for 02@gmail.com');
    }

    // Create Admin profile
    const existingAdmin = await db.Admin.findOne({ where: { account_id: TEST_ACCOUNTS.ADMIN.id } });
    if (!existingAdmin) {
        await db.Admin.create({
            account_id: TEST_ACCOUNTS.ADMIN.id,
            full_name: 'Trần Quản Trị'
        });
        console.log('  ✅ Created Admin profile for 03@gmail.com');
    }

    // Create Learner profiles for ALL learner accounts
    console.log('  Creating Learner profiles for all learner accounts...');
    const learnerAccounts = await db.Account.findAll({
        where: { role: 'learner' },
        attributes: ['id', 'email']
    });

    const existingLearners = await db.Learner.findAll({ attributes: ['account_id'] });
    const existingAccountIds = new Set(existingLearners.map(l => l.account_id));

    let createdLearners = 0;
    const batchSize = 500;
    const toCreateLearners = [];

    for (const account of learnerAccounts) {
        if (!existingAccountIds.has(account.id)) {
            toCreateLearners.push({
                account_id: account.id,
                full_name: generateVietnameseName(),
                current_xp: Math.floor(Math.random() * 5000),
                current_streak: Math.floor(Math.random() * 30)
            });
        }
        if (toCreateLearners.length >= batchSize) {
            await db.Learner.bulkCreate(toCreateLearners);
            createdLearners += toCreateLearners.length;
            process.stdout.write(`\r  Learner profiles: ${createdLearners}/${learnerAccounts.length}`);
            toCreateLearners.length = 0;
        }
    }
    if (toCreateLearners.length > 0) {
        await db.Learner.bulkCreate(toCreateLearners);
        createdLearners += toCreateLearners.length;
    }
    console.log(`\n  ✅ Created ${createdLearners} Learner profiles`);

    // Create Teacher profiles for ALL teacher accounts
    console.log('  Creating Teacher profiles for all teacher accounts...');
    const teacherAccounts = await db.Account.findAll({
        where: { role: 'teacher' },
        attributes: ['id', 'email']
    });

    const existingTeachers = await db.Teacher.findAll({ attributes: ['account_id'] });
    const existingTeacherIds = new Set(existingTeachers.map(t => t.account_id));

    let createdTeachers = 0;
    const specializations = ['IELTS', 'TOEIC', 'TOEFL', 'Giao tiếp', 'Business English', 'Luyện thi', 'Grammar'];

    for (const account of teacherAccounts) {
        if (!existingTeacherIds.has(account.id)) {
            const spec = specializations.slice(0, Math.floor(Math.random() * 3) + 1).join(', ');
            await db.Teacher.create({
                account_id: account.id,
                full_name: generateVietnameseName(),
                specialization: spec,
                bio: `Giảng viên với ${Math.floor(Math.random() * 10) + 2} năm kinh nghiệm giảng dạy tiếng Anh`
            });
            createdTeachers++;
        }
    }
    console.log(`  ✅ Created ${createdTeachers} Teacher profiles`);

    // Update existing teachers with null/empty full_name
    const teachersToUpdate = await db.Teacher.findAll({ where: { full_name: null } });
    for (const teacher of teachersToUpdate) {
        await teacher.update({ full_name: generateVietnameseName() });
    }
    if (teachersToUpdate.length > 0) {
        console.log(`  ✅ Updated ${teachersToUpdate.length} Teacher names`);
    }

    // Update existing learners with null/empty full_name
    const learnersToUpdate = await db.Learner.findAll({ where: { full_name: null } });
    for (const learner of learnersToUpdate) {
        await learner.update({ full_name: generateVietnameseName() });
    }
    if (learnersToUpdate.length > 0) {
        console.log(`  ✅ Updated ${learnersToUpdate.length} Learner names`);
    }

    console.log('  ✅ Profiles seeding complete');
}

module.exports = seedProfiles;
