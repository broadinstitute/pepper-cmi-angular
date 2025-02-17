import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Questions } from '../field-question-array/field-question-array.model';
import { AbstractionField } from '../medical-record-abstraction/model/medical-record-abstraction-field.model';
import { Participant } from '../participant-list/participant-list.model';
import { NameValue } from '../utils/name-value.model';
import { Auth } from '../services/auth.service';
import { Statics } from '../utils/statics';
import { DSMService } from '../services/dsm.service';
import { Router } from '@angular/router';
import { ComponentService } from '../services/component.service';
import { RoleService } from '../services/role.service';
import { ModalComponent } from '../modal/modal.component';
import { AbstractionFieldValue } from '../medical-record-abstraction/model/abstraction-field-value.model';

@Component({
  selector: 'app-abstraction-field',
  templateUrl: './abstraction-field.component.html',
  styleUrls: [ './abstraction-field.component.css' ]
})
export class AbstractionFieldComponent implements OnInit {

  @ViewChild(ModalComponent)
  public noteModal: ModalComponent;

  @Input() participant: Participant;
  @Input() field: AbstractionField;
  @Input() viewValue: AbstractionFieldValue; // to display at type qc the abstraction or review values
  @Input() activityOfField: string;
  @Input() activeFile: string;
  @Input() availableFileNames: string[] = [];
  @Input() availableDrugs: string[] = [];
  @Input() availableCancers: string[] = [];
  @Input() type: string;
  @Input() readonly: boolean;
  @Input() hideDoubleCheck = false;
  @Output() emitFileFromField = new EventEmitter();

  currentPatchField: string;
  currentPatchPart: string;
  patchFinished = true;

  modalFieldName: string;
  tmpValue: string;
  modalReadOnly: boolean;
  _other: string;

  constructor(private dsmService: DSMService, private router: Router, private compService: ComponentService, private role: RoleService) {
  }

  ngOnInit(): void {
    this.setOtherOptionText();
  }

  setOtherOptionText(): void {
    if (this.field.type === 'multi_options' || this.field.additionalType === 'multi_options') {
      if (this.field.fieldValue.value != null && this.field.fieldValue.value !== '') {
        if (this.field.fieldValue.value.indexOf('{') === 0) {
          if (typeof this.field.fieldValue.value === 'string') {
            const tmp = JSON.parse(this.field.fieldValue.value);
            if (tmp[ 'other' ] != null) {
              this._other = tmp[ 'other' ];
              const value = tmp[ this.field.displayName ];
              this.field.fieldValue.value = value;
            } else {
              const value = tmp[ this.field.displayName ];
              if (value.indexOf('[') !== 0) {
                const array: string[] = [];
                array.push(value);
                this.field.fieldValue.value = array;
              } else {
                const array: string[] = JSON.parse(value);
                this.field.fieldValue.value = array;
              }
            }
          }
        } else {
          if (!(this.field.fieldValue.value instanceof Array)) {
            if (this.field.fieldValue.value.indexOf('[') !== 0) {
              const array: string[] = [];
              array.push(this.field.fieldValue.value);
              this.field.fieldValue.value = array;
              if (array.includes('other')) {
                this._other = '';
              }
            } else {
              const array: string[] = JSON.parse(this.field.fieldValue.value);
              this.field.fieldValue.value = array;
              if (array.includes('other')) {
                this._other = '';
              }
            }
          }
        }
      } else {
        this._other = '';
        const array: string[] = [];
        this.field.fieldValue.value = array;
      }
    } else if (this.field.type === 'options' || this.field.additionalType === 'options') {
      if (this.field.fieldValue.value != null) {
        if (this.field.fieldValue.value.indexOf('{') === 0) {
          const tmp: any = JSON.parse(String(this.field.fieldValue.value));
          if (tmp[ 'other' ] != null && tmp[ 'other' ] !== '') {
            if (tmp[ 'other' ].indexOf('{') === -1) {
              this._other = String(tmp[ 'other' ]);
              this.field.fieldValue.value = tmp[ this.field.displayName ];
            }
          } else {
            this._other = '';
          }
        }
      }
    }
  }

