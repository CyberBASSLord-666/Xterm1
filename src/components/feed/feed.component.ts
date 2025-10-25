import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { ToastService } from '../../services/toast.service';

interface FeedImageEvent {
  prompt: string;
  imageURL: string;
  model: string;
  seed?: number;
  width: number;
  height: number;
}

interface FeedTextEvent {
  response: string;
  model: string;
  messages?: { role: string; content: string }[];
}

@Component({
  selector: 'pw-feed',
  templateUrl: './feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedComponent implements OnInit, OnDestroy {
  private toast = inject(ToastService);

  feedItems = signal<FeedImageEvent[]>([]);
  textFeedItems = signal<FeedTextEvent[]>([]);
  feedMode = signal<'image' | 'text'>('image');
  isPaused = signal<boolean>(false);

  private imageEventSource: EventSource | null = null;
  private textEventSource: EventSource | null = null;

  // Reconnection backoff strategy properties
  private imageReconnectDelay = 2000; // ms
  private textReconnectDelay = 2000; // ms
  private readonly maxReconnectDelay = 30000; // 30 seconds

  ngOnInit(): void {
    this.connectImageFeed();
  }

  connectImageFeed(): void {
    this.imageEventSource?.close();
    this.imageEventSource = new EventSource('https://image.pollinations.ai/feed');

    this.imageEventSource.onopen = (): void => {
      // Reset delay on successful connection
      this.imageReconnectDelay = 2000;
    };

    this.imageEventSource.onmessage = (event): void => {
      if (!event.data || this.feedMode() !== 'image' || this.isPaused()) return;
      try {
        const data: FeedImageEvent = JSON.parse(event.data);
        this.feedItems.update((list) => [data, ...list.slice(0, 99)]); // Keep list to 100 items
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Non-JSON image feed event:', event.data);
      }
    };

    this.imageEventSource.onerror = (err): void => {
      // eslint-disable-next-line no-console
      console.error('Image feed error, reconnecting...', err);
      this.toast.show(`Image feed disconnected. Retrying in ${this.imageReconnectDelay / 1000}s.`);
      this.imageEventSource?.close(); // Close the faulty source

      setTimeout(() => {
        this.connectImageFeed();
      }, this.imageReconnectDelay);

      // Increase delay for the next attempt
      this.imageReconnectDelay = Math.min(this.imageReconnectDelay * 2, this.maxReconnectDelay);
    };
  }

  connectTextFeed(): void {
    this.textEventSource?.close();
    this.textEventSource = new EventSource('https://text.pollinations.ai/feed');

    this.textEventSource.onopen = (): void => {
      // Reset delay on successful connection
      this.textReconnectDelay = 2000;
    };

    this.textEventSource.onmessage = (event): void => {
      if (!event.data || this.feedMode() !== 'text' || this.isPaused()) return;
      try {
        const data: FeedTextEvent = JSON.parse(event.data);
        this.textFeedItems.update((list) => [data, ...list.slice(0, 99)]);
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Non-JSON text feed event:', event.data);
      }
    };

    this.textEventSource.onerror = (err): void => {
      // eslint-disable-next-line no-console
      console.error('Text feed error, reconnecting...', err);
      this.toast.show(`Text feed disconnected. Retrying in ${this.textReconnectDelay / 1000}s.`);
      this.textEventSource?.close(); // Close the faulty source

      setTimeout(() => this.connectTextFeed(), this.textReconnectDelay);

      // Increase delay for the next attempt
      this.textReconnectDelay = Math.min(this.textReconnectDelay * 2, this.maxReconnectDelay);
    };
  }

  toggleFeedMode(mode: 'image' | 'text'): void {
    if (this.feedMode() === mode) return;

    this.feedMode.set(mode);
    if (mode === 'image') {
      this.textEventSource?.close();
      this.textEventSource = null;
      this.textFeedItems.set([]);
      this.connectImageFeed();
    } else {
      this.imageEventSource?.close();
      this.imageEventSource = null;
      this.feedItems.set([]);
      this.connectTextFeed();
    }
  }

  togglePause(): void {
    this.isPaused.update((v) => !v);
    this.toast.show(this.isPaused() ? 'Feed paused.' : 'Feed resumed.');
  }

  ngOnDestroy(): void {
    this.imageEventSource?.close();
    this.textEventSource?.close();
  }
}
