import { Component } from '@angular/core';

@Component({
  selector: 'app-docs',
  template: `
    <div class="content-container">
      <nav class="sidenav">
        <section class="sidenav-content">
          <a class="nav-link" [routerLink]="['tutorial']">Tutorial</a>
          <!-- TODO: change this URL once we get a production/externally visible instance set up -->
          <a class="nav-link" href="http://sb-test01.jax.org/api/" target="_blank">API</a>
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
