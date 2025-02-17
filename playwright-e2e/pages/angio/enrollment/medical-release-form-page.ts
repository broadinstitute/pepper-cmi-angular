import { expect, Locator, Page } from '@playwright/test';
import Institution from 'lib/component/institution';
import Checkbox from 'lib/widget/checkbox';
import { AngioPageBase } from 'pages/angio/angio-page-base';
import { waitForNoSpinner } from 'utils/test-utils';

export default class MedicalReleaseFormPage extends AngioPageBase {
  private readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = this.page.locator('h1.PageHeader-title');
  }

  async waitForReady(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ visible: true });
    await expect(this.pageTitle).toHaveText('About you');
    await waitForNoSpinner(this.page);
  }

  /**
   * <br> Questions: Your Physicians' Names
   * <br> Type: Institution Form
   */
  yourPhysiciansNames(institutionIndex?: number): Institution {
    return new Institution(this.page, { label: "Your Physicians' Names", nth: institutionIndex });
  }

  /**
   * <br> Questions: Your Hospital / Institution
   * <br> Where was your initial biopsy for angiosarcoma performed?
   * <br> Type: Institution Form
   */
  yourHospitalInstitution(institutionIndex?: number): Institution {
    return new Institution(this.page, { label: 'Your Hospital / Institution', nth: institutionIndex });
  }

  /**
   * <br> Questions: Where were any other biopsies or surgeries for your angiosarcoma performed?
   * <br> Type: Institution Form
   */
  otherBiopsiesOrSurgeries(institutionIndex?: number): Institution {
    return new Institution(this.page, {
      label: 'Where were any other biopsies or surgeries for your angiosarcoma performed',
      nth: institutionIndex
    });
  }

  /**
   * <br> Question: I have already read and signed the informed consent document ...
   * @returns {Checkbox}
   */
  acknowledge(): Checkbox {
    return new Checkbox(this.page, { label: 'I have already read and signed the informed consent document' });
  }
}
