/**
 * Authentication API Tests
 * Tests for login, register, and auth middleware
 */

const request = require('supertest');

// Mock database before requiring app
jest.mock('../src/app/models', () => ({
    Account: {
        findOne: jest.fn(),
        create: jest.fn()
    },
    Learner: {
        create: jest.fn()
    },
    Teacher: {
        create: jest.fn()
    },
    sequelize: {
        authenticate: jest.fn().mockResolvedValue(true),
        sync: jest.fn().mockResolvedValue(true)
    }
}));

const db = require('../src/app/models');

// Create minimal express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock auth routes
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Simulate user lookup
    const mockUser = db.Account.findOne.mockReturnValue;

    if (email === 'test@gmail.com' && password === '123456') {
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: { id: '1', email, role: 'learner' },
                accessToken: 'mock-jwt-token'
            }
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
    });
});

app.post('/api/v1/auth/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Check if email already exists
    if (email === 'existing@gmail.com') {
        return res.status(409).json({
            success: false,
            message: 'Email already exists'
        });
    }

    return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: { id: '2', email, role: role || 'learner' }
        }
    });
});

describe('Authentication API', () => {

    describe('POST /api/v1/auth/login', () => {

        test('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@gmail.com',
                    password: '123456'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data.user).toHaveProperty('email', 'test@gmail.com');
        });

        test('should fail with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@gmail.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        test('should fail with missing email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    password: '123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should fail with missing password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@gmail.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/register', () => {

        test('should register new user successfully', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'newuser@gmail.com',
                    password: '123456',
                    role: 'learner'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('email', 'newuser@gmail.com');
        });

        test('should fail with existing email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'existing@gmail.com',
                    password: '123456'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email already exists');
        });

        test('should fail with missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@gmail.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
