/**
 * 07. Reviews Seeder
 * Seeds course reviews from review.json
 * Automatically assigns valid courses and learners from database
 */

const db = require('../../../src/app/models');
const { loadJsonFile } = require('../helpers/seedUtils');

async function seedReviews() {
    console.log('\n📌 [07] Seeding Reviews...');

    // Get actual learners and courses from DB
    const learners = await db.Learner.findAll({ attributes: ['id'] });
    const courses = await db.Course.findAll({ attributes: ['id', 'title'] });

    if (courses.length === 0 || learners.length === 0) {
        console.log('  ⚠️ No courses or learners found, skipping reviews');
        return;
    }

    const learnerIds = learners.map(l => l.id);
    const courseList = courses.map(c => c.id);
    console.log(`  Found ${learnerIds.length} learners, ${courseList.length} courses`);

    // Load reviews from JSON
    const reviewsData = loadJsonFile('review.json');

    let createdCount = 0;

    if (reviewsData && Array.isArray(reviewsData) && reviewsData.length > 0) {
        console.log(`  Processing ${reviewsData.length} reviews from JSON...`);

        // Use comments/ratings from JSON but assign to random learners and courses
        for (let i = 0; i < reviewsData.length; i++) {
            const review = reviewsData[i];
            try {
                // Assign random course and learner from DB
                const randomCourseId = courseList[i % courseList.length]; // Distribute across courses
                const randomLearnerId = learnerIds[Math.floor(Math.random() * learnerIds.length)];

                await db.Review.create({
                    learner_id: randomLearnerId,
                    course_id: randomCourseId,
                    rating: review.rating || (Math.floor(Math.random() * 2) + 4),
                    comment: review.comment || 'Khóa học rất hay!',
                    created_at: review.created_at ? new Date(review.created_at) : new Date()
                });
                createdCount++;
            } catch (error) {
                // Skip duplicates silently
            }
        }
        console.log(`  ✅ Created ${createdCount} reviews from review.json`);
    } else {
        // Fallback sample reviews
        console.log('  No review.json found, creating sample reviews...');
        await seedSampleReviews(courseList, learnerIds);
    }
}

async function seedSampleReviews(courseList, learnerIds) {
    const comments = [
        'Khóa học rất hay và bổ ích!',
        'Giáo viên dạy dễ hiểu, recommend!',
        'Nội dung chất lượng, đáng tiền.',
        'Học xong thấy tiến bộ rõ rệt.',
        'Cần thêm bài tập thực hành.',
        'Rất thích cách giảng viên truyền đạt.',
        'Video chất lượng cao, âm thanh rõ.',
        'Giá hơi cao nhưng xứng đáng.',
        'Mình đã lên điểm nhờ khóa này!',
        'Sẽ giới thiệu cho bạn bè.'
    ];

    let count = 0;
    // Create 3-5 reviews per course for first 30 courses
    for (let i = 0; i < Math.min(30, courseList.length); i++) {
        const numReviews = Math.floor(Math.random() * 3) + 3;
        for (let j = 0; j < numReviews; j++) {
            try {
                await db.Review.create({
                    course_id: courseList[i],
                    learner_id: learnerIds[Math.floor(Math.random() * learnerIds.length)],
                    rating: Math.floor(Math.random() * 2) + 4,
                    comment: comments[Math.floor(Math.random() * comments.length)]
                });
                count++;
            } catch (e) {
                // Skip
            }
        }
    }
    console.log(`  ✅ Created ${count} sample reviews`);
}

module.exports = seedReviews;
