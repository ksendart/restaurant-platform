import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { PingResponse } from '@restaurant-platform/shared-types';

@Component({
  selector: 'rp-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ping = httpResource<PingResponse>(() => '/api/ping');
}
