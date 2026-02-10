/**
 * API DTOs and response shapes per FRONTEND_CONTRACT §4.2–4.5 and ARCHITECTURE §6.
 * IDs are Long (number); timestamps ISO-8601; time-only fields are strings (e.g. "08:00").
 */

// ----- Shared shapes (nested in responses) -----

export interface SubjectDto {
  id: number;
  name: string;
}

export interface ProfessorDto {
  id: number;
  name: string;
}

export interface CourseDto {
  id: number;
  name: string;
}

export interface TimeSlotDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

// ----- Coordinator: Matrices -----

export interface MatrixListItemDto {
  id: number;
  name: string;
  active: boolean;
  classCount: number;
  createdAt: string;
}

export interface CreateMatrixRequestDto {
  name: string;
}

export interface CreateMatrixResponseDto {
  id: number;
  name: string;
  coordinatorId: number;
  active: boolean;
  createdAt: string;
}

// ----- Coordinator: Matrix classes -----

export interface MatrixClassDto {
  id: number;
  matrixId: number;
  subject: SubjectDto;
  professor: ProfessorDto;
  timeSlot: TimeSlotDto;
  authorizedCourses: CourseDto[];
  maxStudents: number;
  currentEnrollments: number;
  deletedAt: string | null;
  createdAt: string;
}

export interface CreateClassRequestDto {
  subjectId: number;
  professorId: number;
  timeSlotId: number;
  authorizedCourseIds: number[];
  maxStudents: number;
}

export interface UpdateClassRequestDto {
  timeSlotId: number;
  professorId: number;
  authorizedCourseIds: number[];
}

// ----- Student: Enrollments -----

export interface EnrollmentDto {
  id: number;
  matrixClassId: number;
  subject: SubjectDto;
  professor: ProfessorDto;
  timeSlot: TimeSlotDto;
  enrolledAt: string;
}

export interface EnrollRequestDto {
  matrixClassId: number;
}

// ----- Student: Available classes -----

export interface AvailableClassDto {
  id: number;
  subject: SubjectDto;
  professor: ProfessorDto;
  timeSlot: TimeSlotDto;
  maxStudents: number;
  availableSeats: number;
  authorizedForStudentCourse: boolean;
}

// ----- Paginated responses -----

export interface PaginatedResponseDto<T> {
  items: T[];
  total?: number;
}

// ----- Error response (4xx, 5xx) -----

export interface ApiErrorResponseDto {
  code: string;
  message: string;
  details: Record<string, unknown>;
}
