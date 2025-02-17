import { Inject, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CookieService } from 'ngx-cookie';
import { ConfigurationService } from './configuration.service';
import { NotAuthenticatedServiceAgent } from './serviceAgents/notAuthenticatedServiceAgent.service';
import { LoggingService } from './logging.service';
import { PasswordCheckResult } from './../models/passwordCheckResult';

@Injectable()
export class IrbPasswordService extends NotAuthenticatedServiceAgent<boolean> {
    private log: LoggingService;
    private readonly LOGGER_SOURCE = 'IrbPasswordService';

    constructor(
        @Inject('ddp.config') _configuration: ConfigurationService,
        private cookie: CookieService,
        _http: HttpClient,
        _logger: LoggingService,
        injector: Injector) {
        super(_configuration, _http, _logger);
        this.log = injector.get(LoggingService);
    }

    public checkPassword(password: string): Observable<boolean | HttpErrorResponse> {
        const ddpCfg = this._configuration;
        const studyGuid = ddpCfg.studyGuid;
        return this.postObservable(`/studies/${studyGuid}/irb-password-check`, { password }, {}, true).pipe(
            map((response: HttpResponse<PasswordCheckResult>) => {
                const loggedIn: boolean = !!(response.body) && response.body.result;
                if (loggedIn) {
                    this.saveIrbStudySession();
                }
                return loggedIn;
            }),
            catchError(this.handleError.bind(this)));
    }

    // if no password requires, sending a blank password should return true
    public requiresIrbAuthentication(): Observable<boolean> {
        return this.checkPassword('').pipe(map(loggedIn => !loggedIn));
    }

    public handleError(error: HttpErrorResponse): Observable<HttpErrorResponse> {
      const errMsg = (error.error instanceof ErrorEvent) ?
        // A client-side or network error occurred. Handle it accordingly.
        `An error occurred: ${error.error.message}` :
        // The backend returned an unsuccessful response code. The response body may contain clues as to what went wrong.
        `Backend returned code ${error.status}, body was: ${error.error}`;
      this.log.logError(this.LOGGER_SOURCE, errMsg);
      return throwError(() => error);
    }

    public isIrbAuthenticated(): boolean {
        const value = this.cookie.get(this.getCookieName());
        return !!value && value.trim().length > 0;
    }

    private saveIrbStudySession(): void {
        this.cookie.put(this.getCookieName(), 'LOGGEDIN');
    }

    private removeIrbStudySession(): void {
        this.cookie.remove(this.getCookieName());
    }

    private getCookieName(): string {
        return `pepper.${this._configuration.studyGuid}.irbsession`;
    }
}
