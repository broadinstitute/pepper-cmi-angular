import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FieldSettings } from './field-settings.model';
import { ActivatedRoute } from '@angular/router';
import { ComponentService } from '../services/component.service';
import { DSMService } from '../services/dsm.service';
import { RoleService } from '../services/role.service';
import { Auth } from '../services/auth.service';
import { Statics } from '../utils/statics';
import { FieldType } from './field-type.model';
import { Value } from '../utils/value.model';

@Component({
  selector: 'app-field-settings',
  templateUrl: './field-settings.component.html',
  styleUrls: [ './field-settings.component.css' ]
})
export class FieldSettingsComponent implements OnInit {
  errorMessage: string;
  patternError = false;
  additionalMessage: string;

  loading = false;
  saving = false;

  realmsAllowed: Array<string> = [];
  realm: string;

  fieldSettings: Map<string, Array<FieldSettings>> = new Map();
  selectedType: FieldType;
  settingsOfSelectedType: Array<FieldSettings> = [];
  allowedToSeeInformation = false;
  possibleTypes: Array<FieldType> = [
    new FieldType('Participant', 'r'), // because additional values of participants live in ddp_participant_record table
    new FieldType('Medical Record', 'm'),
    new FieldType('Onc History', 'oD'),
    new FieldType('Tissue', 't')
  ];

