# Sprint 2: Student Profile & Authentication UI

## Sprint Objective
Build frontend authentication flows and candidate profile creation workflows.

## Features Implemented
* Candidate profile collection form (Name, USN, college, phone, branch).
* JWT authentication state context.
* Login & Register UI layout.
* Verification of browser media permissions (Microphone/Camera) for secure testing.

## Folder/File Changes
* `[NEW]` [context/auth-context.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/context/auth-context.tsx)
* `[NEW]` [components/auth/login-form.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/auth/login-form.tsx)
* `[NEW]` [components/auth/register-form.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/auth/register-form.tsx)
* `[NEW]` [components/student/profile-form.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/student/profile-form.tsx)
* `[NEW]` [app/auth/login/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/auth/login/page.tsx)
* `[NEW]` [app/auth/register/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/auth/register/page.tsx)
* `[NEW]` [app/student/profile/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/student/profile/page.tsx)
* `[NEW]` [app/api/auth/verify/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/auth/verify/route.ts)
* `[NEW]` [app/api/students/profile/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/students/profile/route.ts)

## APIs Added or Modified
* `GET /api/auth/verify` - Validates bearer JWT access token.
* `GET /api/students/profile` - Fetches the student details.
* `POST /api/students/profile` - Creates/updates the student details.

## Database Changes
* None (utilized existing `students` profile structure).

## UI Changes
* Created a clean login page and signup form with validations.
* Built dynamic profile input layout that queries branch options and requests camera/microphone permissions.

## Testing Performed
* Verified state synchronization within React's Context.
* Tested permission capture popups inside multiple browsers.

## Git Commit Summary
* `feat: login and registration flows, profile creation view, media constraints checks`

## Sprint Outcome
* **Status**: Completed successfully.
