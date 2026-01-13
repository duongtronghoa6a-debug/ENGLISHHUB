# Test

Lưu trữ tất cả các tài liệu kiểm thử như kế hoạch kiểm thử, các trường hợp kiểm thử (test case) và báo cáo kiểm thử.

## Nội dung

| Tài liệu                             | Mô tả                                    |
| ------------------------------------ | ---------------------------------------- |
| [Kế hoạch kiểm thử](./test_plan.md)  | Chiến lược, phạm vi, môi trường kiểm thử |
| [Test Cases](./test_cases.md)        | Các trường hợp kiểm thử chi tiết         |
| [Báo cáo kiểm thử](./test_report.md) | Kết quả kiểm thử, bugs, đánh giá         |

## Tổng quan nhanh

-   **Manual test cases:** 10 (100% pass)
-   **Automated tests:** 94 (100% pass)
-   **Test suites:** 10
-   **Critical bugs đã sửa:** 3

## Automated Testing

```bash
# Chạy tất cả tests
cd src/server
npm test

# Chạy với coverage report
npm run test:coverage

# Chạy một test file cụ thể
npx jest auth.test.js
```

**Test Suites (10 files, 94 tests):**
| File | Tests | Mô tả |
|------|-------|-------|
| `auth.test.js` | 7 | Authentication (login, register) |
| `course.test.js` | 7 | Course CRUD |
| `enrollment.test.js` | 7 | Enrollment & Revenue |
| `admin.test.js` | 12 | Admin dashboard, users, course approval |
| `lesson.test.js` | 10 | Lesson CRUD |
| `exam.test.js` | 10 | Exams, questions, submit |
| `order.test.js` | 13 | Orders, payment, cancel |
| `cart.test.js` | 10 | Shopping cart |
| `progress.test.js` | 9 | Lesson progress & Streak |
| `review.test.js` | 9 | Reviews & Ratings |
