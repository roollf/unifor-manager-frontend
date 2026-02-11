import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  EnrollmentDto,
  EnrollRequestDto,
  AvailableClassDto,
  PaginatedResponseDto,
  StudentMeDto,
} from '../models';
import { catchError, of } from 'rxjs';
import { API_BASE_URL } from '../core/api-base-url.token';
import type { ListAvailableClassesParams } from './list-available-classes-params';

/**
 * Student REST client per FRONTEND_CONTRACT §4.4.
 * List enrollments, list available classes (with optional filters), enroll.
 * Services return Observable; no subscription in service (project rule).
 */
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get studentBase(): string {
    return `${this.baseUrl}/api/student`;
  }

  /**
   * Current student info (e.g. course for display). Backend may expose GET /api/student/me.
   * On 404 or error, returns { course: null } so UI can show "Not set" without failing.
   */
  getMe(): Observable<StudentMeDto> {
    return this.http
      .get<StudentMeDto>(`${this.studentBase}/me`)
      .pipe(
        catchError(() => of({ course: null }))
      );
  }

  listEnrollments(): Observable<EnrollmentDto[]> {
    return this.http
      .get<PaginatedResponseDto<EnrollmentDto>>(`${this.studentBase}/enrollments`)
      .pipe(map((res) => res.items));
  }

  listAvailableClasses(
    params?: ListAvailableClassesParams
  ): Observable<AvailableClassDto[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.matrixId != null) httpParams = httpParams.set('matrixId', params.matrixId);
      if (params.subjectId != null) httpParams = httpParams.set('subjectId', params.subjectId);
    }
    return this.http
      .get<PaginatedResponseDto<AvailableClassDto>>(
        `${this.studentBase}/classes/available`,
        { params: httpParams }
      )
      .pipe(map((res) => res.items));
  }

  enroll(body: EnrollRequestDto): Observable<EnrollmentDto> {
    return this.http.post<EnrollmentDto>(`${this.studentBase}/enrollments`, body);
  }
}
