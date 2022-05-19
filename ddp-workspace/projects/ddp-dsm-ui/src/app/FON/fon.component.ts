import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-fon',
  template: `
    <div class="mainHolder">
      <h1 class="header">FON study</h1>
      <app-navigation></app-navigation>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .mainHolder {
      display: grid;
      grid-template-columns: 250px auto;
      height: 100vh;
      column-gap: 1%;
      width: 100%;
      margin: 0;
      padding: 0;
      grid-template-areas: ". header" "sidebarNavigation otherPage";
    }

    .header {
      grid-area: header;
      text-align: center;
      border-bottom: 1px solid grey;
      height: 60px;
      line-height: 60px;
      margin: 0;
    }

    app-navigation {
      grid-area: sidebarNavigation
    }

    router-outlet {
      grid-area: otherPage;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class FonComponent {
}
