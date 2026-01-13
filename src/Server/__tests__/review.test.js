/**
 * Review API Tests
 * Tests for course reviews and ratings
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
let mockReviews = [
    { id: 'r1', course_id: 'c1', learner_id: 'l1', rating: 5, comment: 'Great course!', created_at: '2024-01-01' },
    { id: 'r2', course_id: 'c1', learner_id: 'l2', rating: 4, comment: 'Very good', created_at: '2024-01-02' },
    { id: 'r3', course_id: 'c2', learner_id: 'l1', rating: 3, comment: 'Average', created_at: '2024-01-03' }
];

// GET /api/v1/reviews/course/:courseId
app.get('/api/v1/reviews/course/:courseId', (req, res) => {
    const { courseId } = req.params;
    const reviews = mockReviews.filter(r => r.course_id === courseId);

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
        success: true,
        data: {
            reviews,
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length
        }
    });
});

// POST /api/v1/reviews
app.post('/api/v1/reviews', (req, res) => {
    const { course_id, rating, comment } = req.body;
    const learner_id = 'current-user';

    if (!course_id || !rating) {
        return res.status(400).json({ success: false, message: 'Course ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check for existing review
    const existing = mockReviews.find(r => r.course_id === course_id && r.learner_id === learner_id);
    if (existing) {
        return res.status(409).json({ success: false, message: 'You already reviewed this course' });
    }

    const newReview = {
        id: 'r' + Date.now(),
        course_id,
        learner_id,
        rating,
        comment: comment || '',
        created_at: new Date().toISOString()
    };

    mockReviews.push(newReview);

    res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: newReview
    });
});

// PUT /api/v1/reviews/:id
app.put('/api/v1/reviews/:id', (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = mockReviews.find(r => r.id === id);
    if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    review.rating = rating || review.rating;
    review.comment = comment !== undefined ? comment : review.comment;
    review.updated_at = new Date().toISOString();

    res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review
    });
});

// DELETE /api/v1/reviews/:id
app.delete('/api/v1/reviews/:id', (req, res) => {
    const { id } = req.params;
    const index = mockReviews.findIndex(r => r.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Review not found' });
    }

    mockReviews.splice(index, 1);

    res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
    });
});

// GET /api/v1/reviews/my
app.get('/api/v1/reviews/my', (req, res) => {
    const learner_id = 'current-user';
    const myReviews = mockReviews.filter(r => r.learner_id === learner_id);

    res.status(200).json({
        success: true,
        data: myReviews
    });
});

describe('Review API', () => {

    beforeEach(() => {
        mockReviews = [
            { id: 'r1', course_id: 'c1', learner_id: 'l1', rating: 5, comment: 'Great course!' },
            { id: 'r2', course_id: 'c1', learner_id: 'l2', rating: 4, comment: 'Very good' },
            { id: 'r3', course_id: 'c2', learner_id: 'l1', rating: 3, comment: 'Average' }
        ];
    });

    describe('GET /api/v1/reviews/course/:courseId', () => {
        test('should return course reviews with avg rating', async () => {
            const response = await request(app).get('/api/v1/reviews/course/c1');

            expect(response.status).toBe(200);
            expect(response.body.data.reviews.length).toBe(2);
            expect(response.body.data.avgRating).toBe(4.5);
            expect(response.body.data.totalReviews).toBe(2);
        });

        test('should return empty for course without reviews', async () => {
            const response = await request(app).get('/api/v1/reviews/course/c999');

            expect(response.status).toBe(200);
            expect(response.body.data.reviews.length).toBe(0);
            expect(response.body.data.avgRating).toBe(0);
        });
    });

    describe('POST /api/v1/reviews', () => {
        test('should create new review', async () => {
            const response = await request(app)
                .post('/api/v1/reviews')
                .send({
                    course_id: 'c3',
                    rating: 5,
                    comment: 'Excellent!'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.rating).toBe(5);
        });

        test('should fail with invalid rating', async () => {
            const response = await request(app)
                .post('/api/v1/reviews')
                .send({
                    course_id: 'c3',
                    rating: 6
                });

            expect(response.status).toBe(400);
        });

        test('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/v1/reviews')
                .send({ comment: 'No rating' });

            expect(response.status).toBe(400);
        });

        test('should prevent duplicate reviews', async () => {
            // First review
            await request(app)
                .post('/api/v1/reviews')
                .send({ course_id: 'c3', rating: 5 });

            // Duplicate
            const response = await request(app)
                .post('/api/v1/reviews')
                .send({ course_id: 'c3', rating: 4 });

            expect(response.status).toBe(409);
        });
    });

    describe('PUT /api/v1/reviews/:id', () => {
        test('should update review', async () => {
            const response = await request(app)
                .put('/api/v1/reviews/r1')
                .send({ rating: 4, comment: 'Updated comment' });

            expect(response.status).toBe(200);
            expect(response.body.data.rating).toBe(4);
            expect(response.body.data.comment).toBe('Updated comment');
        });

        test('should return 404 for non-existent review', async () => {
            const response = await request(app)
                .put('/api/v1/reviews/r999')
                .send({ rating: 3 });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/reviews/:id', () => {
        test('should delete review', async () => {
            const response = await request(app).delete('/api/v1/reviews/r1');

            expect(response.status).toBe(200);

            // Verify deleted
            const getRes = await request(app).get('/api/v1/reviews/course/c1');
            expect(getRes.body.data.reviews.length).toBe(1);
        });

        test('should return 404 for non-existent review', async () => {
            const response = await request(app).delete('/api/v1/reviews/r999');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/v1/reviews/my', () => {
        test('should return user reviews', async () => {
            // Add a review as current user
            await request(app)
                .post('/api/v1/reviews')
                .send({ course_id: 'c3', rating: 5 });

            const response = await request(app).get('/api/v1/reviews/my');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
