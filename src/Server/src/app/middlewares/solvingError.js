
module.exports = (app) => {
    
    // 1. Bắt lỗi 404 (Route Not Found)
    app.use((req, res, next) => {
        const error = new Error('Not Found');
        error.status = 404;
        next(error); 
    });

    // 2. Bộ xử lý lỗi trung tâm
    app.use((err, req, res, next) => {
        const statusCode = err.status || 500;

        // Lưu ý: Phải có .json() hoặc .send() để trả về, nếu chỉ .status() thì web sẽ treo mãi
        return res.status(statusCode).json({
            status: 'error',
            code: statusCode,
            message: err.message || 'Internal Server Error',
            stack: err.stack // Chỉ hiện khi dev, production nên ẩn
        });
    });
};