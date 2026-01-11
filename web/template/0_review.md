# 📋 PHÂN TÍCH & ĐÁNH GIÁ FILE 0.md (Project Proposal)

## So sánh với cấu trúc thực tế của codebase ENGLISH HUB

---

## ❌ CÁC ĐIỂM SAI / THIẾU SÓT

### 1. Luồng trải nghiệm Learner - SAI
**Vị trí:** Dòng 87
**Nội dung hiện tại:**
> "Bắt buộc thực hiện bài Kiểm tra đầu vào (Placement Test) để xác định trình độ"

**Vấn đề:** Theo FR3.3 trong tài liệu yêu cầu, Placement Test là **TÙY CHỌN**, không bắt buộc.

**Cách sửa:** Đổi thành:
> "Tùy chọn thực hiện bài Kiểm tra đầu vào (Placement Test) từ thư viện đề thi để đánh giá trình độ"

---

### 2. Thiếu vai trò Teacher trong mô tả luồng
**Vị trí:** Dòng 85-93
**Nội dung hiện tại:** Chỉ mô tả Guest, Learner, Admin

**Vấn đề:** Hệ thống có **3 vai trò người dùng chính**: Admin, Teacher, Learner (xác nhận qua bảng `accounts.role` ENUM và model `Teacher.js`).

**Cách sửa:** Thêm phần mô tả Teacher:
```
Giáo viên (Teacher):
- Quản lý và đăng tải nội dung khóa học (Online và Offline).
- Theo dõi lịch dạy và hỗ trợ học viên qua Chat.
- Tạo bài kiểm tra, câu hỏi, upload video/audio.
```

---

### 3. Số kỹ năng học - SAI
**Vị trí:** Dòng 75, 89, 196 và nhiều chỗ khác
**Nội dung hiện tại:**
> "4 kỹ năng (Nghe, Nói, Đọc, Viết)"

**Vấn đề:** Theo FR3.1 trong tài liệu SRS và cấu trúc database (`questions.skill` ENUM), hệ thống hỗ trợ **5 kỹ năng**.

**Cách sửa:** Đổi thành:
> "5 kỹ năng: Đọc (Reading), Viết (Writing), Nghe (Listening), Ngữ pháp (Grammar), và Từ vựng (Vocabulary/Flashcard)"

---

### 4. Số trình độ - SAI
**Vị trí:** Dòng 75
**Nội dung hiện tại:**
> "3 trình độ (Elementary, Intermediate, Advanced)"

**Vấn đề:** Database thực tế sử dụng **6 level theo chuẩn CEFR**: A1, A2, B1, B2, C1, C2 (xác nhận qua `learners.english_level` và `courses.level` ENUM).

**Cách sửa:** Đổi thành:
> "6 trình độ theo chuẩn CEFR: A1, A2, B1, B2, C1, C2"

---

### 5. Tên bảng Database - SAI FORMAT
**Vị trí:** Dòng 166
**Nội dung hiện tại:**
> "NGUOIDUNG, BAIHOC, CAUHOI, KETQUA, XEPHANG"

**Vấn đề:** Tên bảng thực tế trong PostgreSQL là tiếng Anh, snake_case:
```
accounts, admins, learners, teachers, courses, modules, lessons, 
enrollments, learning_progress, exams, questions, exam_submissions, 
submission_answers, orders, order_items, cart_items, reviews, 
offline_classes, offline_schedules, class_enrollments, attendances,
achievements, user_activities, test_sessions, speaking_results,
conversations, conversation_participants, messages, rubrics
```

**Cách sửa:** Cập nhật theo tên thực tế (tổng cộng **29 bảng**).

---

### 6. PostgreSQL ghi SAI loại CSDL
**Vị trí:** Dòng 494
**Nội dung hiện tại:**
> "PostgreSQL - CSDL dạng NoSQL, cloud-based"

**Vấn đề:** PostgreSQL là **RDBMS (Relational Database - SQL)**, KHÔNG PHẢI NoSQL.

**Cách sửa:** Đổi thành:
> "PostgreSQL - CSDL quan hệ (RDBMS/SQL)"

---

### 7. Thiếu nhiều chức năng quan trọng trong danh sách
**Vị trí:** Dòng 117-150 (Bảng chức năng phần mềm)

**Các chức năng thiếu so với FR thực tế:**

| FR Code | Chức năng thiếu |
|---------|-----------------|
| FR2.1 | Hiển thị thư viện tài liệu (Miễn phí, Trả phí, Offline) |
| FR2.2 | Tìm kiếm và lọc khóa học (theo kỹ năng, trình độ, giá) |
| FR2.3 | Xem chi tiết khóa học (Lịch học offline, Giáo viên) |
| FR2.4 | Thêm khóa học vào Giỏ hàng |
| FR2.5 | Thanh toán online qua Cổng thanh toán |
| FR2.6 | Xem lại Lịch sử học tập |
| FR5.1 | Chat trực tuyến |
| FR5.2 | Nhắn tin với Teacher/Admin |
| FR5.3 | Quản lý tin nhắn đến và trả lời |
| FR6.1 | Teacher quản lý khóa học của mình |
| FR7.2 | Dashboard thống kê cho Admin (Doanh thu, Người dùng mới) |

