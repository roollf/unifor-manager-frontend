# Technical Architecture
## Academic Course Registration System — Frontend

**Version:** 1.0  
**Date:** February 9, 2025  
**Stack:** Angular 18+ | Nx | PrimeNG | RxJS | Keycloak  
**References:** [PRD.md](PRD.md), [FRONTEND_CONTRACT.md](FRONTEND_CONTRACT.md)

---

## 1. Technology Stack (Mandatory)

| Item | Requirement |
|------|--------------|
| Framework | **Angular** (version 18 or higher) |
| Routing | **Angular Router** for navigation |
| Route protection | **Route guards** (auth guard, role guard) for coordinator/student routes |
| Styling | **CSS** (no other styling framework required) |
| Monorepo / structure | **Nx** for workspace and build management |
| Reactive programming | **RxJS** (observables, streams, operators) |
| UI components | **PrimeNG** (tables, forms, dialogs, etc.) |

**Technical requirements:**
- **API:** REST via Angular `HttpClient`; base URL from environment.
- **Modular organization:** Nx structure with **libs** and **apps**.
- **RxJS:** Observables, streams, operators; services return `Observable<T>`; async pipe in templates.
- **UI:** Functional interface; correctness and usability with PrimeNG and CSS.

---

## 2. Nx Structure (Libs / Apps)

### 2.1 Recommended Layout

```
apps/
  web/                     # Shell application (Angular Router, feature lazy loading)

libs/
  auth/                    # Auth lib
    src/
      guards/              # AuthGuard, RoleGuard
      services/            # Token handling, Keycloak redirect
  api/                     # API / data lib
    src/
      coordinator/         # Coordinator REST services, DTOs
      student/             # Student REST services, DTOs
      interceptors/        # Bearer token interceptor, error interceptor
  coordinator/             # Coordinator feature
    src/
      matrices/            # Matrix list, create matrix
      classes/             # Class list, create/edit class, filters
  student/                 # Student feature
    src/
      enrollments/         # My enrollments list
      available-classes/   # Browse and enroll
  shared/ui/               # Optional: shared PrimeNG usage, pipes, common components
```

### 2.2 Rationale

- **Apps:** One shell app (`web`) as entry point; uses Angular Router and lazy-loads feature modules.
- **Auth lib:** Centralizes guards and token handling; used by routing and HTTP interceptors.
- **API lib:** Single place for REST calls, DTOs, and interceptors; consumed by feature libs.
- **Feature libs:** Coordinator and Student features are isolated; each owns its routes and components.
- **Shared UI:** Optional; use when multiple features share PrimeNG wrappers or pipes.

### 2.3 Import Rules

- Feature libs depend on `api` and `auth`; not vice versa.
- `api` depends only on Angular core and HttpClient.
- Use Nx path aliases (e.g. `@unifor-manager/auth`, `@unifor-manager/api`).

---

## 3. Authentication and Route Protection

### 3.1 Auth Flow

1. **Login:** Redirect user to Keycloak for login; receive access token.
2. **Token storage:** Store token (e.g. in memory or service); attach to every API request as `Authorization: Bearer <token>`.
3. **Logout:** Clear token; redirect to Keycloak logout when applicable.
4. **401:** Treat as unauthenticated; redirect to login or attempt token refresh.

### 3.2 Route Guards

| Guard | Purpose |
|-------|---------|
| **AuthGuard** | Block unauthenticated users; redirect to Keycloak login. |
| **RoleGuard** | Restrict coordinator routes to `coordinator`, student routes to `student`; on 403, show “access denied” or redirect. |

**Suggested route structure:**
- `/coordinator/matrices` — list matrices
- `/coordinator/matrices/:id/classes` — matrix detail, class list
- `/student/enrollments` — my enrollments
- `/student/classes/available` — browse and enroll

### 3.3 Keycloak Integration

- Use Keycloak JS adapter or Angular Keycloak libraries for redirect flow.
- Map Keycloak user to API user via email (AC-05).
- Roles (`coordinator`, `student`) come from token claims; use them in guards and UI (e.g. role-based nav).

---

## 4. API Client and RxJS

### 4.1 HttpClient Configuration

- **Base URL:** From `environment.apiUrl` (e.g. `http://localhost:8080` for local Docker setup).
- **Headers:** `Content-Type: application/json` for bodies; `Authorization: Bearer <token>` via `HttpInterceptor`.

### 4.2 Interceptors

| Interceptor | Responsibility |
|-------------|----------------|
| **AuthInterceptor** | Add `Authorization: Bearer <token>` to all requests. |
| **ErrorInterceptor** | Parse 4xx/5xx responses; map HTTP status and `code` to user-facing messages; optionally surface via a global message service (e.g. PrimeNG Toast). |

### 4.3 Service Patterns

