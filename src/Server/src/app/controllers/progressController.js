const { LearningProgress, Lesson, Learner, Enrollment } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /progress/sync
exports.syncProgress = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { lessonId, currentTime, isCompleted } = req.body;

        if (!lessonId) return next(HttpError(400, 'Lesson ID is required'));

        // 1. Tìm Bài học để lấy idCOURSE
        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) return next(HttpError(404, 'Lesson not found'));

        // 2. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) return next(HttpError(404, 'Learner not found'));

        // 3. Tìm Enrollment de lay khoa ngoai
        const enrollment = await Enrollment.findOne({
            where: {
                idLEARNER: learner.idLEARNER,
                idCOURSE: lesson.idCOURSE, 
            },
        });

        if (!enrollment) {
            return next(HttpError(403, 'You must enroll in this course first'));
        }

        // 4. Tìm Progress dựa trên ENROLLMENT ID 
        let progress = await LearningProgress.findOne({
            where: {
                ENROLLMENT_idENROLLMENT: enrollment.idENROLLMENT, 
                LESSON_idLESSON: lessonId,                       
            },
        });

        // 5. Update hoặc Create
        if (progress) {
            const newCompletedStatus = progress.isCompleted || isCompleted;
            
            await progress.update({
                lastVideoPosition: currentTime,
                isCompleted: newCompletedStatus,
                lastAccessedAt: new Date() 
            });
        } else {
            progress = await LearningProgress.create({
                ENROLLMENT_idENROLLMENT: enrollment.idENROLLMENT, 
                LESSON_idLESSON: lessonId,
                lastVideoPosition: currentTime || 0,
                isCompleted: isCompleted || false,
                lastAccessedAt: new Date()
            });
        }

        res.status(200).json({
            message: 'Progress synced successfully',
            data: progress
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /progress/:courseId
exports.getProgressByCourse = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { courseId } = req.params;

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) return next(HttpError(404, 'Learner not found'));

        // 2. Progress gắn vào Enrollment
        const enrollment = await Enrollment.findOne({
            where: {
                idLEARNER: learner.idLEARNER,
                idCOURSE: courseId
            }
        });

        // Nếu chưa đăng ký thì chưa có progress nào cả -> Trả về rỗng
        if (!enrollment) {
            return res.status(200).json({
                data: [],
                courseStats: { totalLessons: 0, completedLessons: 0, percent: 0 }
            });
        }

        // 3. Lấy danh sách Progress dựa trên idENROLLMENT
        const progresses = await LearningProgress.findAll({
            where: { 
                ENROLLMENT_idENROLLMENT: enrollment.idENROLLMENT 
            },
            include: [
                {
                    model: Lesson,
                    as: 'lesson', 
                    attributes: ['idLESSON', 'title', 'durationMinutes']
                }
            ]
        });

        // 4. Tính toán thống kê
        const totalLessons = await Lesson.count({ where: { idCOURSE: courseId } });
        const completedLessons = progresses.filter(p => p.isCompleted).length;
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        res.status(200).json({
            data: progresses,
            courseStats: {
                totalLessons,
                completedLessons,
                percent
            }
        });

    } catch (error) {
        next(error);
    }
};