import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LOCATION_INITIALIZED } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';

import { TranslateService } from '@ngx-translate/core';

import {
  DdpModule,
  LogLevel,
  ConfigurationService,
  GoogleAnalyticsEventsService
} from 'ddp-sdk';

import {
  ToolkitModule,
  ToolkitConfigurationService,
  AppComponent
} from 'toolkit';

import { WelcomeComponent } from './components/welcome/welcome.component';
import { MoreDetailsComponent } from './components/more-details/more-details.component';
import { AboutUsComponent } from './components/about-us/about-us.component';

const baseElt = document.getElementsByTagName('base');

let base = '';
if (baseElt) {
  base = baseElt[0].getAttribute('href');
}

declare let DDP_ENV: any;

export const tkCfg = new ToolkitConfigurationService();
tkCfg.studyGuid = DDP_ENV.studyGuid;
tkCfg.aboutYouGuid = 'ANGIOABOUTYOU';
tkCfg.consentGuid = 'ANGIOCONSENT';
tkCfg.releaseGuid = 'ANGIORELEASE';
tkCfg.dashboardGuid = 'DASHBOARD';
tkCfg.lovedOneThankYouGuid = 'THANK_YOU';
tkCfg.aboutYouUrl = 'about-you';
tkCfg.lovedOneUrl = 'loved-one';
tkCfg.consentUrl = 'consent';
tkCfg.releaseUrl = 'release-survey';
tkCfg.dashboardUrl = 'dashboard';
tkCfg.activityUrl = 'activity';
tkCfg.errorUrl = 'error';
tkCfg.stayInformedUrl = 'stay-informed';
tkCfg.lovedOneThankYouUrl = 'loved-one-thank-you';
tkCfg.internationalPatientsUrl = 'international-patients';
tkCfg.moreDetailsUrl = 'more-details';
tkCfg.phone = '857-500-6264';
tkCfg.infoEmail = 'info@ascproject.org';
tkCfg.dataEmail = 'data@ascproject.org';
tkCfg.twitterAccountId = 'ASCaProject';
tkCfg.facebookGroupId = 'groups/1556795987968214';
tkCfg.cBioPortalLink = 'http://www.cbioportal.org/study?id=angs_project_painter_2018#summary';
tkCfg.countMeInUrl = 'https://joincountmein.org/';
tkCfg.showDataRelease = false;
tkCfg.showInfoForPhysicians = false;
tkCfg.showBlog = false;
tkCfg.blogUrl = '';

export let config = new ConfigurationService();
config.backendUrl = DDP_ENV.basePepperUrl;
config.auth0Domain = DDP_ENV.auth0Domain;
config.auth0ClientId = DDP_ENV.auth0ClientId;
config.studyGuid = DDP_ENV.studyGuid;
config.logLevel = LogLevel.Info;
config.baseUrl = location.origin + base;
config.auth0SilentRenewUrl = DDP_ENV.auth0SilentRenewUrl;
config.loginLandingUrl = DDP_ENV.loginLandingUrl;
config.auth0CodeRedirect = location.origin + base + 'auth';
config.localRegistrationUrl = config.backendUrl + '/pepper/v1/register';
config.doLocalRegistration = DDP_ENV.doLocalRegistration;
config.mapsApiKey = DDP_ENV.mapsApiKey;
config.auth0Audience = DDP_ENV.auth0Audience;
config.projectGAToken = DDP_ENV.projectGAToken;

export function translateFactory(translate: TranslateService, injector: Injector) {
  return () => new Promise<any>((resolve: any) => {
    const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
    locationInitialized.then(() => {
      const locale = 'en';
      translate.setDefaultLang(locale);
      translate.use(locale).subscribe(() => {
        console.log(`Successfully initialized '${locale}' language as default.`);
      }, err => {
        console.error(`Problem with '${locale}' language initialization.`);
      }, () => {
        resolve(null);
      });
    });
  });
}

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    DdpModule,
    ToolkitModule
  ],
  declarations: [
    WelcomeComponent,
    MoreDetailsComponent,
    AboutUsComponent
  ],
  providers: [
    {
      provide: 'ddp.config',
      useValue: config
    },
    {
      provide: 'toolkit.toolkitConfig',
      useValue: tkCfg
    },
    {
      provide: APP_INITIALIZER,
      useFactory: translateFactory,
      deps: [
        TranslateService,
        Injector
      ],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(
    private router: Router,
    private analytics: GoogleAnalyticsEventsService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.analytics.emitNavigationEvent();
      }
    });
  }
}
