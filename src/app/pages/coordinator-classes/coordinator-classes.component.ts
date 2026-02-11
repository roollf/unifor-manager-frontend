import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CoordinatorService } from '@unifor-manager/api';
import type {
  MatrixClassDto,
  ListClassesParams,
  CreateClassRequestDto,
  UpdateClassRequestDto,
  SubjectDto,
  ProfessorDto,
  TimeSlotDto,
  CourseDto,
} from '@unifor-manager/api';
import {
  formatTimeSlotLabel,
  formatTimeSlotShortLabel,
  PERIOD_OPTIONS,
  toBackendPeriodOfDay,
} from '@unifor-manager/api';
import { forkJoin } from 'rxjs';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { ConfirmationService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MultiSelect } from 'primeng/multiselect';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-coordinator-classes',
  standalone: true,
  templateUrl: './coordinator-classes.component.html',
  styleUrl: './coordinator-classes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TableModule,
    Button,
    Tag,
    Select,
    InputNumber,
    Checkbox,
    Dialog,
    ConfirmDialog,
    MultiSelect,
  ],
})
export class CoordinatorClassesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly coordinator = inject(CoordinatorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly periodOptions = PERIOD_OPTIONS;
  protected readonly classes = signal<MatrixClassDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly matrixId = signal<number | null>(null);
  protected readonly createDialogVisible = signal(false);
  protected readonly creating = signal(false);
  protected readonly editDialogVisible = signal(false);
  protected readonly editing = signal(false);
  protected readonly editingClass = signal<MatrixClassDto | null>(null);

  /** Reference data from API (subjects, professors, time slots, courses) for dropdowns. */
  protected readonly subjectsRef = signal<SubjectDto[]>([]);
  protected readonly professorsRef = signal<ProfessorDto[]>([]);
  protected readonly timeSlotsRef = signal<TimeSlotDto[]>([]);
  protected readonly coursesRef = signal<CourseDto[]>([]);

  protected subjectOptions = computed(() => this.subjectsRef());
  protected professorOptions = computed(() => this.professorsRef());
  protected timeSlotOptions = computed(() =>
    this.timeSlotsRef().map((s) => ({
      id: s.id,
      label: formatTimeSlotShortLabel(s),
    }))
  );
  protected courseOptions = computed(() => this.coursesRef());

  protected filterForm = this.fb.nonNullable.group({
    periodOfDay: this.fb.control<string | null>(null),
    authorizedCourseId: this.fb.control<number | null>(null),
    maxStudentsMin: this.fb.control<number | null>(null),
    maxStudentsMax: this.fb.control<number | null>(null),
    includeDeleted: this.fb.control<boolean>(false),
  });

  protected createForm = this.fb.nonNullable.group({
    subjectId: [0, [Validators.required, Validators.min(1)]],
    professorId: [0, [Validators.required, Validators.min(1)]],
    timeSlotId: [0, [Validators.required, Validators.min(1)]],
    authorizedCourseIds: this.fb.nonNullable.control<number[]>([]),
    maxStudents: [1, [Validators.required, Validators.min(1)]],
  });

  protected editForm = this.fb.nonNullable.group({
    timeSlotId: [0, [Validators.required, Validators.min(1)]],
    professorId: [0, [Validators.required, Validators.min(1)]],
    authorizedCourseIds: this.fb.nonNullable.control<number[]>([]),
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paramMap) => {
        const idStr = paramMap.get('id');
        if (idStr == null) {
          this.matrixId.set(null);
          return;
        }
        const id = Number(idStr);
        if (Number.isNaN(id)) {
          this.matrixId.set(null);
          return;
        }
        this.matrixId.set(id);
        this.loadWithCurrentFilters(id);
        this.loadReferenceData();
      });
  }

  private loadReferenceData(): void {
    forkJoin({
      subjects: this.coordinator.listSubjects(),
      professors: this.coordinator.listProfessors(),
      timeSlots: this.coordinator.listTimeSlots(),
      courses: this.coordinator.listCourses(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.subjectsRef.set(data.subjects);
          this.professorsRef.set(data.professors);
          this.timeSlotsRef.set(data.timeSlots);
          this.coursesRef.set(data.courses);
        },
      });
  }

  private buildParams(): ListClassesParams {
    const v = this.filterForm.getRawValue();
    const params: ListClassesParams = {};
    const period = toBackendPeriodOfDay(v.periodOfDay);
    if (period != null) params.periodOfDay = period;
    if (v.authorizedCourseId != null) params.authorizedCourseId = v.authorizedCourseId;
    if (v.maxStudentsMin != null) params.maxStudentsMin = v.maxStudentsMin;
    if (v.maxStudentsMax != null) params.maxStudentsMax = v.maxStudentsMax;
    if (v.includeDeleted != null) params.includeDeleted = v.includeDeleted;
    return params;
  }

  private loadWithCurrentFilters(matrixId: number): void {
    this.loading.set(true);
    this.coordinator
      .listClasses(matrixId, this.buildParams())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => this.classes.set(res.items ?? []),
      });
  }

  protected applyFilters(): void {
    const id = this.matrixId();
    if (id == null) return;
    this.loadWithCurrentFilters(id);
  }

  protected openCreateDialog(): void {
    this.createForm.reset({
      subjectId: 0,
      professorId: 0,
      timeSlotId: 0,
      authorizedCourseIds: [],
      maxStudents: 1,
    });
    this.createDialogVisible.set(true);
  }

  protected closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  protected submitCreate(): void {
    if (this.createForm.invalid) return;
    const id = this.matrixId();
    if (id == null) return;
    const v = this.createForm.getRawValue();
    const body: CreateClassRequestDto = {
      subjectId: v.subjectId,
      professorId: v.professorId,
      timeSlotId: v.timeSlotId,
      authorizedCourseIds: v.authorizedCourseIds ?? [],
      maxStudents: v.maxStudents,
    };
    this.creating.set(true);
    this.coordinator
      .createClass(id, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.creating.set(false))
      )
      .subscribe({
        next: () => {
          this.closeCreateDialog();
          this.loadWithCurrentFilters(id);
        },
      });
  }

  protected openEditDialog(row: MatrixClassDto): void {
    this.editingClass.set(row);
    this.editForm.patchValue({
      timeSlotId: row.timeSlot?.id ?? 0,
      professorId: row.professor?.id ?? 0,
      authorizedCourseIds: row.authorizedCourses?.map((c) => c.id) ?? [],
    });
    this.editDialogVisible.set(true);
  }

  protected closeEditDialog(): void {
    this.editDialogVisible.set(false);
    this.editingClass.set(null);
  }

  protected submitEdit(): void {
    if (this.editForm.invalid) return;
    const matrixId = this.matrixId();
    const cls = this.editingClass();
    if (matrixId == null || cls == null) return;
    const v = this.editForm.getRawValue();
    const body: UpdateClassRequestDto = {
      timeSlotId: v.timeSlotId,
      professorId: v.professorId,
      authorizedCourseIds: v.authorizedCourseIds ?? [],
    };
    this.editing.set(true);
    this.coordinator
      .updateClass(matrixId, cls.id, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.editing.set(false))
      )
      .subscribe({
        next: () => {
          this.closeEditDialog();
          this.loadWithCurrentFilters(matrixId);
        },
      });
  }

  protected formatTimeSlot(slot: MatrixClassDto['timeSlot']): string {
    return formatTimeSlotLabel(slot);
  }

  protected formatCourses(courses: MatrixClassDto['authorizedCourses']): string {
    if (!courses?.length) return '—';
    return courses.map((c) => c.name).join(', ');
  }

  protected trackById(_index: number, item: MatrixClassDto): number {
    return item.id;
  }

  protected confirmDelete(row: MatrixClassDto): void {
    const matrixId = this.matrixId();
    if (matrixId == null) return;
    this.confirmationService.confirm({
      header: 'Excluir turma',
      message: `Excluir a turma "${row.subject?.name ?? '—'}" neste horário? A turma será desativada (exclusão lógica).`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.executeDelete(matrixId, row.id),
    });
  }

  private executeDelete(matrixId: number, classId: number): void {
    this.loading.set(true);
    this.coordinator
      .deleteClass(matrixId, classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadWithCurrentFilters(matrixId),
        error: () => this.loading.set(false),
      });
  }
}
