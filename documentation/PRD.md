# Product Requirements Document (PRD)
## Academic Course Registration System — Frontend

**Version:** 1.0  
**Date:** February 9, 2025  
**Stack:** Angular 18+ | Nx | PrimeNG | RxJS | Keycloak  
**Traceability:** Aligned with backend [PRD](https://github.com/roollf/unifor-manager/blob/main/PRD.md) and [FRONTEND_CONTRACT](FRONTEND_CONTRACT.md).

---

## 1. System Overview

### 1.1 Brief Description

The Academic Course Registration System (unifor-manager) is a web application where **coordinators** create and manage curriculum matrices (sets of classes offered in a semester) and **students** view their enrollments and enroll in classes. Authentication and authorization are handled via Keycloak. The backend enforces academic rules (seat limits, course restrictions, schedule conflicts) and role-based access.

### 1.2 Actors

| Actor | Description | UI Capabilities |
|-------|-------------|-----------------|
| **Coordinator** | Manages curriculum matrices and their classes. | Login; list/create matrices; list/add/edit/soft-delete classes (with filters); activate a matrix. |
| **Student** | Views enrollments and enrolls in classes. | Login; view my enrollments; browse available classes (optional filters); enroll in a class (with validation feedback). |

### 1.3 Main User Flows

**Coordinator flow:**
1. Login (Keycloak)
2. List my matrices
3. (Optional) Create matrix
4. Select matrix → List classes (with filters: period of day, authorized course, max students range, include deleted)
5. Add class / Edit class / Soft-delete class (when no enrollments)
6. (Optional) Activate matrix

**Student flow:**
1. Login (Keycloak)
2. View my enrollments
3. Browse available classes (optional: filter by matrix, subject)
4. Enroll in a class
5. See success or error (no seats, schedule conflict, duplicate subject, not authorized for course, etc.)

### 1.4 Out-of-Scope / Resolved

- **Unenroll:** Not in scope; students cannot drop a class.
- **Matrix soft delete:** Not specified in backend; contract does not define behavior.
- **Edit restrictions:** After a class is created, **subject** and **maxStudents** are not editable (ED-02).
- **Active matrix:** At most one matrix has `active = true`; students enroll only in classes belonging to the active matrix.

---

## 2. Acceptance Criteria (UI-Relevant Business Rules)

Acceptance criteria are phrased for the frontend implementation. Rule IDs are preserved for traceability to the backend PRD.

### 2.1 Access Control

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **AC-01** | Coordinator sees only curriculum matrices they created. |
| **AC-03** | Student sees only their own enrollments. |
| **AC-05** | User ↔ Keycloak mapping is by email. |

**UI implication:** All API calls are role-scoped; the backend returns 403 when the authenticated user does not own the resource or does not have the required role. The UI must redirect unauthenticated users to login and display “access denied” for 403.

### 2.2 Coordinator: Matrix Management

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **VM-01** | Coordinator sees only classes in matrices they own. |
| **VM-02** | Coordinator can filter classes by period of day (MORNING, AFTERNOON, EVENING), authorized course, max students range, and include deleted. |
| **VM-03** | Soft-deleted classes are excluded from default listing; “include deleted” filter shows them. |

### 2.3 Coordinator: Create Class

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **CR-01** | Subject, Professor, TimeSlot must reference existing entities (dropdowns). |
| **CR-04** | Authorized courses list must reference existing Course entities (e.g. MultiSelect). |
| **CR-05** | maxStudents must be a positive integer (validated on create only). |
| **CR-03** | Duplicate subject+slot in matrix is not allowed; UI must show error when API returns 409 (CONFLICT_DUPLICATE_SUBJECT_SLOT). |

### 2.4 Coordinator: Edit Class

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **ED-02** | Subject and maxStudents are NOT editable; edit form shows only time slot, professor, authorized courses. |
| **ED-04** | If removing a course from authorized list would invalidate existing enrollments, API returns 409; UI must display user-friendly message. |
| **ED-05** | If changing time slot would cause schedule conflict for any enrolled student, API returns 409; UI must display user-friendly message. |

### 2.5 Coordinator: Delete Class

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **DL-01** | Soft-delete not allowed if the class has enrollments; API returns 409; UI must show message (e.g. “Cannot delete: class has enrollments”). |
| **DL-04** | Soft-deleted classes must be excluded from listings and enrollment options unless “include deleted” is used. |

### 2.6 Student: View Enrollments

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **VE-01** | Student sees only their own enrollments. |
| **VE-02** | Display: Subject, Professor, Time slot for each enrolled class. |
| **VE-03** | Only active (non–soft-deleted) classes are shown. |

### 2.7 Student: Enroll in Class

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **EN-01** | Class must be authorized for the student's course; 409 when not; UI shows message. |
| **EN-02** | Enrollment fails when no seats available (409); UI shows “No seats available”. |
| **EN-03** | Enrollment fails when class overlaps with an already enrolled class (409); UI shows “Schedule conflict”. |
| **EN-07** | Student cannot enroll twice in the same class; 409; UI shows “Already enrolled”. |
| **EN-08** | Student cannot enroll in the same subject more than once; 409; UI shows “Already enrolled in this subject”. |
| **Matrix inactive** | Enrollment only allowed in classes of the active matrix; 409; UI shows appropriate message. |

### 2.8 Period of Day Filter

| Rule ID | Acceptance Criteria |
|---------|---------------------|
| **Filter** | Coordinator can filter classes by `periodOfDay`: MORNING (06:00–12:00), AFTERNOON (12:00–18:00), EVENING (18:00–24:00). A time slot matches if its start time falls within the range. |

---

## 3. Error Handling (UI Semantics)

| HTTP | Meaning | UI Action |
|------|---------|-----------|
| 400 | Bad Request | Show validation errors; highlight invalid fields. |
| 401 | Unauthorized | Redirect to login (Keycloak). |
| 403 | Forbidden | Show “access denied” (e.g. PrimeNG Message). |
| 404 | Not Found | Show “resource not found”;
 redirect to list when appropriate. |
| 409 | Conflict | Map `code` from response to user-friendly message (e.g. CONFLICT_NO_SEATS → “No seats available”). |
| 500 | Internal Server Error | Show generic error; optionally offer retry. |

Error response body structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}
}
```

**Stable codes for 409 (use for i18n or message mapping):**  
`CONFLICT_NO_SEATS`, `CONFLICT_SCHEDULE`, `CONFLICT_DUPLICATE_SUBJECT`, `CONFLICT_ALREADY_ENROLLED`, `CONFLICT_UNAUTHORIZED_COURSE`, `CONFLICT_MATRIX_INACTIVE`, `CONFLICT_HAS_ENROLLMENTS`, `CONFLICT_INVALIDATE_ENROLLMENTS`, `CONFLICT_SCHEDULE_CONFLICT`, `CONFLICT_DUPLICATE_SUBJECT_SLOT`.

---

## 4. API Contract Summary

- **Base URL:** Configurable (environment).
- **Auth:** Keycloak OIDC; send `Authorization: Bearer <token>` on every request.
- **IDs:** All entity IDs are `Long` (number in JSON).
- **Timestamps:** ISO-8601 strings.
- **Paginated lists:** `{ items: [...], total?: number }`.

Full API details and payload shapes are in [FRONTEND_CONTRACT.md](FRONTEND_CONTRACT.md) Section 4.

---

## 5. Implementation Checkpoints

### Phase 1: Foundation and Workspace

**Goal:** Set up Nx workspace, Angular app, and base configuration.

**Tasks:**
- Initialize or verify Nx workspace with Angular 18+ application
- Configure environment files (`apiUrl`, Keycloak settings)
- Set up Angular Router and base route structure
- Add PrimeNG and configure CSS
- Create shell layout (header, nav, outlet) and role-based navigation
- Define lib structure: `auth`, `api`, `coordinator`, `student` (optional `shared/ui`)

**Dependencies:** None (foundation)

**Validation:**
- App builds and runs; base layout renders
- Routes resolve; placeholder components load

---

### Phase 2: Auth and Route Protection

**Goal:** Keycloak integration and protected routes.

**Tasks:**
- Integrate Keycloak (JS adapter or Angular Keycloak library)
- Implement AuthGuard: block unauthenticated users, redirect to Keycloak login
- Implement RoleGuard: restrict coordinator routes to `coordinator`, student routes to `student`
- Create AuthInterceptor: add `Authorization: Bearer <token>` to all requests
- Configure routes: `/coordinator/matrices`, `/coordinator/matrices/:id/classes`, `/student/enrollments`, `/student/classes/available`
- Handle 401: redirect to login; handle 403: show “access denied”

**Dependencies:** Phase 1

**Validation:**
- Unauthenticated user is redirected to Keycloak
- Coordinator cannot access student routes; student cannot access coordinator routes
- API requests include Bearer token

---

### Phase 3: API Layer

**Goal:** REST client, DTOs, and coordinator/student services.

**Tasks:**
- Define DTOs/interfaces (Subject, Professor, TimeSlot, Course, Matrix, MatrixClass, Enrollment, etc.) per API contract
- Create Coordinator API service: list matrices, create matrix, activate matrix, list classes (with query params), create class, get class, update class, delete class
- Create Student API service: list enrollments, list available classes (with filters), enroll
- Services return `Observable<T>`; use RxJS operators (`map`, `catchError`, `switchMap`)
- ErrorInterceptor: parse 4xx/5xx `{ code, message, details }`; surface via global message service (e.g. PrimeNG Toast)

**Dependencies:** Phase 2

**Validation:**
- API calls succeed against running backend; responses typed correctly
- 401/403/404/409 errors are caught and surfaced

---

### Phase 4: Coordinator Features

**Goal:** Coordinator can manage matrices and classes (VM-01, VM-02, VM-03, CR-01 to CR-05, ED-02, ED-04, ED-05, DL-01, DL-04).

**Tasks:**
- **Matrix list:** List matrices (PrimeNG Table or cards); show `active`, `classCount`; create matrix (dialog); activate matrix button
- **Matrix detail:** List classes for selected matrix with filters: periodOfDay (MORNING/AFTERNOON/EVENING), authorizedCourseId, maxStudentsMin, maxStudentsMax, includeDeleted
- **Create class form:** Subject, professor, time slot, authorized courses (MultiSelect), max students; reactive validation; handle 409 CONFLICT_DUPLICATE_SUBJECT_SLOT
- **Edit class form:** Time slot, professor, authorized courses only (ED-02); handle 409 for ED-04 (CONFLICT_INVALIDATE_ENROLLMENTS), ED-05 (CONFLICT_SCHEDULE_CONFLICT)
- **Soft-delete class:** Confirm dialog; handle 409 CONFLICT_HAS_ENROLLMENTS (DL-01)
- Populate dropdowns from nested data in class responses (subjects, professors, time slots, courses)

**Dependencies:** Phase 3

**Validation:**
- Coordinator can list/create matrices and activate one
- Coordinator can list classes with all filters; add/edit/delete class with correct validation feedback

---

### Phase 5: Student Features

**Goal:** Student can view enrollments and enroll in classes (VE-01, VE-02, VE-03, EN-01 to EN-08).

**Tasks:**
- **My enrollments:** List enrolled classes (subject, professor, time slot, enrolledAt) — PrimeNG Table or list
- **Available classes:** List with optional filters (matrixId, subjectId); show `availableSeats`, `authorizedForStudentCourse`; enroll button per row
- **Enroll action:** On success, refresh enrollments; on 409, map `code` to user-friendly message (CONFLICT_NO_SEATS, CONFLICT_SCHEDULE, CONFLICT_DUPLICATE_SUBJECT, CONFLICT_ALREADY_ENROLLED, CONFLICT_UNAUTHORIZED_COURSE, CONFLICT_MATRIX_INACTIVE)
- Use async pipe in templates where appropriate; loading/error/success state per screen

**Dependencies:** Phase 3

**Validation:**
- Student sees only own enrollments; can browse available classes and enroll
- All 409 codes display appropriate messages

---

### Phase 6: Error Handling and Polish

**Goal:** Consistent error UX and final refinements.

**Tasks:**
- Implement full 409 code mapping (Section 3) for coordinator and student flows
- Ensure 400 shows validation errors; 404 shows “not found”; 500 shows generic message
- Add loading states (spinners/skeletons) for lists and forms
- Verify 401 redirects to login; 403 shows “access denied”
- Optional: shared error-message pipe or service for i18n-ready `code` → message mapping
- Manual smoke test of all flows with backend

**Dependencies:** Phase 4, Phase 5

**Validation:**
- All error paths show user-friendly messages
- No unhandled API errors; UX is consistent across screens

---

## 6. Reference

- **Backend repository:** [https://github.com/roollf/unifor-manager](https://github.com/roollf/unifor-manager)
- **Backend PRD:** [PRD.md](https://github.com/roollf/unifor-manager/blob/main/PRD.md)
- **Backend ARCHITECTURE:** [ARCHITECTURE.md](https://github.com/roollf/unifor-manager/blob/main/ARCHITECTURE.md)
- **Frontend Contract:** [FRONTEND_CONTRACT.md](FRONTEND_CONTRACT.md)

---

*End of Frontend PRD*
