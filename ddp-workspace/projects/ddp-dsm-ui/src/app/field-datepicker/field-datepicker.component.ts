import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Utils } from '../utils/utils';
import { EstimatedDate } from './field-datepicker.model';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-field-datepicker',
  templateUrl: './field-datepicker.component.html',
  styleUrls: ['./field-datepicker.component.css']
})
export class FieldDatepickerComponent implements OnInit, OnChanges {
  @Input() dateString: string;
  @Input() disabled = false;
  @Input() showTodayButton = true;
  @Input() showNAButton = false;
  @Input() showNotFoundButton = false;
  @Input() allowUnknownDay = false;
  @Input() dateFormat: string = Utils.DATE_STRING_IN_CVS;
  @Input() allowFutureDate = false;
  @Input() addCheckboxEstimated = false;
  @Input() showCalendarButton = true;
  @Input() fieldName: string;
  @Input() showSaveBtn = false;
  @Input() saveSucceeded = false;
  @Input() dateSaved: Observable<boolean>;
  @Input() colorDuringPatch = false;
  @Output() dateChanged = new EventEmitter();
  @Output() saveCompleted = new EventEmitter();


  _dateString: string;
  defaultDate = '1000-01-01';
  error: string = null;
  estimated = false;
  datePicker: Date;
  showDatePicker = false;
  hasDateChanged = false;
  saveButtonText = 'Save Date';
  isNA = false;
  currentlySaving = false;

  constructor(private util: Utils) {
  }

  ngOnInit(): void {
    this.setInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    for(const propName in changes){
      if('dateSaved' !== propName){
        this.setInput();
      }
    }
  }

  setInput(): void {
    if (this.dateString != null && this.dateString !== '') {
      if (this.addCheckboxEstimated) {
        const estimatedDate = EstimatedDate.parse(this.dateString);
        if (estimatedDate != null) {
          this.handleInput(estimatedDate.dateString);
          this.estimated = estimatedDate.est;
        }
      } else {
        this.handleInput(this.dateString);
      }
    } else {
      this._dateString = '';
      this.estimated = false;
    }
  }

  private handleInput(dateString: string): void {
    if (dateString !== 'N/A' && dateString !== 'Not Found' && dateString !== this.defaultDate) {
      if (dateString != null) {
        let tmpDate: string = dateString;
        if (dateString.length === 7) {
          tmpDate = tmpDate + '-01';
          this._dateString = Utils.getPartialFormatDate(dateString, this.dateFormat);
        } else if (dateString.length === 4) {
          tmpDate = tmpDate + '-01-01';
          this._dateString = dateString;
        } else if (dateString.includes('T')) {
          this._dateString = Utils.getDateFormatted(Utils.getDate(dateString.split('T')[0]), this.dateFormat);
        } else {
          this._dateString = Utils.getDateFormatted(this.datePicker, this.dateFormat);
        }
        this.datePicker = Utils.getDate(tmpDate);
      }
    } else if (dateString === this.defaultDate) {
      this._dateString = 'N/A';
    } else {
      this._dateString = dateString;
    }
  }

  public check(): void {
    this.colorDuringPatch = true;
    if (this._dateString === '') {
      this.emitDate('');
    } else {
      if (this._dateString !== 'N/A' && this._dateString !== 'Not Found') {
        const tmp = Utils.parseDate(this._dateString, this.dateFormat, this.allowUnknownDay);
        // console.log(tmp);
        if (tmp instanceof Date) {
          this.hasDateChanged = (this.datePicker !== tmp);
          this.datePicker = tmp;
          if (this.datePicker != null) {
            this.emitDate(Utils.getDateFormatted(this.datePicker, Utils.DATE_STRING));
            this.colorDuringPatch = false;
            this.error = null;
          } else {
            this.error = this.dateFormat;
          }
        } else if (tmp === Utils.DATE_PARTIAL) {
          this.error = null;
          this.emitDate(Utils.getPartialDateFormatted(this._dateString, this.dateFormat));
          this.colorDuringPatch = false;
          this.hasDateChanged = false;
        } else if (tmp == null) {
          this.error = this.dateFormat;
        }
      }
    }
  }

  public saveDate(): void{
    this.saveButtonText = 'Saving...';
    this.currentlySaving = true;
      this.dateSaved.pipe(finalize(() => {
        this.saveCompleted.emit();
        setTimeout(() => {
          this.saveButtonText = 'Save Date';
          this.currentlySaving = false;
        },5000);
      })).subscribe({
        next: data => {
          this.saveButtonText = 'Success!';
          this.hasDateChanged = false;
        },
        error: err => {
          this.saveButtonText = 'Failed';
        }
          });
    }

    public selectDate(event: any): void {
      this.showDatePicker = false;
      this.datePicker = event;
      if (this.datePicker instanceof Date) {
        //Compare new Value to existing value for color changing
        const newDate = Utils.getDateFormatted(this.datePicker, this.dateFormat);
        this.hasDateChanged = (newDate !== this._dateString);
        this._dateString = newDate; // show user date in the format from the user settings
        this.emitDate(Utils.getDateFormatted(this.datePicker, Utils.DATE_STRING));
      }
    }

    getUtil(): Utils {
      return this.util;
    }

    public setToday(): void {
      this.datePicker = new Date();
      this.showDatePicker = false;
      this.isNA = false;
      this._dateString = Utils.getDateFormatted(this.datePicker, this.dateFormat); // show user date in the format from the user settings
      this.emitDate(Utils.getDateFormatted(this.datePicker, Utils.DATE_STRING));
    }

    public setNA(): void {
      this.isNA = true;
      this._dateString = 'N/A';
      this.emitDate(this.defaultDate);
    }

    public setNotFound(): void {
      this.isNA = true;
      this._dateString = 'Not Found';
      this.emitDate(this._dateString);
    }

    public closeCalendar(): void {
      this.showDatePicker = !this.showDatePicker;
    }

    private emitDate(dateString: string): void {
      if (this.addCheckboxEstimated) {
        this.dateChanged.emit(JSON.stringify(new EstimatedDate(dateString, this.estimated)));
      } else {
        this.dateChanged.emit(dateString);
      }
    }

    estimatedChanged(): void {
      this._dateString = Utils.getDateFormatted(this.datePicker, this.dateFormat); // show user date in the format from the user settings
      this.emitDate(Utils.getDateFormatted(this.datePicker, Utils.DATE_STRING));
    }

    getDateFormatPlaceholder(placeholder: string): string {
      return placeholder.toLowerCase();
    }
  }
