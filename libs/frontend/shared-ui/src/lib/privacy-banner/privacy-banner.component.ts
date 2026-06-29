import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-privacy-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-banner.component.html',
  styleUrl: './privacy-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyBannerComponent {}
