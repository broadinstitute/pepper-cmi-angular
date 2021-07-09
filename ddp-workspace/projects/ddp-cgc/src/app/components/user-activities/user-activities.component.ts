import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivityInstance, ActivityStatusCodes } from 'ddp-sdk';
import { BaseActivities } from '../base-activities/base-activities.component';


@Component({
  selector: 'app-user-activities',
  templateUrl: './user-activities.component.html',
  styleUrls: ['./user-activities.component.scss']
})
export class UserActivitiesComponent extends BaseActivities {
  ActivityStatusCode = ActivityStatusCodes;
  displayedColumns: string[] = ['name', 'status', 'actions'];
}
