const { Review, Course, Learner, Enrollment, Teacher } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /reviews 
exports.createReview = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { course_id, rating, comment } = req.body;

        if (!course_id || !rating) return next(HttpError(400, 'Course ID and Rating are required'));

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { account_id: accountId } });
        if (!learner) return next(HttpError(404, 'Learner profile not found'));

        // 2. Chưa mua ko dc đánh giá (skip for now to allow reviews)
        // const isEnrolled = await Enrollment.findOne({
        //     where: { learner_id: learner.id, course_id: course_id }
        // });
        // if (!isEnrolled) return next(HttpError(403, 'You must enroll in this course to review it'));

        // 3. Chưa đánh giá lần nào thì mới được đánh giá
        const existingReview = await Review.findOne({
            where: { learner_id: learner.id, course_id: course_id }
        });
        if (existingReview) return next(HttpError(409, 'You have already reviewed this course'));

        // 4. Tạo Review
        const newReview = await Review.create({
            learner_id: learner.id,
            course_id: course_id,
            rating,
            comment: comment || ''
        });

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: newReview
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /reviews/course/:courseId 
exports.getReviewsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const reviews = await Review.findAll({
            where: { course_id: courseId },
            include: [{
                model: Learner,
                as: 'learner',
                attributes: ['id', 'full_name']
            }],
            order: [['created_at', 'DESC']]
        });

        // Tính điểm trung bình 
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: parseFloat(averageRating),
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

// 3. [GET] /reviews/my - Get current user's reviews
exports.getMyReviews = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;

        // Find learner profile
        const learner = await Learner.findOne({ where: { account_id: accountId } });
        if (!learner) {
            return res.status(200).json({ success: true, data: [] });
        }

        const reviews = await Review.findAll({
            where: { learner_id: learner.id },
            include: [{
                model: Course,
                as: 'course',
                attributes: ['id', 'title', 'thumbnail_url']
            }],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

// 4. [DELETE] /reviews/:reviewId (Xóa đánh giá - Cho chính chủ hoặc Admin hoac Teacher cua khoa hoc)
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { id: accountId, role } = req.user;

        const review = await Review.findByPk(reviewId, {
            include: [{ model: Learner, as: 'learner' }]
        });
        if (!review) return next(HttpError(404, 'Review not found'));

        // Phải là chính chủ mới được xóa
        if (role === 'learner') {
            const learner = await Learner.findOne({ where: { account_id: accountId } });
            if (!learner || review.learner_id !== learner.id) {
                return next(HttpError(403, 'You can only delete your own review'));
            }
        } else if (role === 'teacher') {
            const teacher = await Teacher.findOne({ where: { account_id: accountId } });
            if (!teacher) return next(HttpError(404, 'Teacher profile not found'));

            const course = await Course.findByPk(review.course_id);

            if (!course || course.teacher_id !== teacher.id) {
                return next(HttpError(403, 'You can only delete reviews for your own courses'));
            }
        }
        // Admin được quyền xóa

        await review.destroy();
        res.status(200).json({ success: true, message: 'Review deleted successfully' });

    } catch (error) {
        next(error);
    }
};

// 4. [PUT] /reviews/:reviewId (Chỉ cho chính chủ)
exports.updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { id: accountId } = req.user;
        const updates = req.body;

        const review = await Review.findByPk(reviewId, {
            include: [{ model: Learner, as: 'learner' }]
        });
        if (!review) return next(HttpError(404, 'Review not found'));

        const learner = await Learner.findOne({ where: { account_id: accountId } });
        if (!learner || review.learner_id !== learner.id) {
            return next(HttpError(403, 'You can only update your own review'));
        }

        // Cập nhật đánh giá
        await review.update({
            rating: updates.rating,
            comment: updates.comment
        });

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });

    } catch (error) {
        next(error);
    }
};