import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-docs',
  template: `
    <div class="content-container">
      <nav class="sidenav">
        <section class="sidenav-content">
          <a class="nav-link" [routerLink]="['browser-features']" routerLinkActive="active">
            Browser Features
          </a>
          <a class="nav-link" [routerLink]="['database']" routerLinkActive="active">
            Database
          </a>
          <!-- TODO: change this URL once we get a production/externally visible instance set up -->
          <a class="nav-link" href="http://sb-test01.jax.org/api/" target="_blank">
            Live API <clr-icon shape="pop-out" size="14"></clr-icon>
          </a>
          <a class="nav-link" [routerLink]="['data-prep']" routerLinkActive="active">
            Data Sources/Formats
          </a>
          <a class="nav-link" [routerLink]="['docker']" routerLinkActive="active">
            Docker Setup
          </a>
          <a class="nav-link" [routerLink]="['configs']" routerLinkActive="active">
            Species Config Files
          </a>
          <a class="nav-link" [routerLink]="['contributors']" routerLinkActive="active">
            Contributor Guidelines
          </a>
          <a
            class="nav-link"
            href="{{sourceCodeURLs.client}}"
            target="_blank"
          >
            Client Source Code <clr-icon shape="pop-out" size="14"></clr-icon>
          </a>
          <a
            class="nav-link"
            href="{{sourceCodeURLs.api}}"
            target="_blank"
          >
            Service Source Code <clr-icon shape="pop-out" size="14"></clr-icon>
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
export class DocsComponent {
  sourceCodeURLs = environment.sourceCode;
}
