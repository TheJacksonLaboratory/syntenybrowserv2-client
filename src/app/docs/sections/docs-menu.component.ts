import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-menu',
  template: `
    <section class="sidenav-content">
      <a class="nav-link" [routerLink]="['/docs-tutorial']">Tutorial</a>
      <a class="nav-link" [routerLink]="['/docs-client-api']">Client API</a>
      <a class="nav-link" [routerLink]="['/docs-service-api']">Python Service API</a>
      <a class="nav-link" [routerLink]="['/docs-data-prep']">Data Sources/Formats</a>
      <a class="nav-link" [routerLink]="['/docs-browser-features']">Browser Features</a>
      <a class="nav-link" [routerLink]="['/docs-docker']">Docker</a>
      <a class="nav-link" [routerLink]="['/docs-configs']">Species Config Files</a>
      <a class="nav-link" [routerLink]="['/docs-contributors']">Contributor Guidelines</a>
    </section>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsMenuComponent {}
