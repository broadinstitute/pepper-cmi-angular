import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivityContentBlock } from '../../../models/activity/activityContentBlock';

@Component({
    selector: 'ddp-activity-content',
    template: `
    <div *ngIf="block.title" [innerHTML]="sanitizer.bypassSecurityTrustHtml(block.title)"></div>
    <div class="ddp-content" [innerHTML]="sanitizedContent"></div>`
})
export class ActivityContentComponent implements OnChanges {
    @Input() block: ActivityContentBlock;
    public sanitizedContent: SafeHtml;

    constructor(public sanitizer: DomSanitizer) {}

    ngOnChanges(): void {
        // only update content on changes to avoid unnecessary rerenders which
        // cause html elements (e.g. `details`) to be recreated that resets their existing (opened/closed) state
        this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.block.content || '');
    }
}
