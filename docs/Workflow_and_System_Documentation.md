# EllipHire - Workflow and System Documentation

This document outlines the high-level workflows that govern how users interact with EllipHire and how the underlying systems process those interactions.

## 1. Student Workflow

The student journey is designed to be seamless, secure, and focused on taking assigned assessments.

```mermaid
graph TD
    A[Registration/Login] --> B[Dashboard]
    B --> C{Profile Complete?}
    C -->|No| D[Update Profile details & permissions]
    C -->|Yes| E[View Assigned Assessments]
    D --> E
    E --> F[Start Assessment]
    F --> G[Proctored Test Environment]
    G --> H[Submit Answers / Auto-submit on Timer End]
    H --> I[AI Evaluation Pipeline Triggered]
    I --> J[Admin Review & Result Generation]
```

- **Proctoring**: During the test, EllipHire logs events like window blurring, tab switching, and missing camera feeds. These are stored in the `violations` table for Admin review.

## 2. Admin Workflow

The Admin journey revolves around managing question banks, orchestrating assessments, and reviewing AI-generated results.

```mermaid
graph TD
    A[Admin Login] --> B[Admin Dashboard]
    B --> C[Question Bank Management]
    C --> D[Create Question Manually]
    C --> E[Bulk Import via Excel Template]
    B --> F[Assessment Creation]
    F --> G[Generate Test Template]
    G --> H[Publish to Students]
    H --> I[Monitor Live Tests & Violations]
    I --> J[Review Evaluated Results]
    J --> K[Export Scores to Excel/CSV]
```

- **Question Bank Management**: Admins have full CRUD operations over MCQs, Coding, and Text questions. The Excel import flow automatically handles duplicates by cross-referencing identical question texts in the `questions` table.

## 3. AI Evaluation Workflow

The evaluation pipeline is the core intelligence of EllipHire. It processes submissions synchronously or asynchronously based on load and configuration.

```mermaid
sequenceDiagram
    participant S as Student
    participant API as Next.js API
    participant DB as Prisma (Supabase)
    participant Piston as Piston Code API
    participant OpenAI as OpenAI API

    S->>API: Submits Test (Coding/Text answers)
    API->>DB: Save raw answers (is_correct: false temporarily)
    
    API->>Piston: Send Source Code + Test Cases (if Coding)
    Piston-->>API: Execution Result (Pass/Fail)
    
    API->>OpenAI: Send Answer + Rubric (if Open Text)
    OpenAI-->>API: JSON {score, feedback, strengths}
    
    API->>DB: Update TestResponse with ai_evaluation_json
    API->>DB: Aggregate final Test score
    API-->>S: "Submission Successful"
```

- **Worker Processes**: For high scalability, evaluations can be offloaded to a background worker (`worker.ts`) using a Redis queue (BullMQ), though standard deployments process them via standard Next.js route handlers.

## 4. Docker Architecture Workflow

For production environments, EllipHire is containerized.

- **Build Phase**: The `Dockerfile` compiles Next.js into a standalone/production bundle and generates the Prisma Client against the Alpine linux architecture.
- **Run Phase**: `docker-compose up` runs the `elliphire-app` container exposing port 3000. It reads the `.env` file from the host.
- **Supabase**: The container does not host a database. It simply connects to the external Supabase instance over TCP/SSL using connection strings defined in the injected environment variables.
