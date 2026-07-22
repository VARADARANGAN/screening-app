# Sprint 6: File Bulk Upload & CSV Parser

## Sprint Objective
Integrate bulk questions upload capabilities supporting PDF parsing, Excel (`.xlsx`), and CSV parsing.

## Features Implemented
* Excel and CSV file parsers using standard file processing libraries.
* File Upload UI Modal in Question Manager.
* Integration of pagination support schema.
* PDF questions extraction utility.

## Folder/File Changes
* `[NEW]` [app/api/questions/parse-pdf/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/questions/parse-pdf/route.ts)
* `[NEW]` [app/api/questions/bulk/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/questions/bulk/route.ts)
* `[MODIFY]` [components/admin/questions-manager.tsx](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/components/admin/questions-manager.tsx) (added bulk upload modal)

## APIs Added or Modified
* `POST /api/questions/parse-pdf` - Extract question blocks from PDF.
* `POST /api/questions/bulk` - Batch-insert question sheets into database.

## Database Changes
* None.

## UI Changes
* Integrated a modal inside `QuestionsManager` that handles file drops, checks extensions, and handles branch mapping.

## Testing Performed
* Checked file schema validations (missing correct answers, empty headers, etc.).
* Verified bulk insertion of 100+ questions simultaneously.

## Git Commit Summary
* `feat: bulk file uploads, csv parser, pdf questions extraction`

## Sprint Outcome
* **Status**: Completed successfully.
