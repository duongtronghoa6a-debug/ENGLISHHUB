# HƯỚNG DẪN CHẠY DỰ ÁN (ENGLISH STUDY WEB)

Tài liệu hướng dẫn cài đặt và vận hành hệ thống English Study Web.

## 1. Yêu cầu hệ thống
*   **Node.js**: v18 trở lên (Khuyến nghị mới nhất).
*   **PostgreSQL**: Cài đặt trực tiếp hoặc chạy qua Docker.
*   **Git**: Để quản lý source code.

---

## 2. Cấu hình Database

Bạn có thể chọn 1 trong 2 cách:

### Cách 1: Sử dụng Docker (Khuyến nghị)
1.  Mở terminal tại thư mục gốc `.../web`.
2.  Chạy lệnh:
    ```bash
    docker-compose up -d
    ```
    *   Sẽ khởi tạo PostgreSQL (port 5432) và pgAdmin (port 5050).
    *   Tài khoản: `postgres` / `password123`.
    *   Database: `english_study_db`.

### Cách 2: Cài PostgreSQL Local
1.  Tạo Database mới tên `english_study_db`.
2.  Cập nhật file `server/.env` với thông tin kết nối DB của bạn.

---

## 3. Cài đặt Backend (Server)

1.  Mở terminal, vào thư mục `server`:
    ```bash
    cd server
    ```
2.  Cài đặt thư viện:
    ```bash
    npm install
    ```
3.  **Khởi tạo & Nạp dữ liệu mẫu (Seed)**:
    Chạy lệnh sau để XÓA sạch DB cũ và tạo dữ liệu mới (Admin, Teacher, Course mẫu):
    ```bash
    node seed.js
    ```
    *(Lưu ý: Lệnh này sẽ xóa toàn bộ dữ liệu hiện có trong DB)*
4.  Khởi động Server:
    ```bash
    npm run dev
    ```
    *   Server chạy tại: `http://localhost:5000`
    *   Tài liệu API (Swagger): `http://localhost:5000/api-docs`

---

## 4. Cài đặt Frontend (Client)

1.  Mở terminal mới, vào thư mục `client`:
    ```bash
    cd client
    ```
2.  Cài đặt thư viện:
    ```bash
    npm install
    ```
3.  Fix lỗi font (nếu có, tùy môi trường):
    *   Trong `node_modules`, `slick-carousel` đôi khi thiếu font, nhưng npm install thường đã đủ.
4.  Khởi động Client:
    ```bash
    npm start
    ```
    *   Web chạy tại: `http://localhost:3000`

---

## 5. Tài khoản Đăng nhập Mẫu

Hệ thống sau khi chạy `node seed.js` sẽ có 3 tài khoản:

| Vai trò | Email | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@english.com` | `123456` | Quản trị toàn hệ thống |
| **Teacher** | `teacher@english.com` | `123456` | Giáo viên, tạo khóa học |
| **Learner** (Student) | `student@english.com` | `123456` | Học viên, đăng ký học |

---

## 6. Các tính năng chính (Kiểm thử)
1.  **Swagger API**: Truy cập `http://localhost:5000/api-docs` để test API trực tiếp.
2.  **Đăng ký/Đăng nhập**: Test flow auth với JWT.
3.  **Khóa học**: Admin/Teacher tạo khóa, User xem và đăng ký.
4.  **Thi thử (Exams)**: Vào mục Tests để làm bài kiểm tra.
5.  **Offline Schedule**: Xem lịch học Offline.

## Xử lý sự cố
*   **Lỗi `Course.hasMany...`**: Thường do lỗi định nghĩa Model, hãy đảm bảo đã `npm install` đủ và không sửa file core model sai cách.
*   **Lỗi DB Connection**: Kiểm tra Docker hoặc file `.env`.
