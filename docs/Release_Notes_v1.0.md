# EllipHire - Release Notes (v1.0.0)

We are thrilled to announce the official **v1.0.0** release of **EllipHire** (formerly known as CampusScreen / Screening Portal). 
This release marks the transition from a beta prototype into a production-ready, highly scalable, AI-powered smart assessment platform.

## 🚀 Key Features

### 1. AI-Powered Evaluation
- **Automated Code Execution**: Coding submissions are now automatically compiled and run against hidden test cases using the Piston API.
- **Semantic Text Scoring**: Open-ended text responses are evaluated by OpenAI, generating nuanced scores, actionable feedback, strengths, and areas for improvement based on Admin-defined rubrics.

### 2. Comprehensive Question Bank & Assessment Engine
- **Excel Bulk Import**: Admins can now download standardized Excel templates and bulk import thousands of questions in seconds.
- **Duplicate Detection**: The system intelligently flags duplicate question text to prevent overlapping questions.
- **Dynamic Test Generation**: Admins can dynamically select question counts and durations, automatically compiling assessments for students.

### 3. Advanced Anti-Cheat Proctoring
- Real-time tracking of tab switches, window blurs, copy-pasting attempts, and right-clicks.
- Configurable camera and microphone permissions before test start.
- Violations are automatically flagged as `warning` or `critical` and permanently logged for Admin review.

### 4. Re-imagined Dashboards
- **Admin Dashboard**: New macro-level analytics view, test publishing controls, and a fully functional Question Bank UI.
- **Student Dashboard**: Clean, distraction-free environment for taking live assessments and viewing past performances.

### 5. Export & Reporting
- Detailed analytics can be exported to Excel/CSV with a single click.
- Percentile rankings are automatically calculated across student cohorts.

## 🛠️ Deployment & Infrastructure (Docker Support)
- **Production Containerization**: EllipHire is now fully Dockerized.
- Multi-stage builds dramatically reduce the container footprint, running a secure non-root `nextjs` user.
- **Supabase Integration**: Decoupled database architecture ensures the Docker container acts statelessly while PostgreSQL handles heavy data loads.

## 🧹 Code Quality & Refactoring
- **Project Cleanup**: Over 2,000 lines of dead code, obsolete schema elements, and unused packages (e.g., `ioredis`, `shadcn` via depcheck) were purged.
- **Prisma 7.8.0**: Upgraded Prisma configuration to support dynamic external data URLs natively via `prisma.config.ts`.
- Reorganized `types/index.ts` to only export actively utilized TypeScript interfaces.

## ⚠️ Known Limitations
- The current Docker setup relies entirely on an external Supabase instance; local self-hosted PostgreSQL is not supported out of the box in `docker-compose.yml`.
- Real-time video/audio streaming (WebRTC proctoring) is planned but currently logs only local events.

## 🗺️ Roadmap for v1.1.0
- External ATS integrations (e.g., Workday, Greenhouse).
- Deep learning-based anomaly detection for proctoring feeds.
- Expanded language support for coding questions (Rust, Go, C#).
