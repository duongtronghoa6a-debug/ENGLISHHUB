# Kịch Bản Demo App - EnglishHub

## 🎯 Thời lượng: 10-15 phút

## 📍 URL: https://englishhub-production-3d95.up.railway.app

---

## � Tài khoản demo:
```
Student: 01@gmail.com / 111111
Teacher: 02@gmail.com / 111111  
Admin:   03@gmail.com / 111111
```

---

## PHẦN 1: GIỚI THIỆU (1 phút)

**Nói:** "Đây là EnglishHub - nền tảng học tiếng Anh trực tuyến."

**Demo:**
- Mở trang chủ
- Scroll qua các section giới thiệu

---

## PHẦN 2: ĐĂNG NHẬP HỌC VIÊN (2 phút)

**Nói:** "Em sẽ demo chức năng từ góc độ học viên."

**Demo:**
1. Click "Đăng nhập"
2. Nhập: `01@gmail.com` / `111111`
3. Click Login

**Show:**
- Dashboard học viên
- Thống kê học tập (nếu có)

---

## PHẦN 3: XEM VÀ MUA KHÓA HỌC (3 phút)

**Nói:** "Học viên có thể xem và đăng ký các khóa học."

**Demo:**
1. Vào "Khóa học" / "Courses"
2. Tìm kiếm khóa học (gõ "TOEIC" hoặc "IELTS")
3. Click vào 1 khóa học để xem chi tiết
4. Show: Thông tin khóa học, giá, giáo viên

**Nếu có nút mua:**
5. Click "Đăng ký" / "Enroll"
6. Xác nhận thanh toán

---

## PHẦN 4: HỌC BÀI (2 phút)

**Nói:** "Sau khi đăng ký, học viên có thể vào học."

**Demo:**
1. Vào "Khóa học của tôi" / "My Courses"
2. Chọn 1 khóa đã đăng ký
3. Xem danh sách bài học (Lessons)
4. Click vào 1 bài → Xem video/nội dung

---

## PHẦN 5: LÀM BÀI KIỂM TRA (2 phút)

**Nói:** "Học viên có thể làm bài thi để đánh giá trình độ."

**Demo:**
1. Vào "Bài thi" / "Exams"
2. Chọn 1 bài thi (ví dụ: Placement Test)
3. Bắt đầu làm bài
4. Trả lời vài câu → Submit
5. Xem kết quả

---

## PHẦN 6: GIÁO VIÊN (2 phút)

**Nói:** "Bây giờ em sẽ demo từ góc độ giáo viên."

**Demo:**
1. Đăng xuất
2. Đăng nhập: `02@gmail.com` / `111111`
3. Vào Dashboard giáo viên

**Show:**
- Thống kê: Số khóa học, học viên, doanh thu
- Danh sách khóa học đã tạo

---

## PHẦN 7: QUẢN TRỊ VIÊN (2 phút)

**Nói:** "Cuối cùng là giao diện Admin."

**Demo:**
1. Đăng xuất
2. Đăng nhập: `03@gmail.com` / `111111`
3. Vào Dashboard Admin

**Show:**
- Thống kê tổng quan
- Quản lý Users
- Quản lý Courses (duyệt khóa học)

---

## PHẦN 8: AUTOMATED TESTING (1 phút)

**Nói:** "Dự án có 94 automated tests."

**Demo (nếu có laptop riêng):**
```bash
cd src/server
npm test
```

**Show:** Kết quả 94 tests PASS

---

## 💡 TIPS KHI DEMO:

1. **Chuẩn bị trước:** Đăng nhập sẵn 1 tab khác
2. **Backup:** Chụp screenshot phòng mạng chậm
3. **Nói chậm:** Để người xem theo kịp
4. **Giải thích:** Khi chuyển màn hình, nói đang làm gì

---

## ⚠️ XỬ LÝ LỖI:

| Lỗi | Cách xử lý |
|-----|------------|
| Trang trắng | Reload, chờ 5s |
| Không load được | Dùng screenshot backup |
| Đăng nhập lỗi | Kiểm tra lại mật khẩu: 111111 |
| Khóa học trống | Chạy update SQL để publish |

---

## � LUỒNG DEMO ĐỀ XUẤT:

```
Trang chủ → Đăng nhập Student → Xem khóa học → Mua khóa 
    → Học bài → Làm bài thi → Đăng xuất 
    → Đăng nhập Teacher → Xem Dashboard/Revenue
    → Đăng xuất → Đăng nhập Admin → Quản lý
    → (Nếu còn thời gian) Demo npm test
```
