# EllipHire - Deployment Documentation

EllipHire supports two primary deployment methods: **Local Bare-Metal** (via Node.js) and **Containerized** (via Docker). Both environments depend on an external PostgreSQL instance hosted on Supabase.

## Prerequisites
- Node.js v22+
- npm (Node Package Manager)
- Docker & Docker Compose (if deploying via containers)
- Active Supabase Project

---

## 1. Local Bare-Metal Deployment

This is the standard approach for running EllipHire directly on a server (e.g., EC2, VPS) or locally for development.

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Variables
Create a `.env` file in the root directory. Ensure all required keys (Database URLs, JWT Secrets, OpenAI keys) are populated.
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Step 3: Database Synchronization
Since we use Prisma (v7.8.0), generate the client and push the schema directly to Supabase:
```bash
npx prisma generate
npx prisma db push
```

### Step 4: Build and Start
```bash
npm run build
npm start
```
The application will run on `http://localhost:3000`.

---

## 2. Docker Deployment

EllipHire includes production-ready Docker configuration. The container packages the Next.js app, handles Prisma generation at build time, and runs the server.

> [!NOTE]
> PostgreSQL is intentionally omitted from the `docker-compose.yml` because the architecture relies on the external Supabase instance for database management, edge functions, and scalability.

### Docker Files Overview
- **`Dockerfile`**: A multi-stage build (deps -> builder -> runner) using `node:22-alpine` for an optimized, small footprint. It runs under a non-root `nextjs` user.
- **`docker-compose.yml`**: Configures the Next.js app service, maps port `3000:3000`, and dynamically loads environment variables via `env_file: .env`.
- **`.dockerignore`**: Excludes `node_modules`, `.next`, `.git`, and local env files to keep the Docker context minimal.

### Step 1: Build the Image
```bash
docker-compose build
```
This step will compile Next.js and generate the Prisma Client for the Linux Alpine architecture.

### Step 2: Run the Container
Start the application in detached mode:
```bash
docker-compose up -d
```

### Step 3: Stop the Container
To gracefully shut down the application:
```bash
docker-compose down
```

### Step 4: Rebuild After Changes
If you modify `package.json`, environment variables, or application code:
```bash
docker-compose up --build -d
```

---

## 3. Deployment via Vercel (Alternative)

Because EllipHire is a Next.js application, it can be deployed directly to Vercel with zero configuration.
1. Connect your GitHub repository to Vercel.
2. Add your Environment Variables in the Vercel Dashboard.
3. Vercel will automatically run `npm run build`. (Ensure your build script in `package.json` includes `prisma generate && next build`).
