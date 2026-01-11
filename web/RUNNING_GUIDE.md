# HƯỚNG DẪN CHẠY DỰ ÁN (ENGLISH STUDY WEB)

---

## 🚀 TRƯỜNG HỢP 1: Chạy Client với Railway Backend (Nhanh nhất)

> Backend đã deploy trên Railway. Bạn chỉ cần chạy Frontend local.

### Bước 1: Tạo file `client/.env`
```env
VITE_API_URL=https://motivated-motivation-production.up.railway.app
```

### Bước 2: Chạy Client
```bash
cd client
npm install
npm start
```

### Bước 3: Truy cập
- Web: `http://localhost:5173`

---

## 💻 TRƯỜNG HỢP 2: Chạy Full Local (Server + Client)

### Yêu cầu
- **Node.js**: v18+
- **Docker** (hoặc PostgreSQL local)

---

### Bước 1: Tạo file `docker-compose.yml` (trong thư mục `web/`)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    container_name: english_web_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: english_study_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    container_name: english_web_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: password123
    ports:
      - "5050:80"
    depends_on:
      - db

volumes:
  postgres_data:
```

### Bước 2: Khởi động Database
```bash
cd web
docker-compose up -d
```

---

### Bước 3: Tạo file `server/.env`
```env
PORT=5000
JWT_SECRET=N01-NM_CNPM-HETHONGHOCTIENGANH

# Database (Docker)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password123
DB_NAME=english_study_db
DB_DIALECT=postgres

# Cloudinary
CLOUDINARY_NAME=dovb1ylnk
CLOUDINARY_KEY=789884671489359
CLOUDINARY_SECRET=ahWjfklYHp4Tz_t2e3MYTuYEglo

# Cloudflare R2
R2_ACCOUNT_ID=b5d71da19095315267ca4581b48cfb52
R2_ACCESS_KEY_ID=ebe512c516835d4aeb49b427765d3120
R2_SECRET_ACCESS_KEY=b55f70e438a580ca66029908635d8f9fba3ee24bd963e05c48bc3bb4ac66cd01
R2_BUCKET_NAME=english-hub-storage
R2_PUBLIC_URL=https://pub-6d07f507d8fe46d9b39f2fc6d63eb8ff.r2.dev

# Gemini AI
GEMINI_API_KEY=AIzaSyCyvQZD7TnVBRid2wa7lzIM3uwAhb85ZCE
```

### Bước 4: Chạy Backend
```bash
cd server
npm install
npm run seed      # Tạo dữ liệu mẫu (lần đầu)
npm run dev       # Khởi động server
```
- Server: `http://localhost:5000`

---

### Bước 5: Tạo file `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

### Bước 6: Chạy Frontend
```bash
cd client
npm install
npm run dev
```
- Web: `http://localhost:5173`

---

## 👤 Tài khoản Đăng nhập Mẫu( đã seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `03@gmail.com` | `111111` |
| Teacher | `02@gmail.com` | `111111` |
| Learner | `01@gmail.com` | `111111` |

---

## 🛠️ Xử lý sự cố

| Lỗi | Giải pháp |
|-----|-----------|
| DB Connection failed | Chạy `docker-compose up -d` |
| CORS error | Kiểm tra `VITE_API_URL` |
| 404 API | Server chưa chạy |