---

### 8. Thiếu mô tả E-commerce / Thương mại điện tử
**Vấn đề:** File không đề cập đến hệ thống:
- **Giỏ hàng** (`cart_items`)
- **Đơn hàng** (`orders`, `order_items`)
- **Thanh toán online** (Payment Gateway)
- **Khóa học Offline** (`offline_classes`, `offline_schedules`, `class_enrollments`)

**Cách sửa:** Bổ sung nhóm FR2 vào danh sách chức năng:
```
Nhóm FR2: Thư viện & Thương mại điện tử
- Hiển thị thư viện tài liệu đa dạng (Miễn phí/Trả phí/Offline)
- Tìm kiếm và lọc khóa học
- Xem chi tiết khóa học
- Thêm vào Giỏ hàng
- Thanh toán online
- Xem Lịch sử học tập
```

---

### 9. Thiếu tính năng Chat/Messaging
**Vấn đề:** File không đề cập hệ thống nhắn tin trực tuyến.

**Database thực tế có:**
- `conversations` - Cuộc hội thoại
- `conversation_participants` - Thành viên tham gia
- `messages` - Tin nhắn

**Cách sửa:** Bổ sung nhóm FR5:
```
Nhóm FR5: Tương tác & Hỗ trợ
- Chat trực tuyến
- Learner nhắn tin với Teacher (hỏi bài) hoặc Admin (hỗ trợ kỹ thuật)
- Teacher và Admin quản lý danh sách tin nhắn và trả lời
```

---

### 10. Mô tả AI Speaking không đầy đủ
**Vị trí:** Dòng 103-104
**Nội dung hiện tại:** Chỉ nói "Speech-to-Text API"

**Vấn đề:** Tính năng AI Speaking thực tế bao gồm:
- Ghi âm và upload audio
- AI **phân tích và chấm điểm** phát âm
- Lưu kết quả vào bảng `speaking_results` (score, feedback, audio_url)
- Phản hồi trong 3-5 giây (NFR1)

**Cách sửa:** Mô tả chi tiết hơn:
> "Tính năng Luyện Nói AI: ghi âm, phân tích phát âm bằng AI, chấm điểm và cung cấp phản hồi chi tiết trong 3-5 giây"

---

## ✅ BẢNG TÓM TẮT CÁC SỬA ĐỔI CẦN THIẾT

| # | Vị trí | Vấn đề | Sửa thành |
|---|--------|--------|-----------|
| 1 | Dòng 87 | "Bắt buộc Placement Test" | "Tùy chọn làm bài kiểm tra" |
| 2 | Dòng 85-93 | Thiếu Teacher | Thêm mô tả vai trò Teacher |
| 3 | Nhiều chỗ | "4 kỹ năng" | "5 kỹ năng: Đọc, Viết, Nghe, Ngữ pháp, Từ vựng" |
| 4 | Dòng 75 | "3 trình độ" | "6 trình độ CEFR: A1, A2, B1, B2, C1, C2" |
| 5 | Dòng 166 | Tên bảng tiếng Việt | Đổi sang tên thực: accounts, courses, lessons... |
| 6 | Dòng 494 | "PostgreSQL NoSQL" | "PostgreSQL (RDBMS/SQL)" |
| 7 | Dòng 117-150 | Thiếu FR2, FR5, FR6, FR7 | Bổ sung đầy đủ các chức năng |
| 8 | Toàn file | Thiếu E-commerce | Bổ sung: Giỏ hàng, Thanh toán, Đơn hàng |
| 9 | Toàn file | Thiếu Chat | Bổ sung: Chat với Teacher/Admin |
| 10 | Dòng 103-104 | AI Speech mô tả sơ sài | Mô tả chi tiết: ghi âm, chấm điểm, feedback |

---

## 📊 SO SÁNH DATABASE

### File 0.md ghi (sai):
- NGUOIDUNG, BAIHOC, CAUHOI, KETQUA, XEPHANG

### Database thực tế (29 bảng):
```
┌─────────────────────────────────────────────────────────────┐
│ Nhóm 1: Tài khoản (4)                                       │
│ accounts, admins, teachers, learners                        │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 2: Khóa học (3)                                        │
│ courses, modules, lessons                                   │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 3: Đăng ký & Tiến độ (2)                               │
│ enrollments, learning_progress                              │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 4: Bài thi & Câu hỏi (5)                               │
│ exams, questions, rubrics, exam_submissions,                │
│ submission_answers                                          │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 5: Thương mại (4)                                      │
│ cart_items, orders, order_items, reviews                    │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 6: Lớp Offline (4)                                     │
│ offline_classes, offline_schedules, class_enrollments,      │
│ attendances                                                 │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 7: Tin nhắn (3)                                        │
│ conversations, conversation_participants, messages          │
├─────────────────────────────────────────────────────────────┤
│ Nhóm 8: Gamification & Tracking (4)                         │
│ achievements, user_activities, test_sessions,               │
│ speaking_results                                            │
└─────────────────────────────────────────────────────────────┘
```

---

*Tài liệu đánh giá được tạo tự động - ENGLISH HUB Project*
*Ngày: 2026-01-12*
