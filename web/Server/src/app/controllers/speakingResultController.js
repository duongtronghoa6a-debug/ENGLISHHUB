const { SpeakingResult, Lesson, Learner, Enrollment, Course } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /speaking-results
exports.submitSpeakingResult = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { lessonId, aiScore, aiFeedback} = req.body;

        if (!req.file) {
            throw HttpError(400, 'Audio recording is required');
        }

        const audioUrl = req.file.path; // Lưu đường dẫn file đã upload

        if (!lessonId || !audioUrl) {
            throw HttpError(400, 'Lesson ID and Audio URL are required');
        }

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) throw HttpError(404, 'Learner profile not found');

        // 2. Tìm Lesson và Course để check enrollment
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) throw HttpError(404, 'Lesson not found');

        // 3. Check mua chua
        const isEnrolled = await Enrollment.findOne({
            where: { idLEARNER: learner.idLEARNER, idCOURSE: lesson.idCOURSE }
        });
        
        if (!isEnrolled) {
            throw HttpError(403, 'You must enroll in this course to submit speaking results');
        }

        // 4. Lưu kết quả
        const newResult = await SpeakingResult.create({
            idLEARNER: learner.idLEARNER,
            idLESSON: lessonId,
            aiScore: aiScore ? parseFloat(aiScore) : 0, // (0-100 )
            aiFeedback: aiFeedback || '', 
            userAudioUrl: audioUrl   
        });

        res.status(201).json({
            message: 'Speaking result saved successfully',
            data: newResult
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /speaking-results/lesson/:lessonId 
exports.getMySpeakingHistory = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { lessonId } = req.params;

        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });

        const results = await SpeakingResult.findAll({
            where: { 
                idLEARNER: learner.idLEARNER,
                idLESSON: lessonId
            },
            order: [['submittedAt', 'DESC']] 
        });

        // Tính điểm trung bình 
        const bestScore = results.reduce((max, r) => {
            const score = parseFloat(r.aiScore) || 0;
            return score > max ? score : max;
        }, 0);

        res.status(200).json({
            message: 'Speaking history retrieved successfully',
            count: results.length,
            bestScore: bestScore,
            data: results
        });

    } catch (error) {
        next(error);
    }
};