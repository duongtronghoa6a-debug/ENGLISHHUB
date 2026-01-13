const { CartItem, Course, Learner, Enrollment } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /cart 
exports.addToCart = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const { courseId } = req.body;

        if (!courseId) throw HttpError(400, 'Course ID is required');

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) throw HttpError(404, 'Learner profile not found');

        // 2. Check xem khóa học có tồn tại không
        const course = await Course.findByPk(courseId);
        if (!course) throw HttpError(404, 'Course not found');

        // 3. Nếu mua rồi thì ko cho thêm vào giỏ
        const isEnrolled = await Enrollment.findOne({
            where: { idLEARNER: learner.idLEARNER, idCOURSE: courseId }
        });
        if (isEnrolled) throw HttpError(409, 'You have already enrolled in this course');

        // 4. Nếu đã có trong giỏ hàng thì ko cho thêm
        const existingItem = await CartItem.findOne({
            where: { idLEARNER: learner.idLEARNER, idCOURSE: courseId }
        });
        if (existingItem) throw HttpError(409, 'Course is already in your cart');

        // 5. Thêm vào giỏ
        const newItem = await CartItem.create({
            idLEARNER: learner.idLEARNER,
            idCOURSE: courseId,
            isSelected: true 
        });

        res.status(201).json({
            message: 'Added to cart successfully',
            data: newItem
        });

    } catch (error) {
        next(error);
    }
};

// 2. [GET] /cart 
exports.getMyCart = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });

        const cartItems = await CartItem.findAll({
            where: { idLEARNER: learner.idLEARNER },
            include: [
                {
                    model: Course,
                    as: 'course', 
                    attributes: ['idCOURSE', 'title', 'price', 'thumbnailUrl']
                }
            ],
            order: [['addedAt', 'DESC']] 
        });

        // Tính tạm tổng tiền
        const total = cartItems.reduce((sum, item) => {
            return item.isSelected ? sum + parseFloat(item.course.price) : sum;
        }, 0);

        res.status(200).json({
            count: cartItems.length,
            totalPrice: total,
            data: cartItems
        });

    } catch (error) {
        next(error);
    }
};

// 3. [DELETE] /cart/:id 
exports.removeFromCart = async (req, res, next) => {
    try {
        const { idCART_ITEM } = req.params; 
        const { id: accountId } = req.user;

        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        
        const item = await CartItem.findByPk(idCART_ITEM);

        if (!item) throw HttpError(404, 'Item not found in cart');

        // Chỉ được xóa mục trong giỏ của chính mình
        if (item.idLEARNER !== learner.idLEARNER) {
            throw HttpError(403, 'You can only remove items from your own cart');
        }

        await item.destroy();

        res.status(200).json({ message: 'Item removed from cart' });

    } catch (error) {
        next(error);
    }
};

// 4. [PATCH] /cart/:id/select
exports.toggleSelection = async (req, res, next) => {
    try {
        const { idCART_ITEM } = req.params; 
        const { isSelected } = req.body; 
        const { id: accountId } = req.user;

        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        const item = await CartItem.findByPk(idCART_ITEM);

        if (!item) throw HttpError(404, 'Item not found');
        if (item.idLEARNER !== learner.idLEARNER) throw HttpError(403, 'Not your cart');

        await item.update({ isSelected });

        res.status(200).json({ message: 'Updated selection', data: item });

    } catch (error) {
        next(error);
    }
};