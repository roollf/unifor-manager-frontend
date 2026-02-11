import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { StudentService } from '@unifor-manager/api';
import type { EnrollmentDto } from '@unifor-manager/api';
import { formatTimeSlotLabel } from '@unifor-manager/api';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs/operators';

/**
 * Student enrollments list (VE-01, VE-02, VE-03).
 * Displays subject, professor, time slot, enrolledAt. Loading and empty states.
 */
@Component({
  selector: 'app-student-enrollments',
  standalone: true,
  imports: [TableModule, DatePipe],
  templateUrl: './student-enrollments.component.html',
  styleUrl: './student-enrollments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentsComponent {
  private readonly student = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly enrollments = signal<EnrollmentDto[]>([]);
  protected readonly loading = signal(false);

  constructor() {
    this.loadEnrollments();
  }

  protected loadEnrollments(): void {
    this.loading.set(true);
    this.student
      .listEnrollments()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (list) => this.enrollments.set(list),
      });
  }

  protected formatTimeSlot(slot: EnrollmentDto['timeSlot']): string {
    return formatTimeSlotLabel(slot);
  }

  protected trackById(_index: number, item: EnrollmentDto): number {
    return item.id;
  }
}
