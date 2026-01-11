const db = require('../models');
const { Exam, Question, Account, ExamSubmission } = db;
const HttpError = require('http-errors');

// 1. [POST] /exams - Create new exam
exports.createExam = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const {
            title,
            description,
            duration_minutes,
            pass_score,
            grading_method,
            list_question_ids,
            status
        } = req.body;

        if (!title) {
            throw HttpError(400, 'Title is required');
        }

        // Parse question IDs if string
        let parsedQuestionIds = [];
        if (list_question_ids) {
            try {
                parsedQuestionIds = typeof list_question_ids === 'string'
                    ? JSON.parse(list_question_ids)
                    : list_question_ids;
            } catch (e) {
                throw HttpError(400, 'list_question_ids must be a valid JSON array');
            }
        }

        const newExam = await Exam.create({
            creator_id: accountId,
            title,
            description,
            duration_minutes: duration_minutes || 60,
            pass_score: pass_score || 60,
            grading_method: grading_method || 'auto',
            list_question_ids: parsedQuestionIds,
            status: status || 'draft'
        });

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: newExam
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /exams - List all exams
exports.getAllExams = async (req, res, next) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;

        const exams = await Exam.findAndCountAll({
            where,
            include: [
                { model: Account, as: 'creator', attributes: ['id', 'email'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: exams.count,
            data: exams.rows
        });

    } catch (error) {
        next(error);
    }
};

// 3. [GET] /exams/:id - Get exam with questions
exports.getExamById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = req.user?.role || 'guest';

        const exam = await Exam.findByPk(id, {
            include: [
                { model: Account, as: 'creator', attributes: ['id', 'email'] }
            ]
        });

        if (!exam) throw HttpError(404, 'Exam not found');

        // Fetch questions from list_question_ids
        let questions = [];
        if (exam.list_question_ids && exam.list_question_ids.length > 0) {
            // Hide correct_answer for learners and guests
            let attributesOption = {};
            if (role === 'learner' || role === 'guest') {
                attributesOption = { exclude: ['correct_answer'] };
            }

            questions = await Question.findAll({
                where: { id: exam.list_question_ids },
                attributes: attributesOption
            });
        }

        res.status(200).json({
            success: true,
            data: {
                ...exam.toJSON(),
                questions
            }
        });

    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /exams/:id - Update exam
exports.updateExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;
        const updates = req.body;

        const exam = await Exam.findByPk(id);
        if (!exam) throw HttpError(404, 'Exam not found');

        // Check ownership
        if (role === 'teacher' && exam.creator_id !== accountId) {
            throw HttpError(403, 'You can only edit your own exams');
        }

        // Parse question IDs if provided
        if (updates.list_question_ids) {
            try {
                updates.list_question_ids = typeof updates.list_question_ids === 'string'
                    ? JSON.parse(updates.list_question_ids)
                    : updates.list_question_ids;
            } catch (e) {
                throw HttpError(400, 'Invalid list_question_ids format');
            }
        }

        await exam.update(updates);

        res.status(200).json({
            success: true,
            message: 'Exam updated successfully',
            data: exam
        });

    } catch (error) {
        next(error);
    }
};

// 5. [DELETE] /exams/:id - Delete exam
exports.deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;

        const exam = await Exam.findByPk(id);
        if (!exam) throw HttpError(404, 'Exam not found');

        // Check ownership
        if (role === 'teacher' && exam.creator_id !== accountId) {
            throw HttpError(403, 'You can only delete your own exams');
        }

        await exam.destroy();

        res.status(200).json({ success: true, message: 'Exam deleted successfully' });

    } catch (error) {
        next(error);
    }
};

// 6. [GET] /exams/published - Get published exams for learners
exports.getPublishedExams = async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const exams = await Exam.findAndCountAll({
            where: { status: 'published' },
            include: [
                { model: Account, as: 'creator', attributes: ['id', 'email'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: exams.count,
            data: exams.rows
        });

    } catch (error) {
        next(error);
    }
};

// 7. [POST] /exams/:id/submit - Submit exam and get results with correct answers
exports.submitExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const accountId = req.user?.id;
        const { answers, timeSpent } = req.body; // answers: { questionId: userAnswer }

        const exam = await Exam.findByPk(id);
        if (!exam) throw HttpError(404, 'Exam not found');

        // Fetch all questions WITH correct_answer (no exclusion for submission)
        let questions = [];
        if (exam.list_question_ids && exam.list_question_ids.length > 0) {
            questions = await Question.findAll({
                where: { id: exam.list_question_ids }
            });
        }

        // Calculate score
        let correctCount = 0;
        let wrongCount = 0;
        const answerDetails = {};

        questions.forEach(q => {
            const userAnswer = answers[q.id] || '';
            const correctAnswer = q.correct_answer || '';
            const isCorrect = userAnswer !== ''
                && correctAnswer !== ''
                && userAnswer.toUpperCase().trim() === correctAnswer.toUpperCase().trim();

            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
            }

            answerDetails[q.id] = {
                questionId: q.id,
                questionText: q.content_text || '',
                userAnswer,
                correctAnswer,
                isCorrect,
                options: q.options
            };
        });

        const totalQuestions = questions.length;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= (exam.pass_score || 60);

        // Save submission to database if user is logged in
        if (accountId) {
            await ExamSubmission.create({
                exam_id: id,
                learner_id: accountId,
                total_score: score,
                submitted_at: new Date(),
                status: 'completed'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                examId: id,
                examTitle: exam.title,
                totalQuestions,
                correctAnswers: correctCount,
                wrongAnswers: wrongCount,
                score,
                maxScore: 100,
                percentage: score,
                passed,
                passScore: exam.pass_score || 60,
                timeSpent: timeSpent || 0,
                answers: answerDetails,
                questions: questions.map(q => ({
                    id: q.id,
                    content_text: q.content_text,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation
                }))
            }
        });

    } catch (error) {
        next(error);
    }
};

// 8. [GET] /exams/my-submissions - Get user's exam submissions
exports.getMySubmissions = async (req, res, next) => {
    try {
        const accountId = req.user.id;

        const submissions = await ExamSubmission.findAll({
            where: { learner_id: accountId },
            include: [{
                model: Exam,
                as: 'exam',
                attributes: ['id', 'title', 'description', 'duration_minutes', 'pass_score']
            }],
            order: [['submitted_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: submissions.map(s => ({
                id: s.id,
                examId: s.exam_id,
                examTitle: s.exam?.title,
                examDescription: s.exam?.description,
                score: s.total_score,
                passed: s.status === 'completed' && s.total_score >= (s.exam?.pass_score || 60),
                timeSpent: 0,
                submittedAt: s.submitted_at
            }))
        });

    } catch (error) {
        next(error);
    }
};
