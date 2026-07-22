# Sprint 8: Student Response Tracking & Resume Test

## Sprint Objective
Enable candidate test state persistence, allowing applicants to resume tests dynamically.

## Features Implemented
* Question state persistence: records completed, unattempted, and flagged states.
* Test resuming: fetches prior saved responses and sets the timer to remaining duration.
* Database synchronization of student choices.

## Folder/File Changes
* `[MODIFY]` [components/test/test-interface.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/test/test-interface.tsx) (added initialization checks for existing responses and remaining seconds)
* `[MODIFY]` [app/api/tests/[id]/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/tests/%5Bid%5D/route.ts) (returns candidate progress details)

## APIs Added or Modified
* `GET /api/tests/[id]` - Returns current exam session state alongside previously submitted answers.

## Database Changes
* Verified constraints on `test_responses` composite unique index `(test_id, question_id)`.

## UI Changes
* Implemented progress navigation states showing saved answers (green) and current question (blue).

## Testing Performed
* Checked test reloading: closed the tab mid-exam, logged back in, and verified all prior options and exact remaining time loaded correctly.

## Git Commit Summary
* `feat: test state persistence, exam resuming, progress checkmarks`

## Sprint Outcome
* **Status**: Completed successfully.
