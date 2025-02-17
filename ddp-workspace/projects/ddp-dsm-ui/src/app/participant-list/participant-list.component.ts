import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractionGroup } from '../abstraction-group/abstraction-group.model';
import { ActivityDefinition } from '../activity-data/models/activity-definition.model';
import { Group } from '../activity-data/models/group.model';
import { Option } from '../activity-data/models/option.model';
import { QuestionAnswer } from '../activity-data/models/question-answer.model';
import { QuestionDefinition } from '../activity-data/models/question-definition.model';
import { Assignee } from '../assignee/assignee.model';
import { Filter } from '../filter-column/filter-column.model';
import { ModalComponent } from '../modal/modal.component';
import { ParticipantColumn } from '../filter-column/models/column.model';
import { OncHistoryDetail } from '../onc-history-detail/onc-history-detail.model';
import { Auth } from '../services/auth.service';
import { ComponentService } from '../services/component.service';
import { DSMService } from '../services/dsm.service';
import { RoleService } from '../services/role.service';
import { KitType } from '../utils/kit-type.model';
import { NameValue } from '../utils/name-value.model';
import { PatchUtil } from '../utils/patch.model';
import { Result } from '../utils/result.model';
import { Statics } from '../utils/statics';
import { Utils } from '../utils/utils';
import { ViewFilter } from '../filter-column/models/view-filter.model';
import { Value } from '../utils/value.model';
import { AssigneeParticipant } from './models/assignee-participant.model';
import { PreferredLanguage } from './models/preferred-languages.model';
import { Sample } from './models/sample.model';
import { Participant } from './participant-list.model';
import { FieldSettings } from '../field-settings/field-settings.model';
import { ParticipantData } from './models/participant-data.model';
import { Sort } from '../sort/sort.model';
import { saveAs } from 'file-saver';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import { LoadingModalComponent } from '../modals/loading-modal.component';
import { BulkCohortTagModalComponent } from '../tags/cohort-tag/bulk-cohort-tag-modal/bulk-cohort-tag-modal.component';
import { CohortTagComponent } from '../tags/cohort-tag/cohort-tag.component';
import { CohortTag } from '../tags/cohort-tag/cohort-tag.model';
import {FieldSettingsModel, ValueModel} from '../STORE/models';

@Component({
  selector: 'app-participant-list',
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.css']
})
export class ParticipantListComponent implements OnInit {

  @ViewChild(ModalComponent)
  public modal: ModalComponent;

  modalAnchor: string;
  assignMR = false;
  assignTissue = false;
  isAssignButtonDisabled = true;
  assignee: Assignee;

  loadedTimeStamp: string;

  errorMessage: string;
  additionalMessage: string;
  loadingParticipants = null;
  parent = 'participantList';

  showFilters = false;
  showCustomizeViewTable = false;
  showSavedFilters = false;
  hasESData = false;

  currentFilter: Array<Filter>;
  selectedFilterName = '';

  participantList: Participant[] = [];
  copyParticipantList: Participant[] = [];
  originalParticipantList: Participant[] = [];
  activePage = 1;
  activityDefinitionList: ActivityDefinition[] = [];
  participant: Participant;
  oncHistoryDetail: OncHistoryDetail;
  assignees: Array<Assignee> = [];
  showParticipantInformation = false;
  showTissue = false;
  selectedTab: string;
  selectedActivity: string;
  selectedMR = '';
  selectedOncOrTissue = '';

  dataSources: Map<string, string> = null;
  sourceColumns = {};
  allFieldNames = new Set();
  dup = false;
  plus = false;
  filterName: string = null;
  filterQuery: string = null;
  activityDefinitions = new Map();

  exportFileFormat = 'xlsx';
  exportHumanReadable = false;
  exportOnlyMostRecent = false;
  EXPORT_SIZE_LIMIT = 10000; // limit due to ElasticSearch paging range limit
  selectedColumns = {};
  prevSelectedColumns = {};
  defaultColumns = [];

  selectedFilter: Filter = null;
  savedFilters: ViewFilter[] = [];
  quickFilters: ViewFilter[] = [];

  settings = {};
  checkBoxGroups = {};
  drugs: string[] = [];
  cancers: string[] = [];
  mrCoverPdfSettings: Value[] = [];

  sortBy: Sort = null;
  sortOrder: string = null;
  sortParent: string = null;
  currentView: string = null;
  showHelp = false;
  filtered = false;
  rowsPerPage: number;
  preferredLanguages: PreferredLanguage[] = [];
  savedSelectedColumns = {};
  isAddFamilyMember = false;
  hasSequencingOrders = false;
  hasExternalShipper = false;
  showGroupFields = false;
  hideSamplesTab = false;
  showContactInformation = false;
  showComputedObject = false;
  participantsSize = 0;
  jsonPatch: any;
  viewFilter: any;
  private start: number;
  selectAllColumnsLabel = 'Select all';
  selectedPatients: string[] = [];
  searchForRGP = false;
  private reservedDefaultSelectedColumns;
  public allColumnsSelected = false;

