/**
 * 01. Accounts Seeder
 * Creates test accounts (student, teacher, admin) and fake learner accounts
 */

const db = require('../../../src/app/models');
const { CONFIG, TEST_ACCOUNTS, hashPassword, progressLog, faker } = require('../helpers/seedUtils');

async function seedAccounts() {
    console.log('\n📌 [01] Seeding Accounts...');
    const hashedPassword = await hashPassword(CONFIG.DEFAULT_PASSWORD);

    // Create test accounts
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
            console.log(`  ✅ Created ${acc.email} (${acc.role})`);
        } else {
            console.log(`  ⏭️ ${acc.email} already exists`);
        }
    }

    // Create fake learners - distribute over 6 months with growth pattern
    console.log(`  Creating ${CONFIG.NUM_FAKE_LEARNERS} fake learner accounts...`);
    const learners = [];

    // User growth distribution: earlier months have fewer users
    const monthDistribution = [0.08, 0.10, 0.12, 0.15, 0.22, 0.33]; // Sum = 1.0

    for (let i = 0; i < CONFIG.NUM_FAKE_LEARNERS; i++) {
        // Determine which month this user was created (0 = 6 months ago, 5 = current)
        const rand = Math.random();
        let cumulative = 0;
        let monthsAgo = 5;
        for (let m = 0; m < monthDistribution.length; m++) {
            cumulative += monthDistribution[m];
            if (rand <= cumulative) {
                monthsAgo = 5 - m;
                break;
            }
        }

        // Create date in that month
        const createdDate = new Date();
        createdDate.setMonth(createdDate.getMonth() - monthsAgo);
        createdDate.setDate(Math.floor(Math.random() * 28) + 1);
        createdDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        learners.push({
            id: faker.string.uuid(),
            email: faker.internet.email().toLowerCase(),
            password_hash: hashedPassword,
            role: 'learner',
            is_active: true,
            created_at: createdDate
        });

        if (learners.length >= CONFIG.BATCH_SIZE) {
            await db.Account.bulkCreate(learners, { ignoreDuplicates: true });
            progressLog(i + 1, CONFIG.NUM_FAKE_LEARNERS, 'Learners');
            learners.length = 0;
        }
    }
    if (learners.length > 0) {
        await db.Account.bulkCreate(learners, { ignoreDuplicates: true });
    }
    console.log(`  ✅ Created ${CONFIG.NUM_FAKE_LEARNERS} learner accounts`);
}

module.exports = seedAccounts;
