# Hướng dẫn chạy dự án English Study Web

Dưới đây là các bước chi tiết để khởi chạy dự án Frontend (React/Vite).

## 1. Kiểm tra vị trí thư mục
Lỗi bạn gặp phải (`npm error enoent Could not read package.json`) là do bạn đang đứng ở thư mục gốc của dự án, nhưng mã nguồn Frontend lại nằm trong thư mục con `web/client`.

## 2. Các bước thực hiện

### Bước 1: Di chuyển vào thư mục Client
Mở Terminal (hoặc Command Prompt/PowerShell) và chạy lệnh sau để đi vào đúng thư mục chứa code:

```bash
cd cnpm/English_study_web/web/client
```

> **Lưu ý:** Nếu lệnh trên báo lỗi, hãy kiểm tra lại từng thư mục bằng cách gõ `dir` hoặc `ls`. Đường dẫn đầy đủ trên máy bạn có thể là:
> `C:\Users\Hoa\Documents\Visual Studio Code\cnpm\English_study_web\web\client`

### Bước 2: Cài đặt thư viện (Chỉ cần làm 1 lần)
Nếu đây là lần đầu bạn chạy dự án hoặc vừa kéo code mới về, hãy chạy lệnh sau để cài đặt các gói cần thiết:

```bash
npm install
```

### Bước 3: Khởi chạy dự án
Sau khi cài đặt xong, chạy lệnh sau để bắt đầu server phát triển:

```bash
npm start
```
*(Hoặc `npm run dev`)*

Sau khi chạy, Terminal sẽ hiện ra đường dẫn (thường là `http://localhost:5173/`). Giữ phím `Ctrl` và click vào link đó để mở trình duyệt.

## 3. Tóm tắt lệnh (Copy & Paste)
Bạn có thể copy toàn bộ đoạn lệnh dưới đây và paste vào Terminal của VS Code:

```bash
cd web/client
npm install
npm start
```

## 4. Troubleshooting (Gỡ lỗi thường gặp)

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `npm error code ENOENT` tại `package.json` | Sai thư mục | Chạy `cd web/client` rồi thử lại. |
| `'vite' is not recognized` | Chưa cài node_modules | Chạy `npm install`. |
| `EADDRINUSE: context port 5173` | Cổng đang bận | Có một terminal khác đang chạy dự án rồi. Tắt nó đi hoặc npm sẽ tự chuyển sang cổng khác. |