- **Observables:** Service methods return `Observable<T>`.
- **Operators:** Use `switchMap`, `catchError`, `map` for chaining and error handling.
- **Templates:** Prefer **async pipe** for subscriptions; avoid manual `subscribe` in components when possible.

**Example:**
```typescript
// Service
getMatrices(): Observable<MatrixSummary[]> {
  return this.http.get<{ items: MatrixSummary[] }>(`${this.baseUrl}/api/coordinator/matrices`)
    .pipe(
      map(res => res.items),
      catchError(err => this.handleError(err))
    );
}
```

### 4.4 Error Handling

- Parse response body as `{ code, message, details }`.
- Map HTTP status and `code` to UX (PrimeNG Toast, Message, or inline feedback).
- For 409, use `code` for stable handling:
  - `CONFLICT_NO_SEATS` → “No seats available”
  - `CONFLICT_SCHEDULE` / `CONFLICT_SCHEDULE_CONFLICT` → “Schedule conflict”
  - `CONFLICT_DUPLICATE_SUBJECT` → “Already enrolled in this subject”
  - `CONFLICT_ALREADY_ENROLLED` → “Already enrolled in this class”
  - etc.

---

## 5. Screens / Views

### 5.1 Coordinator

| Screen | Description | Components |
|--------|-------------|------------|
| **Matrix list** | List my matrices; show `active`, `classCount`; create matrix (dialog or route); activate matrix button. | PrimeNG Table or cards, Dialog |
| **Matrix detail** | List classes for one matrix with filters (period of day, authorized course, max students range, include deleted); add/edit/soft-delete class. | PrimeNG Table, filters, actions |
| **Create class form** | Subject, professor, time slot, authorized courses (MultiSelect), max students. Validation (reactive forms); 409 handling (e.g. duplicate subject+slot). | PrimeNG form components |
| **Edit class form** | Time slot, professor, authorized courses only (ED-02). Handle 409 for ED-04, ED-05. | PrimeNG form components |

### 5.2 Student

| Screen | Description | Components |
|--------|-------------|------------|
| **My enrollments** | List enrolled classes (subject, professor, time slot, enrolledAt). | PrimeNG Table or list |
| **Available classes** | List with optional filters (matrix, subject); show `availableSeats`, `authorizedForStudentCourse`; enroll button per row. | PrimeNG Table, filters |
| **Enroll action** | On success, refresh enrollments; on 409, show message based on `code`. | Toast / Message |

### 5.3 UI Guidelines

- **Functional and clear:** Focus on correctness and usability.
- **PrimeNG + CSS:** Use PrimeNG for components; CSS for layout and tweaks. No requirement for advanced visual design.

---

## 6. Data Types and DTOs

### 6.1 Shared Shapes (from API contract)

- **Subject:** `{ id: number, name: string }`
- **Professor:** `{ id: number, name: string }`
- **Course:** `{ id: number, name: string }`
- **TimeSlot:** `{ id: number, dayOfWeek: string, startTime: string, endTime: string }`

### 6.2 IDs and Timestamps

- **IDs:** All `Long` (number in JSON).
- **Timestamps:** ISO-8601 strings (e.g. `createdAt`, `enrolledAt`, `deletedAt`).
- **Time-only:** Strings (e.g. `"08:00"`, `"08:00:00"`).

### 6.3 Reference Data

Subjects, professors, time slots, and courses are read-only. They appear as nested DTOs in API responses. Use them for dropdowns (PrimeNG Dropdown, MultiSelect) from data returned in context (e.g. from list classes or existing class). No dedicated reference-data endpoints in the current API.

---

## 7. State and Errors (RxJS)

### 7.1 Loading, Error, Success State

- Represent per screen or per request (e.g. `Observable<LoadingState<T>>` or component properties bound to async pipe).
- **Loading:** Show spinner or skeleton.
- **Error:** Show message from API `code` / `message`.
- **Success:** Display data; optionally show success toast.

### 7.2 Error Mapping

- Prefer `code` for stable i18n or message mapping.
- For 409 conflicts, map `code` to specific messages and show via PrimeNG Message/Toast.

---

## 8. Environment Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `apiUrl` | Backend base URL | `http://localhost:8080` |
| Keycloak config | Auth server URL, client ID, etc. | Per Keycloak setup |

Use Angular `environment.ts` (and `environment.prod.ts`) for build-time configuration.

---

## 9. Reference

- **Backend repository:** [https://github.com/roollf/unifor-manager](https://github.com/roollf/unifor-manager)
- **Frontend Contract:** [FRONTEND_CONTRACT.md](FRONTEND_CONTRACT.md)
- **Frontend PRD:** [PRD.md](PRD.md)
- **Backend OpenAPI:** `GET {baseUrl}/q/openapi` when API is running; Swagger UI at `{baseUrl}/q/swagger-ui`.

---

*End of Frontend Architecture Document*
