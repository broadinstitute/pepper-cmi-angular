import { Locator, Page } from '@playwright/test';
import WidgetBase from 'lib/widget/widget-base';

export default class TextArea extends WidgetBase {
  private readonly elementLocator: Locator;
  private readonly rootLocator: Locator;

  /**
   * @param {Page} page
   * @param {{label?: string, ddpTestID?: string, root?: Locator | string, exactMatch?: boolean}} opts
   */
  constructor(page: Page, opts: { label?: string; ddpTestID?: string; root?: Locator | string; exactMatch?: boolean } = {}) {
    super(page);
    const { label, ddpTestID, root, exactMatch = false } = opts;
    this.rootLocator = root ? (typeof root === 'string' ? this.page.locator(root) : root) : this.page.locator('mat-form-field');
    // prettier-ignore
    this.elementLocator = ddpTestID
        ? this.rootLocator.locator(`textarea[data-ddp-test="${ddpTestID}"]`) // Label ignored if ddpTestID is specified
        : exactMatch
            ? this.rootLocator.locator(`//textarea[@id=(//label[.//text()[normalize-space()="${label}"]]/@for)]`)
            : this.rootLocator.locator(`//textarea[@id=(//label[contains(normalize-space(.),"${label}")]/@for)]`);
  }

  async fill(value: string): Promise<void> {
    await this.toLocator().fill(value);
    await this.toLocator().press('Tab');
  }

  toLocator(): Locator {
    return this.elementLocator;
  }
}
