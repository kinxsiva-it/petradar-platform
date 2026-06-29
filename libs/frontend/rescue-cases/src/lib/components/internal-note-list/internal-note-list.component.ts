import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { InternalNote } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-internal-note-list',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './internal-note-list.component.css',
  templateUrl: './internal-note-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternalNoteListComponent {
  readonly notes = input.required<InternalNote[]>();
  readonly noteAdded = output<string>();
  readonly draft = signal('');
  readonly error = signal('');

  submit(): void {
    if (!this.draft().trim()) {
      this.error.set('Add an internal note before submitting.');
      return;
    }
    this.noteAdded.emit(this.draft());
    this.draft.set('');
    this.error.set('');
  }
}
