# Aptitude Screening Portal - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL**
```bash
# Create database
createdb aptitude_portal

# Initialize schema
psql aptitude_portal < schema/init.sql

# Verify connection
psql aptitude_portal -c "SELECT NOW();"
```

**Option B: Docker (Recommended)**
```bash
docker run -d \
  --name postgres-aptitude \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aptitude_portal \
  -p 5432:5432 \
  postgres:15

# Wait 5 seconds for container to start
sleep 5

# Initialize schema
docker exec postgres-aptitude psql -U postgres -d aptitude_portal < schema/init.sql
```

**Option C: Supabase (Future)**
Skip for now. When ready:
1. Create project at https://app.supabase.com
2. Copy connection string from Settings > Database
3. Update .env.local: `DATABASE_URL=<connection-string>`
4. Run: `psql $DATABASE_URL < schema/init.sql`

### 3. Configure Environment
```bash
# Already created .env.local with development defaults
# For production, update these values:
JWT_SECRET=<generate-with: openssl rand -base64 32>
JUDGE0_API_KEY=<your-judge0-key>
NODE_ENV=production
```

### 4. Start Development Server
```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Environment Variables Reference

### Database Configuration
```
DATABASE_URL                     # PostgreSQL connection string
                                 # Format: postgresql://user:pass@host:port/db
DB_HOST                         # Database host (default: localhost)
DB_PORT                         # Database port (default: 5432)
DB_USER                         # Database user (default: postgres)
DB_PASSWORD                     # Database password
DB_NAME                         # Database name (default: aptitude_portal)
```

### Authentication
```
JWT_SECRET                      # JWT signing key (min 32 chars in production)
JWT_EXPIRE                      # Token expiration (default: 7d)
BCRYPT_ROUNDS                   # Password hashing rounds (default: 10)
```

### External APIs
```
JUDGE0_API_KEY                  # Judge0 API key (for code execution)
JUDGE0_API_URL                  # Judge0 endpoint URL
```

### Application
```
NEXT_PUBLIC_APP_URL             # Application URL (http://localhost:3000)
NODE_ENV                        # Environment (development/production)
```

### File Upload
```
MAX_FILE_SIZE                   # Max file size in bytes (default: 5MB)
ALLOWED_FILE_TYPES              # Comma-separated MIME types
```

### Email (Optional)
```
SMTP_HOST                       # Email server host
SMTP_PORT                       # Email server port
SMTP_USER                       # Email account
SMTP_PASSWORD                   # Email password
```

---

## Project Structure

```
/vercel/share/v0-project/
│
├── app/                                    # Next.js App Router
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts          # POST /api/auth/register
│   │   │   ├── login/route.ts             # POST /api/auth/login
│   │   │   └── logout/route.ts            # POST /api/auth/logout
│   │   ├── health/route.ts                # GET /api/health
│   │   ├── students/                      # Sprint 2
│   │   ├── admin/                         # Sprint 3
│   │   ├── tests/                         # Sprint 4
│   │   └── questions/                     # Sprint 3
│   ├── layout.tsx                         # Root layout
│   └── page.tsx                           # Landing page
│
├── lib/                                    # Core utilities
│   ├── db.ts                              # PostgreSQL client & queries
│   ├── auth.ts                            # JWT, password, RBAC
│   ├── validators.ts                      # Zod validation schemas
│   ├── api-response.ts                    # Standard API responses
│   ├── middleware.ts                      # Auth/RBAC/CORS middleware
│   └── utils.ts                           # Utility functions
│
├── types/                                  # TypeScript types
│   └── index.ts                           # Shared interfaces
│
├── components/                             # React components (TBD)
│   ├── auth/                              # Login/Register forms
│   ├── student/                           # Student UI components
│   ├── admin/                             # Admin UI components
│   ├── test/                              # Test interface components
│   └── ui/                                # shadcn/ui components
│
├── schema/                                 # Database
│   └── init.sql                           # PostgreSQL schema
│
├── public/                                 # Static assets
├── .env.example                           # Environment template
├── .env.local                             # Local development (git ignored)
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript config
├── next.config.mjs                        # Next.js config
├── SPRINT1.md                             # Sprint 1 documentation
└── SETUP.md                               # This file
```

---

## Available APIs (Sprint 1)

### Authentication Endpoints

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "role": "student"  # or "admin"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Registration successful"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

#### Logout
```bash
POST /api/auth/logout

Response (200):
{
  "success": true,
  "data": {},
  "message": "Logged out successfully"
}
```

#### Health Check
```bash
GET /api/health

Response (200):
{
  "status": "ok",
  "timestamp": "2025-07-20T10:30:00.000Z",
  "database": "connected"
}
```

---

## Testing

### Using cURL

Register a student:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "role": "student"
  }'
```

Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!"
  }'
