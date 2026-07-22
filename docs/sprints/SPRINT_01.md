# Sprint 1: Project Initialization & Backend Foundation

## Sprint Objective
Establish core infrastructure, environment configuration, database structure, and base API wrappers following strict SOP standards.

## Features Implemented
* Environment Variable configurations (`.env.example`, `.env.local`).
* Centralized API response formats (`lib/api-response.ts`).
* JWT authentication helpers and password hashing configs (`lib/auth.ts`).
* Base input validation Zod schemas (`lib/validators.ts`).
* Initial authentication endpoint setup (register, login, logout, health).

## Folder/File Changes
* `[NEW]` [lib/db.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/lib/db.ts)
* `[NEW]` [lib/auth.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/lib/auth.ts)
* `[NEW]` [lib/validators.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/lib/validators.ts)
* `[NEW]` [lib/api-response.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/lib/api-response.ts)
* `[NEW]` [app/api/auth/register/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/auth/register/route.ts)
* `[NEW]` [app/api/auth/login/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/auth/login/route.ts)
* `[NEW]` [app/api/auth/logout/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/auth/logout/route.ts)
* `[NEW]` [app/api/health/route.ts](file:///c:/Users/R%20P%20Varada%20Rangan/Downloads/screening-app/app/api/health/route.ts)

## APIs Added or Modified
* `POST /api/auth/register` - Registers candidate accounts.
* `POST /api/auth/login` - Authenticates credentials.
* `POST /api/auth/logout` - Clear cookie data.
* `GET /api/health` - Check PostgreSQL connectivity.

## Database Changes
* Initialized 10 normalized tables. Refer to `schema/init.sql` schema definitions.

## UI Changes
* None (Sprint 1 focused entirely on backend/infrastructure).

## Testing Performed
* Manual API verification via `curl` triggers.
* Health check verified database connection pool availability.

## Git Commit Summary
* `feat: project initialization, baseline core modules, config setups`

## Sprint Outcome
* **Status**: Completed successfully.
