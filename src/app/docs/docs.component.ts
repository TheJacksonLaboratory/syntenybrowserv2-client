import { Component } from '@angular/core';

@Component({
  selector: 'app-docs',
  template: `
    <div class="content-container">
      <nav class="sidenav">
        <section class="sidenav-content">
          <a class="nav-link" [routerLink]="['tutorial']">Tutorial</a>
          <a class="nav-link" [routerLink]="['client-api']">Client API</a>
          <a class="nav-link" [routerLink]="['service-api']">Python Service API</a>
          <a class="nav-link" [routerLink]="['data-prep']">Data Sources/Formats</a>
          <a class="nav-link" [routerLink]="['browser-features']">Browser Features</a>
          <a class="nav-link" [routerLink]="['docker']">Docker</a>
          <a class="nav-link" [routerLink]="['configs']">Species Config Files</a>
          <a class="nav-link" [routerLink]="['contributors']">Contributor Guidelines</a>
        </section>
      </nav>
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./docs.component.scss'],
})
export class DocsComponent {}
