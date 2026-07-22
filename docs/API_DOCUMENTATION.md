# API Documentation Manual

This manual provides details for the backend API endpoints exposed by the Aptitude Screening Portal.

## Authentication Endpoints

### 1. `POST /api/auth/register`
Creates candidate Student accounts.
* **Payload**:
  ```json
  {
    "email": "student@college.edu",
    "password": "mypassword123",
    "confirmPassword": "mypassword123"
  }
  ```
* **Response**: `201 Created`
* *Note: Server enforces the `student` role on all registrations.*

### 2. `POST /api/auth/login`
Authenticates users and returns a JWT access token.
* **Payload**:
  ```json
  {
    "email": "user@portal.com",
    "password": "mypassword123"
  }
  ```
* **Response**: `200 OK` (token returned in cookies & data payload).

### 3. `GET /api/auth/verify`
Checks token validity and returns role context.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response**: `200 OK`

---

## Student Profile Endpoints

### 1. `GET /api/students/profile`
Fetches candidate profiles.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### 2. `POST /api/students/profile`
Updates profile properties.
* **Payload**: Full name, USN, college, branchId.

---

## Test Management Endpoints

### 1. `GET /api/tests`
Retrieves tests assigned to the logged-in student.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* *Note: Masked scores if `results_published` is false.*

### 2. `GET /api/tests/[id]`
Gets test details.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* *Note: Masked correct answers and score for student requests if not published.*

### 3. `POST /api/tests/[id]/auto-save`
Auto-saves an answer during test-taking.
* **Payload**: `questionId`, `answer`.

### 4. `POST /api/tests/[id]/submit`
Submits completed test, calculates scores, and logs violations.

---

## Administrative Endpoints

### 1. `POST /api/admin/create-admin` (Super Admin Only)
Allows creation of new admin or super_admin accounts.
* **Headers**: `Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>`
* **Payload**: `email`, `password`, `role`, `fullName`, `department`.

### 2. `GET /api/admin/evaluation` (Admin Only)
Returns lists of student tests, leaderboards, and branch average metrics.

### 3. `POST /api/admin/evaluation` (Admin Only)
Publishes/unpublishes test results globally, by branch, or by specific test IDs.
* **Payload**:
  ```json
  {
    "testIds": ["uuid-1", "uuid-2"],
    "publish": true
  }
  ```
