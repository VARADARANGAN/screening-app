# Sprint 5: Anti-Cheating & Auto-Save Integrations

## Sprint Objective
Integrate real-time answer auto-saving and active candidate browser monitoring to log cheating attempts.

## Features Implemented
* **Tab Switch Hooks**: Capture visibility events and log cheating attempts whenever the candidate switches tabs.
* **Right-Click Restriction**: Blocks browser context menu triggers.
* **Copy/Paste Blockers**: Prevents candidate from copying question texts.
* **Warning Dialogs**: Renders warning modals on cheating detection.
* **Background Auto-Save**: Automatically pushes answers asynchronously to database tables.

## Folder/File Changes
* `[MODIFY]` [components/test/test-interface.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/test/test-interface.tsx) (integrated event listeners and auto-save api calls)
* `[NEW]` [app/api/tests/[id]/auto-save/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/tests/%5Bid%5D/auto-save/route.ts)

## APIs Added or Modified
* `POST /api/tests/[id]/auto-save` - Upserts answer to database (uses ON CONFLICT update logic).

## Database Changes
* Created index structures on `test_responses.test_id` and `violations.test_id` tables.

## UI Changes
* Added warning modals that display on violations detection.
* Implemented checkmarks to show which questions are saved to the backend.

## Testing Performed
* Checked debounced triggers on keypresses and option choices.
* Tested tab switching, right clicks, and copying inside Chrome, Safari, and Firefox.

## Git Commit Summary
* `feat: anti-cheating browser listeners, auto-save triggers, violation logs`

## Sprint Outcome
* **Status**: Completed successfully.
