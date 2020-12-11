import { Component } from '@angular/core';

@Component({
  selector: 'app-examples',
  template: `
    <div class="content-container">
      <nav class="sidenav">
        <section class="sidenav-content">
          <a class="nav-link" [routerLink]="['human-lung-cancer']">
            Lung Cancer Susceptibility in Humans
          </a>
          <a class="nav-link" [routerLink]="['mouse-T2-diabetes']">
            Mouse Type 2 Diabetes Candidate Genes
          </a>
        </section>
      </nav>
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./examples.component.scss'],
})
export class ExamplesComponent {}
