# Hướng dẫn Deploy Website

## Tổng quan
Dự án bao gồm 3 phần:
- **Backend**: API server (Node.js/Express) → Deploy trên Railway
- **Frontend**: Ứng dụng chính (Next.js) → Deploy trên Vercel  
- **Admin**: Trang admin (Next.js) → Deploy trên Vercel
- **Database**: MongoDB Atlas

## Bước 1: Setup Database (MongoDB Atlas)

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Tạo tài khoản miễn phí
3. Tạo cluster mới (chọn tier miễn phí)
4. Tạo database user
5. Whitelist IP addresses (0.0.0.0/0 cho tất cả)
6. Lấy connection string

## Bước 2: Deploy Backend trên Railway

### 2.1 Chuẩn bị
- Đã tạo sẵn: `Dockerfile`, `railway.json`, `.dockerignore`
- Đã cập nhật `package.json` với script build

### 2.2 Deploy
1. Truy cập [Railway](https://railway.app)
2. Đăng nhập bằng GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Chọn repository và folder `backend`
5. Railway sẽ tự động detect Dockerfile và deploy

### 2.3 Cấu hình Environment Variables
Trong Railway dashboard, thêm các biến môi trường:

**Server Configuration:**
```
PORT=4000
NODE_ENV=production
```

**Database:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

**JWT Secrets:**
```
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_SECRET=your-jwt-access-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
ACCESS_TOKEN_SECRET=your-access-token-secret
RESET_SECRET=your-reset-secret
```

**Client URLs (sẽ cập nhật sau khi deploy frontend/admin):**
```
CLIENT_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
```

**Collections (MongoDB):**
```
PARTS_COLL=parts
STIMULI_COLL=stimuli
ITEMS_COLL=parts_placement
TESTS_COLL=tests
```

**Google OAuth:**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Email Configuration:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Support" <no-reply@your.app>
```

**OpenAI (cho chat):**
```
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 2.4 Lấy Backend URL
Sau khi deploy thành công, Railway sẽ cung cấp URL như: `https://your-app.railway.app`

## Bước 3: Deploy Frontend trên Vercel

### 3.1 Chuẩn bị
- Đã tạo sẵn: `vercel.json`, `env.example`

### 3.2 Deploy
1. Truy cập [Vercel](https://vercel.com)
2. Đăng nhập bằng GitHub
3. Click "New Project" → Import Git Repository
4. Chọn repository và folder `frontend`
5. Vercel sẽ tự động detect Next.js

### 3.3 Cấu hình Environment Variables
Trong Vercel dashboard, thêm các biến môi trường:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
NEXT_PUBLIC_API_BASE=https://your-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

## Bước 4: Deploy Admin trên Vercel

### 4.1 Deploy
1. Trong Vercel dashboard, tạo project mới
2. Chọn repository và folder `admin`
3. Vercel sẽ tự động detect Next.js

### 4.2 Cấu hình Environment Variables
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
NEXT_PUBLIC_API_BASE=https://your-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

## Bước 5: Cập nhật CORS và CORS Settings

### 5.1 Backend CORS
Đảm bảo backend cho phép requests từ:
- Frontend URL (Vercel)
- Admin URL (Vercel)

### 5.2 Frontend API Calls
Cập nhật tất cả API calls trong frontend để sử dụng production URL thay vì localhost.

## Bước 6: Testing

1. **Backend**: Test API endpoints
2. **Frontend**: Test tất cả chức năng
3. **Admin**: Test admin panel
4. **Database**: Kiểm tra data được lưu đúng

## Troubleshooting

### Lỗi thường gặp:
1. **CORS Error**: Cập nhật CORS settings trong backend
2. **Environment Variables**: Kiểm tra tất cả biến môi trường
3. **Database Connection**: Kiểm tra MongoDB Atlas connection string
4. **Build Errors**: Kiểm tra TypeScript errors và dependencies

### Logs:
- **Railway**: Xem logs trong Railway dashboard
- **Vercel**: Xem logs trong Vercel dashboard

## Chi phí
- **Railway**: Miễn phí với giới hạn
- **Vercel**: Miễn phí cho personal projects
- **MongoDB Atlas**: Miễn phí tier (512MB)

## Bảo mật
- Sử dụng HTTPS cho tất cả
- Bảo vệ JWT secret
- Cấu hình CORS đúng
- Sử dụng environment variables cho sensitive data
