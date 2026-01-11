const { Order, OrderItem, Course, Learner, Enrollment, sequelize} = require('../models');
const HttpError = require('http-errors');

// 1. [POST] /orders (Tạo đơn hàng mới)
exports.createOrder = async (req, res, next) => {
    // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
    const t = await sequelize.transaction();

    try {
        const { id: accountId } = req.user;
        // nhớ courseIds là mang [1, 2, 3]
        const { courseIds, paymentMethod } = req.body; 

        if (!courseIds || courseIds.length === 0) {
            throw HttpError(400, 'No courses provided');
        }

        if (!paymentMethod) {
            throw HttpError(400, 'Payment method is required');
        }

        // 1. Tìm Learner
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        if (!learner) throw HttpError(404, 'Learner not found');

        // 2. Tính tổng tiền và lấy thông tin khóa học
        let totalPrice = 0;
        const coursesToBuy = [];

        for (const courseId of courseIds) {
            const course = await Course.findByPk(courseId);
            if (!course) throw HttpError(404, `Course ID ${courseId} not found`);
            
            // Check xem đã mua chưa 
            const isEnrolled = await Enrollment.findOne({
                where: { idLEARNER: learner.idLEARNER, idCOURSE: courseId }
            });
            if (isEnrolled) throw HttpError(409, `You already own course: ${course.title}`);

            totalPrice += parseFloat(course.price);
            coursesToBuy.push(course);
        }

        // 3. Tạo Order Header
        const newOrder = await Order.create({
            idLEARNER: learner.idLEARNER,
            totalPrice: totalPrice,
            subTotal: totalPrice, // Tạm thời subTotal = totalPrice (chưa có discount)
            paymentMethod: paymentMethod, 
            status: 'Pending',
            discountCode: null //  =>> Chưa xử lý mã giảm giá
        }, { transaction: t });

        // 4. Tạo Order Details
        for (const course of coursesToBuy) {
            await OrderItem.create({
                idORDER: newOrder.idORDER,
                idCOURSE: course.idCOURSE,
                priceAtPurchase: course.price 
            }, { transaction: t });
        }

        // Commit transaction (Lưu vào DB)
        await t.commit();

        res.status(201).json({
            message: 'Order created successfully',
            data: newOrder
        });

    } catch (error) {
        // Nếu có lỗi -> Rollback 
        await t.rollback();
        next(error);
    }
};

// 2. [PUT] /orders/:orderId/pay ( thanh toán va Kích hoạt khóa học)
exports.processPayment = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { orderId } = req.params; 
        const { id: accountId } = req.user;

        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (!order) throw HttpError(404, 'Order not found');

        // Check quyền 
        if (order.idLEARNER !== learner.idLEARNER) throw HttpError(403, 'Not your order');

        if (order.status === 'Paid') throw HttpError(400, 'Order already paid');

        // kich hoat khoa hoc
        for (const detail of order.items) {
            const existing = await Enrollment.findOne({
                where: { idLEARNER: learner.idLEARNER, idCOURSE: detail.idCOURSE }
            });

            if (!existing) {
                await Enrollment.create({
                    idLEARNER: learner.idLEARNER,
                    idCOURSE: detail.idCOURSE,
                    status: 'ACTIVE'
                }, { transaction: t });
            }
        }

        await order.update({ status: 'Paid' }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: 'Payment successful. Courses enrolled!',
            orderId: order.idORDER
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
        const learner = await Learner.findOne({ where: { idACCOUNT: accountId } });

        const orders = await Order.findAll({
            where: { idLEARNER: learner.idLEARNER },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Course, as: 'course', attributes: ['title', 'thumbnailUrl'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
};