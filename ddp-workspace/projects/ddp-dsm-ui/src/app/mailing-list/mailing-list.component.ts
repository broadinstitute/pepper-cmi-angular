import { Component, OnInit } from '@angular/core';
import { DSMService } from '../services/dsm.service';
import { Auth } from '../services/auth.service';
import { MailingListContact } from './mailing-list.model';
import { Utils } from '../utils/utils';
import { RoleService } from '../services/role.service';
import { ComponentService } from '../services/component.service';
import { ActivatedRoute } from '@angular/router';
import { Statics } from '../utils/statics';

@Component({
  selector: 'app-mailing-list',
  templateUrl: './mailing-list.component.html',
  styleUrls: ['./mailing-list.component.css']
})
export class MailingListComponent implements OnInit {
  realm: string;
  contactList: Array<MailingListContact> = [];

  loadingContacts = false;

  errorMessage: string;
  additionalMessage: string;

  keys: string[] = [];
  sortDir = '';
  sortKey = '';

  constructor(private dsmService: DSMService, private auth: Auth, private role: RoleService, private compService: ComponentService,
               private route: ActivatedRoute) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      // console.log(this.compService.realmMenu);
      this.realm = params[ DSMService.REALM ] || null;
      if (this.realm != null) {
        //        this.compService.realmMenu = this.realm;
        this.checkRight();
      }
    });
  }

  private checkRight(): void {
    let allowedToSeeInformation = false;
    this.additionalMessage = null;
    this.contactList = [];
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.MAILING_LIST).subscribe({
      next: data => {
        jsonData = data;
        jsonData.forEach((val) => {
          if (this.realm === val) {
            allowedToSeeInformation = true;
            this.getMailingList();
          }
        });
        if (!allowedToSeeInformation) {
          this.additionalMessage = 'You are not allowed to see information of the selected study at that category';
        }
      },
      error: () => null
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

  public getMailingList(): void {
    if (this.realm != null) {
      this.loadingContacts = true;
      let jsonData: any[];
      this.additionalMessage = null;
      this.keys = [];
      this.dsmService.getMailingList(this.realm).subscribe({
        next: data => {
          this.contactList = [];
          jsonData = data;
          jsonData.forEach((val) => {
            const contact = MailingListContact.parse(val);
            // this.getPossibleInfoColumns(contact);
            this.contactList.push(contact);
          });
          // console.info(`${this.contactList.length} contacts received: ${JSON.stringify(data, null, 2)}`);
          this.loadingContacts = false;
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.errorMessage = 'Error - Loading contacts  ' + err;
          this.loadingContacts = false;
        }
      });
    }
  }

  public downloadMailingList(): void {
    const map: { firstName: string; lastName: string; email: string; info: string; dateCreated: string }[] = [];
    for (const contact of this.contactList) {
      let dateCreated = '-';
      if (contact.dateCreated != null && contact.dateCreated !== 0) {
        dateCreated = Utils.getDateFormatted(new Date(contact.dateCreated * 1000), Utils.DATE_STRING_IN_CVS);
      }
      map.push({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        info: contact.info,
        dateCreated
      });
    }
    const fields = [];
    if (this.showColumn('firstName')) {
      fields.push('firstName');
    }
    if (this.showColumn('lastName')) {
      fields.push('lastName');
    }
    fields.push('email');
    if (this.showColumn('info')) {
      fields.push('info');
    }
    fields.push('dateCreated');
    const date = new Date();
    Utils.createCSV(
      fields,
      map,
      'MailingList ' + this.realm + ' ' + Utils.getDateFormatted(date, Utils.DATE_STRING_CVS) + Statics.CSV_FILE_EXTENSION
    );
  }

  hasRole(): RoleService {
    return this.role;
  }

  showColumn(name: string): boolean {
    if (this.contactList != null) {
      const foundContact = this.contactList.find(contact => (contact[ name ] != null && contact[ name ] !== ''));
      if (foundContact != null) {
        return true;
      }
    }
    return false;
  }

  getPossibleInfoColumns(contact: MailingListContact): void {
    if (contact != null && contact.info != null) {
      const o: any = JSON.parse( contact.info );
      if (o != null) {
        const k: string[] = Object.keys( o );
        k.forEach(key => {
          if (!this.keys.includes(key)) {
            this.keys.push(key);
          }
        });
      }
    }
  }

  getJsonValue( info: string, key: string ): string {
    return JSON.parse( info )[ key ];
  }

  sortByJson(key: string): void {
    if (this.sortKey !== key) {
      this.sortKey = '';
      this.sortDir = '';
    }
    this.sortKey = key;
    if (this.sortDir === '') {
      this.sortDir = 'asc';
    } else if (this.sortDir === 'asc') {
      this.sortDir = 'desc';
    } else if (this.sortDir === 'desc') {
      this.sortDir = 'asc';
    }
    const order = this.sortDir === 'asc' ? 1 : -1;
    this.contactList.sort((a, b) => {
      if (JSON.parse(a.info)[ key ] == null) {
        return 1;
      } else if (JSON.parse(b.info)[ key ] == null) {
        return -1;
      } else {
        if (typeof JSON.parse(a.info)[ key ] === 'string') {
          if (JSON.parse(a.info)[ key ].toLowerCase() < JSON.parse(b.info)[ key ].toLowerCase()) {
            return -1 * order;
          } else if (JSON.parse(a.info)[ key ].toLowerCase() > JSON.parse(b.info)[ key ].toLowerCase()) {
            return 1 * order;
          } else {
            return 0;
          }
        } else {
          if (JSON.parse(a.info)[ key ] < JSON.parse(b.info)[ key ]) {
            return -1 * order;
          } else if (JSON.parse(a.info)[ key ] > JSON.parse(b.info)[ key ]) {
            return 1 * order;
          } else {
            return 0;
          }
        }
      }
    });
  }

  clearKeySort(): void {
    this.sortKey = '';
    this.sortDir = '';
  }
}
