import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import {
  RealtimeFeedService,
  FeedImageEvent,
  FeedTextEvent,
  FeedType,
  FeedStatus,
  FeedHealth,
  FeedMetrics,
  FeedDiagnostics,
} from '../../services/realtime-feed.service';

@Component({
  selector: 'pw-feed',
  standalone: true,
  templateUrl: './feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent],
})
export class FeedComponent implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly feedService = inject(RealtimeFeedService);

  /** Current feed mode (image or text) - writable signal for reactivity */
  private readonly currentMode: WritableSignal<FeedType> = signal<FeedType>('image');

  /** Current feed mode as a readonly signal for template binding */
  readonly feedMode: Signal<FeedType> = this.currentMode.asReadonly();

  /** Image feed items from RealtimeFeedService */
  readonly feedItems: Signal<FeedImageEvent[]> = this.feedService.imageFeedItems;

  /** Text feed items from RealtimeFeedService */
  readonly textFeedItems: Signal<FeedTextEvent[]> = this.feedService.textFeedItems;

  /** Current feed status */
  readonly status: Signal<FeedStatus> = computed(() => this.feedService.statusSignal(this.currentMode())());

  /** Current feed health */
  readonly health: Signal<FeedHealth> = computed(() => this.feedService.healthSignal(this.currentMode())());

  /** Current feed metrics */
  readonly metrics: Signal<FeedMetrics> = computed(() => this.feedService.metricsSignal(this.currentMode())());

  /** Current feed diagnostics */
  readonly diagnostics: Signal<FeedDiagnostics> = computed(() =>
    this.feedService.diagnosticsSignal(this.currentMode())()
  );

  /** Whether the current feed is paused */
  readonly isPaused: Signal<boolean> = computed(() => this.feedService.pausedSignal(this.currentMode())());

  /** Current error message, if any */
  readonly error: Signal<string | null> = computed(() => this.feedService.errorSignal(this.currentMode())());

  ngOnInit(): void {
    // Start the image feed by default
    this.feedService.start('image', { reset: true });
  }

  /**
   * Toggle between image and text feed modes
   */
  toggleFeedMode(mode: FeedType): void {
    const current = this.currentMode();
    if (current === mode) return;

    // Stop the current feed
    this.feedService.stop(current, { keepItems: false });

    // Switch mode
    this.currentMode.set(mode);

    // Start the new feed
    this.feedService.start(mode, { reset: true });
  }

  /**
   * Toggle pause state for the current feed
   */
  togglePause(): void {
    const result = this.feedService.togglePause(this.currentMode());
    if (result.paused) {
      this.toast.show('Feed paused.');
    } else {
      const flushedMsg = result.flushed > 0 ? ` Flushed ${result.flushed} buffered events.` : '';
      this.toast.show(`Feed resumed.${flushedMsg}`);
    }
  }

  ngOnDestroy(): void {
    // Stop all feeds when component is destroyed
    this.feedService.stop('image', { keepItems: false });
    this.feedService.stop('text', { keepItems: false });
  }
}
