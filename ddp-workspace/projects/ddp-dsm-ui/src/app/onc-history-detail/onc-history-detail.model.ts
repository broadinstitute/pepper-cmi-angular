import { Tissue } from '../tissue/tissue.model';

export class OncHistoryDetail {
  changed = false;
  selected = false;
  deleted = false;

  changedBy: string;

  constructor(public participantId: string, public oncHistoryDetailId: string, public medicalRecordId: string,
              public datePx: string, public typePx: string,
              public locationPx: string, public histology: string, public accessionNumber: string, public facility: string,
              public phone: string, public fax: string, public notes: string, public request: string,
              public faxSent: string, public faxSentBy: string, public faxConfirmed: string,
              public faxSent2: string, public faxSent2By: string, public faxConfirmed2: string,
              public faxSent3: string, public faxSent3By: string, public faxConfirmed3: string,
              public tissueReceived: string, public gender: string,
              public additionalValuesJson: {}, public tissues: Array<Tissue>,
              public tissueProblemOption: string, public destructionPolicy: string, public unableObtainTissue: boolean,
              public numberOfRequests, public deleted: boolean) {
    this.participantId = participantId;
    this.oncHistoryDetailId = oncHistoryDetailId;
    this.medicalRecordId = medicalRecordId;
    this.datePx = datePx;
    this.typePx = typePx;
    this.locationPx = locationPx;
    this.histology = histology;
    this.accessionNumber = accessionNumber;
    this.facility = facility;
    this.phone = phone;
    this.fax = fax;
    this.notes = notes;
    this.request = request;
    this.faxSent = faxSent;
    this.faxSentBy = faxSentBy;
    this.faxConfirmed = faxConfirmed;
    this.faxSent2 = faxSent2;
    this.faxSent2By = faxSent2By;
    this.faxConfirmed2 = faxConfirmed2;
    this.faxSent3 = faxSent3;
    this.faxSent3By = faxSent3By;
    this.faxConfirmed3 = faxConfirmed3;
    this.tissueReceived = tissueReceived;
    this.gender = gender;
    this.additionalValuesJson = additionalValuesJson;
    this.tissues = tissues;
    this.tissueProblemOption = tissueProblemOption;
    this.destructionPolicy = destructionPolicy;
    this.unableObtainTissue = unableObtainTissue;
    this.deleted = deleted;
  }

  static parse(json): OncHistoryDetail {
    const tissues: Array<Tissue> = [];
    const jsonData = json.tissues;
    if (jsonData != null) {
      jsonData.forEach((val) => {
        const tissue = Tissue.parse(val);
        tissues.push(tissue);
      });
    }

    let data = json.dynamicFields;
    let additionalValuesJson = {};
    if (data != null) {
      data = '{' + data.substring(1, data.length - 1) + '}';
      additionalValuesJson = JSON.parse(data);
    }

    return new OncHistoryDetail(
      json.participantId, json.oncHistoryDetailId, json.medicalRecordId, json.datePx, json.typePx, json.locationPx,
      json.histology, json.accessionNumber, json.facility, json.phone, json.fax, json.notes, json.request,
      json.faxSent, json.tFaxSentBy, json.tFaxConfirmed,
      json.tFaxSent2, json.tFaxSent2By, json.tFaxConfirmed2,
      json.tFaxSent3, json.tFaxSent3By, json.tFaxConfirmed3,
      json.tissueReceived, json.gender, additionalValuesJson, tissues,
      json.tissueProblemOption, json.destructionPolicy, json.unableObtainTissue, json.numberOfRequests, json.deleted
    );
  }
}
