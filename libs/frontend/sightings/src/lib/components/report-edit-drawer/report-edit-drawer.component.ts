import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { UserReport } from '@petradar/frontend/mock-data';

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
  readonly closed = output<void>();
  readonly saved = output<string>();
}
