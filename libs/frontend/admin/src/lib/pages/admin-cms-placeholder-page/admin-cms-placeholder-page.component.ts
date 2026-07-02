import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'pr-admin-cms-placeholder-page',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './admin-cms-placeholder-page.component.css',
  templateUrl: './admin-cms-placeholder-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCmsPlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = String(this.route.snapshot.data['title'] ?? 'Admin CMS section');
  readonly description = String(
    this.route.snapshot.data['description'] ??
      'This CMS section is reserved for a focused implementation pass.',
  );
}
