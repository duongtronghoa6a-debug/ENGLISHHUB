/**
 * Master Seed Script - Runs all seed scripts in order
 * 
 * Run: node scripts/seedAll.js
 * Or: npm run seed (if added to package.json)
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const seedScripts = [
    'seedVideoCourses.js',
    'seedAchievementData.js',
    'seedDemoEnrollments.js'
];

async function runAllSeeds() {
    console.log('🌱 ========================================');
    console.log('🌱 MASTER SEED SCRIPT - Running all seeds');
    console.log('🌱 ========================================\n');

    const scriptsDir = __dirname;
    let successCount = 0;
    let failCount = 0;

    for (const script of seedScripts) {
        const scriptPath = path.join(scriptsDir, script);

        console.log(`\n${'='.repeat(50)}`);
        console.log(`▶️  Running: ${script}`);
        console.log(`${'='.repeat(50)}\n`);

        try {
            execSync(`node "${scriptPath}"`, {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
            successCount++;
            console.log(`\n✅ ${script} completed successfully\n`);
        } catch (error) {
            failCount++;
            console.error(`\n❌ ${script} failed\n`);
        }
    }

    console.log('\n🌱 ========================================');
    console.log('🌱 SEED SUMMARY');
    console.log('🌱 ========================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('🌱 ========================================\n');
}

runAllSeeds();
