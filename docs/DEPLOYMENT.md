# Setup & Deployment Guide

This guide details steps to configure, reset, and deploy the Aptitude Screening Portal.

## Getting Started

### 1. Configure Environment variables
Create a `.env` or `.env.local` file in the root of the project:
```properties
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aptitude_portal"
JWT_SECRET="generate-a-safe-minimum-32-char-jwt-secret-string"
JWT_EXPIRE="7d"
BCRYPT_ROUNDS="10"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 2. Reset Database & Seed Super Admin
Clear all test tables and seed the base branch structures along with the initial Super Admin:
```bash
npx tsx seed.ts
```
*(If `tsx` is not installed, you can use `npx ts-node seed.ts` or set up the seed script inside `package.json` and run `npx prisma db seed`).*

Default Seed Credentials:
- **Email**: `superadmin@portal.com`
- **Password**: `superadminpassword`
- **Role**: `super_admin`

---

## Local Development Server

Run the development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start testing.

---

## Production Deployment

### 1. Database Migrations
Run schema migration on production databases:
```bash
npx prisma db push
```

### 2. Build Bundle
Compile the Next.js production builds:
```bash
npm run build
```

### 3. Start Production Server
Launch compiled bundles:
```bash
npm run start
```
