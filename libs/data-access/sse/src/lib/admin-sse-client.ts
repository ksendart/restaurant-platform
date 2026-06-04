import { Injectable } from '@angular/core';
import { AdminOrderStreamEvent } from '@restaurant-platform/shared-types';
import { SseClient } from './sse-client';

@Injectable({ providedIn: 'root' })
export class AdminSseClient extends SseClient<AdminOrderStreamEvent> {}
