/**
 * Lesson API Tests
 * Tests for lesson CRUD operations
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockLessons = [
    { id: 'l1', title: 'Lesson 1', course_id: 'c1', order_index: 1, content_type: 'video' },
    { id: 'l2', title: 'Lesson 2', course_id: 'c1', order_index: 2, content_type: 'pdf' },
    { id: 'l3', title: 'Lesson 3', course_id: 'c2', order_index: 1, content_type: 'video' }
];

// GET /api/v1/lessons/course/:courseId
app.get('/api/v1/lessons/course/:courseId', (req, res) => {
    const { courseId } = req.params;
    const lessons = mockLessons.filter(l => l.course_id === courseId);

    res.status(200).json({
        success: true,
        data: lessons.sort((a, b) => a.order_index - b.order_index)
    });
});

// GET /api/v1/lessons/:id
app.get('/api/v1/lessons/:id', (req, res) => {
    const lesson = mockLessons.find(l => l.id === req.params.id);

    if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    res.status(200).json({ success: true, data: lesson });
});

// POST /api/v1/teacher/courses/:courseId/lessons
app.post('/api/v1/teacher/courses/:courseId/lessons', (req, res) => {
    const { courseId } = req.params;
    const { title, content_type, content_url, duration } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const existingLessons = mockLessons.filter(l => l.course_id === courseId);
    const newLesson = {
        id: 'l' + Date.now(),
        title,
        course_id: courseId,
        content_type: content_type || 'video',
        content_url: content_url || '',
        duration: duration || 0,
        order_index: existingLessons.length + 1
    };

    mockLessons.push(newLesson);

    res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: newLesson
    });
});

// PUT /api/v1/lessons/:id
app.put('/api/v1/lessons/:id', (req, res) => {
    const { id } = req.params;
    const { title, content_type, content_url } = req.body;

    const lesson = mockLessons.find(l => l.id === id);
    if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const updated = {
        ...lesson,
        title: title || lesson.title,
        content_type: content_type || lesson.content_type,
        content_url: content_url || lesson.content_url
    };

    res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        data: updated
    });
});

// DELETE /api/v1/lessons/:id
app.delete('/api/v1/lessons/:id', (req, res) => {
    const { id } = req.params;
    const index = mockLessons.findIndex(l => l.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    mockLessons.splice(index, 1);

    res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully'
    });
});

describe('Lesson API', () => {

    beforeEach(() => {
        mockLessons = [
            { id: 'l1', title: 'Lesson 1', course_id: 'c1', order_index: 1, content_type: 'video' },
            { id: 'l2', title: 'Lesson 2', course_id: 'c1', order_index: 2, content_type: 'pdf' },
            { id: 'l3', title: 'Lesson 3', course_id: 'c2', order_index: 1, content_type: 'video' }
        ];
    });

    describe('GET /api/v1/lessons/course/:courseId', () => {
        test('should return lessons for a course', async () => {
            const response = await request(app).get('/api/v1/lessons/course/c1');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(2);
        });

        test('should return empty array for course without lessons', async () => {
            const response = await request(app).get('/api/v1/lessons/course/c999');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(0);
        });

        test('should return lessons sorted by order', async () => {
            const response = await request(app).get('/api/v1/lessons/course/c1');

            expect(response.body.data[0].order_index).toBeLessThan(response.body.data[1].order_index);
        });
    });

    describe('GET /api/v1/lessons/:id', () => {
        test('should return lesson details', async () => {
            const response = await request(app).get('/api/v1/lessons/l1');

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe('Lesson 1');
        });

        test('should return 404 for non-existent lesson', async () => {
            const response = await request(app).get('/api/v1/lessons/l999');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/teacher/courses/:courseId/lessons', () => {
        test('should create new lesson', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/courses/c1/lessons')
                .send({
                    title: 'New Lesson',
                    content_type: 'video',
                    duration: 600
                });

            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('New Lesson');
            expect(response.body.data.order_index).toBe(3);
        });

        test('should fail without title', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/courses/c1/lessons')
                .send({ content_type: 'video' });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/v1/lessons/:id', () => {
        test('should update lesson', async () => {
            const response = await request(app)
                .put('/api/v1/lessons/l1')
                .send({ title: 'Updated Lesson' });

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe('Updated Lesson');
        });

        test('should return 404 for non-existent lesson', async () => {
            const response = await request(app)
                .put('/api/v1/lessons/l999')
                .send({ title: 'Updated' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/lessons/:id', () => {
        test('should delete lesson', async () => {
            const response = await request(app).delete('/api/v1/lessons/l1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should return 404 for non-existent lesson', async () => {
            const response = await request(app).delete('/api/v1/lessons/l999');

            expect(response.status).toBe(404);
        });
    });
});
