# Test Cases - English Study Web

## Module 1: Authentication

### TC-AUTH-001: Đăng nhập thành công
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra đăng nhập với thông tin hợp lệ |
| **Tiền điều kiện** | Tài khoản đã được đăng ký |
| **Bước thực hiện** | 1. Vào trang đăng nhập<br>2. Nhập email: 02@gmail.com<br>3. Nhập password: 123456<br>4. Click "Đăng nhập" |
| **Kết quả mong đợi** | Chuyển hướng đến dashboard tương ứng với role |
| **Trạng thái** | ✅ PASS |

### TC-AUTH-002: Đăng nhập thất bại - Sai mật khẩu
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra thông báo lỗi khi nhập sai mật khẩu |
| **Tiền điều kiện** | Tài khoản tồn tại |
| **Bước thực hiện** | 1. Vào trang đăng nhập<br>2. Nhập email hợp lệ<br>3. Nhập mật khẩu sai<br>4. Click "Đăng nhập" |
| **Kết quả mong đợi** | Hiển thị thông báo "Sai email hoặc mật khẩu" |
| **Trạng thái** | ✅ PASS |

### TC-AUTH-003: Đăng ký tài khoản mới
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra đăng ký tài khoản learner mới |
| **Tiền điều kiện** | Email chưa được đăng ký |
| **Bước thực hiện** | 1. Vào trang đăng ký<br>2. Nhập thông tin hợp lệ<br>3. Click "Đăng ký" |
| **Kết quả mong đợi** | Tài khoản được tạo, chuyển đến trang đăng nhập |
| **Trạng thái** | ✅ PASS |

---

## Module 2: Course Management

### TC-COURSE-001: Xem danh sách khóa học
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra hiển thị danh sách khóa học |
| **Tiền điều kiện** | Đã đăng nhập |
| **Bước thực hiện** | 1. Vào trang "Khóa học"<br>2. Xem danh sách |
| **Kết quả mong đợi** | Hiển thị danh sách khóa học với thông tin: tên, giá, giáo viên |
| **Trạng thái** | ✅ PASS |

### TC-COURSE-002: Mua khóa học
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra luồng mua khóa học |
| **Tiền điều kiện** | Đăng nhập với role learner |
| **Bước thực hiện** | 1. Chọn khóa học<br>2. Click "Mua ngay"<br>3. Xác nhận thanh toán |
| **Kết quả mong đợi** | Enrollment tạo thành công, Order được tạo |
| **Trạng thái** | ✅ PASS |

### TC-COURSE-003: Teacher tạo khóa học mới
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra tạo khóa học mới |
| **Tiền điều kiện** | Đăng nhập với role teacher |
| **Bước thực hiện** | 1. Vào "Quản lý khóa học"<br>2. Click "Tạo khóa học"<br>3. Điền thông tin<br>4. Submit |
| **Kết quả mong đợi** | Khóa học được tạo với status draft |
| **Trạng thái** | ✅ PASS |

---

## Module 3: Teacher Revenue

### TC-REV-001: Hiển thị doanh thu
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra hiển thị doanh thu teacher |
| **Tiền điều kiện** | Teacher có khóa học đã được mua |
| **Bước thực hiện** | 1. Đăng nhập teacher<br>2. Vào Profile |
| **Kết quả mong đợi** | Hiển thị: Tổng doanh thu, Doanh thu tháng này, % tăng trưởng |
| **Trạng thái** | ✅ PASS |

### TC-REV-002: Cập nhật doanh thu khi có order mới
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Kiểm tra doanh thu cập nhật sau khi mua |
| **Tiền điều kiện** | Teacher có khóa học |
| **Bước thực hiện** | 1. Learner mua khóa học của teacher<br>2. Teacher refresh Profile |
| **Kết quả mong đợi** | Doanh thu tăng theo giá khóa học |
| **Trạng thái** | ✅ PASS |

---

## Module 4: Admin

### TC-ADMIN-001: Duyệt khóa học
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Admin duyệt khóa học pending |
| **Tiền điều kiện** | Có khóa học với approval_status = pending |
| **Bước thực hiện** | 1. Đăng nhập admin<br>2. Vào quản lý khóa học<br>3. Duyệt khóa học |
| **Kết quả mong đợi** | Khóa học chuyển sang approved |
| **Trạng thái** | ✅ PASS |

### TC-ADMIN-002: Quản lý người dùng
| Thuộc tính | Mô tả |
|------------|-------|
| **Mô tả** | Admin xem danh sách người dùng |
| **Tiền điều kiện** | Đăng nhập admin |
| **Bước thực hiện** | 1. Vào "Quản lý người dùng" |
| **Kết quả mong đợi** | Hiển thị danh sách users với role |
| **Trạng thái** | ✅ PASS |

---

## Tổng kết

| Module | Total | Pass | Fail | Skip |
|--------|-------|------|------|------|
| Authentication | 3 | 3 | 0 | 0 |
| Course Management | 3 | 3 | 0 | 0 |
| Teacher Revenue | 2 | 2 | 0 | 0 |
| Admin | 2 | 2 | 0 | 0 |
| **TOTAL** | **10** | **10** | **0** | **0** |
