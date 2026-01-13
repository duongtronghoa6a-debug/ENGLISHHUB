/**
 * Exam API Tests
 * Tests for exam listing, taking, and results
 */

const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());

// Mock data
const mockExams = [
    { id: 'e1', title: 'TOEIC Mock Test 1', duration: 120, total_questions: 200, course_id: 'c1' },
    { id: 'e2', title: 'Grammar Quiz', duration: 30, total_questions: 50, course_id: 'c1' },
    { id: 'e3', title: 'Listening Test', duration: 45, total_questions: 100, course_id: 'c2' }
];

const mockQuestions = [
    { id: 'q1', exam_id: 'e1', question_text: 'What is...?', options: ['A', 'B', 'C', 'D'], correct_answer: 'A' },
    { id: 'q2', exam_id: 'e1', question_text: 'Choose the...', options: ['A', 'B', 'C', 'D'], correct_answer: 'B' },
    { id: 'q3', exam_id: 'e2', question_text: 'Select...', options: ['A', 'B', 'C', 'D'], correct_answer: 'C' }
];

let mockResults = [];

// GET /api/v1/exams
app.get('/api/v1/exams', (req, res) => {
    const { course_id } = req.query;
    let filtered = [...mockExams];

    if (course_id) {
        filtered = filtered.filter(e => e.course_id === course_id);
    }

    res.status(200).json({ success: true, data: filtered });
});

// GET /api/v1/exams/:id
app.get('/api/v1/exams/:id', (req, res) => {
    const exam = mockExams.find(e => e.id === req.params.id);

    if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.status(200).json({ success: true, data: exam });
});

// GET /api/v1/exams/:id/questions
app.get('/api/v1/exams/:id/questions', (req, res) => {
    const { id } = req.params;
    const questions = mockQuestions.filter(q => q.exam_id === id);

    // Hide correct answers for students
    const safeQuestions = questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options
    }));

    res.status(200).json({ success: true, data: safeQuestions });
});

// POST /api/v1/exams/:id/submit
app.post('/api/v1/exams/:id/submit', (req, res) => {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ success: false, message: 'Answers are required' });
    }

    const exam = mockExams.find(e => e.id === id);
    if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const questions = mockQuestions.filter(q => q.exam_id === id);
    let correct = 0;

    answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.question_id);
        if (question && question.correct_answer === answer.selected) {
            correct++;
        }
    });

    const score = Math.round((correct / questions.length) * 100);
    const result = {
        id: 'r' + Date.now(),
        exam_id: id,
        score,
        correct_count: correct,
        total_questions: questions.length,
        passed: score >= 60,
        completed_at: new Date().toISOString()
    };

    mockResults.push(result);

    res.status(200).json({
        success: true,
        message: 'Exam submitted successfully',
        data: result
    });
});

// GET /api/v1/exams/results
app.get('/api/v1/exams/results', (req, res) => {
    res.status(200).json({
        success: true,
        data: mockResults
    });
});

// POST /api/v1/teacher/exams
app.post('/api/v1/teacher/exams', (req, res) => {
    const { title, duration, course_id, total_questions } = req.body;

    if (!title || !course_id) {
        return res.status(400).json({ success: false, message: 'Title and course_id are required' });
    }

    const newExam = {
        id: 'e' + Date.now(),
        title,
        duration: duration || 60,
        course_id,
        total_questions: total_questions || 0
    };

    res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: newExam
    });
});

describe('Exam API', () => {

    beforeEach(() => {
        mockResults = [];
    });

    describe('GET /api/v1/exams', () => {
        test('should return all exams', async () => {
            const response = await request(app).get('/api/v1/exams');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(3);
        });

        test('should filter by course_id', async () => {
            const response = await request(app)
                .get('/api/v1/exams')
                .query({ course_id: 'c1' });

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(2);
        });
    });

    describe('GET /api/v1/exams/:id', () => {
        test('should return exam details', async () => {
            const response = await request(app).get('/api/v1/exams/e1');

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe('TOEIC Mock Test 1');
            expect(response.body.data).toHaveProperty('duration');
        });

        test('should return 404 for non-existent exam', async () => {
            const response = await request(app).get('/api/v1/exams/e999');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/v1/exams/:id/questions', () => {
        test('should return questions without answers', async () => {
            const response = await request(app).get('/api/v1/exams/e1/questions');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0]).not.toHaveProperty('correct_answer');
        });
    });

    describe('POST /api/v1/exams/:id/submit', () => {
        test('should submit exam and return score', async () => {
            const response = await request(app)
                .post('/api/v1/exams/e1/submit')
                .send({
                    answers: [
                        { question_id: 'q1', selected: 'A' },
                        { question_id: 'q2', selected: 'B' }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('score');
            expect(response.body.data.score).toBe(100); // Both correct
            expect(response.body.data.passed).toBe(true);
        });

        test('should calculate partial score', async () => {
            const response = await request(app)
                .post('/api/v1/exams/e1/submit')
                .send({
                    answers: [
                        { question_id: 'q1', selected: 'A' },
                        { question_id: 'q2', selected: 'C' } // Wrong
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.data.score).toBe(50);
            expect(response.body.data.correct_count).toBe(1);
        });

        test('should fail without answers', async () => {
            const response = await request(app)
                .post('/api/v1/exams/e1/submit')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/teacher/exams', () => {
        test('should create new exam', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/exams')
                .send({
                    title: 'New Exam',
                    duration: 90,
                    course_id: 'c1'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('New Exam');
        });

        test('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/v1/teacher/exams')
                .send({ duration: 60 });

            expect(response.status).toBe(400);
        });
    });
});
