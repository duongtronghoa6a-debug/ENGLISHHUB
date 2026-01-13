# Kế Hoạch Kiểm Thử - English Study Web

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu này mô tả kế hoạch kiểm thử cho hệ thống English Study Web - nền tảng học tiếng Anh trực tuyến.

### 1.2 Phạm vi
- Frontend: React + TypeScript + Vite
- Backend: Express.js + Sequelize + PostgreSQL
- Deployment: Railway

## 2. Chiến lược kiểm thử

### 2.1 Unit Testing (Jest - ĐÃ IMPLEMENT)

**Tổng số: 94 automated tests**

| Test File | Tests | API Coverage |
|-----------|-------|--------------|
| auth.test.js | 7 | /auth/login, /auth/register |
| course.test.js | 7 | /courses (CRUD) |
| enrollment.test.js | 7 | /enrollments, Revenue |
| admin.test.js | 12 | /admin/* |
| lesson.test.js | 10 | /lessons (CRUD) |
| exam.test.js | 10 | /exams, /questions |
| order.test.js | 13 | /orders (CRUD, payment) |
| cart.test.js | 10 | /cart (add, remove, clear) |
| progress.test.js | 9 | /progress, /streak |
| review.test.js | 9 | /reviews (CRUD) |

**Chạy tests:**
```bash
cd src/server
npm test                    # Chạy tất cả
npm run test:coverage       # Với coverage report
npx jest auth.test.js       # Chạy 1 file cụ thể
```

### 2.2 Integration Testing
| Loại | Công cụ | Mô tả |
|------|---------|-------|
| API Integration | Postman/Newman | Test luồng API end-to-end |
| Database | Sequelize + Test DB | Test migrations và seeds |

### 2.3 End-to-End Testing
| Loại | Công cụ | Mô tả |
|------|---------|-------|
| UI Testing | Playwright/Cypress | Test user flows |
| Browser Testing | Browser DevTools | Cross-browser compatibility |

## 3. Môi trường kiểm thử

| Môi trường | URL | Database |
|------------|-----|----------|
| Development | localhost:5173 | Local PostgreSQL |
| Production | englishhub-production-3d95.up.railway.app | Railway PostgreSQL |

## 4. Tiêu chí kiểm thử

### 4.1 Tiêu chí đầu vào
- Code đã được commit và push lên repository
- Build thành công không có lỗi
- Seed data đã được chạy

### 4.2 Tiêu chí đầu ra
- Tất cả test cases pass
- Không có critical bugs
- Performance đạt yêu cầu (< 3s load time)

## 5. Lịch trình kiểm thử

| Giai đoạn | Thời gian | Hoạt động |
|-----------|-----------|-----------|
| Unit Test | Liên tục | Chạy khi commit |
| Integration Test | Hàng ngày | CI/CD pipeline |
| E2E Test | Trước release | Manual + Automated |
| UAT | Trước deploy | User acceptance |

## 6. Rủi ro và giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|--------|--------|------------|
| Database không đồng bộ | Cao | Sử dụng migrations |
| API breaking changes | Trung bình | Versioning API |
| Cross-browser issues | Thấp | Test trên nhiều browser |
