import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PetRadarNavbarComponent } from './pet-radar-navbar.component.js';

@Component({
  selector: 'pr-app-shell',
  standalone: true,
  imports: [PetRadarNavbarComponent, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}
