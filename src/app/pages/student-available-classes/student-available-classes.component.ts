import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { StudentService } from '@unifor-manager/api';
import type {
  AvailableClassDto,
  ListAvailableClassesParams,
  SubjectDto,
} from '@unifor-manager/api';
import { formatTimeSlotLabel } from '@unifor-manager/api';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { finalize } from 'rxjs/operators';

/**
 * Student available classes list and enroll (Phase 5).
 * Optional filters: matrixId, subjectId. Shows availableSeats, authorizedForStudentCourse.
 * Enroll per row; on success refresh list and show toast; 409 handled by error interceptor.
 */
@Component({
  selector: 'app-student-available-classes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TableModule,
    Button,
    Tag,
    Select,
    InputNumber,
  ],
  templateUrl: './student-available-classes.component.html',
  styleUrl: './student-available-classes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAvailableClassesComponent {
  private readonly student = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly classes = signal<AvailableClassDto[]>([]);
  protected readonly loading = signal(false);
  /** ID of the class currently being enrolled (for per-row loading). */
  protected readonly enrollingClassId = signal<number | null>(null);
  /** Current student course (for display). undefined = loading, null = not set or error. */
  protected readonly studentCourse = signal<{ id: number; name: string } | null | undefined>(undefined);

  /** Unique subjects from current list for filter dropdown. */
  protected readonly subjectOptions = computed(() => {
    const list = this.classes();
    const seen = new Set<number>();
    const options: SubjectDto[] = [];
    for (const c of list) {
      if (!seen.has(c.subject.id)) {
        seen.add(c.subject.id);
        options.push(c.subject);
      }
    }
    return options;
  });

  protected filterForm = this.fb.nonNullable.group({
    matrixId: this.fb.control<number | null>(null),
    subjectId: this.fb.control<number | null>(null),
  });

  constructor() {
    this.loadAvailableClasses();
    this.loadStudentCourse();
  }

  private loadStudentCourse(): void {
    this.student
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (me) => this.studentCourse.set(me.course),
      });
  }

  private buildParams(): ListAvailableClassesParams {
    const v = this.filterForm.getRawValue();
    const params: ListAvailableClassesParams = {};
    if (v.matrixId != null) params.matrixId = v.matrixId;
    if (v.subjectId != null) params.subjectId = v.subjectId;
    return params;
  }

  protected loadAvailableClasses(): void {
    this.loading.set(true);
    this.student
      .listAvailableClasses(this.buildParams())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (list) => this.classes.set(list),
      });
  }

  protected applyFilters(): void {
    this.loadAvailableClasses();
  }

  protected enroll(cls: AvailableClassDto): void {
    if (cls.availableSeats <= 0 || !cls.authorizedForStudentCourse) return;
    this.enrollingClassId.set(cls.id);
    this.student
      .enroll({ matrixClassId: cls.id })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.enrollingClassId.set(null))
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Matrícula realizada',
            detail: `Você foi matriculado em ${cls.subject.name}.`,
          });
          this.loadAvailableClasses();
        },
      });
  }

  protected formatTimeSlot(slot: AvailableClassDto['timeSlot']): string {
    return formatTimeSlotLabel(slot);
  }

  protected trackById(_index: number, item: AvailableClassDto): number {
    return item.id;
  }
}
