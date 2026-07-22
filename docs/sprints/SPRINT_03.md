# Sprint 3: Question Management & Admin Panel

## Sprint Objective
Build question-bank management CRUD panels and student details index tables for administrator users.

## Features Implemented
* Creation form for new questions with branches, categories, time limit, and difficulty metadata.
* Questions list with dynamic filters and query pagination.
* Student details table showing USN, branch, college, completed tests, and performance averages.
* Initial admin statistics card layout.

## Folder/File Changes
* `[NEW]` [components/admin/questions-manager.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/admin/questions-manager.tsx)
* `[NEW]` [components/admin/students-viewer.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/admin/students-viewer.tsx)
* `[NEW]` [app/admin/dashboard/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/admin/dashboard/page.tsx)
* `[NEW]` [app/admin/questions/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/admin/questions/page.tsx)
* `[NEW]` [app/admin/students/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/admin/students/page.tsx)
* `[NEW]` [app/api/questions/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/questions/route.ts)
* `[NEW]` [app/api/admin/students/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/admin/students/route.ts)

## APIs Added or Modified
* `GET /api/questions` - Lists active/inactive questions.
* `POST /api/questions` - Creates a new question (restricted to admin).
* `GET /api/admin/students` - Returns student rosters with completion analytics.

## Database Changes
* Created index structures on `questions.branch_id` and `students.usn` tables.

## UI Changes
* Developed custom layouts for admin dashboards, student rosters, and question creation sheets.

## Testing Performed
* Validated RBAC constraints on admin endpoints.
* Verified questions filtering by category, branch, and state.

## Git Commit Summary
* `feat: questions management console, student index views, role security bounds`

## Sprint Outcome
* **Status**: Completed successfully.
