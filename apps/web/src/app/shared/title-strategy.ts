import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RpTitleStrategy extends TitleStrategy {
  private static readonly PREFIX = 'RP';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      pageTitle
        ? `${RpTitleStrategy.PREFIX} - ${pageTitle}`
        : RpTitleStrategy.PREFIX
    );
  }
}
