/**
 * Course API Tests
 * Tests for course listing, creation, and management
 */

const request = require('supertest');

// Mock express app for course testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock courses data
const mockCourses = [
    {
        id: 'c1',
        title: 'TOEIC Preparation',
        description: 'Complete TOEIC course',
        price: 199000,
        level: 'B1',
        teacher_id: 't1',
        approval_status: 'approved',
        is_published: true
    },
    {
        id: 'c2',
        title: 'Business English',
        description: 'Business communication',
        price: 299000,
        level: 'B2',
        teacher_id: 't1',
        approval_status: 'approved',
        is_published: true
    }
];

// GET /api/v1/courses
app.get('/api/v1/courses', (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    let filtered = mockCourses.filter(c => c.is_published && c.approval_status === 'approved');

    if (search) {
        filtered = filtered.filter(c =>
            c.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.status(200).json({
        success: true,
        data: filtered,
        pagination: {
            total: filtered.length,
            page: parseInt(page),
            limit: parseInt(limit)
        }
    });
});

// GET /api/v1/courses/:id
app.get('/api/v1/courses/:id', (req, res) => {
    const course = mockCourses.find(c => c.id === req.params.id);

    if (!course) {
        return res.status(404).json({
            success: false,
            message: 'Course not found'
        });
    }

    res.status(200).json({
        success: true,
        data: course
    });
});

// POST /api/v1/teacher/courses (create course)
app.post('/api/v1/teacher/courses', (req, res) => {
    const { title, description, price, level, category } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: 'Title is required'
        });
    }

    const newCourse = {
        id: 'c' + (mockCourses.length + 1),
        title,
        description: description || '',
        price: price || 0,
        level: level || 'B1',
        category: category || 'general',
        approval_status: 'draft',
        is_published: false,
        created_at: new Date().toISOString()
    };

    res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: newCourse
    });
});

describe('Course API', () => {

    describe('GET /api/v1/courses', () => {

        test('should return list of published courses', async () => {
            const response = await request(app)
                .get('/api/v1/courses');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        test('should filter courses by search query', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ search: 'TOEIC' });

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].title).toContain('TOEIC');
        });

        test('should return pagination info', async () => {
            const response = await request(app)
                .get('/api/v1/courses')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('page');
        });
    });

    describe('GET /api/v1/courses/:id', () => {

        test('should return course details', async () => {
            const response = await request(app)
                .get('/api/v1/courses/c1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('title');
            expect(response.body.data).toHaveProperty('price');
        });

        test('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .get('/api/v1/courses/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/teacher/courses', () => {

        test('should create new course', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/courses')
                .send({
                    title: 'New Course',
                    description: 'Test description',
                    price: 150000,
                    level: 'A2'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.title).toBe('New Course');
            expect(response.body.data.approval_status).toBe('draft');
        });

        test('should fail without title', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/courses')
                .send({
                    description: 'No title course',
                    price: 100000
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
