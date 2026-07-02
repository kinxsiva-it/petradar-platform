import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'pr-volunteer-layout',
  standalone: true,
  imports: [RouterOutlet],
  styleUrl: './volunteer-layout.component.css',
  templateUrl: './volunteer-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerLayoutComponent {}
