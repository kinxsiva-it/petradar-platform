import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppShellComponent } from '@petradar/frontend/core';

@Component({
  selector: 'pr-root',
  standalone: true,
  imports: [AppShellComponent],
  template: '<pr-app-shell></pr-app-shell>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
