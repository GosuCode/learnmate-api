# LearnMate Backend Setup Guide

This guide will help you set up the LearnMate backend with a local PostgreSQL database for development.

## 🎯 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 📋 Step-by-Step Setup

### 1. Install PostgreSQL

#### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS:

```bash
brew install postgresql
brew services start postgresql
```

#### Windows:

Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Set Up PostgreSQL User and Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create a new user (optional - you can use the default postgres user)
CREATE USER learnmate WITH PASSWORD 'password';

# Create the database
CREATE DATABASE learnmate;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE learnmate TO learnmate;

# Exit psql
\q
```

**Note**: If you prefer to use the default `postgres` user, you can skip the user creation step.

### 3. Configure Environment Variables

Create or update your `.env` file in the `fastify-typescript-starter` directory:

```env
# Application Configuration
NODE_ENV=development
PORT=9000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# JWT Configuration
JWT_SECRET=learnmate-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h

# Local Database Configuration
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/learnmate

# Optional: Supabase Configuration (for production)
# USE_LOCAL_DB=false
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BASE_URL=http://localhost:9000

# AI Service Configuration (optional)
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 6. Create Admin User

```bash
npm run create-admin
```

This will create an admin user with the following credentials:

- **Email**: `admin@learnmate.com`
- **Password**: `admin123`

### 7. Start the Development Server

```bash
# Option 1: Use the convenience script
./start-dev.sh

# Option 2: Manual start
USE_LOCAL_DB=true LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/learnmate" npm run dev
```

## 🚀 Quick Commands Reference

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start development server          |
| `npm run db:generate`  | Generate Prisma client            |
| `npm run db:push`      | Push schema to database           |
| `npm run db:studio`    | Open Prisma Studio (database GUI) |
| `npm run create-admin` | Create admin user                 |
| `./start-dev.sh`       | Start server with local database  |

## 🔄 Switching Between Databases

### Local Development (Default)

```env
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/learnmate
```

### Supabase/Production

```env
USE_LOCAL_DB=false
DATABASE_URL=your-supabase-connection-string
```

## 🧪 Testing the Setup

### 1. Test API Endpoints

```bash
# Test server health
curl http://localhost:9000/api/users

# Test login
curl -X POST http://localhost:9000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learnmate.com","password":"admin123"}'
```

### 2. Test Frontend Integration

1. Start the frontend: `cd dashboard && npm run dev`
2. Go to: `http://localhost:5173/login`
3. Login with: `admin@learnmate.com` / `admin123`
4. You should be redirected to the admin dashboard

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Check if you can connect
psql -h localhost -U postgres -d learnmate
```

**Error**: `Authentication failed`

```bash
# Check your .env file has correct credentials
# Make sure LOCAL_DATABASE_URL matches your PostgreSQL setup
```

### Port Already in Use

**Error**: `Port 9000 is already in use`

```bash
# Find the process using port 9000
lsof -i :9000

# Kill the process
kill -9 <PID>
```

### Prisma Issues

**Error**: `Prisma client not generated`

```bash
# Regenerate Prisma client
npm run db:generate
```

## 📊 Database Management

### View Database with Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` to view and edit your database.

### Reset Database

```bash
# Drop and recreate database
dropdb learnmate
createdb learnmate
npm run db:push
npm run create-admin
```

## 🎯 Production Deployment

When ready for production:

1. Set `NODE_ENV=production`
2. Set `USE_LOCAL_DB=false`
3. Configure your `DATABASE_URL` for Supabase or your production database
4. Set a strong `JWT_SECRET`
5. Configure CORS origins for your production domain

## 📝 Environment Variables Summary

| Variable             | Description                    | Default                                                   |
| -------------------- | ------------------------------ | --------------------------------------------------------- |
| `NODE_ENV`           | Environment mode               | `development`                                             |
| `PORT`               | Server port                    | `9000`                                                    |
| `USE_LOCAL_DB`       | Use local database             | `true` (dev)                                              |
| `LOCAL_DATABASE_URL` | Local database connection      | `postgresql://postgres:password@localhost:5432/learnmate` |
| `DATABASE_URL`       | Production database connection | Required for production                                   |
| `JWT_SECRET`         | JWT signing secret             | `learnmate-super-secret-jwt-key-2024`                     |
| `CORS_ORIGIN`        | Allowed origins                | `http://localhost:5173,http://localhost:3000`             |

## 🎉 Success Indicators

Your setup is complete when:

✅ PostgreSQL is running  
✅ Database schema is pushed  
✅ Admin user is created  
✅ Server starts without errors  
✅ API endpoints respond correctly  
✅ Frontend can login successfully

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check the server logs for specific error messages
5. Verify the database connection string format

---

**Happy coding! 🚀**
