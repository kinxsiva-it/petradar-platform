import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-admin-cms-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './admin-cms-dashboard-page.component.css',
  templateUrl: './admin-cms-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCmsDashboardPageComponent {}
