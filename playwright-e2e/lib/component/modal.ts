import { Locator, Page } from '@playwright/test';
import Button from 'lib/widget/button';

export default class Modal {
  private readonly rootSelector: Locator;

  constructor(private readonly page: Page) {
    this.page = page;
    this.rootSelector = this.page.locator('[aria-modal="true"][role="dialog"]');
  }

  toLocator(): Locator {
    return this.rootSelector;
  }

  getButton(opts: { label?: string; ddpTestID?: string }): Button {
    const { label, ddpTestID } = opts;
    return new Button(this.page, { label, ddpTestID, root: this.toLocator() });
  }
}
