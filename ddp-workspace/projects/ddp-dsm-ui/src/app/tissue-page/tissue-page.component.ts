import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OncHistoryDetail } from '../onc-history-detail/onc-history-detail.model';
import { Participant } from '../participant-list/participant-list.model';
import { Auth } from '../services/auth.service';

import { ComponentService } from '../services/component.service';
import { Statics } from '../utils/statics';
import { DSMService } from '../services/dsm.service';
import { RoleService } from '../services/role.service';
import { Tissue } from '../tissue/tissue.model';
import { Result } from '../utils/result.model';
import { NameValue } from '../utils/name-value.model';
import { ModalComponent } from '../modal/modal.component';
import { Utils } from '../utils/utils';
import { PatchUtil } from '../utils/patch.model';

@Component({
  selector: 'app-tissue-page',
  templateUrl: './tissue-page.component.html',
  styleUrls: [ './tissue-page.component.css' ],
})
export class TissuePageComponent implements OnInit {
  @ViewChild(ModalComponent)
  public applyToAllModal: ModalComponent;

  @Input() participant: Participant;
  @Input() oncHistoryDetail: OncHistoryDetail;
  @Input() settings: {};
  @Input() tissueId: string;
  @Output() leaveTissue = new EventEmitter();
  @Output() leaveParticipant = new EventEmitter();

  participantExited = true;

  errorMessage: string;
  additionalMessage: string;
  editable = true;

  isChanged = false;
  _showWarningModal = false;
  _warningChangeMessage = 'Are you sure you want to change the destruction policy for all of the tissues from this facility?';
  _warningMessage = '';
  _warningUnsuccessfulMessage = 'updating the destruction policy for this facility not successful! Please contact your DSM developer ';
  realm: string;

  currentPatchField: string;
  patchFinished = true;
  indefinitely: boolean;

  constructor(private auth: Auth, private router: Router, private route: ActivatedRoute,
              private compService: ComponentService, private dsmService: DSMService,
               private role: RoleService, private util: Utils
  ) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      const realm = params[ DSMService.REALM ] || null;
      if (realm != null) {
        //        this.compService.realmMenu = realm;
        this.leaveTissue.emit(true);
        this.leaveParticipant.emit(true);

        this.additionalMessage = null;
      }
    });
  }

  ngOnInit(): void {
    if ((this.participant != null && this.participant.data.status.indexOf(Statics.EXITED) === -1)) {
      this.participantExited = false;
    }
    if (this.oncHistoryDetail != null) {
      this.editable = this.compService.editable;
      this.indefinitely = this.oncHistoryDetail.destructionPolicy === 'indefinitely';
      this.setEditable();
    } else {
      this.errorMessage = 'Error - Information is missing';
    }
    window.scrollTo(0, 0);
  }

  public leavePage(): boolean {
    this.leaveTissue.emit(true);
    return false;
  }

  public backToList(): boolean {
    this.leaveParticipant.emit(true);
    return false;
  }

  addTissue(): void {
    this.oncHistoryDetail.tissues.push(new Tissue(null, this.oncHistoryDetail.oncHistoryDetailId, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null, null, false));
  }

  isPatchedCurrently(field: string): boolean {
    return this.currentPatchField === field;
  }

  currentField(field: string): void {
    if (field != null || (field == null && this.patchFinished)) {
      this.currentPatchField = field;
    }
    if (field === 'destructionPolicy' && this.indefinitely) {
      this.indefinitely = false;
      this.oncHistoryDetail.destructionPolicy = '';
    }
  }

  valueChanged(value: any, parameterName: string): void {
    let v;
    if (parameterName === 'indefinitely' && value.checked != null) {
      v = value.checked ? 'indefinitely' : '';
      parameterName = 'destructionPolicy';

    } else {
      if (typeof value === 'string') {
        this.oncHistoryDetail[ parameterName ] = value;
        v = value;
      } else {
        if (value.srcElement != null && typeof value.srcElement.value === 'string') {
          v = value.srcElement.value;
        } else if (value.value != null) {
          v = value.value;
        } else if (value.checked != null) {
          v = value.checked;
        }
      }
    }
    if (v !== null) {
      const patch1 = new PatchUtil(
        this.oncHistoryDetail.oncHistoryDetailId, this.role.userMail(),
        {
          name: parameterName,
          value: v,
        }, null, 'participantId',
        this.participant.participant.ddpParticipantId, Statics.ONCDETAIL_ALIAS,  null,
        localStorage.getItem(ComponentService.MENU_SELECTED_REALM), this.participant.data.profile['guid']
      );
      const patch = patch1.getPatch();
      this.patchFinished = false;
      this.currentPatchField = parameterName;
      this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe(// need to subscribe, otherwise it will not send!
        data => {
          if (data) {
          this.oncHistoryDetail[ parameterName ] = v;
          if (data instanceof Array) {
            data.forEach( ( val ) => {
              const nameValue = NameValue.parse( val );
              this.oncHistoryDetail[ nameValue.name.slice( nameValue.name.indexOf( '.' ) + 1 ) ] = nameValue.value;
            } );
            }
          }
          // console.info(`response saving data: ${JSON.stringify(data, null, 2)}`);
          this.patchFinished = true;
          this.currentPatchField = null;
          this.setEditable();
        }
      );
    }
  }

  isCheckboxPatchedCurrently(field: string): string {
    if (this.currentPatchField === field) {
      return 'warn';
    }
    return 'primary';
  }

  public applyToAll(): void {
    this._showWarningModal = true;
    this._warningMessage = this._warningChangeMessage;
    this.applyToAllModal.show();
  }

  public doRequest(destructionPolicy): void {
    const jsonData = {
      facility: this.oncHistoryDetail.facility,
      policy: destructionPolicy,
      userId: this.role.userID(),
      userMail: this.role.userMail(),
    };
    this.dsmService.applyDestructionPolicyToAll(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), JSON.stringify(jsonData))
      .subscribe({
        next: data => {
          const result = Result.parse(data);
          if (result.code === 200) {
            for (const oncHis of this.participant.oncHistoryDetails) {
              if (oncHis.facility === this.oncHistoryDetail.facility) {
                oncHis.destructionPolicy = destructionPolicy;
              }
            }
            this._showWarningModal = false;
            this.applyToAllModal.show();
          } else {
            this._showWarningModal = true;
            this._warningMessage = this._warningUnsuccessfulMessage;
            this.applyToAllModal.show();
          }
        },
        error: () => {
          this._showWarningModal = true;
          this._warningMessage = this._warningUnsuccessfulMessage;
          this.applyToAllModal.show();
        }
      });
  }

  getUtil(): Utils {
    return this.util;
  }

  private setEditable(): void {
    if (this.oncHistoryDetail != null && this.oncHistoryDetail.request != null) {
      this.editable = this.oncHistoryDetail.request === 'received'
        || this.oncHistoryDetail.request === 'sent' || this.oncHistoryDetail.request === 'returned';
    }
  }

  getRole(): RoleService {
    return this.role;
  }
}
