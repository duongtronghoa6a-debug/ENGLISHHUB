/**
 * Seed Learner Profiles with Vietnamese Fake Data
 * 
 * This script updates all learner accounts with:
 * - Vietnamese full names
 * - Random study goals
 * 
 * Run: node scripts/seedLearnerProfiles.js
 */

require('dotenv').config();
const { sequelize } = require('../src/config/db/connect');
const db = require('../src/app/models');
const { Learner, Account } = db;

// Vietnamese first names (common)
const FIRST_NAMES = [
    'An', 'Anh', 'Bảo', 'Bình', 'Chi', 'Dung', 'Dũng', 'Đức', 'Giang', 'Hà',
    'Hải', 'Hạnh', 'Hiền', 'Hiếu', 'Hoàng', 'Hồng', 'Hùng', 'Hương', 'Huy', 'Khang',
    'Khánh', 'Khoa', 'Kiên', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Nga',
    'Ngân', 'Ngọc', 'Nhân', 'Như', 'Phong', 'Phú', 'Phương', 'Quang', 'Quân', 'Quỳnh',
    'Sơn', 'Tâm', 'Thành', 'Thảo', 'Thiên', 'Thu', 'Thủy', 'Tiến', 'Trang', 'Trinh',
    'Trung', 'Tú', 'Tuấn', 'Uyên', 'Văn', 'Việt', 'Vũ', 'Xuân', 'Yến', 'Ý'
];

// Vietnamese last names (họ)
const LAST_NAMES = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đào', 'Đinh', 'Lương', 'Cao',
    'Trương', 'Lưu', 'Tạ', 'Tô', 'Hà', 'Thái', 'Tăng', 'Châu', 'Diệp', 'Lâm'
];

// Middle names (đệm)
const MIDDLE_NAMES = [
    'Văn', 'Thị', 'Hữu', 'Đức', 'Hoàng', 'Minh', 'Quốc', 'Thanh', 'Ngọc', 'Kim',
    'Bảo', 'Xuân', 'Thu', 'Phúc', 'Gia', 'Vĩnh', 'Tường', 'Thiên', 'Nhật', 'Anh'
];

// Study goals
const STUDY_GOALS = [
    'Luyện thi IELTS 6.5+',
    'Luyện thi TOEIC 700+',
    'Luyện thi VSTEP B1-B2',
    'Giao tiếp tiếng Anh cơ bản',
    'Tiếng Anh cho công việc',
    'Du học nước ngoài',
    'Phát triển sự nghiệp',
    'Cải thiện kỹ năng nghe-nói',
    'Đọc tài liệu tiếng Anh',
    'Thi chứng chỉ quốc tế'
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateVietnameseName() {
    const lastName = getRandomElement(LAST_NAMES);
    const middleName = getRandomElement(MIDDLE_NAMES);
    const firstName = getRandomElement(FIRST_NAMES);
    return `${lastName} ${middleName} ${firstName}`;
}

async function seedLearnerProfiles() {
    try {
        await sequelize.authenticate();
        console.log('🔌 Database connected\n');

        // Get all learner accounts
        const learnerAccounts = await Account.findAll({
            where: { role: 'learner' },
            attributes: ['id', 'email']
        });

        console.log(`📊 Found ${learnerAccounts.length} learner accounts\n`);

        let created = 0;
        let updated = 0;
        let batchSize = 100;
        let processed = 0;

        for (const account of learnerAccounts) {
            try {
                // Check if learner profile exists
                let learner = await Learner.findOne({
                    where: { account_id: account.id }
                });

                const fullName = generateVietnameseName();
                const studyGoal = getRandomElement(STUDY_GOALS);

                if (learner) {
                    // Update existing
                    if (!learner.full_name || learner.full_name.startsWith('Learner')) {
                        await learner.update({
                            full_name: fullName,
                            study_goal: studyGoal
                        });
                        updated++;
                    }
                } else {
                    // Create new
                    await Learner.create({
                        account_id: account.id,
                        full_name: fullName,
                        study_goal: studyGoal
                    });
                    created++;
                }

                processed++;
                if (processed % batchSize === 0) {
                    console.log(`  ⏳ Processed ${processed}/${learnerAccounts.length}...`);
                }
            } catch (err) {
                console.error(`  ❌ Error for ${account.email}:`, err.message);
            }
        }

        console.log('\n==================================================');
        console.log('🎉 Seeding learner profiles completed!');
        console.log(`   ✅ Created: ${created} new profiles`);
        console.log(`   🔄 Updated: ${updated} existing profiles`);
        console.log(`   📊 Total processed: ${processed}`);
        console.log('==================================================\n');

    } catch (error) {
        console.error('❌ Error seeding profiles:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seedLearnerProfiles();