  constructor(private role: RoleService, private dsmService: DSMService, private compService: ComponentService,
               private router: Router, private auth: Auth, private route: ActivatedRoute, private util: Utils,
              private dialog: MatDialog) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      const realm = params[ DSMService.REALM ] || null;
      if (realm != null) {
        //        this.compService.realmMenu = realm;
        this.additionalMessage = null;
        this.checkRight();
        // this.saveSelectedColumns(); commented out, because we don't need it as
        //                             we don't renew selected columns anymore, as we are going to have defaultColumns for each study
      }
    });
  }

  ngOnInit(): void {
    this.additionalMessage = null;
    if (localStorage.getItem(ComponentService.MENU_SELECTED_REALM) == null) {
      this.additionalMessage = 'Please select a study';
    } else {
      this.checkRight();
    }
    window.scrollTo(0, 0);
  }

  public getPaginationParticipantListSize(): number {
    return this.participantsSize;
  }

  public pageChanged(pageNumber: number, rPerPage?: number): void {
    this.loadingParticipants = true;
    this.role.getUserSetting().setRowsPerPage = rPerPage;
    const rowsPerPage = rPerPage ? rPerPage : this.role?.getUserSetting()?.getRowsPerPage();
    const from = (pageNumber - 1) * rowsPerPage;
    const to = pageNumber * rowsPerPage;
    if (this.viewFilter) {
      this.applyFilter(this.buildTemporaryViewFilter(), from, to);
    } else {
      if (this.jsonPatch) {
        this.dsmService.filterData(localStorage.getItem(
          ComponentService.MENU_SELECTED_REALM), this.jsonPatch, this.parent, null, from, to, this.sortBy
        )
          .subscribe({
            next: data => {
              this.setFilterDataOnSuccess(data);
            },
            error: () => {
              this.participantList = [];
              this.originalParticipantList = [];
              this.copyParticipantList = [];
              this.loadingParticipants = null;
              this.additionalMessage = 'Error - Filtering Participant List, Please contact your DSM developer';
            }
          });
      } else {
        this.dsmService.filterData(
          localStorage.getItem(ComponentService.MENU_SELECTED_REALM), null, this.parent, true, from, to, this.sortBy
          )
          .subscribe({
            next: data => {
              this.setFilterDataOnSuccess(data);
            },
            error: err => {
              if (err._body === Auth.AUTHENTICATION_ERROR) {
                this.auth.logout();
              }
              this.loadingParticipants = null;
              this.errorMessage = 'Error - Loading Participant List, Please contact your DSM developer';
            }
          });
      }
    }

    this.activePage = pageNumber;
  }

  private buildTemporaryViewFilter(): ViewFilter {
    //used for applyFilter method which manipulates selected columns to avoid
    //columns loss on page change if participant has chosen default filter from settings
    const tempViewFilter = this.viewFilter.copy();
    const tempColumns = {};
    Object.assign(tempColumns, tempViewFilter.columns);
    Object.assign(tempViewFilter.columns, this.selectedColumns);
    return tempViewFilter;
  }

  private setFilterDataOnSuccess(data: any): void {
    this.participantList = [];
    this.additionalMessage = '';
    this.originalParticipantList = [];
    this.copyParticipantList = [];
    if (data != null) {
      const jsonData = data;
      jsonData['participants'].forEach((val) => {
        const participant = Participant.parse(val);
        this.participantList.push(participant);
      });
      this.originalParticipantList = this.participantList;
      this.participantsSize = jsonData['totalCount'];
      const date = new Date();
      this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
      this.additionalMessage = null;
    }
    this.loadingParticipants = null;
  }

  private checkRight(): void {
    // assumption for now: profile parameters are always the same, only survey will be dynamic per ddp
    this.start = new Date().getTime();
    this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
    this.setSelectedFilterName('');
    this.currentFilter = null;
    this.filterQuery = null;
    let allowedToSeeInformation = false;
    this.errorMessage = null;
    this.participantList = null;
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.MEDICALRECORD).subscribe({
      next: data => {
        jsonData = data;
        jsonData.forEach((val) => {
          if (localStorage.getItem(ComponentService.MENU_SELECTED_REALM) === val) {
            allowedToSeeInformation = true;
            this.loadSettings();
          }
        });
        if (!allowedToSeeInformation) {
          this.loadingParticipants = null;
          this.compService.customViews = null;
          this.errorMessage = 'You are not allowed to see information of the selected study at that category';
        }
      },
      error: () => {
        this.loadingParticipants = null;
        return null;
      }
    });
  }

  loadSettings(): void {
    this.rowsPerPage = this.role?.getUserSetting()?.getRowsPerPage();
    let jsonData: any;
    this.dsmService.getSettings(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), this.parent).subscribe({
      next: data => {
        this.assignees = [];
        this.drugs = [];
        this.cancers = [];
        this.activityDefinitionList = [];
        this.quickFilters = [];
        this.savedFilters = [];
        this.mrCoverPdfSettings = [];
        this.defaultColumns = [Filter.REALM, Filter.SHORT_ID, Filter.FIRST_NAME, Filter.LAST_NAME, Filter.ENROLLMENT_STATUS];
        this.assignees.push(new Assignee('-1', 'Remove Assignee', ''));
        jsonData = data;
        this.dataSources = new Map([
          ['data', 'Participant'],
          ['p', 'Participant - DSM'],
          ['m', 'Medical Record'],
          ['oD', 'Onc History'],
          ['t', 'Tissue'],
          ['k', 'Sample'],
          ['a', 'Abstraction'],
          ['c', 'Cohort Tags'],
          ['cl', 'Clinical Orders']
        ]);
        this.sourceColumns = {};
        this.selectedColumns = {};
        this.settings = {};
        this.dataSources.forEach((value: string, key: string) => {
          this.selectedColumns[key] = [];
          this.sourceColumns[key] = [];
        });
        if (jsonData.assignees != null) {
          jsonData.assignees.forEach((val) => {
            this.assignees.push(Assignee.parse(val));
          });
        }
        if (jsonData.drugs != null) {
          jsonData.drugs.forEach((val) => {
            this.drugs.push(val);
          });
        }
        if (jsonData.cancers != null) {
          jsonData.cancers.forEach((val) => {
            this.cancers.push(val);
          });
        }
        if (jsonData.fieldSettings != null && !this.role.viewOnlyDSSData) {
          Object.keys(jsonData.fieldSettings).forEach((key) => {
            jsonData.fieldSettings[key].forEach((fieldSetting: FieldSettings) => {
              let options: Array<NameValue> = null;
              if (fieldSetting.displayType === 'OPTIONS') {
                options = new Array<NameValue>();
                if (fieldSetting.possibleValues != null) {
                  const defaultOptionValue = {value: '', name: ''};
                  fieldSetting.possibleValues.unshift(defaultOptionValue as Value);

                  fieldSetting.possibleValues.forEach((value: Value) => {
                    options.push(new NameValue(value.value, value.value));
                  });
                }
              }
              const filter = new Filter(
                new ParticipantColumn( fieldSetting.columnDisplay, Utils.convertUnderScoresToCamelCase(fieldSetting.columnName), key),
                Filter.ADDITIONAL_VALUE_TYPE, options, new NameValue( fieldSetting.columnName, null ),
                false, true, null, null, null, null, false,
                false, false, false, fieldSetting.displayType
              );
              if (this.settings[key] == null || this.settings[key] == null) {
                this.settings[key] = [];
              }
              if (key === 'r') {
                if (this.sourceColumns['p'] == null) {
                  this.sourceColumns['p'] = [];
                }
                this.sourceColumns['p'].push(filter);
              } else if (key === 'sm') {
                if (this.sourceColumns['t'] == null) {
                  this.sourceColumns['t'] = [];
                }
                this.sourceColumns['t'].push(filter);
              } else {
                if (this.sourceColumns[fieldSetting.fieldType] == null) {
                  this.sourceColumns[fieldSetting.fieldType] = [];
                }
                if (key === null || key === 'null') {
                  if (fieldSetting.displayType === 'TAB' && !this.dataSources.has(fieldSetting.columnName)) {
                    this.dataSources.set(fieldSetting.columnName, fieldSetting.columnDisplay);
                  }
                }
                if (fieldSetting.displayType == null || fieldSetting.displayType !== 'GROUP') {
                  this.sourceColumns[fieldSetting.fieldType].push(filter);
                }
              }
              this.settings[key].push(fieldSetting);
              if (fieldSetting.displayType == null || fieldSetting.displayType !== 'GROUP') {
                this.allFieldNames.add(filter.participantColumn.tableAlias + '.' + filter.participantColumn.name);
                if (fieldSetting.displayType === 'CHECKBOX') {
                  if (!this.checkBoxGroups[key]) {
                    this.checkBoxGroups[key] = [];
                  }
                  this.checkBoxGroups[key].push(fieldSetting);
                }
              }
            });
          });
        }
        this.hasESData = false;
        if (jsonData.activityDefinitions != null) {
          Object.keys(jsonData.activityDefinitions).forEach((key) => {
            this.hasESData = true;
            const activityDefinition: ActivityDefinition = ActivityDefinition.parse(jsonData.activityDefinitions[key]);
            let possibleColumns: Array<Filter> = [];
            if (this.sourceColumns[activityDefinition.activityCode] != null) {
              possibleColumns = this.sourceColumns[activityDefinition.activityCode];
            } else {
              possibleColumns.push(
                new Filter(
                  new ParticipantColumn(
                    activityDefinition.activityCode + ' Survey Created', 'createdAt', activityDefinition.activityCode, null, true
                  ),
                  Filter.DATE_TYPE
                ));
              possibleColumns.push(
                new Filter(
                  new ParticipantColumn(activityDefinition.activityCode + ' Survey Completed', 'completedAt',
                    activityDefinition.activityCode, null, true),
                  Filter.DATE_TYPE
                ));
              possibleColumns.push(
                new Filter(
                  new ParticipantColumn(activityDefinition.activityCode + ' Survey Last Updated', 'lastUpdatedAt',
                    activityDefinition.activityCode, null, true),
                  Filter.DATE_TYPE
                ));
              possibleColumns.push(
                new Filter(
                  new ParticipantColumn(activityDefinition.activityCode + ' Survey Status', 'status',
                    activityDefinition.activityCode, null, true),
                  Filter.OPTION_TYPE,
                  [
                    new NameValue('COMPLETE', 'Completed'),
                    new NameValue('CREATED', 'Created'),
                    new NameValue('IN_PROGRESS', 'In Progress')
                  ]));
            }
            if (activityDefinition?.questions != null) {
              for (const question of activityDefinition.questions) {
                if (question.stableId != null) {
                  let options: Array<NameValue> = null;
                  let type: string = question.questionType;
                  if (question.questionType === 'PICKLIST') {
                    options = new Array<NameValue>();
                    type = Filter.OPTION_TYPE;
                    if (question.options != null) {
                      question.options.forEach((option: Option) => {
                        options.push(new NameValue(option.optionStableId, option.optionText));
                        if (option?.nestedOptions != null) {
                          option.nestedOptions.forEach((nOption: Option) => {
                            options.push(new NameValue(option.optionStableId + '.' + nOption.optionStableId, nOption.optionText));
                          });
                        }
                      });
                    }
                    if (question.groups != null) {
                      question.groups.forEach((group: Group) => {
                        options.push(new NameValue(group.groupStableId, group.groupText));
                        if (group.options != null) {
                          group.options.forEach((gOption: Option) => {
                            options.push(new NameValue(group.groupStableId + '.' + gOption.optionStableId, gOption.optionText));
                          });
                        }
                      });
                    }
                  } else if (question.questionType === 'COMPOSITE') {
                    options = new Array<NameValue>();
                    if (question.childQuestions != null) {
                      question.childQuestions.forEach((childQuestion: QuestionDefinition) => {
                        if (childQuestion.options != null) {
                          type = Filter.OPTION_TYPE;
                          childQuestion.options.forEach((option: Option) => {
                            options.push(new NameValue(option.optionStableId, option.optionText));
                            if (option?.nestedOptions != null) {
                              option.nestedOptions.forEach((nOption: Option) => {
                                options.push(new NameValue(nOption.optionStableId, nOption.optionText));
                              });
                            }
                          });
                        }
                        if (childQuestion.groups != null) {
                          type = Filter.OPTION_TYPE;
                          childQuestion.groups.forEach((group: Group) => {
                            options.push(new NameValue(group.groupStableId, group.groupText));
                            if (group.options != null) {
                              group.options.forEach((gOption: Option) => {
                                options.push(new NameValue(gOption.optionStableId, gOption.optionText));
                              });
                            }
                          });
                        }
                      });
                    }
                  } else if (question.questionType === 'NUMERIC') {
                    type = Filter.NUMBER_TYPE;
                  }
                  const filterInPossibleColumns = possibleColumns.find(filter => filter.participantColumn.name === question.stableId);
                  if (filterInPossibleColumns == null) {
                    const displayName = this.getQuestionOrStableId(question);
                    const filter = new Filter(
                      new ParticipantColumn(displayName, question.stableId, activityDefinition.activityCode, 'questionsAnswers', true),
                      type,
                      options
                    );
                    possibleColumns.push(filter);
                  }
                }
              }
              const name = activityDefinition.activityName == null || activityDefinition.activityName === '' ?
                activityDefinition.activityCode : activityDefinition.activityName;
              this.dataSources.set(activityDefinition.activityCode, name);
              this.sourceColumns[activityDefinition.activityCode] = possibleColumns;
              this.selectedColumns[activityDefinition.activityCode] = [];
              // add now all these columns to allFieldsName for the search-bar
              possibleColumns.forEach(filter => {
                const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
                this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
              });
            }
            this.activityDefinitionList.push(activityDefinition);
          });
        }
        if (this.settings && this.settings['TAB_GROUPED']) {
          this.addTabGroupedColumns();
        }
        if (this.settings && this.settings['TAB']) {
          this.addTabColumns();
        }
        if (data.defaultColumns && data.defaultColumns.length > 0) {
          this.defaultColumns = [];
          for (const defaultColumn of data.defaultColumns) {
            const filterToAdd: Filter = Filter[defaultColumn.value];
            if (filterToAdd) {
              this.defaultColumns.push(Filter[defaultColumn.value]);
            } else {
              this.addDynamicFieldDefaultColumns(defaultColumn);
            }
          }
        }
        this.getSourceColumnsFromFilterClass();
        if (jsonData.abstractionFields != null && jsonData.abstractionFields.length > 0) {
          // only add abstraction columns if there is a abstraction form setup
          jsonData.abstractionFields.forEach((key) => {
            const abstractionGroup = AbstractionGroup.parse(key);
            abstractionGroup.fields.forEach((field) => {
              const tmp: string = field.medicalRecordAbstractionFieldId.toString();
              const tmpValues: NameValue[] = [];
              let tmpType = Filter.TEXT_TYPE;
              if ((field.type === 'button_select' || field.type === 'options' || field.type === 'multi_options')
                && field.possibleValues != null) {
                tmpType = Filter.OPTION_TYPE;
                field.possibleValues.forEach((value) => {
                  tmpValues.push(new NameValue(value.value, value.value));
                });
              } else if (field.type === 'multi_type' || field.type === 'multi_type_array') {
                tmpType = field.type;
              }
              this.sourceColumns['a'].push(
                new Filter(
                  new ParticipantColumn(field.displayName, tmp, abstractionGroup.abstractionGroupId.toString(), 'final'),
                  tmpType,
                  tmpValues,
                  new NameValue(tmp, null)
                ));
            });
          });
          // add now all these columns to allFieldsName for the search-bar
          this.sourceColumns['a'].forEach(filter => {
            const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            // add when abstraction is searchable
            // this.allFieldNames.add( tmp + "." + filter.participantColumn.name );
          });
        } else {
          this.dataSources.delete('a');
        }

        if (jsonData.hasProxyData != null) {
          this.dataSources.set('proxy', 'Proxy');
          const possibleColumns: Array<Filter> = [];
          possibleColumns.push(new Filter(new ParticipantColumn('First Name', 'firstName', 'proxy', null, true), Filter.TEXT_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Last Name', 'lastName', 'proxy', null, true), Filter.TEXT_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Email', 'email', 'proxy', null, true), Filter.TEXT_TYPE));

          this.sourceColumns['proxy'] = possibleColumns;
          this.selectedColumns['proxy'] = [];
          possibleColumns.forEach(filter => {
            const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
          });
          this.orderColumns();
        }

        if (jsonData.filters != null) {
          jsonData.filters.forEach((val) => {
            const view: ViewFilter = ViewFilter.parseFilter(val, this.sourceColumns);
            if (val.userId.includes('System')) {
              this.quickFilters.push(view);
            } else {
              this.savedFilters.push(view);
            }
          });
          this.savedFilters.sort((a, b) => a.filterName.localeCompare(b.filterName));
          // console.log(this.savedFilters);
        }
        if (jsonData.mrCoverPdf != null) {
          jsonData.mrCoverPdf.forEach((val) => {
            const value: Value = Value.parse(val);
            this.mrCoverPdfSettings.push(value);
          });
        }
        if (jsonData.kitTypes != null) {
          let hasExternalShipper = false;
          const options = new Array<NameValue>();
          const optionsUpload = new Array<NameValue>();
          // TODO: check is it correct ? - shadowed `val`
          jsonData.kitTypes.forEach((val) => {
            const kitType = KitType.parse(val);
            if (kitType.uploadReasons != null) {
              // eslint-disable-next-line @typescript-eslint/no-shadow
              kitType.uploadReasons.forEach((val) => {
                const found = optionsUpload.find(option => option.value === val);
                if (found == null) {
                  optionsUpload.push(new NameValue(val, val));
                }
              });
            }
            options.push(new NameValue(kitType.name, kitType.displayName));
            if (kitType.externalShipper) {
              hasExternalShipper = true;
              this.hasExternalShipper = true;
            }
          });
          if (optionsUpload.length > 0) {
            optionsUpload.push(new NameValue('SAMPLE_UPLOAD_EMPTY', 'NORMAL'));
            this.sourceColumns['k'].push(new Filter(ParticipantColumn.UPLOAD_REASON, Filter.OPTION_TYPE, optionsUpload));
            this.allFieldNames.add('k' + '.' + ParticipantColumn.UPLOAD_REASON.name);
          }
          this.sourceColumns['k'].push(new Filter(ParticipantColumn.SAMPLE_TYPE, Filter.OPTION_TYPE, options));
          if (hasExternalShipper) {
            this.sourceColumns['k'].push(new Filter(ParticipantColumn.EXTERNAL_ORDER_NUMBER, Filter.TEXT_TYPE));
            this.sourceColumns['k'].push(new Filter(ParticipantColumn.EXTERNAL_ORDER_DATE, Filter.DATE_TYPE));
            this.allFieldNames.add('k' + '.' + ParticipantColumn.EXTERNAL_ORDER_NUMBER.name);
            this.allFieldNames.add('k' + '.' + ParticipantColumn.EXTERNAL_ORDER_DATE.name);
          }
        } else {
          this.dataSources.delete('k');
        }
        if (jsonData.preferredLanguages != null) {
          this.preferredLanguages = new Array<PreferredLanguage>();
          const options = new Array<NameValue>();
          jsonData.preferredLanguages.forEach((val) => {
            const language = PreferredLanguage.parse(val);
            this.preferredLanguages.push(language);
            options.push(new NameValue(language.languageCode, language.displayName));
          });
          this.sourceColumns['data'].push(new Filter(ParticipantColumn.PREFERRED_LANGUAGE, Filter.OPTION_TYPE, options));
        }

        if (jsonData.hideMRTissueWorkflow != null || !this.role.allowedToViewMedicalRecords()) {
          this.dataSources.delete('m');
          this.dataSources.delete('oD');
          this.dataSources.delete('t');
          this.removeColumnFromSourceColumns('p', Filter.ONC_HISTORY_CREATED);
          this.removeColumnFromSourceColumns('p', Filter.ONC_HISTORY_REVIEWED);
          this.removeColumnFromSourceColumns('p', Filter.PAPER_CR_SENT);
          this.removeColumnFromSourceColumns('p', Filter.PAPER_CR_RECEIVED);
          this.removeColumnFromSourceColumns('p', Filter.MINIMAL_RECORDS);
          this.removeColumnFromSourceColumns('p', Filter.ABSTRACTION_READY);
          this.removeColumnFromSourceColumns('p', Filter.ASSIGNEE_MR);
          this.removeColumnFromSourceColumns('p', Filter.ASSIGNEE_TISSUE);
          this.removeColumnFromSourceColumns('p', Filter.PARTICIPANT_NOTES);
          this.assignees = null;
        }
        if (jsonData.hasInvitations != null) {
          this.dataSources.set('invitations', 'Invitation');

          const possibleColumns: Array<Filter> = [];
          possibleColumns.push(new Filter(new ParticipantColumn('Created', 'createdAt', 'invitations', null, true), Filter.DATE_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Accepted', 'acceptedAt', 'invitations', null, true), Filter.DATE_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Verified', 'verifiedAt', 'invitations', null, true), Filter.DATE_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Voided', 'voidedAt', 'invitations', null, true), Filter.DATE_TYPE));
          possibleColumns.push(new Filter(
            new ParticipantColumn('Contact Email', 'contactEmail', 'invitations', null, true), Filter.TEXT_TYPE)
          );
          possibleColumns.push(new Filter(new ParticipantColumn('Invitation Code', 'guid', 'invitations', null, true), Filter.TEXT_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Notes', 'notes', 'invitations', null, true), Filter.TEXT_TYPE));
          possibleColumns.push(new Filter(new ParticipantColumn('Type', 'type', 'invitations', null, true), Filter.TEXT_TYPE));

          this.sourceColumns['invitations'] = possibleColumns;
          this.selectedColumns['invitations'] = [];
          possibleColumns.forEach(filter => {
            const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
          });
          this.orderColumns();
        }
        if (jsonData.hasAddressTab) {
          this.addContactInformationColumns();
        } else {
          this.showContactInformation = false;
        }
        if (jsonData.hasComputedObject) {
          this.addAutomatedScoringColumns();
        }

        if (jsonData.hideESFields != null) {
          const hideESFields: Value[] = [];
          jsonData.hideESFields.forEach((val) => {
            const value: Value = Value.parse(val);
            hideESFields.push(value);
          });
          if (hideESFields?.length > 0) {
            hideESFields.forEach((field) => {
              const esField = field.value.split('.');
              if (esField != null) {
                this.sourceColumns['data'].forEach(source => {
                  if (source.participantColumn.object === esField[0] && source.participantColumn.name === esField[1]) {
                    // remove the ES columns
                    this.removeColumnFromSourceColumns('data', source);
                  }
                });
              }
            });
          }
        }
        this.updateStudySpecificStatuses(jsonData.studySpecificStatuses);
        this.isAddFamilyMember = jsonData.addFamilyMember === true;
        this.showGroupFields = jsonData.showGroupFields === true;
        this.hasSequencingOrders = jsonData.hasSequencingOrders === true;

        if (jsonData.hideSamplesTab === true) {
          this.hideSamplesTab = true;
          this.dataSources.delete('k');
        } else {
          this.hideSamplesTab = false;
        }
        this.orderColumns();
        this.getData();
        this.deleteFiltersAccordingToPermission();
        this.removeUnnecessaryColumns();
      },
      // this.renewSelectedColumns(); commented out because if we have defaultColumns for all the studies we won't need it anymore
      error: err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.auth.logout();
        }
        // eslint-disable-next-line no-throw-literal
        throw 'Error - Loading display settings' + err;
      }
    });
  }

  private deleteFiltersAccordingToPermission(): void {
    let columnNamesToDelete: string[];

    if(this.mrAndDssFalse) {
      columnNamesToDelete = ['k', 'address', 'm', 'oD'];
    } else if(this.mrFalseDssTrue) {
      columnNamesToDelete = ['m', 'oD'];
    }

    this.deleteFilters(columnNamesToDelete);
  }

  private deleteFilters(columnNames: string[]): void {
    if(columnNames?.length > 0) {
      columnNames.forEach((name: string) => {
        delete this.sourceColumns[name];
        this.dataSources.delete(name);
      });
    }
  }

  private get mrFalseDssTrue(): boolean {
    return !this.role.allowedToViewMedicalRecords() && this.role.viewOnlyDSSData;
  }

  private get mrAndDssFalse(): boolean {
    return !this.role.allowedToViewMedicalRecords() && !this.role.viewOnlyDSSData;
  }

  private removeUnnecessaryColumns(): void {
    if(!this.hasExternalShipper) {
      const sampleColumnFiltersToRemove = [Filter.CORRECTED_TEST,
        Filter.RESULT_TEST, Filter.TIME_TEST, Filter.STATUS_IN,
        Filter.STATUS_OUT, Filter.CARE_EVOLVE];

      this.removeColumns('k', sampleColumnFiltersToRemove);
    }

    if(!this.hasSequencingOrders) {
      const sampleColumnFiltersToRemove = [Filter.SEQUENCING_RESTRICTION, Filter.SAMPLE_NOTES, Filter.COLLECTION_DATE];

      delete this.sourceColumns['cl'];
      this.dataSources.delete('cl');

      this.removeColumns('k', sampleColumnFiltersToRemove);
    }
  }

  private removeColumns(tableAlias: string, filters: Filter[]): void {
    filters.forEach((filter: Filter) => this.removeColumnFromSourceColumns(tableAlias, filter));
  }

  private removeColumnFromSourceColumns(source: string, filter: Filter): void {
    const index = this.sourceColumns[ source ].indexOf(filter);
    if (index !== -1) {
      this.sourceColumns[ source ].splice(index, 1);
    }

  }

  private addDynamicFieldDefaultColumns(defaultColumn: any): void {
    let defaultColumnName: string;
    if (defaultColumn.value.split('.').length === 2) {
      defaultColumnName = defaultColumn.value.split('.')[1];
    }
    if (!defaultColumnName) {
      return;
    }
    for (const sourceColumnGroup of Object.values(this.sourceColumns)) {
      for (const currentFilter of sourceColumnGroup as Array<Filter>) {
        const isOurDefaultColumnTabGrouped = (currentFilter['participantColumn'] && currentFilter['participantColumn']['name']
          && currentFilter['participantColumn']['name'] === defaultColumnName
          && currentFilter['participantColumn']['tableAlias'] === 'participantData');
        if (isOurDefaultColumnTabGrouped) {
          const groupName = currentFilter['participantColumn']['object'];
          if (groupName) {
            this.defaultColumns.push(currentFilter);
            return;
          }
        }
      }
    }
  }

  parseAdditionalValues(additionalValuesJson: object): object | null {
    if(additionalValuesJson === null) {
      return null;
    }

    this.settings['r'] && this.settings['r'].forEach((fieldSettings: FieldSettingsModel) => {
      const transformedKey = fieldSettings.columnName.toLowerCase().split('_').map((str: string, index: number) =>
        index > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : str).join('');

      const foundValue = fieldSettings.possibleValues && fieldSettings.possibleValues
        .find(({value}: ValueModel) => value === additionalValuesJson[transformedKey]);

      if(foundValue) {
        additionalValuesJson[transformedKey] = foundValue.name;
      }
    });

    return additionalValuesJson;
  }

  getQuestionOrStableId(question: QuestionDefinition): string {
    return question.questionText != null && question.questionText !== '' && question.questionText.length < 45 ?
      question.questionText : question.stableId;
  }

  orderColumns(): void {
    this.dataSources.forEach((value: string, key: string) => {
      this.sourceColumns[ key ].sort((a: Filter, b: Filter) => this.sort(a.participantColumn.display, b.participantColumn.display, 1));
    });
  }

  getSourceColumnsFromFilterClass(): void {
    for (const filter of Filter.ALL_COLUMNS) {
      if (filter.participantColumn.tableAlias === 'o' || filter.participantColumn.tableAlias === 'ex'
        || filter.participantColumn.tableAlias === 'r'
      ) {
        this.sourceColumns[ 'p' ].push(filter);
      } else if (filter.participantColumn.tableAlias === 'inst') {
        this.sourceColumns[ 'm' ].push(filter);
      }  else if (filter.participantColumn.tableAlias === 'sm') {
        this.sourceColumns[ 't' ].push( filter );
      } else if (filter.participantColumn.tableAlias === 'clinical') {
        this.sourceColumns[ 'clinical' ].push( filter );
      } else if (this.sourceColumns[ filter.participantColumn.tableAlias ] != null) {
        // TODO - can be changed to add all after all DDPs are migrated
        if (this.hasESData) {
          this.sourceColumns[ filter.participantColumn.tableAlias ].push(filter);
          const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
          this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
        } else {
          if (filter.participantColumn.tableAlias === 'data'
            && (filter.participantColumn.object === 'profile' || filter.participantColumn.object === 'address')
          ) {
            if (!['doNotContact', 'email', 'legacyShortId', 'legacyAltPid', 'createdAt'].includes(filter.participantColumn.name)) {
              this.sourceColumns[ filter.participantColumn.tableAlias ].push(filter);
              const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
              this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
            }
          } else if (filter.participantColumn.tableAlias === 'data' && filter.participantColumn.object == null) {
            this.sourceColumns[ filter.participantColumn.tableAlias ].push(filter);
            const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
          } else if (filter.participantColumn.tableAlias !== 'data') {
            this.sourceColumns[ filter.participantColumn.tableAlias ].push(filter);
            const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
            this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
          }
        }
      }
    }
  }

  private getData(): void {
    // find viewFilter by filterName
    let defaultFilter: ViewFilter = null;
    if (this.role.getUserSetting()?.defaultParticipantFilter) {
      defaultFilter = this.savedFilters.find(filter => filter.filterName === this.role.getUserSetting().defaultParticipantFilter);
      if (defaultFilter == null) {
        defaultFilter = this.quickFilters.find(filter => filter.filterName === this.role.getUserSetting().defaultParticipantFilter);
      }
      if (defaultFilter != null) {
        defaultFilter.selected=true;
        this.selectFilter(defaultFilter);
      } else if (this.role.getUserSetting()?.defaultParticipantFilter !== ''
        && this.role.getUserSetting()?.defaultParticipantFilter != null
      ) {
        // eslint-disable-next-line max-len
        this.additionalMessage = 'The default filter seems to be deleted, however it is still the default filter as long as not changed in the user settings.';
        this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
        this.dsmService.filterData(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), null, this.parent, true).subscribe({
          next: data => {
            if (data != null) {
              this.additionalMessage = '';
              this.participantList = [];
              this.originalParticipantList = [];
              this.copyParticipantList = [];
              const jsonData = data;
              jsonData['participants'].forEach((val) => {
                const participant = Participant.parse(val);
                this.participantList.push(participant);
              });
              this.originalParticipantList = this.participantList;
              this.participantsSize = jsonData['totalCount'];
              const date = new Date();
              this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
            }
            this.loadingParticipants = null;
            this.dataSources.forEach((value: string, key: string) => {
              this.selectedColumns[ key ] = [];
            });
            this.refillWithDefaultColumns();
            this.sendAnalyticsMetric();
          },
          error: err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.auth.logout();
            }
            this.loadingParticipants = null;
            this.errorMessage = 'Error - Loading Participant List, Please contact your DSM developer';
          }
        });
      }
    } else {
      this.selectFilter(null);
    }
  }

  private refillWithDefaultColumns(): void {
    this.selectedColumns['data'] = [];
    for (const defaultColumn of this.defaultColumns) {
      if (
        defaultColumn.participantColumn &&
        defaultColumn.participantColumn.object &&
        defaultColumn.participantColumn.tableAlias === 'participantData'
      ) {
        if (!this.selectedColumns[defaultColumn.participantColumn.object]) {
          this.selectedColumns[defaultColumn.participantColumn.object] = [];
        }
        this.selectedColumns[defaultColumn.participantColumn.object].push(defaultColumn);
      } else if (defaultColumn.participantColumn.tableAlias) {
        if (!this.selectedColumns[defaultColumn.participantColumn.tableAlias]) {
          this.selectedColumns[defaultColumn.participantColumn.tableAlias] = [];
        }
        this.selectedColumns[defaultColumn.participantColumn.tableAlias].push(defaultColumn);
      }
    }
  }



  public selectFilter(viewFilter: ViewFilter): void {
    this.resetPagination();
    this.resetSelectedPatients();
    this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
    this.currentView = JSON.stringify(viewFilter);
    if (viewFilter != null) {
      this.filtered = true;
      this.viewFilter = viewFilter;
    } else {
      this.filtered = false;
    }
    this.applyFilter(viewFilter);
  }

  resetSelectedPatients(): void {
    this.selectedPatients = [];
  }

  private applyFilter(viewFilter: ViewFilter, from: number = 0, to: number = this.role?.getUserSetting()?.getRowsPerPage()): void {
    this.dsmService.applyFilter(viewFilter, localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
      this.parent, null, from, to, this.sortBy)
      .subscribe({
        next: data => {
          if (data != null) {
            if (viewFilter != null && viewFilter.filters?.length) {
              for (const filter of viewFilter.filters) {
                let t = filter.participantColumn.tableAlias;
                if (t === 'r' || t === 'o' || t === 'ex') {
                  t = 'p';
                } else if (t === 'inst') {
                  t = 'm';
                } else if (t === 'sm') {
                  t = 't';
                } else if (t === 'participantData') {
                  t = filter.participantColumn.object;
                }
                for (const f of this.sourceColumns[t]) {
                  if (f.participantColumn.name === filter.participantColumn.name) {
                    const index = this.sourceColumns[t].indexOf(f);
                    if (index !== -1) {
                      this.sourceColumns[t].splice(index, 1);
                      this.sourceColumns[t].push(filter);
                      break;
                    }
                  }
                }
              }
            }
            this.participantList = [];
            this.additionalMessage = '';
            this.originalParticipantList = [];
            this.copyParticipantList = [];
            const jsonData = data;
            jsonData['participants'].forEach((val) => {
              const participant = Participant.parse(val);
              this.participantList.push(participant);
            });
            this.originalParticipantList = this.participantList;
            this.participantsSize = jsonData['totalCount'];
            if (viewFilter != null) {
              this.filterQuery = viewFilter.queryItems;
              viewFilter.selected = true;
              for (const f of this.quickFilters) {
                if (viewFilter.filterName !== f.filterName) {
                  f.selected = false;
                }
              }
              if (viewFilter.filters?.length) {
                for (const filter of viewFilter.filters) {
                  if (filter.type === Filter.OPTION_TYPE) {
                    filter.selectedOptions = filter.getSelectedOptionsBoolean();
                  }
                }
              }
              this.selectedFilterName = viewFilter.filterName;
              this.filterQuery = viewFilter.queryItems.replace(',', '');
              // this.selectedColumns = viewFilter.columns;
              const c = {};
              for (const key of Object.keys(viewFilter.columns)) {
                c[key] = [];
                for (const column of viewFilter.columns[key]) {
                  if (key === 'participantData' && column.participantColumn && column.participantColumn.object) {
                    if (!c[column.participantColumn.object]) {
                      c[column.participantColumn.object] = [];
                    }
                    c[column.participantColumn.object].push(column.copy());
                  } else {
                    c[key].push(column.copy());
                  }
                }
              }
              this.selectedColumns = c;
              if (!this.hasESData) {
                this.filterClientSide(viewFilter);
              }
            } else {
              // if selected columns are not set, set to default columns
              const selectedStudy = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
              if ((this.selectedColumns['data'] && this.selectedColumns['data'].length === 0)
                || (!this.selectedColumns['data'] && this.isSelectedColumnsNotEmpty())) {
                if(selectedStudy !== 'RGP') {
                  this.dataSources.forEach((value: string, key: string) => {
                    this.selectedColumns[key] = [];
                  });
                  this.refillWithDefaultColumns();
                }
                if(selectedStudy === 'RGP' && !this.searchForRGP) {
                  this.refillWithDefaultColumns();
                }
              }
            }
            const date = new Date();
            this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
          }
          this.loadingParticipants = null;
          this.sendAnalyticsMetric();
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.loadingParticipants = null;
          this.errorMessage = 'Error - Loading Participant List, Please contact your DSM developer';
        }
      });
  }

  isSelectedColumnsNotEmpty(): boolean {
    return Object.values(this.selectedColumns).find(value => value != null && (value as Array<any>).length > 0) !== null;
  }

  getColSpan(): number {
    let columnCount = 1; // 1 = checkbox column
    this.dataSources.forEach((value: string, key: string) => {
      if (this.selectedColumns[ key ] != null) {
        this.selectedColumns[ key ].forEach(col => columnCount = columnCount + 1);
      }
    });
    return columnCount;
  }

  getFilters(): void {
    this.dsmService.getFiltersForUserForRealm(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), this.parent).subscribe({
      next: jsonData => {
        this.savedFilters = [];
        jsonData.forEach((val) => {
          let view: ViewFilter;
          if (!val.userId.includes('System')) {
            view = ViewFilter.parseFilter(val, this.sourceColumns);
            this.savedFilters.push(view);
          }
        });
        this.savedFilters.sort((f1, f2) => f1.filterName.localeCompare(f2.filterName));
      },
      error: () => {
        this.showSavedFilters = false;
        this.errorMessage = 'Error - Loading Filter List, Please contact your DSM developer';
      }
    });
  }

  public onclickDropDown(e): void {
    e.stopPropagation();
  }

  showCustomizeView(): void {
    // this.loadSettings();
    this.showFilters = false;
    this.showSavedFilters = false;
    this.showCustomizeViewTable = !this.showCustomizeViewTable;
  }

  showFiltersTable(): void {
    const assigneesMap = [];
    if (this.assignees) {
      this.assignees.forEach(assignee => {
        if (assignee.assigneeId !== '-1') {
          assigneesMap.push(new NameValue(assignee.assigneeId, assignee.name));
        }
      });
    }
    // fixing assignee filters
    if (this.selectedColumns[ 'p' ] != null) {
      this.selectedColumns[ 'p' ].forEach((col, i) => {
        if (col.participantColumn.name === Filter.ASSIGNEE_MR.participantColumn.name) {
          this.selectedColumns[ 'p' ][ i ] = new Filter(ParticipantColumn.ASSIGNEE_MR, Filter.OPTION_TYPE, assigneesMap);
        }
      });
      this.selectedColumns[ 'p' ].forEach((col, i) => {
        if (col.participantColumn.name === Filter.ASSIGNEE_TISSUE.participantColumn.name) {
          this.selectedColumns[ 'p' ][ i ] = new Filter(ParticipantColumn.ASSIGNEE_TISSUE, Filter.OPTION_TYPE, assigneesMap);
        }
      });
    }
    this.showCustomizeViewTable = false;
    this.showSavedFilters = false;
    this.showFilters = !this.showFilters;
  }

  showSavedFiltersPanel(): void {
    this.showCustomizeViewTable = false;
    this.showFilters = false;
    this.showSavedFilters = !this.showSavedFilters;
    if (this.showSavedFilters) {
      this.getFilters();
    }
  }

  public clearFilter(): void {
    this.setSelectedFilterName('');
    this.start = new Date().getTime();
    this.filterQuery = null;
    this.resetSelectedPatients();
    this.clearAllFilters();
    this.getData();
    this.setDefaultColumns();
    const selectedStudy = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
    if(selectedStudy === 'RGP') {
      this.searchForRGP = true;
    }
  }

  private setDefaultColumns(): void {
    if (this.isQuickFilterSelected()) {
      this.setQuickFilterColumnsIfSelected();
      return;
    } else if (this.isSavedFilterSelected()) {
      this.setSavedFilterColumnsIfSelected();
      return;
    }
    const filteredColumns = this.getDefaultColumns();
    this.selectedColumns = filteredColumns;
    if (this.isDataOfViewFilterExists()) {
      this.viewFilter.columns = this.getDefaultColumns();
    }
  }

  private setSavedFilterColumnsIfSelected(): void {
    const selectedSavedFilter = this.savedFilters.find(sf => sf.selected);
    if (selectedSavedFilter) {
      this.selectedColumns = selectedSavedFilter.columns;
    }
  }

  private setQuickFilterColumnsIfSelected(): void {
    const selectedQuickFilter = this.quickFilters.find(qf => qf.selected);
    if (selectedQuickFilter) {
      this.selectedColumns = selectedQuickFilter.columns;
    }
  }

  private isQuickFilterSelected(): boolean {
    let isQuickFilterSelected = false;
    this.quickFilters.forEach(viewFilter => {
      if (viewFilter.selected) {
        isQuickFilterSelected = true;
      }
    });
    return isQuickFilterSelected;
  }

  private isSavedFilterSelected(): boolean {
    let isSavedFilterSelected = false;
    this.savedFilters.forEach(viewFilter => {
      if (viewFilter.selected) {
        isSavedFilterSelected = true;
      }
    });
    return isSavedFilterSelected;
  }

  private getDefaultColumns(): {} {
    const filteredColumns = {};
    for (const defaultColumn of this.defaultColumns){
      Object.entries(this.sourceColumns).forEach( entry => {
        const [key, value] = entry;
        const val = value as Filter[];
        val.forEach(col => {
            if (defaultColumn['participantColumn']['name'] === col['participantColumn']['name']
              && defaultColumn['participantColumn']['tableAlias'] === col['participantColumn']['tableAlias']) {
              const newVal = filteredColumns[key]? filteredColumns[key]: [];
              newVal.push(col);
              filteredColumns[key] = newVal;
            }
        });
      });
    }
    return filteredColumns;
  }

  public parseMillisToDateString(dateInMillis: number): string {
    const date = new Date(dateInMillis);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
    };
    return date.toLocaleString('en-US', options);
  }

  public clearAllFilters(): void {
    this.clearManualFilters();
    this.resetPagination();
    this.deselectQuickFilters();
    this.deselectSavedFilters();
  }
  public clearManualFilters(): void {
    this.dataSources.forEach((value: string, key: string) => {
      if (this.selectedColumns[ key ] != null) {
        for (const filter of this.selectedColumns[ key ]) {
          if (filter != null) {
            filter.clearFilter();
          }
        }
      }
    });
    this.currentFilter = [];
  }

  private resetPagination(): void {
    this.viewFilter = null;
    this.jsonPatch = null;
    this.activePage = 1;
    this.rowsPerPage = this.role?.getUserSetting()?.getRowsPerPage();
  }

  getUtilStatic(): typeof Utils {
    return Utils;
  }

  public setSelectedFilterName(filterName): void {
    this.selectedFilterName = filterName;
  }


  addOrRemoveColumn(column: Filter, parent: string): void {
    if (this.selectedColumns[ parent ] == null) {
      this.selectedColumns[ parent ] = [];
    }
    if (this.hasThisColumnSelected(this.selectedColumns[ parent ], column)) {
      const f = this.selectedColumns[ parent ].find(item =>
        item.participantColumn.tableAlias === column.participantColumn.tableAlias &&
        item.participantColumn.name === column.participantColumn.name
      );
      const index = this.selectedColumns[ parent ].indexOf(f);
      this.selectedColumns[ parent ].splice(index, 1);
    } else {
      this.selectedColumns[ parent ].push(column);
    }
  }

  private isDataOfViewFilterExists(): boolean {
    return !!(this.viewFilter && this.viewFilter.columns && this.viewFilter.columns.data);
  }

  renewSelectedColumns(): void {
    if (this.savedSelectedColumns['data'] && this.sourceColumns['data']) {
      this.selectedColumns['data'] = this.savedSelectedColumns['data'].map(filter => {
        const column = this.sourceColumns['data'].find(f =>
          f.participantColumn.tableAlias === filter.participantColumn.tableAlias
          && f.participantColumn.name === filter.participantColumn.name
        );
        return column;
      });
    }
  }

  saveSelectedColumns(): void {
    this.savedSelectedColumns = this.selectedColumns;
  }

  openParticipant(participant: Participant, colSource: string, selectedActivity?): void {
    if (participant != null) {
      let tabAnchor = 'Survey Data';
      if (colSource === 'm' || participant.data.activities == null) {
        tabAnchor = 'Medical Records';
        this.selectedMR = '';
        this.selectedOncOrTissue = '';
      } else if (colSource === 'oD' || colSource === 't') {
        tabAnchor = 'Onc History';
        this.selectedMR = '';
        this.selectedOncOrTissue = '';
      }
      if (participant.participantData) {
        let proband = participant.participantData.find(p => p.data[ 'MEMBER_TYPE' ] === 'SELF');
        if (!proband) {
          proband = participant.participantData
            .find(p => p.data[ 'COLLABORATOR_PARTICIPANT_ID' ] && p.data[ 'COLLABORATOR_PARTICIPANT_ID' ].slice(-2) === '_3');
        }
        if (proband && proband.participantDataId) {
          tabAnchor = proband.participantDataId;
        }
      }
      if(tabAnchor === 'Survey Data') {
        this.selectedActivity = selectedActivity;
      }
      if (this.filtered && participant.participant != null && participant.participant.ddpParticipantId != null) {
        this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
        this.dsmService.getParticipantData(
            localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
            participant.participant.ddpParticipantId,
            this.parent
          )
          .subscribe({
            next: data => {
              if (data != null && data[0] != null) {
                const pt: Participant = Participant.parse(data[0]);
                if (pt == null) {
                  this.errorMessage = 'Participant not found';
                } else {
                  if (pt.participant != null && pt.participant.ddpParticipantId != null
                    && pt.participant.ddpParticipantId === participant.participant.ddpParticipantId) {
                    this.selectedTab = tabAnchor;
                    this.participant = pt;
                    this.showParticipantInformation = true;
                    this.showTissue = false;
                  }
                }
              } else {
                this.errorMessage = 'Error - Loading Participant Information, Please contact your DSM developer';
              }
              this.loadingParticipants = null;
            },
            error: () => {
              this.errorMessage = 'Error - Loading Participant Information, Please contact your DSM developer';
            }
          });
      } else {
        this.selectedTab = tabAnchor;
        this.participant = participant;
        this.showParticipantInformation = true;
        this.showTissue = false;
      }
    }
  }

  openTissue(participant: Participant, oncHistory: OncHistoryDetail): void {
    if (participant != null && oncHistory != null) {
      this.participant = participant;
      this.oncHistoryDetail = oncHistory;
      this.showTissue = true;
    }
  }

  getRealm(): string {
    return localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
  }

  getFilterButtonColorStyle(isOpened: boolean): string {
    if (isOpened) {
      return Statics.COLOR_ACCENT;
    }
    return Statics.COLOR_BASIC;
  }

  getButtonColorStyle(isOpened: boolean): string {
    if (isOpened) {
      return Statics.COLOR_PRIMARY;
    }
    return Statics.COLOR_BASIC;
  }

  public doFilter(): void {
    this.resetPagination();
    this.resetSelectedPatients();
    const json = [];
    this.dataSources.forEach((value: string, key: string) => {
        this.createFilterJson(json, key);
      }
    );
    // nothing to filter on the server
    if (json.length !== 0) {
      this.filterQuery = null;
      this.selectedFilterName = null;
      this.deselectQuickFilters();
      const jsonPatch = JSON.stringify({
        filters: json,
        parent: this.parent
      });
      this.currentFilter = json;
      this.currentView = jsonPatch;
      this.jsonPatch = jsonPatch;
      this.filtered = true;
      this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
      this.dsmService.filterData(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), jsonPatch, this.parent, null)
        .subscribe({
          next: data => {
            if (data != null && data !== '') {
              this.participantList = [];
              this.additionalMessage = '';
              this.originalParticipantList = [];
              this.copyParticipantList = [];
              this.filterQuery = '';
              const jsonData = data;
              jsonData['participants'].forEach((val) => {
                const participant = Participant.parse(val);
                this.participantList.push(participant);
              });
              this.originalParticipantList = this.participantList;
              this.participantsSize = jsonData['totalCount'];
              if (!this.hasESData) {
                this.filterClientSide(null);
              }
              this.loadingParticipants = null;
              this.errorMessage = null;
              window.scrollTo(0, 0);
              const date = new Date();
              this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
              this.additionalMessage = null;
            } else {
              this.additionalMessage = 'Something went wrong while filtering - List was not filtered!';
            }
          },
          error: err => {
            this.loadingParticipants = null;
            this.errorMessage = 'Error - Loading Participant List, Please contact your DSM developer\n ' + err;
          }
        });
    } else {
      this.filtered = false;
      this.filterQuery = '';
      this.selectedFilterName = null;
      this.deselectQuickFilters();
      // TODO - can be changed later to all using the same - after all studies are migrated!
      // check if it was a tableAlias data filter -> filter client side
      const selectedStudy = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
      if(selectedStudy === 'RGP') {
        this.searchForRGP = true;
      }
      this.selectFilter(null);
    }
  }

  createFilterJson(json, key: string): void {
    if (this.selectedColumns[ key ] != null) {
      for (const filter of this.selectedColumns[ key ]) {
        this.addFilterToJson(filter, json);
      }
    }
  }

  addFilterToJson(filter: Filter, json): void {
    const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
    let filterText = null;
    // change filter to something backend knows!
    if (filter.participantColumn.name === 'sampleQueue') {
      if (filter.type === Filter.OPTION_TYPE) {
        let status = null;
        for (const [key, value] of Object.entries(filter.selectedOptions)) {
          if (value) {
            status = filter.options[ key ].name;
            break;
          }
        }
        if (status != null) {
          if (status === 'shipped') {
            let filter1 = new NameValue('scanDate', null);
            let filter2 = new NameValue('scanDate', 'true');
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn
            );
            json.push(filterText);
            filter1 = new NameValue('receiveDate', 'true');
            filter2 = new NameValue('receiveDate', null);
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn
            );
          }
          if (status === 'received') {
            const filter1 = new NameValue('receiveDate', null);
            const filter2 = new NameValue('receiveDate', 'true');
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn
            );
          }
          if (status === 'deactivated') {
            const filter1 = new NameValue('deactivatedDate', null);
            const filter2 = new NameValue('deactivatedDate', 'true');
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, false, true, filter.participantColumn
            );
          }
          if (status === 'error') {
            let filter1 = new NameValue('error', 'true');
            let filter2 = new NameValue('error', null);
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.CHECKBOX_TYPE, false, false, false, filter.participantColumn
            );
            json.push(filterText);
            filter1 = new NameValue('scanDate', 'true');
            filter2 = new NameValue('scanDate', null);
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn
            );
          }
          if (status === 'queue') {
            const filter1 = new NameValue('scanDate', 'true');
            const filter2 = new NameValue('scanDate', null);
            filterText = Filter.getFilterJson(
              tmp, filter1, filter2, null, false, Filter.DATE_TYPE, false, true, false, filter.participantColumn
            );
          }
        }
      }
    } else if (filter.participantColumn.name === 'uploadReason') {
      if (filter.type === Filter.OPTION_TYPE) {
        let option = null;
        for (const [key, value] of Object.entries(filter.selectedOptions)) {
          if (value) {
            option = filter.options[ key ].name;
            break;
          }
        }
        if (option === 'SAMPLE_UPLOAD_EMPTY') {
          const filter1 = new NameValue('uploadReason', null);
          const filter2 = new NameValue('uploadReason', null);
          filterText = Filter.getFilterJson(
            tmp, filter1, filter2, [], true, Filter.OPTION_TYPE, false, true, false, filter.participantColumn
          );
        } else {
          filterText = Filter.getFilterText(filter, tmp);
        }
      }
    } else {
      filterText = Filter.getFilterText(filter, tmp);
    }
    if (filterText != null && Object.keys(filterText).length > 0) {
      json.push(filterText);
    }
  }

  hasRole(): RoleService {
    return this.role;
  }

  public shareFilter(savedFilter: ViewFilter, i): void {
    const value = savedFilter.shared ? '0' : '1';
    const patch1 = new PatchUtil(savedFilter.id, this.role.userMail(),
      {name: 'shared', value}, null, this.parent, null, null, null, localStorage.getItem(ComponentService.MENU_SELECTED_REALM), null);
    const patch = patch1.getPatch();
    this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe({
      next: data => {
        this.savedFilters[ i ].shared = ( value === '1' );
      },
      error: () => {
        this.additionalMessage = 'Error - Sharing Filter, Please contact your DSM developer';
      }
    });
  }

  public deleteView(savedFilter: ViewFilter): void {
    const patch1 = new PatchUtil(
      savedFilter.id, this.role.userMail(),
      {name: 'fDeleted', value: '1'}, null, this.parent, null, null, null,
      localStorage.getItem(ComponentService.MENU_SELECTED_REALM), null
    );
    const patch = patch1.getPatch();
    this.dsmService.patchParticipantRecord(JSON.stringify(patch)).subscribe({
      next: data => {
        this.getFilters();
      },
      error: () => {
        this.additionalMessage = 'Error - Deleting Filter, Please contact your DSM developer';
      }
    });
  }

  saveCurrentFilter(): void {
    this.dup = false;
    this.plus = false;
    if (this.filterName.includes('+')) {
      this.plus = true;
      return;
    }

    const columns = [];
    this.dataSources.forEach((value: string, key: string) => {
      if (this.selectedColumns != null && this.selectedColumns[ key ] != null) {
        for (const col of this.selectedColumns[ key ]) {
          const name = col.participantColumn.name;
          columns.push( col.participantColumn.tableAlias + '.' + name );
        }
      }
    });
    let tmpFilterName = this.selectedFilterName;
    const quickFilter = this.quickFilters.find(x => x.filterName === this.selectedFilterName);
    if (quickFilter == null) {
      tmpFilterName = null;
    }

    const jsonData = {
      columnsToSave: columns,
      filterName: this.filterName,
      shared: '0',
      fDeleted: '0',
      filters: this.currentFilter,
      parent: this.parent,
      quickFilterName: tmpFilterName,
      queryItems: this.filterQuery
    };
    const jsonPatch = JSON.stringify(jsonData);
    this.currentView = jsonPatch;
    this.dsmService.saveCurrentFilter(jsonPatch, localStorage.getItem(ComponentService.MENU_SELECTED_REALM), this.parent).subscribe({
      next: data => {
        const result = Result.parse(data);
        if (result.code === 500 && result.body != null) {
          this.dup = true;
          return;
        } else if (result.code !== 500) {
          this.dup = false;
          this.plus = false;
          this.filterName = null;
          this.modal.hide();
        }
      },
      error: () => {
        this.additionalMessage = 'Error - Saving Filter, Please contact your DSM developer';
      }
    });
  }

  public isSortField(name: string, tableAlias: string): boolean {
    return name === this.sortBy?.innerProperty && tableAlias === this.sortBy?.tableAlias;
  }

  sortByColumnName(col: Filter, sortParent: string): void {
    const isSortingByTheSameColumn = col.participantColumn.name === this.sortBy?.innerProperty;
    const isPreviouslySortedByAscending = 'asc' === this.sortOrder;
    this.sortOrder = this.sortBy !== null
          ? isSortingByTheSameColumn ? ( isPreviouslySortedByAscending ? 'desc' : 'asc' ) : 'asc'
          : 'asc';
    this.sortParent = sortParent;
    const sort = Sort.parse(col, this.sortOrder);
    sort.activityVersions = this.getLatestActivityVersion(col);
    this.sortBy = sort;
    this.pageChanged(this.activePage, this.rowsPerPage);
  }

  getLatestActivityVersion(column: Filter): string[] {
    if (column.participantColumn === null) {
      return null;
    }
    const activityCode = column.participantColumn.tableAlias;
    const activityVersions = this.activityDefinitionList
        .filter(activity => activityCode === activity.activityCode)
        .map(activity => activity.activityVersion);
    if (activityVersions.length > 0) {
      return activityVersions;
    }
    else {
      return null;
    }
  }

  private sort(x, y, order, sortField?, colType?): number {
    if (sortField !== undefined && x != null && y != null) {
      x = x[ sortField ];
      y = y[ sortField ];
    }
    if (x == null || x === '' || (colType === 'DATE' && x === 0)) {
      return 1;
    } else if (y == null || y === '' || (colType === 'DATE' && y === 0)) {
      return -1;
    } else {
      if (typeof x === 'string') {
        if (x.toLowerCase() < y.toLowerCase()) {
          return -1 * order;
        } else if (x.toLowerCase() > y.toLowerCase()) {
          return 1 * order;
        } else {
          return 0;
        }
      } else {
        if (x < y) {
          return -1 * order;
        } else if (x > y) {
          return 1 * order;
        } else {
          return 0;
        }
      }
    }
  }

  findOptionValue(chosenOption: Array<string>, activityCode: string, stableId: string): any {
    const filter = this.selectedColumns[activityCode].find(f => f.participantColumn.name === stableId);
    const optionValue = filter.options.find(option => option.name === chosenOption);
    return optionValue.value;
  }

  public isSelectedFilter(filterName): boolean {
    return this.selectedFilterName === filterName;
  }

  getUtil(): Utils {
    return this.util;
  }

  getLanguageName(languageCode: string): string {
      const language = this.preferredLanguages.find(obj => obj.languageCode === languageCode);
      if (language != null) {
        return language.displayName;
      }
      return '';
  }

  getKeys(): string[] {
    return Array.from(this.dataSources.keys());
  }

  getTableAlias(col: ParticipantColumn): string {
    return col.object != null ? col.object : col.tableAlias;
  }

  openDialog(message: string): MatDialogRef<LoadingModalComponent> {
    return this.dialog.open(LoadingModalComponent, {data: {message: message}, disableClose: true});
  }

  openBulkCohort(): void {
    const openedDialog = this.dialog.open(BulkCohortTagModalComponent, {data: {
      manualFilter: this.jsonPatch,
      savedFilter: this.viewFilter,
      selectedPatients: this.selectedPatients
    }});
    openedDialog.afterClosed().subscribe(data => this.setBulkCreatedTagsToParticipants(data));
  }

  private setBulkCreatedTagsToParticipants(data: any): void {
    const cohortTags = data as CohortTag[];
    if(cohortTags instanceof Array && cohortTags.length) {
      for (const cohortTag of cohortTags) {
        const maybeParticipant = this.participantList
          .find(participant => participant.data.profile['guid'] === cohortTag['ddpParticipantId']);
        if (maybeParticipant) {
          const existingCohortTags = maybeParticipant.data.dsm[CohortTagComponent.COHORT_TAG] as CohortTag[];
          if (existingCohortTags) {
            if (existingCohortTags.find(tag => tag.cohortTagName === cohortTag.cohortTagName)) {
              continue;
            }
            existingCohortTags.push(cohortTag);
          } else {
            maybeParticipant.data.dsm[CohortTagComponent.COHORT_TAG] = [cohortTag];
          }
        }
      }
    }
  }

  downloadCurrentData(): void {
    this.openModal('exportOptions');
  }

  executeDownload(): void {
    this.modal.hide();

    const dialogRef = this.openDialog('Exporting participants list. This may take several minutes...');
    const columns = [];
    for(const col in this.selectedColumns) {
      for (const key in this.selectedColumns[col]) {
        columns.push(this.selectedColumns[col][key]);
      }
    }
    this.dsmService.downloadParticipantData(
      localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
      this.jsonPatch,
      this.parent,
      columns,
      this.viewFilter,
      null,
      this.sortBy,
      this.exportFileFormat,
      this.exportHumanReadable,
      this.exportOnlyMostRecent
    ).subscribe({
      next: response => {
        let fileName = 'file';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = fileNameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            fileName = matches[1].replace(/['"]/g, '');
          }
        }
        const fileContent = response.body;
        const blob = new Blob([fileContent], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
        dialogRef.close();
      },
      error: err => {
        dialogRef.close();
        // open a dialog to show the error so the user doesn't lose their current view
        this.openModal('downloadError');
      }}
    );
  }

  isMultipleOrSingleSelectMode( qDef: QuestionDefinition ): boolean {
    return (qDef.selectMode === 'MULTIPLE' || qDef.selectMode === 'SINGLE');
  }

  getOptionDisplay(options: NameValue[], key: string): string {
    if (options != null) {
      const nameValue = options.find(obj => obj.name === key);
      if (nameValue != null) {
        return nameValue.value;
      }
    }
    return key;
  }

  checkboxChecked(participant: Participant): void {
    this.isAssignButtonDisabled = true;
    if (participant.isSelected) {
      if (this.isAssignable(participant)) {
        this.isAssignButtonDisabled = false;
      }
      this.selectedPatients.push(participant.data.profile['guid']);
    } else {
      this.selectedPatients = this.selectedPatients.filter(guid => guid !== participant.data.profile['guid']);
    }
  }

  generateCheckboxColor(participant: Participant): string {
    if (this.isAssignable(participant)) {
      return 'accent';
    } else {
      return 'primary';
    }
  }

  isAnySelectedAssignable(): boolean {
    return this.participantList.find(participant => participant.isSelected && this.isAssignable(participant)) != null;
  }

  private isAssignable(participant: Participant): boolean {
    return participant.data.status === 'ENROLLED'
      && participant.data.medicalProviders != null && participant.medicalRecords != null
      && participant.data.medicalProviders.length > 0 && participant.medicalRecords.length > 0;
  }

  assign(): void { // arg[0] = selectedAssignee: Assignee
    this.additionalMessage = null;
    if (this.assignee != null && this.participantList.length > 0) {
      const assignParticipants: Array<AssigneeParticipant> = [];
      for (const pt of this.participantList) {
        if (pt.isSelected && this.isAssignable(pt)) {
          if (this.assignMR) {
            if (this.assignee.assigneeId === '-1') {
              pt.participant.assigneeIdMr = null;
            } else {
              pt.participant.assigneeIdMr = this.assignee.name;
            }
          }
          if (this.assignTissue) {
            if (this.assignee.assigneeId === '-1') {
              pt.participant.assigneeIdTissue = null;
            } else {
              pt.participant.assigneeIdTissue = this.assignee.name;
            }
          }
          assignParticipants.push(new AssigneeParticipant(pt.participant.participantId, this.assignee.assigneeId,
            this.assignee.email, pt.data.profile[ 'shortId' ]));
        }
      }
      this.deselect();
      this.dsmService.assignParticipant(
          localStorage.getItem(ComponentService.MENU_SELECTED_REALM),
          this.assignMR, this.assignTissue, JSON.stringify(assignParticipants)
        )
        .subscribe({ // need to subscribe, otherwise it will not send!
          next: data => {
            const result = Result.parse(data);
            if (result.code !== 200) {
              this.additionalMessage = result.body;
            }
            // this.loadParticipantData();
            this.assignMR = false;
            this.assignTissue = false;
          },
          error: err => {
            if (err._body === Auth.AUTHENTICATION_ERROR) {
              this.router.navigate([Statics.HOME_URL]);
            }
            this.additionalMessage = 'Error - Assigning Participants, Please contact your DSM developer';
          }
        });
    }
    this.modal.hide();
    window.scrollTo(0, 0);
  }

  assigneeSelected(evt: any): void {
    this.assignee = evt;
  }

  deselect(): void {
    for (const pt of this.participantList) {
      if (pt.isSelected) {
        pt.isSelected = false;
      }
    }
  }

  openModal(modalAnchor: string): void {
    this.modalAnchor = modalAnchor;
    this.modal.show();
  }

  deselectQuickFilters(): void {
    this.deselectFilters(this.quickFilters);
  }

  deselectSavedFilters(): void {
    this.deselectFilters(this.savedFilters);
  }

  deselectFilters(filterArray: ViewFilter[]): void {
    if (filterArray != null) {
      filterArray.forEach(filter => {
        if (filter.selected) {
          filter.selected = false;
        }
      });
    }
  }

  public doFilterByQuery(queryText: string): void {
    this.clearManualFilters();
    this.deselectQuickFilters();
    this.deactivateSavedFilterIfNotInUse(queryText);
    queryText = queryText.replace('( k.uploadReason = \'NORMAL\' )', 'k.uploadReason IS NULL');
    queryText = queryText.replace('( k.uploadReason like \'NORMAL\' )', 'k.uploadReason IS NULL');
    const jsonPatch = JSON.stringify({
      filterQuery: queryText,
      parent: this.parent
    });
    this.filtered = queryText != null;
    this.jsonPatch = jsonPatch;
    this.loadingParticipants = localStorage.getItem(ComponentService.MENU_SELECTED_REALM);
    this.dsmService.filterData(localStorage.getItem(ComponentService.MENU_SELECTED_REALM), jsonPatch, this.parent, null)
      .subscribe({
        next: data => {
          this.participantList = [];
          this.additionalMessage = '';
          this.originalParticipantList = [];
          this.copyParticipantList = [];
          if (data != null) {
            const jsonData = data;
            jsonData['participants'].forEach((val) => {
              const participant = Participant.parse(val);
              this.participantList.push(participant);
            });
            this.originalParticipantList = this.participantList;
            this.participantsSize = jsonData['totalCount'];
            const date = new Date();
            this.loadedTimeStamp = Utils.getDateFormatted(date, Utils.DATE_STRING_IN_EVENT_CVS);
            this.additionalMessage = null;
          }
          this.loadingParticipants = null;
          this.filterQuery = queryText;
        },
        error: () => {
          this.participantList = [];
          this.originalParticipantList = [];
          this.copyParticipantList = [];
          this.loadingParticipants = null;
          this.additionalMessage = 'Error - Filtering Participant List, Please contact your DSM developer';
        }
      });
  }

  private deactivateSavedFilterIfNotInUse(queryText: string): void {
    if (this.filterQuery !== queryText) {
      this.selectedFilterName = '';
    }
  }

  addContactInformationColumns(): void {
    this.showContactInformation = true;

    this.dataSources.set('address', 'Contact Information');
    const possibleColumns: Array<Filter> = [];
    possibleColumns.push(new Filter(new ParticipantColumn('Street 1', 'street1', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Street 2', 'street2', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('City', 'city', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('State', 'state', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Zip', 'zip', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Country', 'country', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Phone', 'phone', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Mail To Name', 'mailToName', 'address', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('Valid', 'valid', 'address', null, true), Filter.BOOLEAN_TYPE));

    this.sourceColumns['address'] = possibleColumns;
    this.selectedColumns[ 'address' ] = [];
    possibleColumns.forEach(filter => {
      const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
      this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
    });
    this.orderColumns();
  }

  getQuestionAnswerByName(questionsAnswers: Array<QuestionAnswer>, name: string): QuestionAnswer {
    return questionsAnswers.find(x => x.stableId === name);
  }

  updateParticipant(participant: Participant): void {
    if (participant != null) {
      this.showParticipantInformation = false;
      const pt = this.participantList.find(p => p.data.profile[ 'guid' ] === participant.data.profile[ 'guid' ]);
      if (pt != null) {
        const index = this.participantList.indexOf(pt);
        this.participantList[ index ] = participant;
      }
    }
  }

  getMultiObjects(fieldValue: string | string[]): any {
    if (!(fieldValue instanceof Array)) {
      return JSON.parse(fieldValue);
    }
    return null;
  }

  getMultiKeys(o: any): string[] {
    if (o != null) {
      return Object.keys(o);
    }
    return null;
  }

  isDateValue(value: string): boolean {
    return value != null && typeof value === 'string' && value.indexOf('dateString') > -1 && value.indexOf('est') > -1;
  }

  getDateValue(value: string): string {
    if (value != null) {
      const o: any = JSON.parse(value);
      return o[ 'dateString' ];
    }
    return '';
  }

  filterClientSide(viewFilter: ViewFilter): boolean {
    let didClientSearch = false;
    if (viewFilter == null && this.selectedColumns[ 'data' ].length === 0) {
      return didClientSearch;
    }
    let participantFilters: Filter[];
    if (viewFilter != null && viewFilter.filters != null && viewFilter.filters.length !== 0) {
      participantFilters = viewFilter.filters;
    } else if (viewFilter == null) {
      participantFilters = this.selectedColumns[ 'data' ];
    }
    this.copyParticipantList = this.originalParticipantList;
    if (participantFilters != null && participantFilters.length !== 0) {
      for (const filter of participantFilters) {
        if (filter.participantColumn.tableAlias === 'data') {
          const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
          const filterText = Filter.getFilterText(filter, tmp);
          if (filterText != null) {
            didClientSearch = true;
            if (filter.type === 'TEXT') {
              let value = filterText[ 'filter1' ][ 'value' ];
              if (value !== null) {
                if (value.includes('\'')) {
                  const first = value.indexOf('\'');
                  const last = value.lastIndexOf('\'');
                  value = value.substring(first + 1, last);
                } else if (value.includes('"')) {
                  const first = value.indexOf('"');
                  const last = value.lastIndexOf('"');
                  value = value.substring(first + 1, last);
                }
                if (value != null && value !== '') {
                  this.copyParticipantList = this.copyParticipantList.filter(participant =>
                    participant.data !== null &&
                    participant.data[ filterText[ 'parentName' ] ][ filterText[ 'filter1' ][ 'name' ] ] === value
                  );
                }
                this.participantList = this.copyParticipantList;
              } else {
                const empt = filterText[ 'empty' ];
                if (empt === 'true') {
                  this.copyParticipantList = this.copyParticipantList.filter(participant =>
                    participant.data !== null &&
                    participant.data[ filterText[ 'parentName' ] ][ filterText[ 'filter1' ][ 'name' ] ] === null
                  );
                } else {
                  const notempt = filterText[ 'notEmpty' ];
                  if (notempt === 'true') {
                    this.copyParticipantList = this.copyParticipantList.filter(participant =>
                      participant.data !== null &&
                      participant.data[ filterText[ 'parentName' ] ][ filterText[ 'filter1' ][ 'name' ] ] !== null
                    );
                  }
                }
                this.participantList = this.copyParticipantList;
              }

            } else if (filterText[ 'type' ] === 'OPTIONS') {
              const results: Participant[] = [];
              let temp: Participant[] = [];
              for (const option of filterText[ 'selectedOptions' ]) {// status
                temp = this.copyParticipantList.filter(participant =>
                  participant.data != null &&
                  participant.data[ filterText[ 'filter1' ][ 'name' ] ] === option
                );
                for (const t of temp) {
                  results.push(t);
                }
              }
              this.copyParticipantList = results;
              this.participantList = results;
            }
          }
        }
      }
    }
    return didClientSearch;
  }

  hasThisColumnSelected(selectedColumnArray: Array<Filter>, oncColumn: Filter): boolean {
    const f = selectedColumnArray.find(item =>
      item.participantColumn.tableAlias === oncColumn.participantColumn.tableAlias &&
      item.participantColumn.name === oncColumn.participantColumn.name
    );
    return f !== undefined;
  }

  changeRowNumber(rows: number): void {
    this.pageChanged(this.activePage, rows);
    this.rowsPerPage = rows;
  }

  formatInvitation(invitationCode: string): string {
    return invitationCode == null ? '' : invitationCode.match(/.{1,4}/g).join('-');
  }

  getParticipantData(participant: Participant, column: string, fieldTypeId: string): string {
    if (participant != null && participant.participantData != null && fieldTypeId != null && column != null) {
      const participantData = participant.participantData.find(pData => pData.fieldTypeId === fieldTypeId);
      if (participantData != null && participantData.data != null && participantData.data[column] != null) {
        return participantData.data[column];
      }
    }
    return '';
  }

  updateStudySpecificStatuses(statuses: NameValue[]): void {
    if (this.sourceColumns && this.sourceColumns[ 'data' ]) {
      const statusFilter: Filter = this.sourceColumns['data'].find((filter: Filter) => filter.participantColumn.name === 'status');
      if (statusFilter && statusFilter.options) {
        if (statusFilter.options.length > 1) {
          statusFilter.options = statusFilter.options.slice(0, 1);
        }
        if (statuses) {
          statuses.forEach((status: NameValue) => statusFilter.options.push(new NameValue(status.name, status.value)));
        }
      }
    }
  }

  getPersonField(personData: ParticipantData, column: Filter, participant: Participant): string {
    let name: string;
    if (column && column.participantColumn) {
      name = column.participantColumn.name;
    }
    return this.getPersonFieldFromDataRow(personData, column, name, participant);
  }

  getPersonFieldFromDataRow(personData: ParticipantData, column: Filter, name: string, participant: Participant): any {
    if (!personData || !personData.data || !name) {
      return null;
    }
    const currentKey = Object.keys(personData.data).find(key => key === name);
    const field = personData.data[currentKey];
    if (field) {
      if (column.options && column.options[0] && column.options[0].name) {
        let fieldToShow;
        if (column.additionalType === Filter.ACTIVITY_STAFF_TYPE) {
          fieldToShow = column.options.find(nameValue => nameValue.name === field);
        } else {
          fieldToShow = column.options.find(nameValue => nameValue.value === field);
        }
        if (fieldToShow != null) {
          return fieldToShow.name;
        }
        return '';
      }
      return field;
    } else {
      const fieldSettings: FieldSettings[] = this.settings[column.participantColumn.object];
      if (fieldSettings != null) {
        const fieldSetting = fieldSettings.find(setting => setting.columnName === name);
        if (fieldSetting != null) {
          if (fieldSetting.actions && fieldSetting.actions[0]) {
            if (
              fieldSetting.actions[0].type === 'CALC' && fieldSetting.actions[0].value
              && personData.data[fieldSetting.actions[0].value]
            ) {
              return this.countYears(personData.data[fieldSetting.actions[0].value]);
            } else if (fieldSetting.actions[0].type === 'SAMPLE' && fieldSetting.actions[0].type2 === 'MAP_TO_KIT') {
              return this.getSampleFieldValue(fieldSetting, personData, participant);
            }
          }
        }
      }
    }
    return '';
  }

  getSampleFieldValue(fieldSetting: FieldSettings, personsParticipantData: ParticipantData, participant: Participant): string {
    if (participant == null) {
      return '';
    }
    const sample: Sample = participant.kits.find(kit =>
      kit.bspCollaboratorSampleId === personsParticipantData.data['COLLABORATOR_PARTICIPANT_ID']
    );
    if (sample && fieldSetting.actions[0].value && sample[fieldSetting.actions[0].value] && fieldSetting.displayType) {
      if (fieldSetting.displayType === 'DATE') {
        return new Date(sample[fieldSetting.actions[0].value]).toISOString().split('T')[0];
      }
      return sample[fieldSetting.actions[0].value];
    }
    return '';
  }

  countYears(startDate: string): number {
    const diff = Date.now() - Date.parse(startDate);
    const diffDate = new Date(diff);
    return Math.abs(diffDate.getUTCFullYear() - 1970);
  }

  getPersonFieldForMultipleRows(personDatas: ParticipantData[], column: Filter, participant: Participant): string {
    let name: string;
    if (column && column.participantColumn) {
      name = column.participantColumn.name;
    }
    let result: string;
    for (const personData of personDatas) {
      result = this.getPersonFieldFromDataRow(personData, column, name, participant);
      if (result) {
        break;
      }
    }
    if (!result && participant.data && participant.data.activities) {
      const setting = this.findSettingByColumnName(name);
      if (setting) {
        result = Utils.getActivityDataValues(setting, participant, this.activityDefinitionList);
      }
    }
    return result;
  }

  findSettingByColumnName(name: string): FieldSettings {
    if (this.settings && this.settings['TAB']) {
      for (const tab of this.settings['TAB']) {
        for (const setting of this.settings[tab.columnName]) {
          if (setting.displayType !== 'ACTIVITY' && setting.displayType !== 'ACTIVITY_STAFF') {
            continue;
          }
          if (setting.columnName === name) {
            return setting;
          }
        }
      }
    }
  }

  getPersonType(personData: ParticipantData): string {
    return personData.data['COLLABORATOR_PARTICIPANT_ID'];
  }

  addTabGroupedColumns(): void {
    let possibleColumns: Array<Filter> = [];
    for (const tab of this.settings['TAB_GROUPED']) {
      for (const setting of this.settings[tab.columnName]) {
        this.dataSources.set(setting.columnName, setting.columnDisplay);
        for (const field of this.settings[setting.columnName]) {
          const filter = this.createFilter(field);
          possibleColumns.push(...filter);
        }
        this.sourceColumns[setting.columnName] = possibleColumns;
        possibleColumns = [];
      }
    }
  }

  hasAssignees(): boolean {
    return Array.isArray(this.assignees) && this.assignees.length > 0;
  }

  private createFilter(field: FieldSettings): Filter[] {
    let showType = field.displayType;
    let filter: Filter = new Filter(
      new ParticipantColumn(field.columnDisplay?.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
      showType,
      (field.possibleValues as NameValue[])
    );
    if (showType === Filter.TEXTAREA_TYPE) {
      showType = Filter.TEXT_TYPE;
      filter = new Filter(
        new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
        showType,
        (field.possibleValues as NameValue[])
      );
    } else if (showType === Filter.ACTIVITY_STAFF_TYPE) {
      if (field.possibleValues && field.possibleValues[0].type) {
        showType = field.possibleValues[0].type;
      } else {
        showType = 'TEXT';
      }
      filter = new Filter(
        new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
        showType,
        (field.possibleValues as NameValue[])
      );
      if (showType === Filter.RADIO_TYPE) {
        const options: NameValue[] = [];
        options.push(new NameValue('Yes', '1'));
        options.push(new NameValue('No', '0'));
        filter = new Filter(
          new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
          showType, options, null, null, null, null, null, null, null, null,
          null, null, true, Filter.ACTIVITY_STAFF_TYPE
        );
      }
    } else if (showType === Filter.RADIO_TYPE) {
      filter = new Filter(
        new ParticipantColumn(field.columnDisplay.replace('*', ''), field.columnName, 'participantData', field.fieldType, false),
        showType, (field.possibleValues as NameValue[]), null, null, null, null, null, null, null, null,
        null, null, true
      );
    }

    const conditionalFilters = [];

    if(field?.actions) {
      field.actions.forEach(action => {
        if(action?.conditionalFieldSetting) {
          const conditionalFieldSettings = action.conditionalFieldSetting;
          const [conditionalFilter] = this.createFilter(conditionalFieldSettings);
          conditionalFilters.push(conditionalFilter);
        }
      });
    }
    return [filter, ...conditionalFilters];
  }

  addTabColumns(): void {
    let possibleColumns: Array<Filter> = [];
    if((this.role.allowedToViewMedicalRecords && !this.role.viewOnlyDSSData)
      || (!this.role.allowedToViewMedicalRecords && !this.role.viewOnlyDSSData) ) {
      for (const tab of this.settings['TAB']) {
        this.dataSources.set(tab.columnName, tab.columnDisplay);
        for (const setting of this.settings[tab.columnName]) {
          const filter = this.createFilter(setting);
          possibleColumns.push(...filter);
        }
        this.sourceColumns[tab.columnName] = possibleColumns;
        possibleColumns = [];
      }
    }
  }

  checkIfColumnIsTabGrouped(alias: string): boolean {
    if (this.settings && this.settings['TAB_GROUPED']) {
      for (const tab of this.settings['TAB_GROUPED']) {
        for (const setting of this.settings[tab.columnName]) {
          if (setting.columnName === alias) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkIfColumnIsTabbed(alias: string): boolean {
    if (this.settings && this.settings['TAB']) {
      for (const tab of this.settings['TAB']) {
        if (tab.columnName === alias) {
          return true;
        }
      }
    }
    return false;
  }

  addAutomatedScoringColumns(): void {
    this.showComputedObject = true;

    this.dataSources.set('computed', 'Morning-Evening Questionnaire Scoring');
    const possibleColumns: Array<Filter> = [];
    possibleColumns.push(new Filter(new ParticipantColumn('MEQ Score', 'meqScore', 'computed', null, true), Filter.TEXT_TYPE));
    possibleColumns.push(new Filter(new ParticipantColumn('MEQ Chronotype', 'meqChronotype', 'computed', null, true), Filter.TEXT_TYPE));
    this.sourceColumns['computed'] = possibleColumns;
    this.selectedColumns[ 'computed' ] = [];
    possibleColumns.forEach(filter => {
      const tmp = filter.participantColumn.object != null ? filter.participantColumn.object : filter.participantColumn.tableAlias;
      this.allFieldNames.add(tmp + '.' + filter.participantColumn.name);
     });
     this.orderColumns();
  }

  private sendAnalyticsMetric(): void {
    const passed = new Date().getTime() - this.start;
    this.dsmService.sendAnalyticsMetric(this.getRealm(), passed).subscribe({});
  }


  toggleColumns(checked: boolean): void {
    if(!this.reservedDefaultSelectedColumns) {
      this.reservedDefaultSelectedColumns = this.copyColumns(this.selectedColumns);
    }
    if(checked) {
      this.selectedColumns = this.copyColumns(this.sourceColumns);
      this.allColumnsSelected = true;
    } else {
      this.allColumnsSelected = false;
      this.selectedColumns = this.reservedDefaultSelectedColumns;
    }
  }


  private copyColumns(columns: {[key: string]: Filter[]}): {[key: string]: Filter[]}  {
    const copiedColumns = {};
    Object.entries(columns as {[key: string]: Filter[]}).forEach(([key, value]) => {
      copiedColumns[key] = [];
      copiedColumns[key].push(...value);
    });
    return copiedColumns;
  }
}
