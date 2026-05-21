import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type SseStatus = 'connected' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class SseClient<T> {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private es: EventSource | null = null;
  private readonly messages = new Subject<T>();
  private readonly status = new Subject<SseStatus>();

  readonly data = signal<T | null>(null);
  readonly connected = signal(false);
  readonly messages$: Observable<T> = this.messages.asObservable();
  readonly status$: Observable<SseStatus> = this.status.asObservable();

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  connect(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.disconnect();

    const es = new EventSource(url, { withCredentials: true });
    this.es = es;

    es.onopen = () => {
      this.connected.set(true);
      this.status.next('connected');
    };
    es.onerror = () => {
      this.connected.set(false);
      this.status.next('disconnected');
    };
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        this.data.set(parsed);
        this.messages.next(parsed);
      } catch {
        // ignore malformed payloads
      }
    };
  }

  disconnect(): void {
    if (this.es) {
      this.es.close();
      this.es = null;
      this.connected.set(false);
    }
  }
}
