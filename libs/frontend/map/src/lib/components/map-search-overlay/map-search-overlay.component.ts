import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  LucideSearch,
  LucideSlidersHorizontal,
} from '@lucide/angular';

@Component({
  selector: 'pr-map-search-overlay',
  standalone: true,
  imports: [
    FormsModule,
    LucideSearch,
    LucideSlidersHorizontal,
  ],
  templateUrl: './map-search-overlay.component.html',
  styleUrl: './map-search-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSearchOverlayComponent {
  readonly query = input('');
  readonly queryChanged = output<string>();
  readonly filtersOpened = output();
}
