import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BrowserGuard, IrbGuard } from 'ddp-sdk';

import { WelcomeComponent } from './components/welcome/welcome.component';
import { RoutePaths } from './router-resources';
import { PasswordRedesignedComponent, WorkflowStartActivityRedesignedComponent } from 'toolkit';

const routes: Routes = [
    {
      path: RoutePaths.ShareMyData,
      component: WorkflowStartActivityRedesignedComponent,
      canActivate: [
        IrbGuard,
        BrowserGuard
      ],
      data: {
        activityGuid: 'PREQUAL'
      }
    },
    {
      path: RoutePaths.Password,
      component: PasswordRedesignedComponent
    },
    {
        path: RoutePaths.Welcome,
        component: WelcomeComponent,
        pathMatch: 'full',
        canActivate: [IrbGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [
      RouterModule.forRoot(routes, {
        enableTracing: false,
        scrollPositionRestoration: 'top'
      })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
