# Sprint 10: Final Polish, Production Readiness, & Secure RBAC

## Sprint Objective
Modify test evaluation visibility to reflect recruitment workflows, harden public registration against role injection, secure frontend routes via layout filters, and add super_admin creation control.

## Features Implemented
* **Recruitment Test Evaluation Workflow**: Student scores, correct answers, and feedback are masked until explicitly published by an administrator.
* **Student Dashboard Guard**: Hide test scores and View Results options.
* **Layout guards**: Restricted `/admin/*` views to authenticated administrators, and `/student/*` views to candidates.
* **Role Enforcement on registration**: Force `role = 'student'` on all public registration requests.
* **Super Admin account creation endpoint**: Secure route allowing super_admin to register new admin and super_admin accounts.

## Folder/File Changes
* `[NEW]` [app/api/admin/create-admin/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/admin/create-admin/route.ts)
* `[NEW]` [app/admin/evaluation/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/admin/evaluation/page.tsx)
* `[NEW]` [components/admin/evaluation-manager.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/admin/evaluation-manager.tsx)
* `[MODIFY]` [app/admin/layout.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/admin/layout.tsx) (integrated useAuth checking)
* `[MODIFY]` [app/student/layout.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/student/layout.tsx) (integrated useAuth checking)
* `[MODIFY]` [components/auth/register-form.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/auth/register-form.tsx) (removed role radio selection)
* `[MODIFY]` [app/api/auth/register/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/auth/register/route.ts) (force role student)

## APIs Added or Modified
* `POST /api/admin/create-admin` - Provision admin accounts (super_admin restricted).
* `GET /api/admin/evaluation` - Retrieve submissions index, branch performance stats, leaderboards.
* `POST /api/admin/evaluation` - Publish/unpublish scores to candidate portals.

## Database Changes
* Switched to single-instance prisma transactions for profile verification.

## UI Changes
* Developed Test Evaluation section containing rank listings, branch aggregations, filters, and inspector modals.

## Testing Performed
* Verified layout redirects: candidate accounts manually typing `/admin/dashboard` are cleanly redirected back to their `/student/dashboard`.
* Tested register API role injection attempts and confirmed they are successfully overridden to student.

## Git Commit Summary
* `feat: test publication flow, rbac layout guards, super admin endpoint`

## Sprint Outcome
* **Status**: Completed successfully.