  abstractionValueChanged(value: any, field: AbstractionField, fieldName: string): void {
    this.patchFinished = false;
    let putOtherBack = false;
    let v;
    if (typeof value === 'string') {
      v = value;
    } else {
      if (value.srcElement != null && typeof value.srcElement.value === 'string') {
        v = value.srcElement.value;
      } else if (value.value != null) {
        v = value.value;
      } else if (value.checked != null) {
        v = value.checked;
      } else if (value.source.value != null && value.source.selected) {
        v = value.source.value;
      }
    }

    if (v !== null) {
      if (field.type === 'textarea' &&
        !['note', 'question', 'noData', 'filePage', 'matchPhrase'].includes(fieldName)
      ) {
        field.fieldValue.value = v.toUpperCase();
      }
      if (fieldName === 'value' && field.type === 'date') {
        field.fieldValue.value = v;
      } else if (fieldName === 'value' &&
        ( field.type === 'multi_options' || field.additionalType === 'multi_options' ||
          field.type === 'options' || field.additionalType === 'options')
      ) {
        if (field.fieldValue.value.indexOf('other') > -1) {
          if (this._other !== '' && this._other != null) {
            const selectName = field.displayName;
            const tmp = {
              other: this._other
            };
            tmp[ selectName ] = field.fieldValue.value;
            v = JSON.stringify(tmp);
            fieldName = 'value';
          } else {
            this._other = '';
          }
          putOtherBack = true;
        } else {
          this._other = null;
        }
      } else if (fieldName === 'other') {
        const selectName = field.displayName;
        const tmp = {
          other: this._other
        };
        tmp[ selectName ] = field.fieldValue.value;
        v = JSON.stringify(tmp);
        fieldName = 'value';
        putOtherBack = true;
      }
      if (fieldName === 'value' || (fieldName === 'noData' && field.fieldValue.value != null && field.fieldValue.value !== '')) {
        field.fieldValue.valueCounter++;
      }
      if (fieldName === 'fileName') {
        if (v != null && v !== '') {
          this.addFileNameToList(v);
        }
      } else {
        if (this.activeFile != null && this.activeFile !== '') {
          field.fieldValue.fileName = this.activeFile;
        }
      }
      let patch = null;
      // no data selected
      if (fieldName === 'noData' && field.fieldValue.value != null && field.fieldValue.value !== '') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_noData', value: v},
            {name: this.activityOfField + '_value', value: null},
            {name: this.activityOfField + '_valueCounter', value: field.fieldValue.valueCounter},
            {name: this.activityOfField + '_fileName', value: null},
            {name: this.activityOfField + '_filePage', value: null} ,
            {name: this.activityOfField + '_matchPhrase', value: null} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
        field.fieldValue.value = null;
        field.fieldValue.fileName = null;
      } else if (fieldName === 'noData') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_noData', value: v},
            {name: this.activityOfField + '_value', value: null},
            {name: this.activityOfField + '_fileName', value: null},
            {name: this.activityOfField + '_filePage', value: null} ,
            {name: this.activityOfField + '_matchPhrase', value: null}],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
        field.fieldValue.value = null;
        field.fieldValue.fileName = null;
      } else if (fieldName === 'question') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          fieldName: field.displayName,
          nameValues: [ {name: this.activityOfField + '_' + fieldName, value: v} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
      } else if (fieldName === 'note' || fieldName === 'doubleCheck' || fieldName === 'fileName') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_' + fieldName, value: v} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
      } else if (fieldName === 'value') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_' + fieldName, value: v},
            {name: this.activityOfField + '_valueCounter', value: field.fieldValue.valueCounter} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
      } else if (fieldName === 'matchPhrase') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_' + fieldName, value: v} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
      } else if (fieldName === 'filePage' && field.fieldValue.fileName != null && field.fieldValue.fileName !== '') {
        patch = {
          id: field.fieldValue.primaryKeyId,
          parentId: this.participant.participant.participantId,
          parent: 'participantId',
          user: this.role.userMail(),
          fieldId: field.medicalRecordAbstractionFieldId,
          nameValues: [ {name: this.activityOfField + '_' + fieldName, value: v},
            {name: this.activityOfField + '_fileName', value: field.fieldValue.fileName} ],
          realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          ddpParticipantId: this.participant.participant.ddpParticipantId
        };
      }
      if (fieldName !== 'note' && fieldName !== 'question') {
        this.currentPatchField = field.displayName;
        this.currentPatchPart = fieldName;
      }
      if (patch != null) {
        this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe({// need to subscribe, otherwise it will not send!
          next: data => {
            if (putOtherBack) {
              this.setOtherOptionText();
            }
            if (data) {
              if (data['primaryKeyId']) {
                field.fieldValue.primaryKeyId = data['primaryKeyId'];
              }
              if (data instanceof Array) {
                data.forEach((val) => {
                  const nameValue = NameValue.parse(val);
                  if (fieldName === 'question') {
                    this.field.fieldValue.question = nameValue.value;
                  }
                });
              }
            }
            this.patchFinished = true;
            if (fieldName !== 'note' && fieldName !== 'question') {
              this.currentPatchField = null;
              this.currentPatchPart = null;
            }
          },
          error: err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.router.navigate([ Statics.HOME_URL ]);
            }
          }
        });
      }
    }
  }

  saveSelectedQc(field: AbstractionField): void {
    field.fieldValue.valueCounter++;
    const patch = {
      id: field.fieldValue.primaryKeyId,
      parentId: this.participant.participant.participantId,
      parent: 'participantId',
      user: this.role.userMail(),
      fieldId: field.medicalRecordAbstractionFieldId,
      nameValues: [ {name: 'qc_noData', value: field.fieldValue.noData},
        {name: 'qc_value', value: field.fieldValue.value},
        {name: 'qc_valueCounter', value: field.fieldValue.valueCounter},
        {name: 'qc_fileName', value: field.fieldValue.fileName},
        {name: 'qc_filePage', value: field.fieldValue.filePage} ,
        {name: 'qc_matchPhrase', value: field.fieldValue.matchPhrase} ],
      realm : localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
      ddpParticipantId: this.participant.participant.ddpParticipantId
    };
    this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe({// need to subscribe, otherwise it will not send!
      next: data => {
      if (data) {
        if (data['primaryKeyId']) {
          field.fieldValue.primaryKeyId = data['primaryKeyId'];
          }
        }
      },
      error: err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate([ Statics.HOME_URL ]);
        }
      }
    });
  }

  addFileNameToList(fileName: string): void {
    this.emitFileFromField.emit(fileName);
  }

  currentField(field: string, part: string): void {
    if (field != null || (field == null && this.patchFinished)) {
      this.currentPatchField = field;
    }
    if (part != null || (part == null && this.patchFinished)) {
      this.currentPatchPart = part;
    }
  }

  isPatchedCurrently(field: string, part: string): boolean {
    return (this.currentPatchField === field && this.currentPatchPart === part);
  }

  doNothing(): boolean { // needed for the menu, otherwise page will refresh!
    return false;
  }

  getNoteButtonColorStyle(s: string): string {
    if (s != null && s !== '') {
      return Statics.COLOR_PRIMARY;
    }
    return Statics.COLOR_BASIC;
  }

  getQuestionButtonColorStyle(questionJson: string): string {
    if (questionJson != null && questionJson !== '') {
      const questionsModel: Questions = JSON.parse(questionJson);
      const questions = questionsModel.questions;
      for (const question of questions) {
        if (question.question != null && question.question !== '') {
          if (questionsModel.done) {
            return Statics.COLOR_RESLOVED;
          }
          return Statics.COLOR_ACCENT;
        }
      }
    }
    return Statics.COLOR_BASIC;
  }

  getQuestionTooltip(questionJson: string): string {
    let tooltip: string = null;
    if (questionJson != null && questionJson !== '') {
      const questionsModel: Questions = JSON.parse(questionJson);
      const questions = questionsModel.questions;
      for (const question of questions) {
        if (question.question != null && question.question !== '') {
          if (tooltip == null) {
            tooltip = '';
          } else {
            tooltip = tooltip + '; ';
          }
          tooltip = tooltip + question.question + ': ';
          if (question.answer != null && question.answer !== '') {
            tooltip = tooltip + question.answer;
          }
        }
      }
    }
    return tooltip;
  }

  openNoteModal(note: string, fieldName: string, modalReadOnly): void {
    this.modalFieldName = fieldName;
    this.tmpValue = note;
    this.modalReadOnly = modalReadOnly;
  }

  updateQuestion(event: any): void {
    this.field.fieldValue[ 'question' ] = event;
    this.abstractionValueChanged(this.field.fieldValue[ 'question' ], this.field, 'question');
  }

  emailAddress(questionJson: string): boolean {
    if (this.modalFieldName === 'question') {
      if (questionJson != null && questionJson !== '') {
        const questionsModel: Questions = JSON.parse(questionJson);
        const questions = questionsModel.questions;

        for (const question of questions) {
          if (question.question != null && question.question !== '' && question.email != null && question.email !== ''
            && question.email.match('\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b') && question.status !== 'done') {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  }

  setQuestionToSent(questionJson: string): void {
    if (questionJson != null && questionJson !== '') {
      const questionsModel: Questions = JSON.parse(questionJson);
      const questions = questionsModel.questions;

      for (const question of questions) {
        if (question.status !== 'done') {
          if (question.question != null && question.question !== '') {
            if (question.email != null && question.email !== '') {
              question.status = 'sent';
              question.qUser = this.role.getUserName();
              question.qDate = Date.now().toString();
            } else {
              question.status = 'draft';
            }
          }
        }
      }
      this.field.fieldValue[ 'question' ] = JSON.stringify(questionsModel);
    }
  }
}
