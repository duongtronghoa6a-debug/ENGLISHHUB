/**
 * Order API Tests
 * Tests for order creation, payment, and history
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockOrders = [];
let mockCart = [
    { id: 'cart1', course_id: 'c1', price: 199000 },
    { id: 'cart2', course_id: 'c2', price: 299000 }
];

// GET /api/v1/orders
app.get('/api/v1/orders', (req, res) => {
    res.status(200).json({
        success: true,
        data: mockOrders
    });
});

// GET /api/v1/orders/:id
app.get('/api/v1/orders/:id', (req, res) => {
    const order = mockOrders.find(o => o.id === req.params.id);

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
});

// POST /api/v1/orders
app.post('/api/v1/orders', (req, res) => {
    const { courseIds, paymentMethod } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Course IDs are required' });
    }

    const items = courseIds.map(id => {
        const cartItem = mockCart.find(c => c.course_id === id);
        return {
            course_id: id,
            price: cartItem ? cartItem.price : 199000
        };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const order = {
        id: 'ord-' + Date.now(),
        learner_id: 'learner-1',
        items,
        total_amount: totalAmount,
        payment_method: paymentMethod || 'bank_transfer',
        status: 'pending',
        created_at: new Date().toISOString()
    };

    mockOrders.push(order);

    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
    });
});

// PUT /api/v1/orders/:id/pay
app.put('/api/v1/orders/:id/pay', (req, res) => {
    const { id } = req.params;
    const order = mockOrders.find(o => o.id === id);

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    order.status = 'completed';
    order.paid_at = new Date().toISOString();

    res.status(200).json({
        success: true,
        message: 'Payment successful',
        data: order
    });
});

// PUT /api/v1/orders/:id/cancel
app.put('/api/v1/orders/:id/cancel', (req, res) => {
    const { id } = req.params;
    const order = mockOrders.find(o => o.id === id);

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot cancel paid order' });
    }

    order.status = 'cancelled';

    res.status(200).json({
        success: true,
        message: 'Order cancelled',
        data: order
    });
});

describe('Order API', () => {

    beforeEach(() => {
        mockOrders = [];
    });

    describe('GET /api/v1/orders', () => {
        test('should return empty orders initially', async () => {
            const response = await request(app).get('/api/v1/orders');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        test('should return orders after creation', async () => {
            // Create an order first
            await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'], paymentMethod: 'momo' });

            const response = await request(app).get('/api/v1/orders');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
        });
    });

    describe('POST /api/v1/orders', () => {
        test('should create order successfully', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .send({
                    courseIds: ['c1', 'c2'],
                    paymentMethod: 'bank_transfer'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.items.length).toBe(2);
            expect(response.body.data.status).toBe('pending');
            expect(response.body.data.total_amount).toBe(498000);
        });

        test('should fail without courseIds', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .send({ paymentMethod: 'momo' });

            expect(response.status).toBe(400);
        });

        test('should fail with empty courseIds', async () => {
            const response = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: [] });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        test('should return order details', async () => {
            // Create order first
            const createRes = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'] });

            const orderId = createRes.body.data.id;
            const response = await request(app).get(`/api/v1/orders/${orderId}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(orderId);
        });

        test('should return 404 for non-existent order', async () => {
            const response = await request(app).get('/api/v1/orders/ord-999');

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/v1/orders/:id/pay', () => {
        test('should complete payment', async () => {
            // Create order
            const createRes = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'] });

            const orderId = createRes.body.data.id;

            // Pay
            const response = await request(app).put(`/api/v1/orders/${orderId}/pay`);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('completed');
            expect(response.body.data).toHaveProperty('paid_at');
        });

        test('should fail for already paid order', async () => {
            const createRes = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'] });

            const orderId = createRes.body.data.id;

            // Pay first time
            await request(app).put(`/api/v1/orders/${orderId}/pay`);

            // Try to pay again
            const response = await request(app).put(`/api/v1/orders/${orderId}/pay`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Order already paid');
        });
    });

    describe('PUT /api/v1/orders/:id/cancel', () => {
        test('should cancel pending order', async () => {
            const createRes = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'] });

            const orderId = createRes.body.data.id;
            const response = await request(app).put(`/api/v1/orders/${orderId}/cancel`);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('cancelled');
        });

        test('should not cancel paid order', async () => {
            const createRes = await request(app)
                .post('/api/v1/orders')
                .send({ courseIds: ['c1'] });

            const orderId = createRes.body.data.id;

            // Pay first
            await request(app).put(`/api/v1/orders/${orderId}/pay`);

            // Try to cancel
            const response = await request(app).put(`/api/v1/orders/${orderId}/cancel`);

            expect(response.status).toBe(400);
        });
    });
});
