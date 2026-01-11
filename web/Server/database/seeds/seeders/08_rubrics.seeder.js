/**
 * 08. Rubrics Seeder
 * Creates grading rubrics for exams
 */

const db = require('../../../src/app/models');

async function seedRubrics() {
    console.log('\n📌 [08] Seeding Rubrics...');

    const rubrics = [
        { name: 'Excellent', min_score: 90, max_score: 100, description: 'Outstanding performance', grade: 'A' },
        { name: 'Good', min_score: 80, max_score: 89, description: 'Above average performance', grade: 'B' },
        { name: 'Satisfactory', min_score: 70, max_score: 79, description: 'Average performance', grade: 'C' },
        { name: 'Needs Improvement', min_score: 60, max_score: 69, description: 'Below average', grade: 'D' },
        { name: 'Failing', min_score: 0, max_score: 59, description: 'Did not meet minimum requirements', grade: 'F' }
    ];

    let createdCount = 0;

    for (const rubric of rubrics) {
        try {
            await db.Rubric.findOrCreate({
                where: { name: rubric.name },
                defaults: rubric
            });
            createdCount++;
        } catch (error) {
            // Rubric model might not exist
            if (error.name === 'SequelizeConnectionError' || error.message.includes('does not exist')) {
                console.log('  ⚠️ Rubric table not found, skipping...');
                return;
            }
        }
    }

    console.log(`  ✅ Created ${createdCount} rubrics`);
}

module.exports = seedRubrics;
