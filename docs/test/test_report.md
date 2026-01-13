# Báo Cáo Kiểm Thử - English Study Web

**Ngày báo cáo:** 13/01/2026  
**Phiên bản:** 1.0  
**Người thực hiện:** Team Development

---

## 1. Tổng quan

### 1.1 Phạm vi kiểm thử
- Authentication (Đăng nhập/Đăng ký)
- Course Management (Quản lý khóa học)
- Teacher Revenue (Doanh thu giáo viên)
- Admin Functions (Chức năng quản trị)

### 1.2 Automated Testing (Jest)

**Chạy tests:** `npm test` từ thư mục `src/server`

| Test Suite | Tests | Pass | Fail | Mô tả |
|------------|-------|------|------|-------|
| auth.test.js | 7 | 7 | 0 | Login, Register, Validation |
| course.test.js | 7 | 7 | 0 | Course CRUD, Search, Filter |
| enrollment.test.js | 7 | 7 | 0 | Enrollment, Revenue Tracking |
| admin.test.js | 12 | 12 | 0 | Dashboard, Users, Course Approval |
| lesson.test.js | 10 | 10 | 0 | Lesson CRUD, Order |
| exam.test.js | 10 | 10 | 0 | Exams, Questions, Submit, Results |
| order.test.js | 13 | 13 | 0 | Orders, Payment, Cancel |
| cart.test.js | 10 | 10 | 0 | Cart Add, Remove, Clear |
| progress.test.js | 9 | 9 | 0 | Lesson Progress, Streak |
| review.test.js | 9 | 9 | 0 | Reviews, Ratings |
| **TOTAL** | **94** | **94** | **0** | **100% Pass Rate** |

### 1.2 Môi trường kiểm thử
| Thuộc tính | Giá trị |
|------------|---------|
| URL Production | https://englishhub-production-3d95.up.railway.app |
| Database | PostgreSQL on Railway |
| Browser | Chrome 120+, Firefox 120+ |

---

## 2. Kết quả kiểm thử

### 2.1 Tổng hợp

| Metric | Giá trị |
|--------|---------|
| Tổng số test cases | 10 |
| Pass | 10 (100%) |
| Fail | 0 (0%) |
| Skip | 0 (0%) |

### 2.2 Chi tiết theo module

```
Authentication     ████████████████████ 100% (3/3)
Course Management  ████████████████████ 100% (3/3)
Teacher Revenue    ████████████████████ 100% (2/2)
Admin Functions    ████████████████████ 100% (2/2)
```

---

## 3. Bugs đã phát hiện và sửa

### Bug #1: Doanh thu Teacher không cập nhật
| Thuộc tính | Mô tả |
|------------|-------|
| **Mức độ** | Critical |
| **Mô tả** | Doanh thu vẫn = 0 sau khi có học viên mua khóa học |
| **Nguyên nhân** | enrollmentController không tạo Order/OrderItem |
| **Fix** | Thêm logic tạo Order/OrderItem trong createEnrollment |
| **Trạng thái** | ✅ Đã sửa |

### Bug #2: TypeScript build error
| Thuộc tính | Mô tả |
|------------|-------|
| **Mức độ** | High |
| **Mô tả** | Build fail do `thisMonthRevenue possibly undefined` |
| **Nguyên nhân** | TypeScript strict mode check |
| **Fix** | Thêm null coalescing operator `?? 0` |
| **Trạng thái** | ✅ Đã sửa |

### Bug #3: Course price overflow
| Thuộc tính | Mô tả |
|------------|-------|
| **Mức độ** | Medium |
| **Mô tả** | Không thể tạo khóa học với giá > 100 triệu |
| **Nguyên nhân** | DECIMAL(10,2) quá nhỏ |
| **Fix** | Tăng lên DECIMAL(15,2) |
| **Trạng thái** | ✅ Đã sửa |

---

## 4. Đánh giá chất lượng

### 4.1 Functional Testing
| Tiêu chí | Đạt | Ghi chú |
|----------|-----|---------|
| Login/Logout | ✅ | Hoạt động tốt |
| CRUD Courses | ✅ | Đầy đủ chức năng |
| Enrollment | ✅ | Tạo order + enrollment |
| Revenue Tracking | ✅ | Sau khi fix |
| Admin Approval | ✅ | Hoạt động tốt |

### 4.2 Non-Functional Testing
| Tiêu chí | Kết quả | Ghi chú |
|----------|---------|---------|
| Page Load Time | < 3s | Đạt |
| Build Size | 988 KB | Cần optimize |
| Mobile Responsive | Tốt | Đã test |

---


| Vai trò | Họ tên | Ngày |
|---------|--------|------|
| Tester |Nguyễn Hoàng Minh Quân | 13/01/2026 |

