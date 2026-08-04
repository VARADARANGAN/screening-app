# EllipHire - Project Overview

## Business Objective
**EllipHire** is designed to completely digitize, streamline, and scale the recruitment and candidate screening process for organizations. By replacing manual tests and subjective evaluations with an automated, AI-driven assessment engine, EllipHire dramatically reduces time-to-hire while maintaining high standards of candidate quality.

## Problem Statement
Traditional screening methods involve distributing PDFs/Forms, manually collecting responses, and having engineers or recruiters spend countless hours manually grading code and essays. This is prone to bias, highly unscalable, and susceptible to rampant cheating by candidates using external resources.

## Solution Overview
EllipHire solves this by providing a unified, secure, and automated testing environment. 
1. Admins can bulk-import thousands of questions via Excel.
2. Students take proctored tests that monitor tab switches, window blurs, and camera activity.
3. Submissions are instantly evaluated by an AI Pipeline (using OpenAI for semantic text analysis and Piston API for secure code execution).
4. Results are automatically aggregated, ranked by percentile, and exported for final recruitment decisions.

## Modules

### 1. User Authentication & Authorization
- **JWT-based authentication** ensuring secure sessions.
- **Role-based Access Control (RBAC)** distinguishing between Students, Admins, and Super Admins.

### 2. Dashboard & Analytics
- **Admin Dashboard**: Offers macro-level stats (Total Students, Tests Taken, Average Score).
- **Student Dashboard**: Tracks pending assessments, completed test histories, and profile completion status.

### 3. Question Bank Management
- **Manual Creation**: GUI to create MCQs, Coding, Open Text, and Structured Response questions.
- **Excel Import**: Support for downloading standardized Excel templates and uploading bulk questions with automatic duplicate detection.

### 4. Assessment Engine
- Real-time timer and auto-submission upon expiration.
- Anti-cheat proctoring logging violations (`tab_switch`, `window_blur`, `camera_off`, etc.).

### 5. AI Evaluation Pipeline
- **Coding Evaluation**: Compiles and executes code via Judge0/Piston API, checking against hidden test cases.
- **Open Text Evaluation**: Passes candidate answers and expected rubrics to an LLM (OpenAI) for semantic scoring and feedback generation.

## User Roles
1. **Student / Candidate**: Takes tests, views past attempt histories (if allowed), updates profile.
2. **Admin**: Manages the question bank, creates test templates, reviews AI-evaluated results, and exports scores.
3. **Super Admin**: System owner, manages other Admins and oversees platform configurations.

## Technology Stack
- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, BullMQ (optional background jobs)
- **Database**: PostgreSQL hosted on Supabase
- **ORM**: Prisma v7.8.0
- **AI Integrations**: OpenAI, Piston API / Judge0
- **Deployment**: Docker, Vercel
