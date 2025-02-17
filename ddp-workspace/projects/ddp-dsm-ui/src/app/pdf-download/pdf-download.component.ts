import { Component, OnInit } from '@angular/core';
import { RoleService } from '../services/role.service';
import { DSMService } from '../services/dsm.service';
import { Auth } from '../services/auth.service';
import { ComponentService } from '../services/component.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Statics } from '../utils/statics';
import { PDFModel } from './pdf-download.model';

const fileSaver = require('file-saver');

@Component({
  selector: 'app-pdf-download',
  templateUrl: './pdf-download.component.html',
  styleUrls: [ './pdf-download.component.css' ]
})
export class PdfDownloadComponent implements OnInit {
  errorMessage: string;
  additionalMessage: string;
  loading = false;

  realm: string;

  participantId: string = null;
  allowedToSeeInformation = false;

  possiblePDFs: Array<string> = [];
  participantPDFs: Array<PDFModel> = [];
  selectedPDF: string;

  hasParticipantSpecificPDFs = false;

  constructor(private dsmService: DSMService, private auth: Auth, private router: Router, private role: RoleService,
               private compService: ComponentService, private route: ActivatedRoute) {
    if (!auth.authenticated()) {
      auth.logout();
    }
    this.route.queryParams.subscribe(params => {
      this.realm = params[ DSMService.REALM ] || null;
      if (this.realm != null) {
        this.errorMessage = null;
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
    this.allowedToSeeInformation = false;
    let jsonData: any[];
    this.dsmService.getRealmsAllowed(Statics.PDF_DOWNLOAD_MENU).subscribe({
      next: data => {
        jsonData = data;
        jsonData.forEach((val) => {
          if (this.realm === val) {
            this.getListOfPossiblePDFs();
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

  // TODO can be changed after all DDPs are migrated
  getListOfPossiblePDFs(): void {
    if (this.realm !== '') {
      this.errorMessage = null;
      this.additionalMessage = null;
      this.loading = true;
      let jsonData: any[];
      this.dsmService.getPossiblePDFs(this.realm).subscribe({
        next: data => {
          this.possiblePDFs = [];
          // console.info(`received: ${JSON.stringify(data, null, 2)}`);
          jsonData = data;
          jsonData.forEach((val) => {
            const role: string = val;
            const roleParts: string[] = role.split('_');
            if (roleParts.length === 3) {
              this.possiblePDFs.push(roleParts[ 2 ]);
            } else if (role === 'pdf_download') {
              this.hasParticipantSpecificPDFs = true;
            }
          });
          this.loading = false;
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.loading = false;
          this.errorMessage = 'Error - Loading list of event types\nPlease contact your DSM developer';
        }
      });
    }
  }

  getParticipantsPDFs(): void {
    if (this.participantId != null && this.participantId !== '') {
      this.errorMessage = null;
      this.additionalMessage = null;
      this.loading = true;
      this.dsmService.getParticipantsPDFs(this.realm, this.participantId).subscribe({
        next: data => {
          this.participantPDFs = [];
          // console.info( `received: ${JSON.stringify( data, null, 2 )}` );
          const jsonData = data;
          if (jsonData != null) {
            jsonData.forEach((val) => {
              const participantPdf = PDFModel.parse(val);
              this.participantPDFs.push(participantPdf);
            });
          }
          console.log(this.participantPDFs);
          this.loading = false;
        },
        error: err => {
          if (err._body === Auth.AUTHENTICATION_ERROR) {
            this.auth.logout();
          }
          this.loading = false;
          this.errorMessage = 'Error - Loading list of event types\nPlease contact your DSM developer';
        }
      });
    }
  }

  downloadPDF(configName: string): void {
    this.loading = true;
    this.dsmService.downloadPDF(this.participantId, null, null, null, null, this.compService.getRealm(),
      configName, null, null
    ).subscribe({
      next: data => {
        // eslint-disable-next-line no-console
        console.info(data);
        this.downloadFile(data, '_' + configName);
        this.loading = false;
      },
      error: err => {
        if (err._body === Auth.AUTHENTICATION_ERROR) {
          this.router.navigate([Statics.HOME_URL]);
        }
        this.additionalMessage = 'Error - Downloading consent pdf file\nPlease contact your DSM developer';
        this.loading = false;
      }
    });
  }

  downloadFile(data: any, type: string): void {
    const blob = new Blob([ data ], {type: 'application/pdf'});
    fileSaver.saveAs(blob, this.participantId + type + Statics.PDF_FILE_EXTENSION);
  }
}
