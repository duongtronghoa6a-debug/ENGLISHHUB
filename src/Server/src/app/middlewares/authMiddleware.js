/*
   (Authentication - Xác thực): 
   Tạo và xác minh JWT Token, 
   đăng nhập mới được vô
*/

const jwt = require('jsonwebtoken');
const HttpError = require('http-errors');

const signAuth = function (user) {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3d' });
}
const isAuth = (req, res, next) => {
    try {
        // Lấy cái chuỗi "Bearer eyJhbGciOi..." từ Header gửi lên
        const tokenStr = req.headers.authorization;

        // Nếu không gửi token lên -> lỗi
        if (!tokenStr) {
            throw HttpError(401, 'Token is required (Login first!)');
        }

        // Cắt bỏ chữ "Bearer " để lấy đúng đoạn mã token
        // Định dạng chuẩn: "Bearer <token>"

        // phía frontend định dạng như này để lấy
        // 2. Gửi request kèm Token trong Header
        //         const res = await fetch(`${API_URL}/me`, {
        //             method: 'GET',
        //             headers: {
        //                 // ĐÂY LÀ CHỖ FRONTEND CHÈN TOKEN VÀO
        //                 // Chuẩn quốc tế: "Bearer <token>"
        //                 'Authorization': `Bearer ${token}` 
        //             }
        //         });

        const token = tokenStr.split(' ')[1];

        if (!token) {
            throw HttpError(401, 'Token format is invalid');
        }

        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);

        // QUAN TRỌNG: Gắn thông tin user vào biến req để các hàm sau dùng
        req.user = decodedUser;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(HttpError(401, 'Token has expired, please login again'));
        }
        return next(HttpError(401, 'Invalid Token'));
    }
};
module.exports = { signAuth, isAuth };
