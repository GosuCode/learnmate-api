# LearnMate Quick Start Guide

## 🚀 One-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up database schema
npm run db:generate
npm run db:push

# 3. Create admin user
npm run create-admin

# 4. Start development server
./start-dev.sh
```

## 🔑 Admin Login Credentials

- **Email**: `admin@learnmate.com`
- **Password**: `admin123`

## 📋 Essential Commands

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `./start-dev.sh`       | Start server with local database |
| `npm run dev`          | Start server (manual env setup)  |
| `npm run db:push`      | Update database schema           |
| `npm run db:studio`    | Open database GUI                |
| `npm run create-admin` | Create admin user                |

## 🔄 Database Switching

**Local Development:**

```env
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/learnmate
```

**Supabase/Production:**

```env
USE_LOCAL_DB=false
DATABASE_URL=your-supabase-url
```

## 🧪 Test Your Setup

```bash
# Test API
curl http://localhost:9000/api/users

# Test login
curl -X POST http://localhost:9000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learnmate.com","password":"admin123"}'
```

## 🎯 Frontend Integration

1. `cd dashboard && npm run dev`
2. Go to `http://localhost:5173/login`
3. Login with admin credentials
4. Redirected to dashboard

## 🆘 Quick Fixes

**Server won't start:**

```bash
# Kill existing process
pkill -f "node.*dist/index.js"
# Restart
./start-dev.sh
```

**Database connection error:**

```bash
# Check PostgreSQL
sudo systemctl status postgresql
# Restart if needed
sudo systemctl restart postgresql
```

**Reset everything:**

```bash
npm run db:push
npm run create-admin
./start-dev.sh
```

---

**For detailed setup, see `SETUP_GUIDE.md`**
