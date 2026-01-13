/**
 * Cart API Tests
 * Tests for shopping cart operations
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockCart = [];

// GET /api/v1/cart
app.get('/api/v1/cart', (req, res) => {
    const total = mockCart.reduce((sum, item) => sum + item.price, 0);

    res.status(200).json({
        success: true,
        data: {
            items: mockCart,
            total,
            itemCount: mockCart.length
        }
    });
});

// POST /api/v1/cart
app.post('/api/v1/cart', (req, res) => {
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    // Check if already in cart
    const existing = mockCart.find(item => item.course_id === courseId);
    if (existing) {
        return res.status(409).json({ success: false, message: 'Course already in cart' });
    }

    const newItem = {
        id: 'cart-' + Date.now(),
        course_id: courseId,
        title: 'Course ' + courseId,
        price: 199000,
        added_at: new Date().toISOString()
    };

    mockCart.push(newItem);

    res.status(201).json({
        success: true,
        message: 'Added to cart',
        data: newItem
    });
});

// DELETE /api/v1/cart/:id
app.delete('/api/v1/cart/:id', (req, res) => {
    const { id } = req.params;
    const index = mockCart.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    mockCart.splice(index, 1);

    res.status(200).json({
        success: true,
        message: 'Removed from cart'
    });
});

// DELETE /api/v1/cart (clear all)
app.delete('/api/v1/cart', (req, res) => {
    mockCart = [];

    res.status(200).json({
        success: true,
        message: 'Cart cleared'
    });
});

// PATCH /api/v1/cart/:id/select
app.patch('/api/v1/cart/:id/select', (req, res) => {
    const { id } = req.params;
    const { isSelected } = req.body;

    const item = mockCart.find(i => i.id === id);
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.is_selected = isSelected;

    res.status(200).json({
        success: true,
        data: item
    });
});

describe('Cart API', () => {

    beforeEach(() => {
        mockCart = [];
    });

    describe('GET /api/v1/cart', () => {
        test('should return empty cart initially', async () => {
            const response = await request(app).get('/api/v1/cart');

            expect(response.status).toBe(200);
            expect(response.body.data.items).toEqual([]);
            expect(response.body.data.total).toBe(0);
            expect(response.body.data.itemCount).toBe(0);
        });

        test('should return cart with items and total', async () => {
            // Add items first
            await request(app).post('/api/v1/cart').send({ courseId: 'c1' });
            await request(app).post('/api/v1/cart').send({ courseId: 'c2' });

            const response = await request(app).get('/api/v1/cart');

            expect(response.status).toBe(200);
            expect(response.body.data.itemCount).toBe(2);
            expect(response.body.data.total).toBe(398000);
        });
    });

    describe('POST /api/v1/cart', () => {
        test('should add item to cart', async () => {
            const response = await request(app)
                .post('/api/v1/cart')
                .send({ courseId: 'c1' });

            expect(response.status).toBe(201);
            expect(response.body.data.course_id).toBe('c1');
        });

        test('should prevent duplicate items', async () => {
            await request(app).post('/api/v1/cart').send({ courseId: 'c1' });

            const response = await request(app)
                .post('/api/v1/cart')
                .send({ courseId: 'c1' });

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('Course already in cart');
        });

        test('should fail without courseId', async () => {
            const response = await request(app)
                .post('/api/v1/cart')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/v1/cart/:id', () => {
        test('should remove item from cart', async () => {
            const addRes = await request(app)
                .post('/api/v1/cart')
                .send({ courseId: 'c1' });

            const itemId = addRes.body.data.id;
            const response = await request(app).delete(`/api/v1/cart/${itemId}`);

            expect(response.status).toBe(200);

            // Verify cart is empty
            const cartRes = await request(app).get('/api/v1/cart');
            expect(cartRes.body.data.itemCount).toBe(0);
        });

        test('should return 404 for non-existent item', async () => {
            const response = await request(app).delete('/api/v1/cart/cart-999');

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/cart', () => {
        test('should clear entire cart', async () => {
            // Add items
            await request(app).post('/api/v1/cart').send({ courseId: 'c1' });
            await request(app).post('/api/v1/cart').send({ courseId: 'c2' });

            // Clear cart
            const response = await request(app).delete('/api/v1/cart');

            expect(response.status).toBe(200);

            // Verify cart is empty
            const cartRes = await request(app).get('/api/v1/cart');
            expect(cartRes.body.data.itemCount).toBe(0);
        });
    });

    describe('PATCH /api/v1/cart/:id/select', () => {
        test('should select/deselect cart item', async () => {
            const addRes = await request(app)
                .post('/api/v1/cart')
                .send({ courseId: 'c1' });

            const itemId = addRes.body.data.id;

            const response = await request(app)
                .patch(`/api/v1/cart/${itemId}/select`)
                .send({ isSelected: true });

            expect(response.status).toBe(200);
            expect(response.body.data.is_selected).toBe(true);
        });
    });
});
