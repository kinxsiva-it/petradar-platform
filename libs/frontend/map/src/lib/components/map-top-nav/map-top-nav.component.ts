import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideChevronDown,
  LucideGitFork,
  LucideHeart,
  LucideMap,
  LucidePawPrint,
  LucidePlus,
} from '@lucide/angular';
@Component({
  selector: 'pr-map-top-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBell,
    LucideChevronDown,
    LucideGitFork,
    LucideHeart,
    LucideMap,
    LucidePawPrint,
    LucidePlus,
  ],
  templateUrl: './map-top-nav.component.html',
  styleUrl: './map-top-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapTopNavComponent {}
