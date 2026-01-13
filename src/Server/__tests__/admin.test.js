/**
 * Admin API Tests
 * Tests for admin dashboard, user management, course approval
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
const mockUsers = [
    { id: '1', email: 'admin@gmail.com', role: 'admin', status: 'active' },
    { id: '2', email: 'teacher@gmail.com', role: 'teacher', status: 'active' },
    { id: '3', email: 'learner@gmail.com', role: 'learner', status: 'active' }
];

const mockCourses = [
    { id: 'c1', title: 'Course 1', approval_status: 'pending', teacher_id: 't1' },
    { id: 'c2', title: 'Course 2', approval_status: 'approved', teacher_id: 't1' },
    { id: 'c3', title: 'Course 3', approval_status: 'rejected', teacher_id: 't2' }
];

// GET /api/v1/admin/stats
app.get('/api/v1/admin/stats', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            totalUsers: mockUsers.length,
            totalCourses: mockCourses.length,
            pendingCourses: mockCourses.filter(c => c.approval_status === 'pending').length,
            totalRevenue: 5000000,
            monthlyRevenue: 1000000
        }
    });
});

// GET /api/v1/admin/users
app.get('/api/v1/admin/users', (req, res) => {
    const { role, status, page = 1, limit = 10 } = req.query;

    let filtered = [...mockUsers];
    if (role) filtered = filtered.filter(u => u.role === role);
    if (status) filtered = filtered.filter(u => u.status === status);

    res.status(200).json({
        success: true,
        data: filtered,
        pagination: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) }
    });
});

// PUT /api/v1/admin/users/:id
app.put('/api/v1/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { ...user, status: status || user.status, role: role || user.role }
    });
});

// GET /api/v1/admin/courses
app.get('/api/v1/admin/courses', (req, res) => {
    const { approval_status } = req.query;

    let filtered = [...mockCourses];
    if (approval_status) filtered = filtered.filter(c => c.approval_status === approval_status);

    res.status(200).json({
        success: true,
        data: filtered
    });
});

// PUT /api/v1/admin/courses/:id/approve
app.put('/api/v1/admin/courses/:id/approve', (req, res) => {
    const { id } = req.params;
    const { approval_status } = req.body;

    const course = mockCourses.find(c => c.id === id);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
        return res.status(400).json({ success: false, message: 'Invalid approval status' });
    }

    res.status(200).json({
        success: true,
        message: `Course ${approval_status} successfully`,
        data: { ...course, approval_status }
    });
});

// DELETE /api/v1/admin/users/:id
app.delete('/api/v1/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
        success: true,
        message: 'User deleted successfully'
    });
});

describe('Admin API', () => {

    describe('GET /api/v1/admin/stats', () => {
        test('should return dashboard statistics', async () => {
            const response = await request(app).get('/api/v1/admin/stats');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalUsers');
            expect(response.body.data).toHaveProperty('totalCourses');
            expect(response.body.data).toHaveProperty('pendingCourses');
            expect(response.body.data).toHaveProperty('totalRevenue');
        });
    });

    describe('GET /api/v1/admin/users', () => {
        test('should return all users', async () => {
            const response = await request(app).get('/api/v1/admin/users');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(3);
        });

        test('should filter users by role', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({ role: 'teacher' });

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].role).toBe('teacher');
        });
    });

    describe('PUT /api/v1/admin/users/:id', () => {
        test('should update user status', async () => {
            const response = await request(app)
                .put('/api/v1/admin/users/2')
                .send({ status: 'inactive' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('inactive');
        });

        test('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .put('/api/v1/admin/users/999')
                .send({ status: 'inactive' });

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/v1/admin/courses', () => {
        test('should return all courses', async () => {
            const response = await request(app).get('/api/v1/admin/courses');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(3);
        });

        test('should filter by approval status', async () => {
            const response = await request(app)
                .get('/api/v1/admin/courses')
                .query({ approval_status: 'pending' });

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
        });
    });

    describe('PUT /api/v1/admin/courses/:id/approve', () => {
        test('should approve course', async () => {
            const response = await request(app)
                .put('/api/v1/admin/courses/c1/approve')
                .send({ approval_status: 'approved' });

            expect(response.status).toBe(200);
            expect(response.body.data.approval_status).toBe('approved');
        });

        test('should reject course', async () => {
            const response = await request(app)
                .put('/api/v1/admin/courses/c1/approve')
                .send({ approval_status: 'rejected' });

            expect(response.status).toBe(200);
            expect(response.body.data.approval_status).toBe('rejected');
        });

        test('should fail with invalid status', async () => {
            const response = await request(app)
                .put('/api/v1/admin/courses/c1/approve')
                .send({ approval_status: 'invalid_status' });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/v1/admin/users/:id', () => {
        test('should delete user successfully', async () => {
            const response = await request(app).delete('/api/v1/admin/users/3');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should return 404 for non-existent user', async () => {
            const response = await request(app).delete('/api/v1/admin/users/999');

            expect(response.status).toBe(404);
        });
    });
});
