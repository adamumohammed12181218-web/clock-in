# 🕒 Oasis TimeMark — Attendance Management System

A comprehensive web-based attendance tracking system for Sandlip Oasis IT Interns with QR code scanning, device binding, and real-time dashboards.

## 📋 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account (free tier OK)
- Modern web browser

### 1️⃣ Backend Setup

```bash
cd server
npm install
```

#### Configure Environment Variables

Create/verify `.env` file in `server/` with:

```env
# Supabase credentials (get from supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_key

# JWT configuration
JWT_SECRET=change-this-to-a-long-random-secret-string
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://127.0.0.1:5500

# Admin setup key (use once to create first admin)
ADMIN_SETUP_KEY=oasis-admin-setup-2026
```

### 2️⃣ Database Setup

1. Go to [Supabase Dashboard](https://supabase.com)
2. Create a new project
3. Open the SQL Editor
4. Copy the entire contents of `database/schema.sql`
5. Paste and execute it

**This will create:**
- ✅ `admins` table
- ✅ `students` table  
- ✅ `locations` table
- ✅ `qr_codes` table
- ✅ `attendance` table
- ✅ `working_days` table
- ✅ All necessary indexes and triggers

### 3️⃣ Start the Server

```bash
cd server
npm run dev
```

Expected output:
```
🚀 Oasis TimeMark API running on http://localhost:3000
📋 Health check: http://localhost:3000/health
🌍 Environment: development
```

### 4️⃣ Frontend Setup

#### Option A: Using Live Server (VS Code)
1. Install [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code
2. Right-click `client/index.html`
3. Select "Open with Live Server"
4. This will serve on `http://127.0.0.1:5500`

#### Option B: Using Python
```bash
cd client
python -m http.server 5500
```

### 5️⃣ Create First Admin Account

1. Open Postman or use `curl`:

```bash
curl -X POST http://localhost:3000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Admin Name",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "setup_key": "oasis-admin-setup-2026"
  }'
```

2. Save the returned JWT token

3. Go to `http://127.0.0.1:5500/index.html`
4. Login with your admin credentials

## 🎯 Features

### 👑 Admin Features
- ✅ Create and manage locations
- ✅ Generate daily QR codes
- ✅ View real-time attendance dashboard
- ✅ Manage student accounts
- ✅ Override attendance records
- ✅ Export attendance reports
- ✅ Configure working days

### 🎓 Student Features
- ✅ Register account with device binding
- ✅ Clock in/out manually or via QR scan
- ✅ View personal attendance history
- ✅ Track attendance rate and streaks
- ✅ View calendar with attendance status
- ✅ Download attendance CSV

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register           — Student registration
POST   /api/auth/login              — Login (admin or student)
GET    /api/auth/me                 — Get current user info
POST   /api/auth/admin/register     — Create admin (setup key required)
```

### Attendance
```
POST   /api/attendance/clock-in     — Clock in
POST   /api/attendance/clock-out    — Clock out
GET    /api/attendance/my           — Get own attendance history
GET    /api/attendance/stats/me     — Get own statistics
```

### Admin
```
GET    /api/admin/stats             — Dashboard statistics
POST   /api/admin/locations         — Create location
GET    /api/admin/locations         — Get all locations
PATCH  /api/admin/locations/:id     — Update location
POST   /api/admin/qr/generate       — Generate daily QR
GET    /api/admin/qr/today          — Get today's QR code
GET    /api/admin/students          — Get all students
PATCH  /api/admin/students/:id      — Activate/deactivate student
GET    /api/admin/working-days      — Get working days config
PUT    /api/admin/working-days      — Update working days
```

## 🔒 Security Features

- **JWT Authentication** — Secure token-based auth
- **Password Hashing** — bcryptjs with 12 salt rounds
- **Device Binding** — IP + browser fingerprint validation
- **Rate Limiting** — 100 req/15min general, 20 req/15min for auth
- **CORS Protection** — Whitelist-based origin validation
- **SQL Injection Prevention** — Parameterized queries via Supabase
- **XSS Prevention** — HTML escaping in frontend
- **One Clock-In Per Day** — Prevents duplicate attendance

## 📱 Supported Browsers

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is missing"
→ Check `.env` file has correct credentials from Supabase dashboard

### CORS error: "Not allowed by CORS"
→ Update `FRONTEND_URL` in `.env` to match your frontend URL

### QR code doesn't work
→ Make sure browser has camera permissions and location is created

### "Device not recognized" error
→ Check device binding in development mode (NODE_ENV=development bypasses strict checks)

### Database errors
→ Verify schema.sql was fully executed in Supabase SQL Editor

## 📞 Support

For issues, check:
1. Browser console (F12 → Console tab)
2. Server logs (terminal running `npm run dev`)
3. Supabase dashboard → Logs tab

## 📄 License

Project for Sandlip Oasis IT Internship Program

---

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **Last Updated:** September 2, 2026
