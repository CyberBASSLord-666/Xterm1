import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Reusable skeleton loading component for showing loading states.
 * Provides consistent loading UI across the application.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div 
      class="skeleton animate-pulse"
      [class]="customClass"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
    ></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--bg-secondary) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        var(--bg-secondary) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '4px';
  @Input() customClass: string = '';
}
