/**
 * 10. Enrollments Seeder
 * Creates student enrollments for ALL courses (5-15 per course)
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../../../src/app/models');
const { faker } = require('@faker-js/faker');

async function seedEnrollments() {
    console.log('\n📌 [10] Seeding Enrollments...');

    try {
        // Get learner accounts
        const learners = await db.Learner.findAll({
            limit: 100,
            attributes: ['id']
        });

        if (learners.length === 0) {
            console.log('  ⚠️ No learners found, skipping enrollments');
            return;
        }

        const learnerIds = learners.map(l => l.id);
        console.log(`  Found ${learnerIds.length} learners`);

        // Get ALL courses (not just published, not limited to 30)
        const courses = await db.Course.findAll({
            attributes: ['id', 'title'],
            include: [{
                model: db.Enrollment,
                as: 'enrollments',
                attributes: ['id']
            }]
        });

        if (courses.length === 0) {
            console.log('  ⚠️ No courses found, skipping enrollments');
            return;
        }

        console.log(`  Found ${courses.length} courses`);

        let createdCount = 0;
        let skippedCount = 0;

        // Create enrollments for each course
        for (const course of courses) {
            // Skip if course already has >= 5 enrollments
            if ((course.enrollments?.length || 0) >= 5) {
                skippedCount++;
                continue;
            }

            // Each course gets 5-15 random learners
            const numEnrollments = faker.number.int({ min: 5, max: 15 });
            const shuffledLearners = [...learnerIds].sort(() => Math.random() - 0.5);
            const selectedLearners = shuffledLearners.slice(0, numEnrollments);

            for (const learnerId of selectedLearners) {
                try {
                    await db.Enrollment.findOrCreate({
                        where: {
                            learner_id: learnerId,
                            course_id: course.id
                        },
                        defaults: {
                            id: uuidv4(),
                            learner_id: learnerId,
                            course_id: course.id,
                            enrolled_at: faker.date.past({ years: 1 }),
                            progress_percent: faker.number.int({ min: 0, max: 100 }),
                            status: faker.helpers.arrayElement(['active', 'active', 'active', 'completed'])
                        }
                    });
                    createdCount++;
                } catch (error) {
                    // Ignore duplicates
                }
            }
        }

        console.log(`  ✅ Created ${createdCount} enrollments (${skippedCount} courses already had data)`);

    } catch (error) {
        console.error('  ⚠️ Error seeding enrollments:', error.message);
    }
}

module.exports = seedEnrollments;

