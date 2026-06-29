import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-lost-pet-photo-gallery',
  standalone: true,
  templateUrl: './lost-pet-photo-gallery.component.html',
  styleUrl: './lost-pet-photo-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetPhotoGalleryComponent {
  readonly alt = input.required<string>();
  readonly photos = input.required<readonly string[]>();
}

