import { Component } from '@angular/core';

@Component({
  selector: 'app-docs',
  template: `
    <div class="content-container">
      <nav class="sidenav">
        <section class="sidenav-content">
          <a class="nav-link" [routerLink]="['browser-features']" routerLinkActive="active">
            Browser Features
          </a>
          <a class="nav-link" [routerLink]="['tutorial']" routerLinkActive="active">
            Tutorial
          </a>
          <!-- TODO: change this URL once we get a production/externally visible instance set up -->
          <a class="nav-link" href="http://sb-test01.jax.org/api/" target="_blank">
            API <clr-icon shape="pop-out" size="14"></clr-icon>
          </a>
          <a class="nav-link" [routerLink]="['data-prep']" routerLinkActive="active">
            Data Sources/Formats
          </a>
          <a class="nav-link" [routerLink]="['docker']" routerLinkActive="active">
            Docker
          </a>
          <a class="nav-link" [routerLink]="['configs']" routerLinkActive="active">
            Species Config Files
          </a>
          <a class="nav-link" [routerLink]="['contributors']" routerLinkActive="active">
            Contributor Guidelines
          </a>
          <!-- TODO: change this URL once we get a the Github repo(s) set up -->
          <a
            class="nav-link"
            href="https://github.com/TheJacksonLaboratory/syntenybrowser"
            target="_blank"
          >
            Source Code (Github) <clr-icon shape="pop-out" size="14"></clr-icon>
          </a>
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
