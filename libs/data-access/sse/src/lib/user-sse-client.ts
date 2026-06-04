import { Injectable } from '@angular/core';
import { OrderStreamEvent } from '@restaurant-platform/shared-types';
import { SseClient } from './sse-client';

@Injectable({ providedIn: 'root' })
export class UserSseClient extends SseClient<OrderStreamEvent> {}
