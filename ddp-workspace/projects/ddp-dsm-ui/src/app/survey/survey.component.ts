import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DSMService } from '../services/dsm.service';
import { Auth } from '../services/auth.service';
import { RoleService } from '../services/role.service';
import { Result } from '../utils/result.model';
import { Statics } from '../utils/statics';
import { ComponentService } from '../services/component.service';
import { ParticipantSurveyUploadObject, Survey, SurveyStatus, TriggerResponse } from './survey.model';
import { Utils } from '../utils/utils';
import { ModalComponent } from '../modal/modal.component';
import { FieldFilepickerComponent } from '../field-filepicker/field-filepicker.component';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css']
})
export class SurveyComponent implements OnInit {
  @ViewChild(ModalComponent)
  public modal: ModalComponent;

  @ViewChild(FieldFilepickerComponent)
  public filepicker: FieldFilepickerComponent;

  errorMessage: string;
  additionalMessage: string;
  loading = false;

  realm: string;

  possibleSurveys: Array<Survey> = [];
  surveyStatus: Array<SurveyStatus> = [];
  survey: Survey;

  participantId: string = null;
  allowedToSeeInformation = false;

  file: File = null;
  reason: string = null;

  noSurveyStatus = false;

  filterParticipantId = '';
  filterShortId = '';
  filterReason = '';
  filterUser = '';

  failedTrigger: Array<ParticipantSurveyUploadObject> = [];
  alreadyTriggered: Array<ParticipantSurveyUploadObject> = [];

