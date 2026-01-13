/**
 * Enrollment & Revenue Tests
 * Tests for course enrollment and teacher revenue tracking
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockOrders = [];
let mockEnrollments = [];

// POST /api/v1/enrollments/enroll/:courseId
app.post('/api/v1/enrollments/enroll/:courseId', (req, res) => {
    const { courseId } = req.params;
    const learnerId = 'learner-1';

    // Check if already enrolled
    const existing = mockEnrollments.find(e =>
        e.course_id === courseId && e.learner_id === learnerId
    );

    if (existing) {
        return res.status(409).json({
            success: false,
            message: 'Already enrolled in this course'
        });
    }

    // Create enrollment
    const enrollment = {
        id: 'enr-' + Date.now(),
        learner_id: learnerId,
        course_id: courseId,
        status: 'active',
        enrolled_at: new Date().toISOString()
    };
    mockEnrollments.push(enrollment);

    // Create order for revenue tracking
    const order = {
        id: 'ord-' + Date.now(),
        learner_id: learnerId,
        total_amount: 199000,
        status: 'completed',
        items: [{ course_id: courseId, price: 199000 }]
    };
    mockOrders.push(order);

    res.status(201).json({
        success: true,
        message: 'Enrollment created successfully',
        data: enrollment
    });
});

// GET /api/v1/enrollments/check/:courseId
app.get('/api/v1/enrollments/check/:courseId', (req, res) => {
    const { courseId } = req.params;
    const learnerId = 'learner-1';

    const enrollment = mockEnrollments.find(e =>
        e.course_id === courseId && e.learner_id === learnerId
    );

    res.status(200).json({
        success: true,
        isEnrolled: !!enrollment,
        status: enrollment ? enrollment.status : null
    });
});

// GET /api/v1/teacher/dashboard/stats (revenue)
app.get('/api/v1/teacher/dashboard/stats', (req, res) => {
    const teacherCourseIds = ['course-1', 'course-2'];

    const teacherOrders = mockOrders.filter(o =>
        o.items.some(item => teacherCourseIds.includes(item.course_id))
    );

    const totalRevenue = teacherOrders.reduce((sum, o) => sum + o.total_amount, 0);

    res.status(200).json({
        success: true,
        data: {
            totalCourses: 2,
            totalStudents: mockEnrollments.length,
            totalRevenue: totalRevenue,
            thisMonthRevenue: totalRevenue,
            lastMonthRevenue: 0
        }
    });
});

describe('Enrollment API', () => {

    beforeEach(() => {
        // Reset mock data before each test
        mockOrders = [];
        mockEnrollments = [];
    });

    describe('POST /api/v1/enrollments/enroll/:courseId', () => {

        test('should enroll successfully and create order', async () => {
            const response = await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.status).toBe('active');

            // Verify order was created
            expect(mockOrders.length).toBe(1);
            expect(mockOrders[0].status).toBe('completed');
        });

        test('should prevent duplicate enrollment', async () => {
            // First enrollment
            await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            // Second enrollment - should fail
            const response = await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Already enrolled in this course');
        });
    });

    describe('GET /api/v1/enrollments/check/:courseId', () => {

        test('should return false when not enrolled', async () => {
            const response = await request(app)
                .get('/api/v1/enrollments/check/course-1');

            expect(response.status).toBe(200);
            expect(response.body.isEnrolled).toBe(false);
        });

        test('should return true after enrollment', async () => {
            // Enroll first
            await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            // Check enrollment
            const response = await request(app)
                .get('/api/v1/enrollments/check/course-1');

            expect(response.status).toBe(200);
            expect(response.body.isEnrolled).toBe(true);
            expect(response.body.status).toBe('active');
        });
    });
});

describe('Teacher Revenue API', () => {

    beforeEach(() => {
        mockOrders = [];
        mockEnrollments = [];
    });

    describe('GET /api/v1/teacher/dashboard/stats', () => {

        test('should return zero revenue initially', async () => {
            const response = await request(app)
                .get('/api/v1/teacher/dashboard/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalRevenue).toBe(0);
            expect(response.body.data.thisMonthRevenue).toBe(0);
        });

        test('should update revenue after enrollment', async () => {
            // Create enrollment (which creates order)
            await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            // Check revenue
            const response = await request(app)
                .get('/api/v1/teacher/dashboard/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalRevenue).toBe(199000);
            expect(response.body.data.thisMonthRevenue).toBe(199000);
        });

        test('should accumulate revenue from multiple enrollments', async () => {
            // Create multiple enrollments
            await request(app)
                .post('/api/v1/enrollments/enroll/course-1');

            // Reset mock to allow another enrollment
            mockEnrollments = mockEnrollments.filter(e => e.course_id !== 'course-2');

            await request(app)
                .post('/api/v1/enrollments/enroll/course-2');

            // Check revenue
            const response = await request(app)
                .get('/api/v1/teacher/dashboard/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalRevenue).toBe(398000); // 2 x 199000
        });
    });
});
