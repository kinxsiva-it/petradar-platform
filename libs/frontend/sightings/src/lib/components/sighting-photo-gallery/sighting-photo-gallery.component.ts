import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-sighting-photo-gallery',
  standalone: true,
  templateUrl: './sighting-photo-gallery.component.html',
  styleUrl: './sighting-photo-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SightingPhotoGalleryComponent {
  readonly alt = input.required<string>();
  readonly photos = input.required<readonly string[]>();
}