  constructor(private dsmService: DSMService, private auth: Auth, private router: Router, private role: RoleService,
              private compService: ComponentService, private route: ActivatedRoute, private util: Utils) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      this.realm = params[DSMService.REALM] || null;
      if (this.realm != null) {
        //        this.compService.realmMenu = this.realm;
        this.checkRight();
      }
    });
  }

  ngOnInit(): void {
    if (localStorage.getItem(ComponentService.MENU_SELECTED_REALM) != null) {
      this.realm = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
      this.checkRight();
    } else {
      this.additionalMessage = 'Please select a study';
    }
    window.scrollTo(0, 0);
  }

  private checkRight(): void {
    this.additionalMessage = null;
    this.noSurveyStatus = false;
    this.surveyStatus = [];
    this.allowedToSeeInformation = false;
    this.noSurveyStatus = false;
    this.errorMessage = null;
    this.survey = null;
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.SURVEY_CREATION).subscribe({
      next: data => {
        jsonData = data;
        jsonData.forEach((val) => {
          if (this.realm === val) {
            this.getListOfPossibleSurveys();
            this.allowedToSeeInformation = true;
          }
        });
        if (!this.allowedToSeeInformation) {
          this.additionalMessage = 'You are not allowed to see information of the selected study at that category';
        }
      },
      error: () => null
    });
  }

  getListOfPossibleSurveys(): void {
    if (this.realm !== '') {
      this.errorMessage = null;
      this.additionalMessage = null;
      this.loading = true;
      this.noSurveyStatus = false;
      this.surveyStatus = [];
      let jsonData: any[];
      this.dsmService.getPossibleSurveys(this.realm).subscribe({
        next: data => {
          this.possibleSurveys = [];
          // console.info(`received: ${JSON.stringify(data, null, 2)}`);
          jsonData = data;
          jsonData.forEach((val) => {
            const survey = Survey.parse(val);
            this.possibleSurveys.push(survey);
          });
          this.loading = false;
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.loading = false;
          this.errorMessage = 'Error - Loading list of surveys\nPlease contact your DSM developer';
        }
      });
    }
  }

  getListOfSurveyStatus(): void {
    if (this.realm !== '' && (this.survey != null && this.survey.name !== '')) {
      this.errorMessage = null;
      this.additionalMessage = null;
      this.loading = true;
      this.noSurveyStatus = false;
      let jsonData: any[];
      this.dsmService.getSurveyStatus(this.realm, this.survey.name).subscribe({
        next: data => {
          this.surveyStatus = [];
          const result = Result.parse(data);
          if (result.code === 200 && result.body === 'NO_SURVEY_STATUS') {
            this.noSurveyStatus = true;
          } else {
            // console.info(`received: ${JSON.stringify(data, null, 2)}`);
            jsonData = data;
            jsonData.forEach((val) => {
              const surveyStatus = SurveyStatus.parse(val);
              this.surveyStatus.push(surveyStatus);
            });
            this.noSurveyStatus = false;
          }
          this.loading = false;
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.loading = false;
          this.errorMessage = 'Error - Loading list of survey status\nPlease contact your DSM developer';
        }
      });
    }
  }

  triggerSurvey(): void {
    if (this.realm !== '' && (this.participantId !== '' || this.file != null)) {
      this.errorMessage = null;
      this.loading = true;
      let triggerSurveyPayload: any = null;
      let isFileUpload = false;

      if (this.participantId != null && this.participantId !== '') {
        const participantPayload = {participantId: this.participantId};
        triggerSurveyPayload = JSON.stringify(participantPayload);
      } else if (this.file != null) {
        triggerSurveyPayload = this.file;
        isFileUpload = true;
      }
      this.dsmService.triggerSurvey(this.realm, this.survey.name, this.survey.type, this.reason, isFileUpload, triggerSurveyPayload)
        .subscribe(// need to subscribe, otherwise it will not send!
          data => {
            this.loading = false;
            if (typeof data === 'string') {
              this.errorMessage = 'Error - Uploading txt.\n' + data;
            } else {
              const result = Result.parse(data);
              if (result.code === 200) {
                this.additionalMessage = 'Survey triggered';
                this.participantId = null;
                this.reason = null;
              } else {
                const response: TriggerResponse = TriggerResponse.parse(data);
                response.failedToTrigger.forEach((val) => {
                  this.failedTrigger.push(ParticipantSurveyUploadObject.parse(val));
                });
                if (this.failedTrigger.length > 0) {
                  this.errorMessage = 'Failed to trigger survey for ' + this.failedTrigger.length + ' participant(s)';
                }

                response.alreadyTriggered.forEach((val) => {
                  this.alreadyTriggered.push(ParticipantSurveyUploadObject.parse(val));
                });
                if (this.alreadyTriggered.length > 0) {
                  let showAlreadyTriggered = false;
                  for (const survey of this.possibleSurveys) {
                    if (survey.name === this.survey.name) {
                      showAlreadyTriggered = true;
                    }
                  }
                  if (showAlreadyTriggered) {
                    this.modal.show();
                  } else {
                    // eslint-disable-next-line max-len
                    this.additionalMessage = 'Your list contained participants which already had that survey.\nThese participants were ignored, rest was triggered';
                    this.getListOfSurveyStatus();
                  }
                }
                if (this.failedTrigger.length === 0 && this.alreadyTriggered.length === 0) {
                  this.additionalMessage = 'DDP was triggered to sent out survey(s).';
                  this.file = null;
                  this.filepicker.unselectFile();
                  this.reason = null;
                }
              }
            }
          }
        );
    } else {
      this.errorMessage = 'Please select a study and a survey and enter the participant ID for the participant';
    }
  }

  fileSelected(file: File): void {
    this.file = file;
  }

  getUtil(): Utils {
    return this.util;
  }

  disableButton(): boolean {
    if (!this.noSurveyStatus) {
      if ((this.participantId !== '' || this.file != null) && this.reason != null) {
        return false;
      }
    } else {
      if (this.participantId != null || this.file != null) {
        return false;
      }
    }
    return true;
  }

  triggerAgain(): void {
    for (let i = this.alreadyTriggered.length - 1; i >= 0; i--) {
      if (!this.alreadyTriggered[i].selected) {
        this.alreadyTriggered.splice(i, 1);
      }
    }
    const jsonParticipants = JSON.stringify(this.alreadyTriggered);
    // console.log(jsonParticipants);
    this.dsmService.triggerAgain(this.realm, this.survey.name, this.survey.type, this.reason + ' - (Re-triggered)', jsonParticipants)
      .subscribe({
        next: data => {
          this.loading = false;
          if (typeof data === 'string') {
            this.errorMessage = 'Error - Triggering again.\n' + data;
          } else {
            this.errorMessage = 'All surveys were triggered.';
            this.getListOfSurveyStatus();
          }
        },
        error: err => {
          this.loading = false;
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.errorMessage = 'Error - Uploading txt\n' + err;
        }
      });
    this.emptyUpload();
  }

  forgetParticipants(): void {
    this.emptyUpload();
  }

  emptyUpload(): void {
    this.modal.hide();
    this.alreadyTriggered = [];
    this.reason = null;
    this.filepicker.unselectFile();
    this.getListOfSurveyStatus();
  }

  hasRole(): RoleService {
    return this.role;
  }
}
