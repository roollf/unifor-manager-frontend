# Frontend Contract
## Academic Course Registration System

**Purpose:** This document is the single source of truth for a downstream agent that will create **PRD.md** and **ARCHITECTURE.md** in the frontend repository. It derives from the backend PRD and ARCHITECTURE and is written for frontend consumption. The frontend **must** use the stack and technical requirements defined in Section 2.5.

**Portability:** This contract is intended to live in the **frontend** project (possibly in a different repo from the API). The backend documentation lives in the API repository: [https://github.com/roollf/unifor-manager](https://github.com/roollf/unifor-manager). Backend OpenAPI: when the API is running, `GET {baseUrl}/q/openapi` and Swagger UI at `{baseUrl}/q/swagger-ui`.

---

## 1. How to Use This Contract

**For the agent generating frontend PRD and ARCHITECTURE:**

1. **Generate PRD.md** for the frontend repo:
   - Product overview, actors, and user flows from Section 2.
   - Business rules that affect the UI (Section 3), phrased as acceptance criteria where appropriate (e.g. "Coordinator can filter classes by period of day").
   - Keep terminology and rule IDs (e.g. EN-01, CR-01) consistent with this contract so traceability to the backend PRD is preserved.

2. **Generate ARCHITECTURE.md** for the frontend repo:
   - Use the **required stack** (Section 2.5) and the **Frontend Architecture Guidance** (Section 5) — Angular, Nx, PrimeNG, RxJS, route protection, modular structure.
   - Do not substitute other frameworks or UI libraries; the stack is fixed.

3. Do not invent new endpoints or payload shapes; use the API contract (Section 4) as the source of truth. The backend implementation uses **Long** for all IDs and **ISO-8601** (or time strings) for timestamps.

---

## 2. Product Overview

### 2.1 System

**Name:** Academic Course Registration System (unifor-manager).

**Description:** Web application where **coordinators** create and manage curriculum matrices (sets of classes offered in a semester) and **students** view their enrollments and enroll in classes. Authentication and authorization are handled via Keycloak. The backend enforces academic rules (seat limits, course restrictions, schedule conflicts) and role-based access.

### 2.2 Actors

| Actor | Description | UI capabilities |
|-------|-------------|-----------------|
| **Coordinator** | Manages curriculum matrices and their classes. | Login; list/create matrices; list/add/edit/soft-delete classes (with filters); activate a matrix. |
| **Student** | Views enrollments and enrolls in classes. | Login; view my enrollments; browse available classes (optional filters); enroll in a class (with validation feedback). |

### 2.3 Main User Flows (UI-oriented)

**Coordinator flow:**  
Login (Keycloak) → List my matrices → (Optional) Create matrix → Select matrix → List classes (with filters: period of day, authorized course, max students range, include deleted) → Add class / Edit class / Soft-delete class (when no enrollments) → (Optional) Activate matrix.

**Student flow:**  
Login (Keycloak) → View my enrollments → Browse available classes (optional: filter by matrix, subject) → Enroll in a class → See success or error (no seats, schedule conflict, duplicate subject, not authorized for course, etc.).

### 2.4 Out-of-Scope / Resolved

- **Unenroll:** Not in scope; students cannot drop a class.
- **Matrix soft delete:** Not specified in backend; contract does not define behavior.
- **Edit restrictions:** After a class is created, **subject** and **maxStudents** are not editable (ED-02).
- **Active matrix:** At most one matrix has `active = true`; students enroll only in classes belonging to the active matrix.

### 2.5 Frontend Stack and Technical Requirements (Mandatory)

**Required stack**

| Item | Requirement |
|------|--------------|
| Framework | **Angular** (version 18 or higher) |
| Routing | Project structured with **Angular Router** |
| Route protection | **Route guards** (e.g. auth guard, role guard) to protect coordinator/student routes |
| Styling | **CSS** (no other styling framework required) |
| Monorepo / structure | **Nx** for workspace and build management |
| Reactive programming | **RxJS** (observables, streams, operators) |
| UI components | **PrimeNG** for components (tables, forms, dialogs, etc.) |

**Technical requirements**

- **API:** Communication with the backend via **REST** (e.g. Angular `HttpClient`); base URL configurable (environment).
- **Modular organization:** Use **Nx** structure with **libs** and **apps** (e.g. app for the shell, libs for feature modules, shared data/auth).
- **RxJS:** Use **observables**, **streams**, and **operators** appropriately (e.g. services returning `Observable<T>`, `switchMap`/`catchError` for HTTP, async pipe in templates).
- **UI:** **Functional interface**; advanced visual design is not required — focus on correctness and usability with PrimeNG and CSS.

---

## 3. Business Rules (UI-Relevant)

### 3.1 Access Control

- **AC-01:** Coordinator sees only curriculum matrices they created.
- **AC-03:** Student sees only their own enrollments.
- **AC-05:** User ↔ Keycloak mapping is by email.

All API calls are role-scoped; the backend returns 403 when the authenticated user does not own the resource or does not have the required role.

### 3.2 Validation and Conflict Rules (UI should handle or display)

- **Seat limit:** Enrollment fails (409) when no seats available (EN-02).
- **Schedule conflict:** Enrollment fails (409) when the class overlaps with an already enrolled class (EN-03).
- **Duplicate subject:** Student cannot enroll in the same subject more than once (EN-08); 409 when violated.
- **Course authorization:** Class must be authorized for the student's course (EN-01); 409 when not.
- **Already enrolled:** Student cannot enroll twice in the same class (EN-07); 409.
- **Matrix inactive:** Enrollment only allowed in classes of the active matrix; 409 if matrix is not active.
- **Delete class:** Soft-delete not allowed if the class has enrollments (DL-01); 409.
- **Edit class:** Cannot change authorized courses if that would invalidate existing enrollments (ED-04); 409. Cannot change time slot if it would cause schedule conflict for any enrolled student (ED-05); 409.
- **Duplicate subject+slot in matrix:** Same subject in the same time slot in the same matrix is not allowed (CR-03); 409 on create.

### 3.3 Error Semantics

| HTTP | Meaning | Typical use |
|------|---------|-------------|
| 400 | Bad Request | Validation errors (invalid IDs, missing required fields, constraint violations). |
| 401 | Unauthorized | Not logged in or token invalid; frontend should redirect to login. |
| 403 | Forbidden | Logged in but not allowed (wrong role or not owner). |
| 404 | Not Found | Matrix, class, or resource not found. |
| 409 | Conflict | Business rule violation (no seats, schedule conflict, duplicate subject, has enrollments, etc.). |
| 500 | Internal Server Error | Server error; show generic message and optionally retry. |

Error response body (Section 4.5) includes a `code` that the UI can use for i18n or user-friendly messages.

### 3.4 Period of Day Filter (Coordinator)

Filter for listing matrix classes (query param `periodOfDay`): **MORNING** | **AFTERNOON** | **EVENING**.

Ranges (backend Appendix A):

| Period    | Start | End   |
|-----------|-------|-------|
| MORNING   | 06:00 | 12:00 |
| AFTERNOON | 12:00 | 18:00 |
| EVENING   | 18:00 | 24:00 |

A time slot matches a period if its start time falls within the range.

---

## 4. API Contract

### 4.1 Base URL and Authentication

- **Base URL:** Configurable (e.g. environment variable). When running with Docker Compose, the backend is at `http://localhost:8080`.
- **Authentication:** Keycloak OIDC. The frontend must obtain an access token (e.g. via redirect or Keycloak JS adapter) and send it as `Authorization: Bearer <token>` on every API request.
- **Roles:** `coordinator`, `student`. Endpoints are protected by role; wrong role or unauthenticated requests get 401/403.
- **Login/Logout:** Handled by Keycloak (redirect to Keycloak for login; logout via Keycloak).

### 4.2 Data Types

- **IDs:** All entity IDs are **Long** (number in JSON), not UUID.
- **Timestamps:** ISO-8601 strings (e.g. `createdAt`, `enrolledAt`, `deletedAt`). Time-only fields (e.g. in time slots) are strings (e.g. `"08:00"`, `"10:00"` or `"08:00:00"`).
- **Paginated lists:** When applicable, response has `items` (array) and optionally `total` (number). Some list endpoints return only `{ "items": [...] }` without `total`.

### 4.3 Shared DTO Shapes (nested in responses)

Used inside various response objects:

- **Subject:** `{ "id": number, "name": string }`
- **Professor:** `{ "id": number, "name": string }`
- **Course:** `{ "id": number, "name": string }`
- **TimeSlot:** `{ "id": number, "dayOfWeek": string, "startTime": string, "endTime": string }`  
  `dayOfWeek` is e.g. `"MONDAY"`; times are time strings (e.g. `"08:00"` or `"08:00:00"`).

### 4.4 Endpoints

#### Coordinator

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/coordinator/matrices` | coordinator | List matrices owned by current coordinator. |
| POST | `/api/coordinator/matrices` | coordinator | Create a new matrix. |
| PUT | `/api/coordinator/matrices/{matrixId}/activate` | coordinator | Set this matrix as the active one (at most one active). 204 No Content. |
| GET | `/api/coordinator/matrices/{matrixId}/classes` | coordinator | List classes in the matrix (with optional filters). |
| POST | `/api/coordinator/matrices/{matrixId}/classes` | coordinator | Create a class in the matrix. |
| GET | `/api/coordinator/matrices/{matrixId}/classes/{classId}` | coordinator | Get one class by id. |
| PUT | `/api/coordinator/matrices/{matrixId}/classes/{classId}` | coordinator | Update class (time slot, professor, authorized courses only). |
| DELETE | `/api/coordinator/matrices/{matrixId}/classes/{classId}` | coordinator | Soft-delete class. 204 No Content. |

**List matrices – Response 200**

```json
{
  "items": [
    {
      "id": 0,
      "name": "string",
      "active": true,
      "classCount": 0,
      "createdAt": "2025-02-08T12:00:00Z"
    }
  ]
}
```

**Create matrix – Request**

```json
{
  "name": "string"
}
```

**Create matrix – Response 201**

```json
{
  "id": 0,
  "name": "string",
  "coordinatorId": 0,
  "active": false,
  "createdAt": "2025-02-08T12:00:00Z"
}
```

**List classes – Query params**

- `periodOfDay` (optional): `MORNING` | `AFTERNOON` | `EVENING`
- `authorizedCourseId` (optional): number
- `maxStudentsMin` (optional): number
- `maxStudentsMax` (optional): number
- `includeDeleted` (optional): boolean, default `false`

**List classes – Response 200**

```json
{
  "items": [
    {
      "id": 0,
      "matrixId": 0,
      "subject": { "id": 0, "name": "string" },
      "professor": { "id": 0, "name": "string" },
      "timeSlot": { "id": 0, "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "10:00" },
      "authorizedCourses": [{ "id": 0, "name": "string" }],
      "maxStudents": 30,
      "currentEnrollments": 0,
      "deletedAt": null,
      "createdAt": "2025-02-08T12:00:00Z"
    }
  ],
  "total": 0
}
```

**Create class – Request**

```json
{
  "subjectId": 0,
  "professorId": 0,
  "timeSlotId": 0,
  "authorizedCourseIds": [0, 0],
  "maxStudents": 30
}
```

**Create class – Response 201**  
Same shape as one element in list classes (single class object with `subject`, `professor`, `timeSlot`, `authorizedCourses`, `maxStudents`, `currentEnrollments`, `deletedAt`, `createdAt`).

**Update class – Request**

```json
{
  "timeSlotId": 0,
  "professorId": 0,
  "authorizedCourseIds": [0, 0]
}
```

**Update class – Response 200**  
Same shape as create class response.

**Errors (coordinator):** 400 (validation), 403 (not owner), 404 (matrix/class not found), 409 (duplicate subject+slot, has enrollments, invalidate enrollments, schedule conflict).

---

#### Student

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/student/enrollments` | student | List current student's enrollments (active, non–soft-deleted classes only). |
| POST | `/api/student/enrollments` | student | Enroll in a class. |
| GET | `/api/student/classes/available` | student | List classes the student can enroll in (active matrix, seat availability, course authorization). |

**List enrollments – Response 200**

```json
{
  "items": [
    {
      "id": 0,
      "matrixClassId": 0,
      "subject": { "id": 0, "name": "string" },
      "professor": { "id": 0, "name": "string" },
      "timeSlot": { "id": 0, "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "10:00" },
      "enrolledAt": "2025-02-08T12:00:00Z"
    }
  ]
}
```

**Enroll – Request**

```json
{
  "matrixClassId": 0
}
```

**Enroll – Response 201**

```json
{
  "id": 0,
  "matrixClassId": 0,
  "subject": { "id": 0, "name": "string" },
  "professor": { "id": 0, "name": "string" },
  "timeSlot": { "id": 0, "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "10:00" },
  "enrolledAt": "2025-02-08T12:00:00Z"
}
```

**List available classes – Query params**

- `matrixId` (optional): number
- `subjectId` (optional): number

**List available classes – Response 200**

```json
{
  "items": [
    {
      "id": 0,
      "subject": { "id": 0, "name": "string" },
      "professor": { "id": 0, "name": "string" },
      "timeSlot": { "id": 0, "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "10:00" },
      "maxStudents": 30,
      "availableSeats": 5,
      "authorizedForStudentCourse": true
    }
  ]
}
```

**Errors (student):** 400 (validation), 403 (not student), 404 (class not found), 409 (CONFLICT_MATRIX_INACTIVE, CONFLICT_UNAUTHORIZED_COURSE, CONFLICT_NO_SEATS, CONFLICT_ALREADY_ENROLLED, CONFLICT_DUPLICATE_SUBJECT, CONFLICT_SCHEDULE).

### 4.5 Error Response Format

All error responses (4xx, 5xx) that return JSON use this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}
}
```

- **code:** Stable identifier (e.g. `NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT_NO_SEATS`, `CONFLICT_SCHEDULE`, `CONFLICT_DUPLICATE_SUBJECT`, `CONFLICT_ALREADY_ENROLLED`, `CONFLICT_UNAUTHORIZED_COURSE`, `CONFLICT_MATRIX_INACTIVE`, `CONFLICT_HAS_ENROLLMENTS`, `CONFLICT_INVALIDATE_ENROLLMENTS`, `CONFLICT_SCHEDULE_CONFLICT`, `CONFLICT_DUPLICATE_SUBJECT_SLOT`). The frontend can use `code` for i18n or user-friendly messages.
- **message:** Human-readable description (may be in backend locale).
- **details:** Optional object with extra context (e.g. entity IDs).

### 4.6 OpenAPI

The backend exposes OpenAPI at `GET /q/openapi` and Swagger UI at `/q/swagger-ui`. The frontend may use the OpenAPI spec for code generation or reference; this contract remains the human-readable source for the agent.

---

## 5. Frontend Architecture Guidance (Angular + Nx + PrimeNG + RxJS)

### 5.1 Auth Flow and Route Protection

- **Keycloak:** Redirect user to Keycloak for login; receive access token; store it (e.g. in memory or a service) and attach to every API request as `Authorization: Bearer <token>`.
- **Angular Router:** Structure the app with routes (e.g. `/coordinator/matrices`, `/coordinator/matrices/:id/classes`, `/student/enrollments`, `/student/classes/available`). Use **route guards** (e.g. `AuthGuard`, `RoleGuard`) to:
  - Block unauthenticated users (redirect to login / Keycloak).
  - Restrict coordinator routes to users with role `coordinator` and student routes to `student`; redirect or show forbidden on 403.
- **401:** Treat as unauthenticated; redirect to login or refresh token.
- **403:** Show “forbidden” or “access denied” (e.g. PrimeNG message); user may have wrong role.
- **Logout:** Clear token and redirect to Keycloak logout if applicable.

### 5.2 API Client and RxJS

- **HttpClient:** Use Angular `HttpClient` for REST calls; **base URL** from environment (e.g. `environment.apiUrl`).
- **Headers:** `Content-Type: application/json` for request bodies; `Authorization: Bearer <token>` (e.g. via an `HttpInterceptor`) for authenticated endpoints.
- **RxJS:** Expose API calls as **Observables** (e.g. service methods return `Observable<T>`). Use operators such as `switchMap`, `catchError`, `map` for chaining and error handling; use **async pipe** in templates where appropriate to manage subscriptions.
- **Error handling:** Parse 4xx/5xx response body as `{ code, message, details }`; map HTTP status and `code` to UX (e.g. PrimeNG Toast or Message). Use `code` for stable handling of conflicts (CONFLICT_NO_SEATS, CONFLICT_SCHEDULE, etc.).

### 5.3 Nx Structure (Libs / Apps)

- **Apps:** At least one application (e.g. `app` or `web`) as the shell; uses Angular Router and loads feature modules.
- **Libs:** Organize by feature or layer, e.g.:
  - **Auth lib:** Guard(s), token handling, Keycloak redirect.
  - **API/data lib(s):** Services that call the REST endpoints (coordinator, student), DTOs/interfaces.
  - **Feature libs:** Coordinator feature (matrices, classes), Student feature (enrollments, available classes).
  - **Shared UI lib (optional):** Shared PrimeNG usage, pipes, or common components.
- Use Nx conventions for importing between libs and apps (path aliases, buildable/publishable as needed).

### 5.4 Suggested Screens / Views (PrimeNG + CSS)

**Coordinator**

- **Matrix list:** List my matrices (e.g. PrimeNG Table or cards), create matrix (dialog or route), show `active` and `classCount`. Button/link to activate matrix (PUT `.../activate`).
- **Matrix detail:** List classes for one matrix with filters (period of day, authorized course, max students range, include deleted); PrimeNG Table with actions: add class, edit class, soft-delete class.
- **Create/Edit class form:** Subject, professor, time slot, authorized courses (e.g. PrimeNG MultiSelect), max students (create only). Show validation (reactive forms) and 409 errors (e.g. duplicate subject+slot, has enrollments) via Message/Toast.

**Student**

- **My enrollments:** List of enrolled classes (subject, professor, time slot, enrolledAt) — e.g. PrimeNG Table or list.
- **Available classes:** List with optional filters (matrix, subject); show `availableSeats`, `authorizedForStudentCourse`; enroll button per row.
- **Enroll action:** On success refresh enrollments; on 409 show message based on `code` (no seats, schedule conflict, duplicate subject, not authorized, etc.).

**UI:** Functional and clear; use PrimeNG components and **CSS** for layout and tweaks. No requirement for advanced visual design.

### 5.5 Reference Data

Subjects, professors, time slots, and courses are read-only. They appear as nested DTOs in API responses. Use them for dropdowns (e.g. PrimeNG Dropdown, MultiSelect) from the data returned in context (e.g. from list classes or existing class). No dedicated reference-data endpoints in the current API.

### 5.6 State and Errors (RxJS)

- Represent **loading**, **error**, and **success** state per screen or per request (e.g. `Observable<LoadingState<T>>` or component properties bound to async pipe).
- Use API `code` and `message` for user-facing errors; prefer `code` for stable i18n or message mapping.
- For 409 conflicts, map `code` to specific messages (e.g. “No seats”, “Schedule conflict”, “Already enrolled in this subject”) and show via PrimeNG Message/Toast.

---

## 6. Reference

- **Backend repository:** [https://github.com/roollf/unifor-manager](https://github.com/roollf/unifor-manager)
- **Backend PRD:** [PRD.md](https://github.com/roollf/unifor-manager/blob/main/documentation/PRD.md) — full product requirements, domain model, database schema, implementation phases.
- **Backend ARCHITECTURE:** [ARCHITECTURE.md](https://github.com/roollf/unifor-manager/blob/main/documentation/ARCHITECTURE.md) — backend package structure, entity design, DTO strategy, security, error handling.
- **Backend OpenAPI:** When the API is running, `GET {baseUrl}/q/openapi` returns the OpenAPI 3.x spec; Swagger UI at `{baseUrl}/q/swagger-ui`.
- **Traceability:** Keep rule IDs (e.g. AUTH-01, AC-01, CR-01, EN-01, DL-01, ED-04, ED-05, VM-02) consistent in the generated frontend PRD so that requirements can be traced to the backend PRD.

---

*End of Frontend Contract*
