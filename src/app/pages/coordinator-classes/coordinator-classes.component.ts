import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coordinator-classes',
  standalone: true,
  template: '<p>Coordinator classes for matrix {{ matrixId }} (placeholder)</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatorClassesComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly matrixId = this.route.snapshot.paramMap.get('id') ?? '';
}
