/**
 * 11. Orders Seeder
 * Creates mock orders for revenue calculation
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../../../src/app/models');
const { faker } = require('@faker-js/faker');

async function seedOrders() {
    console.log('\n📌 [11] Seeding Mock Orders...');

    try {
        // Get enrolled learners with their course enrollments - increased limit for more data
        const enrollments = await db.Enrollment.findAll({
            limit: 200,
            include: [
                { model: db.Course, as: 'course' },
                { model: db.Learner, as: 'learner' }
            ]
        });

        if (enrollments.length === 0) {
            console.log('  ⚠️ No enrollments found, skipping orders');
            return;
        }

        let orderCount = 0;
        let orderItemCount = 0;

        // Group enrollments by learner for realistic orders
        const learnerEnrollments = {};
        for (const e of enrollments) {
            const learnerId = e.learner_id;
            if (!learnerEnrollments[learnerId]) {
                learnerEnrollments[learnerId] = [];
            }
            learnerEnrollments[learnerId].push(e);
        }

        // Generate dates for 6 months of chart data
        const generateMonthlyDate = (monthsAgo) => {
            const date = new Date();
            date.setMonth(date.getMonth() - monthsAgo);
            date.setDate(Math.floor(Math.random() * 28) + 1);
            return date;
        };

        // Create orders for each learner
        for (const learnerId of Object.keys(learnerEnrollments)) {
            const learnerCourses = learnerEnrollments[learnerId];
            const learner = learnerCourses[0]?.learner;

            if (!learner) continue;

            // Create 1-2 orders per learner
            const numOrders = faker.number.int({ min: 1, max: 2 });

            for (let i = 0; i < numOrders && learnerCourses.length > 0; i++) {
                // Take 1-3 courses for this order
                const coursesForOrder = learnerCourses.splice(0, faker.number.int({ min: 1, max: 3 }));

                // Calculate total - ensure prices are valid numbers
                const total = coursesForOrder.reduce((sum, e) => {
                    const price = parseFloat(e.course?.price) || 0;
                    return sum + (isNaN(price) ? 0 : price);
                }, 0);

                // Distribute orders across 6 months for chart data
                const monthsAgo = faker.number.int({ min: 0, max: 5 });
                const orderDate = monthsAgo === 0
                    ? faker.date.recent({ days: 15 })  // Current month
                    : generateMonthlyDate(monthsAgo);  // Past months

                // Create order - all completed (auto-success payment)
                const order = await db.Order.create({
                    id: uuidv4(),
                    learner_id: learnerId,
                    user_id: learner.account_id,
                    total_amount: total,
                    status: 'completed',  // Auto-success payment
                    payment_method: faker.helpers.arrayElement(['momo', 'vnpay', 'bank_transfer', 'COD']),
                    items_json: coursesForOrder.map(e => ({
                        course_id: e.course_id,
                        title: e.course?.title,
                        price: e.course?.price || 0
                    })),
                    created_at: orderDate
                });

                orderCount++;

                // Create order items
                for (const enrollment of coursesForOrder) {
                    const itemPrice = parseFloat(enrollment.course?.price) || 0;
                    await db.OrderItem.create({
                        id: uuidv4(),
                        order_id: order.id,
                        course_id: enrollment.course_id,
                        price: isNaN(itemPrice) ? 0 : itemPrice
                    });
                    orderItemCount++;
                }
            }
        }

        console.log(`  ✅ Created ${orderCount} orders with ${orderItemCount} items`);

    } catch (error) {
        console.error('  ⚠️ Error seeding orders:', error.message);
    }
}

module.exports = seedOrders;
