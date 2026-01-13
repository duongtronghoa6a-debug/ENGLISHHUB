const { Order, OrderItem, Course, Learner, Enrollment, sequelize } = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /orders (Tạo đơn hàng mới)
exports.createOrder = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { id: accountId } = req.user;
        const { courseIds, paymentMethod } = req.body;

        if (!courseIds || courseIds.length === 0) {
            throw HttpError(400, 'No courses provided');
        }

        if (!paymentMethod) {
            throw HttpError(400, 'Payment method is required');
        }

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { account_id: accountId } });
        if (!learner) throw HttpError(404, 'Learner not found');

        // 2. Tính tổng tiền và lấy thông tin khóa học
        let totalPrice = 0;
        const coursesToBuy = [];

        for (const courseId of courseIds) {
            const course = await Course.findByPk(courseId);
            if (!course) throw HttpError(404, `Course ID ${courseId} not found`);

            // Check xem đã mua chưa
            const isEnrolled = await Enrollment.findOne({
                where: { learner_id: learner.id, course_id: courseId }
            });
            if (isEnrolled) throw HttpError(409, `You already own course: ${course.title}`);

            totalPrice += parseFloat(course.price || 0);
            coursesToBuy.push(course);
        }

        // 3. Tạo Order Header
        const newOrder = await Order.create({
            learner_id: learner.id,
            user_id: accountId,
            total_amount: totalPrice,
            payment_method: paymentMethod,
            status: 'pending',
            items_json: coursesToBuy.map(c => ({ id: c.id, title: c.title, price: c.price }))
        }, { transaction: t });

        // 4. Tạo Order Items
        for (const course of coursesToBuy) {
            await OrderItem.create({
                order_id: newOrder.id,
                course_id: course.id,
                price: course.price || 0
            }, { transaction: t });
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: newOrder
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// 2. [PUT] /orders/:orderId/pay (Thanh toán và kích hoạt khóa học)
exports.processPayment = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { orderId } = req.params;
        const { id: accountId } = req.user;

        const learner = await Learner.findOne({ where: { account_id: accountId } });
        if (!learner) throw HttpError(404, 'Learner not found');

        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (!order) throw HttpError(404, 'Order not found');

        // Check quyền (kiểm tra cả learner_id và user_id)
        if (order.learner_id !== learner.id && order.user_id !== accountId) {
            throw HttpError(403, 'Not your order');
        }

        if (order.status === 'completed') throw HttpError(400, 'Order already paid');

        // Kích hoạt khóa học và thu thập info cho notification
        const courseNames = [];
        const teacherAccountIds = new Set();

        for (const item of order.items) {
            const existing = await Enrollment.findOne({
                where: { learner_id: learner.id, course_id: item.course_id }
            });

            if (!existing) {
                await Enrollment.create({
                    learner_id: learner.id,
                    course_id: item.course_id,
                    status: 'active'
                }, { transaction: t });
            }

            // Get course and teacher info for notifications
            const course = await Course.findByPk(item.course_id, {
                include: [{ model: require('../models').Teacher, as: 'teacher' }]
            });
            if (course) {
                courseNames.push(course.title);
                if (course.teacher?.account_id) {
                    teacherAccountIds.add(course.teacher.account_id);
                }
            }
        }

        // Update order status to 'completed'
        await order.update({ status: 'completed' }, { transaction: t });

        await t.commit();

        // Send notifications after commit
        const { sendNotification } = require('./notificationController');

        // Notification to learner
        await sendNotification(accountId, {
            title: '🎉 Thanh toán thành công!',
            message: `Bạn đã mua thành công: ${courseNames.join(', ')}. Chúc bạn học tập hiệu quả!`,
            type: 'success',
            category: 'purchase',
            related_id: order.id,
            related_type: 'order',
            action_url: '/my-courses'
        });

        // Notification to each teacher
        for (const teacherAccountId of teacherAccountIds) {
            await sendNotification(teacherAccountId, {
                title: '💰 Có học viên mới mua khóa học!',
                message: `Một học viên vừa mua khóa học của bạn. Doanh thu: ${new Intl.NumberFormat('vi-VN').format(order.total_amount)}₫`,
                type: 'success',
                category: 'purchase',
                related_id: order.id,
                related_type: 'order',
                action_url: '/teacher/revenue'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment successful. Courses enrolled!',
            orderId: order.id
        });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// 3. [GET] /orders (Xem lịch sử mua hàng)
exports.getMyOrders = async (req, res, next) => {
    try {
        const { id: accountId } = req.user;
        const learner = await Learner.findOne({ where: { account_id: accountId } });

        if (!learner) {
            return res.status(200).json({ data: [] });
        }

        const orders = await Order.findAll({
            where: { learner_id: learner.id },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail_url', 'price'] }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};