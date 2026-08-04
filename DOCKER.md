# EllipHire Docker Configuration

This document outlines how to build and run the EllipHire application using Docker. The Docker setup is optimized for production and uses your existing `.env` file to connect to external services (like the Supabase PostgreSQL database).

## Prerequisites

- Docker and Docker Compose installed on your system.
- A `.env` file in the root directory containing all necessary environment variables:
  - `DATABASE_URL` (Pointing to Supabase)
  - `JWT_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - etc.

## Getting Started

### 1. Build the Docker Image

To build the Docker image, run the following command in the root directory:

```bash
docker-compose build
```

This will create a multi-stage Docker image using Node.js 22 Alpine, install dependencies, generate the Prisma Client, and build the Next.js application.

### 2. Run the Application

To start the application in detached mode, run:

```bash
docker-compose up -d
```

The application will be accessible at `http://localhost:3000`.

### 3. Stop the Application

To stop the running container:

```bash
docker-compose down
```

### 4. Rebuild the Image

If you make any changes to the source code or `package.json`, you will need to rebuild the image before running it again:

```bash
docker-compose up --build -d
```

## Troubleshooting

- **Database Connection Issues:** Ensure your `DATABASE_URL` in the `.env` file is correct and accessible from within a Docker container.
- **Missing Environment Variables:** Ensure all required secrets are present in `.env`. Docker Compose automatically loads them into the container via the `env_file` directive.
- **Build Errors:** If `npx prisma generate` fails, check if the architecture of the container matches Prisma's expectations. The Alpine image uses `musl` libc, which Prisma handles gracefully with the `linux-musl` target.
