import { ActivitySection } from './activitySection';
import { ReplaySubject } from 'rxjs';

export class ActivityForm {
    public readonly: boolean;
    public name: string;
    public sections: Array<ActivitySection>;
    public introduction: ActivitySection;
    public closing: ActivitySection;
    public formType: string;
    public activityCode: string;
    public subtitle: string | null;
    public readonlyHint: string | null;
    public lastUpdatedText?: string;
    public lastUpdated?: Date;
    public validationState: ReplaySubject<boolean> = new ReplaySubject();

    constructor() {
        this.sections = new Array<ActivitySection>();
    }

    public validate(): boolean {
        let isValid = true;
        for (const section of this.getAllSections()) {
            isValid = section.validate() && isValid;
        }
        this.validationState.next(isValid);
        return isValid;
    }

    public shouldScrollToFirstInvalidQuestion(): void {
        for (const section of this.sections) {
            if (section.shouldScrollToFirstInvalidQuestion()) {
                return;
            }
        }
    }

    public recalculateSectionsVisibility(): void {
        this.sections.forEach(section => section.recalculateVisibility());
    }

    public isSomeSectionVisible(): boolean {
        this.recalculateSectionsVisibility();
        return this.sections.some(section => section.visible === true);
    }

    private getAllSections(): Array<ActivitySection> {
        const allSections: ActivitySection[] = [];
        this.introduction && allSections.push(this.introduction);
        allSections.push.apply(allSections, this.sections);
        this.closing && allSections.push(this.closing);
        return allSections;
    }
}
