import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';
import { ExamplesComponent } from './examples/examples.component';
import { SyntenyBrowserComponent } from './synteny-browser/synteny-browser.component';

import { DocsTutorialComponent } from './docs/sections/docs-tutorial.component';
import { DocsClientAPIComponent } from './docs/sections/docs-client-api.component';
import { DocsServiceAPIComponent } from './docs/sections/docs-python-api.component';
import { DocsDataPrepComponent } from './docs/sections/docs-data-prep.component';
import { DocsFeaturesComponent } from './docs/sections/docs-features.component';
import { DocsDockerComponent } from './docs/sections/docs-docker.component';
import { DocsConfigsComponent } from './docs/sections/docs-configs.component';
import { DocsContributorsComponent } from './docs/sections/docs-contributors.component';

const routes: Routes = [
  { path: 'browser', component: SyntenyBrowserComponent },
  { path: 'about', component: AboutComponent },
  { path: 'docs', component: DocsComponent,
    children: [
      { path: 'tutorial', component: DocsTutorialComponent },
      { path: 'client-api', component: DocsClientAPIComponent },
      { path: 'service-api', component: DocsServiceAPIComponent },
      { path: 'data-prep', component: DocsDataPrepComponent },
      { path: 'browser-features', component: DocsFeaturesComponent },
      { path: 'docker', component: DocsDockerComponent },
      { path: 'configs', component: DocsConfigsComponent },
      { path: 'contributors', component: DocsContributorsComponent },
    ]
  },
  { path: 'examples', component: ExamplesComponent },
  { path: '', pathMatch: 'full', redirectTo: 'browser' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
