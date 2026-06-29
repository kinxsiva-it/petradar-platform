import { ChangeDetectionStrategy, Component, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pr-rescue-photo-update',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './rescue-photo-update.component.css',
  templateUrl: './rescue-photo-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescuePhotoUpdateComponent implements OnDestroy {
  readonly photoAdded = output<{ url: string; caption: string }>();
  readonly previewUrl = signal<string | null>(null);
  readonly caption = signal('');
  readonly progress = signal(0);
  readonly error = signal('');

  ngOnDestroy(): void {
    this.revokePreview();
  }

  addFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.error.set('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.error.set('Use JPG, PNG, or WebP for mock photo updates.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('Mock photo must be 10MB or smaller.');
      return;
    }
    this.revokePreview();
    this.previewUrl.set(URL.createObjectURL(file));
    this.progress.set(100);
  }

  remove(): void {
    this.revokePreview();
    this.progress.set(0);
  }

  failPreview(): void {
    this.error.set('Upload failed presentation: please choose another photo.');
    this.progress.set(0);
  }

  submit(): void {
    const url = this.previewUrl();
    if (!url) {
      this.error.set('Choose a photo before adding an update.');
      return;
    }
    this.photoAdded.emit({ caption: this.caption(), url });
    this.previewUrl.set(null);
    this.caption.set('');
    this.progress.set(0);
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}
