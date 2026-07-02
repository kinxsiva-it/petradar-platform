import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { RescueCaseCardComponent, type RescueCase } from '@petradar/frontend/rescue-cases';

@Component({
  selector: 'pr-assigned-case-list',
  standalone: true,
  imports: [RescueCaseCardComponent],
  styleUrl: './assigned-case-list.component.css',
  templateUrl: './assigned-case-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignedCaseListComponent {
  readonly cases = input.required<readonly RescueCase[]>();
  readonly title = input.required<string>();
  readonly emptyText = input('No cases in this list.');
  readonly accepted = output<string>();
}
