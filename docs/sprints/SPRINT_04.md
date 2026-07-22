# Sprint 4: Test Interface & Timer System

## Sprint Objective
Build candidate-facing dashboard layouts and real-time test-taking page interfaces.

## Features Implemented
* Dynamic student homepage rendering assigned tests, status, duration, and actions (Start/Resume).
* Test taking page with question list sidebar navigator, timer, and question inputs.
* Support for MCQ, True/False, Essay, and Coding inputs.
* Submitting responses to backend database tables.

## Folder/File Changes
* `[NEW]` [components/test/test-interface.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/test/test-interface.tsx)
* `[NEW]` [components/student/dashboard.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/student/dashboard.tsx)
* `[NEW]` [app/student/dashboard/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/student/dashboard/page.tsx)
* `[NEW]` [app/student/test/[id]/page.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/student/test/%5Bid%5D/page.tsx)
* `[NEW]` [app/api/tests/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/tests/route.ts)
* `[NEW]` [app/api/tests/[id]/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/tests/%5Bid%5D/route.ts)
* `[NEW]` [app/api/tests/[id]/submit/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/tests/%5Bid%5D/submit/route.ts)

## APIs Added or Modified
* `GET /api/tests` - Returns assigned test sheets for logged-in student.
* `GET /api/tests/[id]` - Returns question payloads and options.
* `POST /api/tests` - Allows admin to allocate tests to students.
* `POST /api/tests/[id]/submit` - Records final submission, computes grades, logs end timestamps.

## Database Changes
* None (utilized tests, test_questions, test_responses structure).

## UI Changes
* Created a responsive exam interface layout containing a question navigator map, header timer, and input fields.
* Integrated student homepage lists.

## Testing Performed
* Checked countdown execution accuracy.
* Verified that auto-submit executes correctly upon timer expiration.

## Git Commit Summary
* `feat: test dashboard listing, candidate exam views, timer synchronization`

## Sprint Outcome
* **Status**: Completed successfully.
