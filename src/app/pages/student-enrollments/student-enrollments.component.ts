import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-student-enrollments',
  standalone: true,
  template: '<p>My enrollments (placeholder)</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentsComponent {}
