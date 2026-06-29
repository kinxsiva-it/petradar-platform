import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideDynamicIcon, type LucideIcon } from '@lucide/angular';
export interface MapFilterChip {
  key: 'condition' | 'species' | 'status';
  value: string;
  label: string;
  icon: LucideIcon;
  tone: 'cat' | 'dog' | 'other' | 'injured' | 'match' | 'rescue' | 'reunited';
  active: boolean;
}
@Component({
  selector: 'pr-map-filter-chips',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './map-filter-chips.component.html',
  styleUrl: './map-filter-chips.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapFilterChipsComponent {
  readonly chips = input.required<readonly MapFilterChip[]>();
  readonly chipToggled = output<MapFilterChip>();
}
