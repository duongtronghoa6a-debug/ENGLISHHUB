/**
 * Progress & Gamification API Tests
 * Tests for lesson progress, streaks, and gamification
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockProgress = [];
let mockStreak = { current_streak: 0, longest_streak: 0, last_activity: null };

// GET /api/v1/progress/course/:courseId
app.get('/api/v1/progress/course/:courseId', (req, res) => {
    const { courseId } = req.params;
    const courseProgress = mockProgress.filter(p => p.course_id === courseId);

    const totalLessons = 10;
    const completedLessons = courseProgress.filter(p => p.is_completed).length;
    const percentage = Math.round((completedLessons / totalLessons) * 100);

    res.status(200).json({
        success: true,
        data: {
            course_id: courseId,
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            percentage,
            lessons: courseProgress
        }
    });
});

// POST /api/v1/progress/lesson/:lessonId
app.post('/api/v1/progress/lesson/:lessonId', (req, res) => {
    const { lessonId } = req.params;
    const { course_id, is_completed } = req.body;

    const existing = mockProgress.find(p => p.lesson_id === lessonId);

    if (existing) {
        existing.is_completed = is_completed ?? existing.is_completed;
        existing.last_viewed = new Date().toISOString();

        return res.status(200).json({
            success: true,
            message: 'Progress updated',
            data: existing
        });
    }

    const progress = {
        id: 'prog-' + Date.now(),
        lesson_id: lessonId,
        course_id: course_id || 'c1',
        is_completed: is_completed || false,
        last_viewed: new Date().toISOString()
    };

    mockProgress.push(progress);

    // Update streak
    mockStreak.current_streak++;
    mockStreak.last_activity = new Date().toISOString();
    if (mockStreak.current_streak > mockStreak.longest_streak) {
        mockStreak.longest_streak = mockStreak.current_streak;
    }

    res.status(201).json({
        success: true,
        message: 'Progress recorded',
        data: progress
    });
});

// GET /api/v1/streak
app.get('/api/v1/streak', (req, res) => {
    res.status(200).json({
        success: true,
        data: mockStreak
    });
});

// POST /api/v1/streak/check-in
app.post('/api/v1/streak/check-in', (req, res) => {
    const today = new Date().toDateString();
    const lastActivity = mockStreak.last_activity
        ? new Date(mockStreak.last_activity).toDateString()
        : null;

    if (lastActivity === today) {
        return res.status(200).json({
            success: true,
            message: 'Already checked in today',
            data: mockStreak
        });
    }

    mockStreak.current_streak++;
    mockStreak.last_activity = new Date().toISOString();

    if (mockStreak.current_streak > mockStreak.longest_streak) {
        mockStreak.longest_streak = mockStreak.current_streak;
    }

    res.status(200).json({
        success: true,
        message: 'Check-in successful',
        data: mockStreak
    });
});

describe('Progress API', () => {

    beforeEach(() => {
        mockProgress = [];
        mockStreak = { current_streak: 0, longest_streak: 0, last_activity: null };
    });

    describe('GET /api/v1/progress/course/:courseId', () => {
        test('should return 0% progress initially', async () => {
            const response = await request(app).get('/api/v1/progress/course/c1');

            expect(response.status).toBe(200);
            expect(response.body.data.percentage).toBe(0);
            expect(response.body.data.completed_lessons).toBe(0);
        });

        test('should calculate progress correctly', async () => {
            // Complete some lessons
            await request(app)
                .post('/api/v1/progress/lesson/l1')
                .send({ course_id: 'c1', is_completed: true });
            await request(app)
                .post('/api/v1/progress/lesson/l2')
                .send({ course_id: 'c1', is_completed: true });

            const response = await request(app).get('/api/v1/progress/course/c1');

            expect(response.status).toBe(200);
            expect(response.body.data.completed_lessons).toBe(2);
            expect(response.body.data.percentage).toBe(20); // 2/10 * 100
        });
    });

    describe('POST /api/v1/progress/lesson/:lessonId', () => {
        test('should record new progress', async () => {
            const response = await request(app)
                .post('/api/v1/progress/lesson/l1')
                .send({ course_id: 'c1', is_completed: true });

            expect(response.status).toBe(201);
            expect(response.body.data.is_completed).toBe(true);
        });

        test('should update existing progress', async () => {
            // Record first view
            await request(app)
                .post('/api/v1/progress/lesson/l1')
                .send({ course_id: 'c1', is_completed: false });

            // Mark as completed
            const response = await request(app)
                .post('/api/v1/progress/lesson/l1')
                .send({ is_completed: true });

            expect(response.status).toBe(200);
            expect(response.body.data.is_completed).toBe(true);
        });

        test('should update streak when recording progress', async () => {
            await request(app)
                .post('/api/v1/progress/lesson/l1')
                .send({ course_id: 'c1' });

            const streakRes = await request(app).get('/api/v1/streak');

            expect(streakRes.body.data.current_streak).toBe(1);
        });
    });
});

describe('Streak API', () => {

    beforeEach(() => {
        mockStreak = { current_streak: 0, longest_streak: 0, last_activity: null };
    });

    describe('GET /api/v1/streak', () => {
        test('should return initial streak data', async () => {
            const response = await request(app).get('/api/v1/streak');

            expect(response.status).toBe(200);
            expect(response.body.data.current_streak).toBe(0);
            expect(response.body.data.longest_streak).toBe(0);
        });
    });

    describe('POST /api/v1/streak/check-in', () => {
        test('should increment streak on check-in', async () => {
            const response = await request(app).post('/api/v1/streak/check-in');

            expect(response.status).toBe(200);
            expect(response.body.data.current_streak).toBe(1);
        });

        test('should update longest streak', async () => {
            await request(app).post('/api/v1/streak/check-in');

            const response = await request(app).get('/api/v1/streak');

            expect(response.body.data.longest_streak).toBe(1);
        });

        test('should not double count same day', async () => {
            await request(app).post('/api/v1/streak/check-in');
            const response = await request(app).post('/api/v1/streak/check-in');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Already checked in today');
            expect(response.body.data.current_streak).toBe(1);
        });
    });
});
