import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { UserReport } from '@petradar/frontend/mock-data';
import type { UpdateSightingRequest } from '../../data-access/sightings-api.models.js';

@Component({
  selector: 'pr-report-edit-drawer',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './report-edit-drawer.component.css',
  templateUrl: './report-edit-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportEditDrawerComponent {
  readonly report = input.required<UserReport>();
  readonly closed = output();
  readonly saved = output<{ id: string; changes: UpdateSightingRequest }>();

  color = '';
  pattern = '';
  description = '';

  constructor() {
    effect(() => {
      const report = this.report();
      this.color = report.color;
      this.pattern = report.pattern;
      this.description = report.description;
    });
  }

  save(): void {
    this.saved.emit({
      changes: {
        color: this.color,
        description: this.description,
        pattern: this.pattern,
      },
      id: this.report().id,
    });
  }
}
