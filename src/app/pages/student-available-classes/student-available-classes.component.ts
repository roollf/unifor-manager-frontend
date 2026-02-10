import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-student-available-classes',
  standalone: true,
  template: '<p>Available classes (placeholder)</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAvailableClassesComponent {}
