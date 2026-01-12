require('dotenv').config();
const express = require('express');

var morgan = require('morgan');
const path = require('path');

const route = require('./src/routes');

// Lấy hàm connect để test mạng
const { connect } = require('./src/config/db/connect');
// Lấy models để tạo bảng
const models = require('./src/app/models');

const solvingError = require('./src/app/middlewares/solvingError');
const app = express();
const port = process.env.PORT || 3000;



// 1. Cấu hình CORS cho phép mọi origin (bao gồm localhost và production)
const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Handle preflight requests
app.options('*', cors());

// 2. BẬT MORGAN để theo dõi mọi request 
app.use(morgan('dev'));

// 3. Cấu hình Static files
app.use(express.static(path.join(__dirname, 'public')));

// Giúp Server đọc được dữ liệu JSON từ client gửi lên (POST/PUT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. tạo kết nối db
connect();

// Health check endpoint cho Railway
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Đồng bộ tạo bảng
models.sequelize.sync({ force: false, alter: true })
    .then(() => {
        console.log('Đã đồng bộ Database thành công!');
    })
    .catch(err => {
        console.error('Lỗi tạo bảng:', err);
    });


route(app);

// 8. xử lí lỗi
solvingError(app);

// start server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});