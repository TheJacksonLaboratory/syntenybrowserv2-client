import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';

import { DocsTutorialComponent } from './docs/docs-tutorial.component';
import { DocsClientAPIComponent } from './docs/docs-client-api.component';
import { DocsServiceAPIComponent } from './docs/docs-python-api.component';
import { DocsDataPrepComponent } from './docs/docs-data-prep.component';
import { DocsFeaturesComponent } from './docs/docs-features.component';
import { DocsDockerComponent } from './docs/docs-docker.component';
import { DocsConfigsComponent } from './docs/docs-configs.component';
import { DocsContributorsComponent } from './docs/docs-contributors.component';

import { ExamplesComponent } from './examples/examples.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'docs', component: DocsComponent },
  { path: 'docs-tutorial', component: DocsTutorialComponent },
  { path: 'docs-client-api', component: DocsClientAPIComponent },
  { path: 'docs-service-api', component: DocsServiceAPIComponent },
  { path: 'docs-data-prep', component: DocsDataPrepComponent },
  { path: 'docs-browser-features', component: DocsFeaturesComponent },
  { path: 'docs-docker', component: DocsDockerComponent },
  { path: 'docs-configs', component: DocsConfigsComponent },
  { path: 'docs-contributors', component: DocsContributorsComponent },
  { path: 'examples', component: ExamplesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