  constructor(private _changeDetectionRef: ChangeDetectorRef, private dsmService: DSMService, private auth: Auth,
               private role: RoleService, private compService: ComponentService, private route: ActivatedRoute) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      this.realm = params[ DSMService.REALM ] || null;
      if (this.realm != null) {
        //        this.compService.realmMenu = this.realm;
        for (const posType of this.possibleTypes) {
          if (posType.selected) {
            posType.selected = false;
          }
        }
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
    this.allowedToSeeInformation = false;
    this.additionalMessage = null;
    this.selectedType = null;
    this.settingsOfSelectedType = [];
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.MEDICALRECORD).subscribe({
      next: data => {
        jsonData = data;
        jsonData.forEach((val) => {
          if (this.realm === val) {
            this.allowedToSeeInformation = true;
            this.loadFieldSettings();
          }
        });
        if (!this.allowedToSeeInformation) {
          this.additionalMessage = 'You are not allowed to see information of the selected study at that category';
        }
      },
      error: () => null
    });
  }

  typeChecked(type: FieldType): void {
    if (type.selected) {
      this.selectedType = type;
      this.changeSelectedType(type);
    } else {
      this.selectedType = null;
      this.errorMessage = null;
      this.settingsOfSelectedType = [];
    }
    for (const posType of this.possibleTypes) {
      if (posType !== type) {
        if (posType.selected) {
          posType.selected = false;
        }
      }
    }
  }

  changeSelectedType(type: FieldType): void {
    this.additionalMessage = '';
    this.settingsOfSelectedType = [];
    if (this.fieldSettings.has(type.name)) {
      const existingList: Array<FieldSettings> = this.fieldSettings.get(type.name);
      for (const setting of existingList) {
        this.settingsOfSelectedType.push(setting);
      }
    }
    const newSetting: FieldSettings = new FieldSettings(null, null, null, this.selectedType.name,
      null, null, 1, null, null, null);
    newSetting.addedNew = true;
    this.settingsOfSelectedType.push(newSetting);
  }

  loadFieldSettings(): void {
    this.loading = true;
    let jsonData: Map<string, Array<FieldSettings>>;

    this.dsmService.getFieldSettings(this.realm).subscribe({
      next: data => {
        this.fieldSettings = new Map<string, Array<FieldSettings>>();
        jsonData = data;

        for (const [ key, value ] of Object.entries(jsonData)) {
          const type = this.possibleTypes.find(x => x.tableAlias === key);
          for (const setting of value) {
            const event = FieldSettings.parse(setting);
            FieldSettings.addSettingWithType(this.fieldSettings, event, type ? type : new FieldType('', ''));
          }
        }
        if (this.selectedType) {
          this.settingsOfSelectedType = [];
          if (this.fieldSettings.has(this.selectedType.name)) {
            const existingList: Array<FieldSettings> = this.fieldSettings.get(this.selectedType.name);
            for (const setting of existingList) {
              this.settingsOfSelectedType.push(setting);
            }
          }
          const newSetting: FieldSettings = new FieldSettings(null, null, null, this.selectedType.name,
            null, null, 1, null, null, null);
          newSetting.addedNew = true;
          this.settingsOfSelectedType.push(newSetting);
        }
        this.loading = false;
      },
      error: err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.auth.logout();
        }
        this.loading = false;
        const returnedMessage = JSON.parse(err._body);
        this.errorMessage = returnedMessage['body'] ?
          returnedMessage['body'] : 'Error - Loading FieldSettings\nPlease contact your DSM developer';
      }
    });
  }

  saveFieldSettings(): void {
    if (this.realm != null) {
      this.saving = true;
      let foundError = false;
      let cleanedFieldSettings: Array<FieldSettings>;
      if (this.settingsOfSelectedType != null && this.settingsOfSelectedType.length > 0) {
        cleanedFieldSettings = FieldSettings.removeUnchangedFieldSettings(this.settingsOfSelectedType, this.selectedType);
        for (const setting of cleanedFieldSettings) {
          if (setting.notUniqueError || setting.spaceError) {
            foundError = true;
          }
        }
      } else {
        cleanedFieldSettings = null;
      }
      if (foundError) {
        this.additionalMessage = 'Please fix errors first!';
      } else if (cleanedFieldSettings === null) {
        this.additionalMessage = 'Nothing to save!';
      } else {
        // Create an object that JSON can convert better...
        const updatedFieldSettings: object = {};
        updatedFieldSettings[ this.selectedType.tableAlias ] = cleanedFieldSettings;

        this.dsmService.saveFieldSettings(this.realm, JSON.stringify(updatedFieldSettings)).subscribe({
          next: data => {
            this.loadFieldSettings();
            if (data.hasOwnProperty('code') && data[ 'code' ] !== 200) {
              this.additionalMessage = 'Error - Saving field settings\nPlease contact your DSM developer';
            } else {
              this.additionalMessage = 'Data saved';
            }
          },
          error: err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.auth.logout();
              this.loading = false;
            }
            this.additionalMessage = JSON.parse(err._body).body;
          }
        });
      }

      this.saving = false;
      window.scrollTo(0, 0);
    }
  }

  onDisplayTypeChange(index: number): void {
    const setting: FieldSettings = this.settingsOfSelectedType[ index ];
    setting.possibleValues = [];
    setting.possibleValues.push(new Value(null));

    setting.changedBy = this.role.userMail();
    setting.changed = true;
  }

  onChange(index: number, value?: FieldSettings[]): void {
    if(value) {
      value.every(fs => this.testRegex(fs.columnName)) ? this.changeFields(index) : this.patternError = true;
    }
    else {this.changeFields(index);}
  }

  changeFields(index: number): void {
    this.patternError = false;
    this.settingsOfSelectedType[ index ].changedBy = this.role.userMail();
    this.settingsOfSelectedType[ index ].changed = true;
    if (index === this.settingsOfSelectedType.length - 1) {
      this.addNewFieldSetting();
    }
  }

  testRegex(input: string): boolean {
    return /(^[a-z])([a-z_]+$)/gi.test(input);
  }

  addNewFieldSetting(): void {
    const fieldSetting: FieldSettings = new FieldSettings(null, null, null, this.selectedType.name, null, null, 1, null, null,null);
    fieldSetting.addedNew = true;
    this.settingsOfSelectedType.push(fieldSetting);
  }

  addValue(setting: FieldSettings): void {
    const value = new Value(null);
    setting.possibleValues.push(value);
    setting.changed = true;

  }

  deleteFieldSetting(index: number): void {
    this.settingsOfSelectedType[ index ].deleted = true;
    this.onChange(index);
    this.saveFieldSettings();
  }

  checkColName(index: number): void {
    const setting: FieldSettings = this.settingsOfSelectedType[ index ];
    setting.notUniqueError = false;
    setting.spaceError = setting.columnName.indexOf(' ') > -1;
    for (let i = 0; i < this.settingsOfSelectedType.length; i++) {
      if (i !== index) {
        if (this.settingsOfSelectedType[ i ].columnName === setting.columnName) {
          setting.notUniqueError = true;
        }
      }
    }
  }
}
