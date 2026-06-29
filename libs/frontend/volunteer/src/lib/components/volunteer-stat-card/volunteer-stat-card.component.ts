import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-volunteer-stat-card',
  standalone: true,
  styleUrl: './volunteer-stat-card.component.css',
  template: `
    <article>
      <span>{{ value() }}</span>
      <strong>{{ label() }}</strong>
      <small>{{ hint() }}</small>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerStatCardComponent {
  readonly hint = input('');
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
}
