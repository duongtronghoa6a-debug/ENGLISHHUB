/*
   (Authorization - Phân quyền): 

    chỉ cho phép những vai trò (role) nhất định truy cập
    kiểu admin/teacher 
    cấm LEANER
*/
const HttpError = require('http-errors');

const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        // Đảm bảo isAuth đã chạy trước đó
        if (!req.user || !req.user.role) {
            return next(HttpError(500, 'Internal Server Error: Authorization check failed.'));
        }

        const userRole = req.user.role;

        if (allowedRoles.includes(userRole)) {
            // Đủ quyền -> Cho đi tiếp
            next();
        } else {
            // 403 Forbidden: Server từ chối phục vụ.
            return next(HttpError(403, 'Forbidden: You do not have permission to perform this action.'));
        }
    };
};

module.exports = restrictTo;