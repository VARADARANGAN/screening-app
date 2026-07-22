# Project Overview

The **Aptitude Screening Portal** is a production-grade, full-stack recruitment testing application designed to evaluate candidate aptitude securely, efficiently, and at scale.

## Core Objectives

1. **Secure Evaluation:** Prevent cheating during examinations using comprehensive anti-cheat hooks.
2. **Robust Grading:** Automate MCQ test scoring and response storage in real-time.
3. **Campus Recruitment Flow:** Protect applicant results and scores from public or student access until explicitly published by an administrator.
4. **Actionable Analytics:** Provide recruiters with branch-wise metrics, individual scorecards, leaderboards, and violation counts to evaluate top talent.

## Main Modules & Features

### 1. Authentication & Role-Based Access Control (RBAC)
* Public signup is strictly limited to candidate students.
* Admins are securely provisioned via database seed scripts or manually added by existing `super_admin` accounts.
* All routes, layouts, and API endpoints are guarded by strict role-based access checks (Student vs. Admin vs. Super Admin).

### 2. Candidate Test Interface
* Focus-monitoring anti-cheat systems: Tracks tab switches, disables copy-paste, and disables right-clicking with real-time logs.
* Debounced auto-save function (1-2s delay) that ensures answer persistence even in the event of connectivity drops or power disruptions.
* Auto-submission once the allocated test duration expires.

### 3. Administrative Dashboard
* Full CRUD interface to manage aptitude questions, categorized by branch/division, tags, and marks.
* Bulk questions upload supporting Excel (`.xlsx`) and CSV parsing.
* Performance ranking boards showing rankings, scores, and violation alerts.
* Test inspection page enabling deep-dive evaluation of student options, question-by-question scoring, and time boundaries.
