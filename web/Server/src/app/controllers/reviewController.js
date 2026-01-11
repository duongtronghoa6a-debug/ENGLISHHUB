const { Review, Course, Learner, Enrollment, Teacher } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /reviews 
exports.createReview = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { courseId, rating, comment } = req.body;

        if (!courseId || !rating) return next(HttpError(400, 'Course ID and Rating are required'));

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) return next(HttpError(404, 'Learner profile not found'));

        // 2. Chưa mua ko dc đánh giá
        const isEnrolled = await Enrollment.findOne({
            where: { idLEARNER: learner.idLEARNER, idCOURSE: courseId }
        });
        if (!isEnrolled) return next(HttpError(403, 'You must enroll in this course to review it'));

        // 3. Chưa đánh giá lần nào thì mới được đánh giá
        const existingReview = await Review.findOne({
            where: { idLEARNER: learner.idLEARNER, idCOURSE: courseId }
        });
        if (existingReview) return next(HttpError(409, 'You have already reviewed this course'));

        // 4. Tạo Review
        const newReview = await Review.create({
            idLEARNER: learner.idLEARNER,
            idCOURSE: courseId,
            rating,
            comment
        });

        res.status(201).json({
            message: 'Review created successfully',
            data: newReview
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /courses/:courseId/reviews 
exports.getReviewsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const reviews = await Review.findAll({
            where: { idCOURSE: courseId },
            include: [{
                model: Learner,
                as: 'learner',
                attributes: ['fullName', 'avatarUrl'] 
            }],
            order: [['createdAt', 'DESC']] 
        });

        // Tính điểm trung bình 
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.status(200).json({
            count: reviews.length,
            averageRating: parseFloat(averageRating),
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

// 3. [DELETE] /reviews/:id (Xóa đánh giá - Cho chính chủ hoặc Admin hoac Teacher cua khoa hoc)
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { id: accountId, role } = req.user;

        const review = await Review.findByPk(reviewId, {
            include: [{ model: Learner, as: 'learner' }]
        });
        if (!review) return next(HttpError(404, 'Review not found'));

        // Phải là chính chủ mới được xóa
        if (role === 'LEARNER') {
            const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
            if (!learner || review.idLEARNER !== learner.idLEARNER) {
                return next(HttpError(403, 'You can only delete your own review'));
            }
        } else if (role === 'TEACHER') {
            const teacher = await Teacher.findOne({ where: { idACCOUNT: accountId } });
            if (!teacher) return next(HttpError(404, 'Teacher profile not found'));

            const course = await Course.findByPk(review.idCOURSE);
            
            if (!course || course.idTEACHER !== teacher.idTEACHER) {
                return next(HttpError(403, 'You can only delete reviews for your own courses'));
            }
        }
        // Admin được quyền xóa
        
        await review.destroy();
        res.status(200).json({ message: 'Review deleted successfully' });

    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /reviews/:id (Chỉ cho chính chủ)
exports.updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { id: accountId, role } = req.user;
        const updates = req.body;

        const review = await Review.findByPk(reviewId, {
            include: [{ model: Learner, as: 'learner' }]
        });
        if (!review) return next(HttpError(404, 'Review not found'));

        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner || review.idLEARNER !== learner.idLEARNER) {
            return next(HttpError(403, 'You can only update your own review'));
        }

        // Cập nhật đánh giá
        
        await review.update({
            rating: updates.rating,
            comment: updates.comment
        });

        res.status(200).json({
            message: 'Review updated successfully',
            data: review
        });

    } catch (error) {
        next(error);
    }
};