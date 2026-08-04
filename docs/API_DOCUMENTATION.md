# EllipHire - API Documentation

The EllipHire backend is built using Next.js App Router API Routes (`app/api/*`). All endpoints (except public ones like login/register) require a Bearer token in the `Authorization` header.

## 1. Authentication APIs

### `POST /api/auth/register`
- **Description**: Registers a new Student user.
- **Request Body**: `email`, `password`, `fullName`, `usn`, `college`, `branch`
- **Response**: `{ user, token }`

### `POST /api/auth/login`
- **Description**: Authenticates a User (Student or Admin).
- **Request Body**: `email`, `password`
- **Response**: `{ user, token }`

### `GET /api/auth/me`
- **Description**: Fetches the currently authenticated user's profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ id, email, role, ...profileDetails }`

---

## 2. Student APIs

### `GET /api/students/[id]`
- **Description**: Fetch specific student details and their test history.
- **Access**: Admin / Super Admin (or the student themselves).
- **Response**: Student Object + `tests` array.

### `PUT /api/students/[id]`
- **Description**: Updates student profile (e.g., agreeing to camera/mic permissions).
- **Request Body**: `camera_permission`, `microphone_permission`, `phone`
- **Response**: Updated Student Object.

---

## 3. Question Bank APIs

### `GET /api/questions`
- **Description**: Fetches paginated questions. Supports filtering by difficulty, type, and branch.
- **Access**: Admin.
- **Response**: `{ data: [...], total, page, limit }`

### `POST /api/questions`
- **Description**: Creates a single new question (MCQ, Coding, Open Text, etc.).
- **Access**: Admin.
- **Request Body**: Question Object.
- **Response**: Created Question Object.

### `POST /api/questions/import`
- **Description**: Bulk imports questions from an Excel (`.xlsx` / `.csv`) file.
- **Access**: Admin.
- **Request Body**: `FormData` containing the file.
- **Response**: `{ successCount, duplicateCount, errorCount, errors: [...] }`

---

## 4. Test APIs

### `GET /api/tests`
- **Description**: Fetch assigned or pending tests for a student.
- **Access**: Student.
- **Response**: Array of Tests.

### `POST /api/tests`
- **Description**: Admin creates a new Test for a student or generates a Template.
- **Access**: Admin.
- **Request Body**: `studentId`, `templateId`, `duration`
- **Response**: Created Test Object.

### `POST /api/tests/[id]/submit`
- **Description**: Submits the completed test.
- **Access**: Student.
- **Request Body**: Array of `responses` and `violations`.
- **Response**: `{ message: 'Test submitted successfully', evalJobId }`

---

## 5. AI Evaluation APIs

### `POST /api/tests/[id]/eval`
- **Description**: Triggers the AI Evaluation pipeline for unstructured questions (Coding, Open Text).
- **Access**: Internal / Worker.
- **Process**: 
  1. Compiles/Runs code via **Piston API**.
  2. Sends text to **OpenAI API** with grading rubrics.
  3. Updates `TestResponse` with detailed JSON feedback.

---

## 6. Admin Analytics APIs

### `GET /api/admin/dashboard`
- **Description**: Aggregated statistics for the admin overview.
- **Access**: Admin.
- **Response**: `{ totalStudents, totalTests, averageScore, ... }`

### `GET /api/admin/export`
- **Description**: Exports a consolidated CSV/Excel file of student rankings and scores.
- **Access**: Admin.
- **Response**: Downloadable `.xlsx` binary stream.