```

Check health:
```bash
curl http://localhost:3000/api/health
```

### Using Postman

1. Import collection (TBD - will create in Sprint 2)
2. Set environment: `localhost:3000`
3. Run requests with pre-filled credentials

---

## Database Schema Overview

### Users Table
- Stores login credentials for all users
- Roles: student, admin, super_admin
- Password stored as bcrypt hash

### Students Table
- Student profile information
- Links to users via user_id
- Tracks profile completion status
- Permission flags for camera/microphone

### Admins Table
- Admin profile information
- Links to users via user_id

### Questions Table
- Question bank for assessments
- Types: MCQ, coding, essay, true_false
- Difficulty levels: easy, medium, hard
- Organized by branch (CSE, ECE, etc.)

### Tests Table
- Student test instances
- Tracks start/end times, duration
- Status: not_started, in_progress, paused, submitted, evaluated
- Violation counter

### Test Responses Table
- Student answers to individual questions
- Auto-save tracking
- Score calculation

### Violations Table
- Anti-cheating violation logs
- Types: tab_switch, window_blur, copy_paste, etc.
- Severity levels: warning, critical

---

## Security Best Practices

### Password Security ✅
- Bcryptjs hashing with 10 rounds
- Constant-time comparison
- Never logged or exposed
- Min 8 characters required

### JWT Security ✅
- Stored in HTTP-only cookies (production)
- Expires after 7 days
- Signed with JWT_SECRET
- CSRF protection ready

### Database Security ✅
- All queries parameterized (no SQL injection)
- Connection pooling
- SSL support for production
- Read-only comments in schema

### API Security ✅
- Input validation with Zod
- CORS headers configured
- Rate limiting ready
- Error responses don't leak data

---

## Deployment

### To Vercel
```bash
# Connect GitHub repository (done manually in Vercel dashboard)
git push origin main

# Vercel auto-deploys on push
# Update environment variables in Vercel Settings > Environment Variables
```

### Environment Setup for Production
```bash
# Generate strong JWT secret
openssl rand -base64 32

# Add to Vercel environment:
NEXT_PUBLIC_APP_URL=https://your-domain.com
JWT_SECRET=<generated-secret>
BCRYPT_ROUNDS=12  # Higher for production
NODE_ENV=production
DATABASE_URL=<supabase-or-neon-connection-string>
JUDGE0_API_KEY=<your-api-key>
```

### Database Migration to Supabase
1. Get Supabase connection string
2. Run: `psql $DATABASE_URL < schema/init.sql`
3. Update DATABASE_URL in Vercel environment
4. No code changes needed (abstraction layer handles it)

---

## Troubleshooting

### "connect ECONNREFUSED"
**Problem**: Cannot connect to PostgreSQL
**Solution**:
- Verify PostgreSQL is running: `psql -l`
- Check DATABASE_URL is correct
- For Docker: `docker ps | grep postgres-aptitude`

### "password authentication failed"
**Problem**: Wrong credentials
**Solution**:
- Verify DB_USER and DB_PASSWORD in .env.local
- Test with: `psql -U postgres -d aptitude_portal`

### "relation 'users' does not exist"
**Problem**: Schema not initialized
**Solution**:
- Run: `psql aptitude_portal < schema/init.sql`
- Verify: `psql aptitude_portal -c "\dt"`

### "JWT token invalid"
**Problem**: Token expired or tampered
**Solution**:
- Regenerate token by logging in again
- Check JWT_SECRET matches
- Verify token hasn't expired

### Build Errors
**Problem**: TypeScript compilation errors
**Solution**:
- Run: `pnpm tsc --noEmit` to check types
- Delete .next folder: `rm -rf .next`
- Rebuild: `pnpm build`

---

## Next Steps: Sprint 2

Sprint 2 will implement:
- Student profile completion endpoints
- Profile picture upload
- Student dashboard page
- Navigation components
- Protected routes middleware
- Form components with React Hook Form

See SPRINT1.md for detailed Sprint 1 completion status.

---

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
psql -l               # List databases
psql $DATABASE_URL    # Connect to database
\dt                   # List tables in psql
\df                   # List functions

# Docker
docker ps             # List running containers
docker logs postgres-aptitude  # View container logs
docker stop postgres-aptitude  # Stop container
docker rm postgres-aptitude    # Remove container

# Git
git log --oneline     # View commit history
git status            # Check changes
git add .             # Stage all changes
git commit -m "..."   # Commit with message
git push origin main  # Push to GitHub
```

---

## Resources

- **Next.js 16**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Zod**: https://zod.dev/
- **JWT**: https://jwt.io/
- **Bcryptjs**: https://github.com/dcodeIO/bcrypt.js
- **React Hook Form**: https://react-hook-form.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/

---

**Last Updated**: July 20, 2025  
**Status**: Sprint 1 Complete ✅  
**Next Sprint**: Sprint 2 (Student Profile & Dashboard)
