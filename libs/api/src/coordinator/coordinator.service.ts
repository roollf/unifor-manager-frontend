import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  MatrixListItemDto,
  CreateMatrixRequestDto,
  CreateMatrixResponseDto,
  MatrixClassDto,
  CreateClassRequestDto,
  UpdateClassRequestDto,
  PaginatedResponseDto,
  SubjectDto,
  ProfessorDto,
  TimeSlotDto,
  CourseDto,
} from '../models';
import { API_BASE_URL } from '../core/api-base-url.token';
import type { ListClassesParams } from './list-classes-params';

/**
 * Coordinator REST client per FRONTEND_CONTRACT §4.4.
 * List matrices, create matrix, activate matrix, list/create/get/update/delete classes.
 * Services return Observable; no subscription in service (project rule).
 */
@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get coordinatorBase(): string {
    return `${this.baseUrl}/api/coordinator`;
  }

  listMatrices(): Observable<MatrixListItemDto[]> {
    return this.http
      .get<PaginatedResponseDto<MatrixListItemDto>>(`${this.coordinatorBase}/matrices`)
      .pipe(map((res) => res.items));
  }

  createMatrix(body: CreateMatrixRequestDto): Observable<CreateMatrixResponseDto> {
    return this.http.post<CreateMatrixResponseDto>(`${this.coordinatorBase}/matrices`, body);
  }

  activateMatrix(matrixId: number): Observable<void> {
    return this.http
      .put<void>(`${this.coordinatorBase}/matrices/${matrixId}/activate`, null)
      .pipe(map(() => undefined));
  }

  /** Reference data for Add class form. API may return array or { items: [] }. */
  private arrayOrItems<T>(res: T[] | { items?: T[] }): T[] {
    return Array.isArray(res) ? res : (res as { items?: T[] }).items ?? [];
  }

  listSubjects(): Observable<SubjectDto[]> {
    return this.http
      .get<SubjectDto[] | { items: SubjectDto[] }>(`${this.coordinatorBase}/reference/subjects`)
      .pipe(map((res) => this.arrayOrItems(res)));
  }

  listProfessors(): Observable<ProfessorDto[]> {
    return this.http
      .get<ProfessorDto[] | { items: ProfessorDto[] }>(`${this.coordinatorBase}/reference/professors`)
      .pipe(map((res) => this.arrayOrItems(res)));
  }

  listTimeSlots(): Observable<TimeSlotDto[]> {
    return this.http
      .get<TimeSlotDto[] | { items: TimeSlotDto[] }>(`${this.coordinatorBase}/reference/time-slots`)
      .pipe(map((res) => this.arrayOrItems(res)));
  }

  listCourses(): Observable<CourseDto[]> {
    return this.http
      .get<CourseDto[] | { items: CourseDto[] }>(`${this.coordinatorBase}/reference/courses`)
      .pipe(map((res) => this.arrayOrItems(res)));
  }

  listClasses(matrixId: number, params?: ListClassesParams): Observable<PaginatedResponseDto<MatrixClassDto>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.periodOfDay != null) httpParams = httpParams.set('periodOfDay', params.periodOfDay);
      if (params.authorizedCourseId != null)
        httpParams = httpParams.set('authorizedCourseId', params.authorizedCourseId);
      if (params.maxStudentsMin != null) httpParams = httpParams.set('maxStudentsMin', params.maxStudentsMin);
      if (params.maxStudentsMax != null) httpParams = httpParams.set('maxStudentsMax', params.maxStudentsMax);
      if (params.includeDeleted != null)
        httpParams = httpParams.set('includeDeleted', String(params.includeDeleted));
    }
    return this.http.get<PaginatedResponseDto<MatrixClassDto>>(
      `${this.coordinatorBase}/matrices/${matrixId}/classes`,
      { params: httpParams }
    );
  }

  createClass(matrixId: number, body: CreateClassRequestDto): Observable<MatrixClassDto> {
    return this.http.post<MatrixClassDto>(
      `${this.coordinatorBase}/matrices/${matrixId}/classes`,
      body
    );
  }

  getClass(matrixId: number, classId: number): Observable<MatrixClassDto> {
    return this.http.get<MatrixClassDto>(
      `${this.coordinatorBase}/matrices/${matrixId}/classes/${classId}`
    );
  }

  updateClass(
    matrixId: number,
    classId: number,
    body: UpdateClassRequestDto
  ): Observable<MatrixClassDto> {
    return this.http.put<MatrixClassDto>(
      `${this.coordinatorBase}/matrices/${matrixId}/classes/${classId}`,
      body
    );
  }

  deleteClass(matrixId: number, classId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.coordinatorBase}/matrices/${matrixId}/classes/${classId}`)
      .pipe(map(() => undefined));
  }
}
