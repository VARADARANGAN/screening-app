# Sprint 7: Admin Analytics Dashboard

## Sprint Objective
Build aggregated recruiters analytics dashboards containing branch stats and cheat metrics.

## Features Implemented
* Complete recruiter overview: total applicants, tests taken, average score, and active violations.
* Visual breakdowns of test metrics by student branch.
* Distribution statistics.

## Folder/File Changes
* `[NEW]` [components/admin/dashboard.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/admin/dashboard.tsx)
* `[NEW]` [app/api/admin/analytics/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/admin/analytics/route.ts)

## APIs Added or Modified
* `GET /api/admin/analytics` - Returns complete dashboard analytics datasets (filtered to admins).

## Database Changes
* None (uses calculations over students, tests, violations, and branches).

## UI Changes
* Developed a responsive admin console with metric cards, grid layouts, and charts.

## Testing Performed
* Checked calculation times for database joins (averaging results across multiple tables).
* Tested authorization bounds (403 returned on student JWT).

## Git Commit Summary
* `feat: admin analytics charts, metrics breakdown, secure role routing`

## Sprint Outcome
* **Status**: Completed successfully.
