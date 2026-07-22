# API Reference - Aptitude Screening Portal

## Base URL
```
http://localhost:3000  (development)
https://your-domain.com (production)
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional error details */ }
  }
}
```

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error
- `503` - Service Unavailable (database down)

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user (student or admin)

**Request**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "student"  // or "admin"
}
```

**Parameters**
- `email` (string, required): Valid email address
- `password` (string, required): Min 8 characters
- `confirmPassword` (string, required): Must match password
- `role` (enum, required): "student" or "admin"

**Response (201)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**Error Cases**
- `400` - Validation failed (invalid email, short password, etc.)
- `409` - User already exists with that email

**Example**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "role": "student"
  }'
```

---

### POST /api/auth/login
Login with email and password

**Request**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Parameters**
- `email` (string, required): Email address
- `password` (string, required): Password

**Response (200)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "student@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Cases**
- `400` - Validation failed
- `401` - Invalid email or password

**Example**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!"
  }'
```

---

### POST /api/auth/logout
Logout current user (clears authentication cookie)

**Request**
```bash
POST /api/auth/logout
```

**Response (200)**
```json
{
  "success": true,
  "data": {},
  "message": "Logged out successfully"
}
```

**Example**
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

---

## System Endpoints

### GET /api/health
Check API and database health status

**Request**
```bash
GET /api/health
```

**Response (200 - Healthy)**
```json
{
  "status": "ok",
  "timestamp": "2025-07-20T10:30:00.000Z",
  "database": "connected"
}
```

**Response (503 - Unhealthy)**
```json
{
  "status": "error",
  "timestamp": "2025-07-20T10:30:00.000Z",
  "database": "disconnected"
}
```

**Example**
```bash
curl http://localhost:3000/api/health
```

---

## Authentication

### Bearer Token Authentication
Include JWT token in Authorization header:

```bash
Authorization: Bearer <token>
```

**Example**
```bash
curl -X GET http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Cookie Authentication
Token is automatically stored in HTTP-only cookie after login/register:

```bash
Set-Cookie: auth_token=<token>; HttpOnly; Secure; SameSite=Strict
```

The browser automatically includes this in subsequent requests.

---

## Common Error Responses

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email format"],
        "password": ["Password must be at least 8 characters"]
      }
    }
  }
}
```

### Unauthorized Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Forbidden Error
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### Not Found Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Conflict Error
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "User with this email already exists"
  }
}
```

### Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "details": "Error message details"
  }
}
```

---

## Rate Limiting

Currently implemented:
- Default: 100 requests per minute per IP
- Applies to all endpoints
- Returns `429 Too Many Requests` when limit exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests"
  }
}
```

---

## CORS

Allowed:
- **Origin**: `http://localhost:3000` (dev), configured in production
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: Included

---

## Testing with Postman

### 1. Create Environment
```json
{
  "baseUrl": "http://localhost:3000",
  "token": ""
}
```

### 2. Register Request
```
POST {{baseUrl}}/api/auth/register

Body (raw JSON):
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "confirmPassword": "TestPass123!",
  "role": "student"
}

Tests:
pm.globals.set("token", pm.response.json().data.token);
```

### 3. Login Request
```
POST {{baseUrl}}/api/auth/login

Body (raw JSON):
{
  "email": "test@example.com",
  "password": "TestPass123!"
}

Tests:
pm.globals.set("token", pm.response.json().data.token);
```

### 4. Protected Endpoint (Future)
```
GET {{baseUrl}}/api/students/profile

Headers:
Authorization: Bearer {{token}}
```

### 5. Health Check
```
GET {{baseUrl}}/api/health
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "role": "student"
  }' | jq .
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' | jq '.data.token'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

### Health Check
```bash
curl http://localhost:3000/api/health | jq .
```

### With Bearer Token
```bash
TOKEN="<your-jwt-token>"

curl -X GET http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Validation Rules

### Email
- Valid email format (RFC 5322)
- Unique in system
- Case-insensitive

### Password
- Minimum 8 characters
- Can contain: letters, numbers, special characters
- No length maximum

### Role
- "student" - Student account
- "admin" - Administrator account
- Default: "student"

---

## Environment Variables

Required for API endpoints:
```
JWT_SECRET=<32+ char secret>
DATABASE_URL=postgresql://...
BCRYPT_ROUNDS=10
```

Optional:
```
JUDGE0_API_KEY=<key>
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| USER_EXISTS | 409 | Email already registered |
| INVALID_TOKEN | 401 | Token is invalid/expired |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Server error |
| RATE_LIMITED | 429 | Too many requests |

---

## API Versioning

Current version: **v1** (implicit)

Future versions:
- `/api/v2/...` - New endpoints with breaking changes
- `/api/v1/...` - Maintained for backward compatibility

---

## Pagination (Future)

Planned for GET list endpoints:

```json
{
  "success": true,
  "data": [
    { /* items */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

Query parameters:
- `page`: Current page (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Column to sort by
- `sortOrder`: "asc" or "desc"

---

## Webhooks (Future)

Planned events:
- `test.started`
- `test.completed`
- `test.submitted`
- `violation.detected`
- `score.calculated`

---

## Rate Limits (Future)

Planned rate limiting:

| Endpoint | Limit |
|----------|-------|
| /api/auth/register | 5/hour |
| /api/auth/login | 10/hour |
| General endpoints | 1000/hour |
| File uploads | 100/hour |

---

## Support & Documentation

- **Setup Guide**: See `SETUP.md`
- **Sprint 1 Docs**: See `SPRINT1.md`
- **Type Definitions**: See `types/index.ts`
- **Validation Schemas**: See `lib/validators.ts`

---

**Last Updated**: July 20, 2025  
**API Version**: v1 (Sprint 1)  
**Status**: Complete ✅
