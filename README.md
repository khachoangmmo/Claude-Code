# Mrbo Ads — E-Learning Platform

> Nền tảng học Performance Marketing cho Bất Động Sản với thương hiệu **Mrbo Ads**

## Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript |
| Backend   | Node.js + Express.js            |
| Database  | SQLite (via better-sqlite3)     |
| Auth      | JWT (jsonwebtoken + bcryptjs)   |

## Tính Năng

### Người Dùng
- Đăng ký / Đăng nhập với JWT
- Xem danh sách & tìm kiếm khóa học
- Xem chi tiết khóa học với chương trình học
- Đăng ký khóa học
- Dashboard cá nhân với tiến độ học
- Đánh giá & nhận xét khóa học
- Cập nhật hồ sơ cá nhân

### Quản Trị
- Quản lý người dùng
- Tạo & cập nhật khóa học
- Thống kê doanh thu & học viên

## Cài Đặt & Chạy

### Yêu cầu
- Node.js >= 18.x

### Các bước

```bash
# 1. Cài dependencies
cd backend && npm install

# 2. Tạo file .env
cp .env.example .env
# Chỉnh sửa JWT_SECRET trong .env

# 3. Khởi tạo database & seed data
node db/init.js

# 4. Chạy server
npm start
# Server chạy tại http://localhost:5000
```

## Cấu Trúc Dự Án

```
Claude-Code/
├── frontend/               # Static HTML/CSS/JS
│   ├── index.html          # Trang chủ
│   ├── courses.html        # Danh sách khóa học
│   ├── course.html         # Chi tiết khóa học
│   ├── login.html          # Đăng nhập
│   ├── register.html       # Đăng ký
│   ├── dashboard.html      # Dashboard học viên
│   ├── css/
│   │   └── style.css       # Design system
│   └── js/
│       ├── api.js          # API client
│       ├── auth.js         # Auth module
│       └── main.js         # Utilities & renderers
│
└── backend/                # Node.js API
    ├── server.js           # Entry point
    ├── package.json
    ├── .env.example
    ├── db/
    │   ├── init.js         # Schema & seed data
    │   └── database.js     # DB connection
    ├── middleware/
    │   └── auth.js         # JWT middleware
    └── routes/
        ├── auth.js         # Auth routes
        ├── courses.js      # Course routes
        ├── users.js        # User routes
        └── categories.js   # Category routes
```

## API Endpoints

### Auth
| Method | Endpoint            | Mô tả                |
|--------|---------------------|----------------------|
| POST   | /api/auth/register  | Đăng ký tài khoản    |
| POST   | /api/auth/login     | Đăng nhập            |
| GET    | /api/auth/me        | Lấy thông tin user   |
| PUT    | /api/auth/profile   | Cập nhật hồ sơ       |

### Courses
| Method | Endpoint                                 | Mô tả                  |
|--------|------------------------------------------|------------------------|
| GET    | /api/courses                             | Danh sách khóa học     |
| GET    | /api/courses/featured                    | Khóa học nổi bật       |
| GET    | /api/courses/:slug                       | Chi tiết khóa học      |
| POST   | /api/courses                             | Tạo khóa học (admin)   |
| PUT    | /api/courses/:id                         | Cập nhật (admin)       |
| POST   | /api/courses/:id/enroll                  | Đăng ký học            |
| GET    | /api/courses/:id/lessons/:lessonId       | Xem bài học            |
| POST   | /api/courses/:id/lessons/:lessonId/complete | Đánh dấu hoàn thành |
| POST   | /api/courses/:id/review                  | Đánh giá khóa học      |

### Users
| Method | Endpoint                      | Mô tả                  |
|--------|-------------------------------|------------------------|
| GET    | /api/users/me/enrollments     | Khóa học đã đăng ký    |
| GET    | /api/users/me/progress/:id    | Tiến độ học            |
| GET    | /api/users                    | Danh sách user (admin) |
| GET    | /api/users/stats              | Thống kê (admin)       |

## Demo Accounts

| Role       | Email               | Password  |
|------------|---------------------|-----------|
| Admin      | admin@mrboads.com   | Admin@123 |
| Instructor | mrbo@mrboads.com    | Mrbo@123  |

## Brand

- **Thương hiệu**: Mrbo Ads
- **Lĩnh vực**: Performance Marketing cho Bất Động Sản
- **Màu chính**: Orange `#F97316`
- **Font**: Sora (headings) + Inter (body)
