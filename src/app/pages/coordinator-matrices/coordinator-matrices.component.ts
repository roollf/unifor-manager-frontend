import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CoordinatorService } from '@unifor-manager/api';
import type { MatrixListItemDto } from '@unifor-manager/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-coordinator-matrices',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TableModule,
    Button,
    Dialog,
    InputText,
    Tag,
  ],
  templateUrl: './coordinator-matrices.component.html',
  styleUrl: './coordinator-matrices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorMatricesComponent {
  private readonly coordinator = inject(CoordinatorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly matrices = signal<MatrixListItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly createDialogVisible = signal(false);
  protected readonly creating = signal(false);
  /** Matrix ID currently being activated (for button loading state). */
  protected readonly activatingMatrixId = signal<number | null>(null);

  protected createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    this.loadMatrices();
  }

  protected loadMatrices(): void {
    this.loading.set(true);
    this.coordinator
      .listMatrices()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (list) => this.matrices.set(list),
      });
  }

  protected openCreateDialog(): void {
    this.createForm.reset({ name: '' });
    this.createDialogVisible.set(true);
  }

  protected closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  protected submitCreate(): void {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    const name = this.createForm.controls.name.value.trim();
    this.coordinator
      .createMatrix({ name })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.creating.set(false))
      )
      .subscribe({
        next: () => {
          this.closeCreateDialog();
          this.loadMatrices();
        },
      });
  }

  protected activateMatrix(matrix: MatrixListItemDto): void {
    if (matrix.active) return;
    this.activatingMatrixId.set(matrix.id);
    this.coordinator
      .activateMatrix(matrix.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.activatingMatrixId.set(null))
      )
      .subscribe({
        next: () => this.loadMatrices(),
      });
  }

  protected trackById(_index: number, item: MatrixListItemDto): number {
    return item.id;
  }
}
