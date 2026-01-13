const db = require('../models');
const { Question, Exam, Account, Rubric } = db;
const HttpError = require('http-errors');

// 1. [POST] /questions - Create new question
exports.createQuestion = async (req, res, next) => {
    try {
        const { id: accountId, role } = req.user;
        const {
            skill,
            type,
            level,
            content_text,
            options,
            correct_answer,
            explanation,
            rubric_id
        } = req.body;

        // Handle file upload
        const media_url = req.file ? req.file.path : null;
        const media_type = req.file ? getMediaType(req.file.mimetype) : 'none';

        if (!skill || !type || !content_text) {
            throw HttpError(400, 'Missing required fields: skill, type, content_text');
        }

        // Parse options if string
        let parsedOptions = null;
        if (options) {
            try {
                parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
            } catch (e) {
                throw HttpError(400, 'options must be a valid JSON');
            }
        }

        const newQuestion = await Question.create({
            creator_id: accountId,
            skill,
            type,
            level: level || 'B1',
            content_text,
            media_url,
            media_type,
            options: parsedOptions,
            correct_answer,
            explanation,
            rubric_id: rubric_id || null
        });

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: newQuestion
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /questions - List all questions (with filters)
exports.getAllQuestions = async (req, res, next) => {
    try {
        const { skill, type, level, limit = 50, offset = 0 } = req.query;
        const { role } = req.user;

        const where = {};
        if (skill) where.skill = skill;
        if (type) where.type = type;
        if (level) where.level = level;

        // Hide correct_answer for learners
        let attributesOption = {};
        if (role === 'learner') {
            attributesOption = { exclude: ['correct_answer'] };
        }

        const questions = await Question.findAndCountAll({
            where,
            attributes: attributesOption,
            include: [
                { model: Account, as: 'creator', attributes: ['id', 'email'] },
                { model: Rubric, as: 'rubric', attributes: ['id', 'name'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: questions.count,
            data: questions.rows
        });

    } catch (error) {
        next(error);
    }
};

// 3. [GET] /questions/:id - Get single question
exports.getQuestionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        let attributesOption = {};
        if (role === 'learner') {
            attributesOption = { exclude: ['correct_answer'] };
        }

        const question = await Question.findByPk(id, {
            attributes: attributesOption,
            include: [
                { model: Account, as: 'creator', attributes: ['id', 'email'] },
                { model: Rubric, as: 'rubric' }
            ]
        });

        if (!question) throw HttpError(404, 'Question not found');

        res.status(200).json({ success: true, data: question });

    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /questions/:id - Update question
exports.updateQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;
        const {
            skill,
            type,
            level,
            content_text,
            options,
            correct_answer,
            explanation,
            rubric_id
        } = req.body;

        const question = await Question.findByPk(id);
        if (!question) throw HttpError(404, 'Question not found');

        // Check ownership (teachers can only edit their own)
        if (role === 'teacher' && question.creator_id !== accountId) {
            throw HttpError(403, 'You can only edit your own questions');
        }

        const updates = {};
        if (skill) updates.skill = skill;
        if (type) updates.type = type;
        if (level) updates.level = level;
        if (content_text) updates.content_text = content_text;
        if (correct_answer) updates.correct_answer = correct_answer;
        if (explanation) updates.explanation = explanation;
        if (rubric_id !== undefined) updates.rubric_id = rubric_id;

        // Handle file upload
        if (req.file) {
            updates.media_url = req.file.path;
            updates.media_type = getMediaType(req.file.mimetype);
        }

        // Parse options
        if (options) {
            try {
                updates.options = typeof options === 'string' ? JSON.parse(options) : options;
            } catch (e) {
                throw HttpError(400, 'Invalid options format');
            }
        }

        await question.update(updates);

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: question
        });

    } catch (error) {
        next(error);
    }
};

// 5. [DELETE] /questions/:id - Delete question
exports.deleteQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: accountId, role } = req.user;

        const question = await Question.findByPk(id);
        if (!question) throw HttpError(404, 'Question not found');

        // Check ownership
        if (role === 'teacher' && question.creator_id !== accountId) {
            throw HttpError(403, 'You can only delete your own questions');
        }

        await question.destroy();

        res.status(200).json({ success: true, message: 'Question deleted successfully' });

    } catch (error) {
        next(error);
    }
};

// Helper function to determine media type from mimetype
function getMediaType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('video/')) return 'video';
    return 'none';
}