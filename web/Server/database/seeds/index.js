/**
 * MASTER SEED FILE
 * 
 * Runs all seeders in the correct order.
 * 
 * Usage: 
 *   cd Server
 *   node database/seeds/index.js
 * 
 * Or add to package.json:
 *   "seed": "node database/seeds/index.js"
 *   Then run: npm run seed
 */

require('dotenv').config();
const { sequelize } = require('../../src/config/db/connect');
const db = require('../../src/app/models');

// Import all seeders in order
const seedAccounts = require('./seeders/01_accounts.seeder');
const seedProfiles = require('./seeders/02_profiles.seeder');
const seedCourses = require('./seeders/03_courses.seeder');
const seedExams = require('./seeders/04_exams.seeder');
const seedOfflineClasses = require('./seeders/05_offlineClasses.seeder');
const seedAchievements = require('./seeders/06_achievements.seeder');
const seedReviews = require('./seeders/07_reviews.seeder');
const seedRubrics = require('./seeders/08_rubrics.seeder');
const seedManifestCourses = require('./seeders/09_manifest.seeder');
const seedEnrollments = require('./seeders/10_enrollments.seeder');
const seedOrders = require('./seeders/11_orders.seeder');

async function main() {
    console.log('🚀 Starting Master Seed Process...');
    console.log('='.repeat(50));

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Sync models (force: true = drop and recreate ALL tables)
        // WARNING: This will DELETE all existing data!
        const forceSync = process.argv.includes('--force') || process.argv.includes('-f');

        if (forceSync) {
            console.log('⚠️  FORCE MODE: Dropping and recreating all tables...');
            await sequelize.sync({ force: true });
        } else {
            console.log('📋 Using ALTER mode (preserving existing data where possible)');
            await sequelize.sync({ alter: true });
        }
        console.log('✅ Database schema synced\n');

        // Run all seeders in order
        await seedAccounts();
        await seedProfiles();
        await seedCourses();
        await seedExams();
        await seedOfflineClasses();
        await seedAchievements();
        await seedReviews();
        await seedRubrics();
        await seedManifestCourses();  // Cloudflare R2 courses
        await seedEnrollments();       // Student enrollments
        await seedOrders();            // Mock orders for revenue


        console.log('\n' + '='.repeat(50));
        console.log('🎉 All seeds completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('  - Student: 01@gmail.com / 111111');
        console.log('  - Teacher: 02@gmail.com / 111111');
        console.log('  - Admin:   03@gmail.com / 111111');
        console.log('='.repeat(50));

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

main();
