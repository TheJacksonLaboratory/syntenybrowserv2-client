import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { DocsComponent } from './docs/docs.component';
import { ExamplesComponent } from './examples/examples.component';
import { SyntenyBrowserComponent } from './synteny-browser/synteny-browser.component';

import { DocsTutorialComponent } from './docs/sections/docs-tutorial.component';
import { DocsDataPrepComponent } from './docs/sections/docs-data-prep/docs-data-prep.component';
import { DocsFeaturesComponent } from './docs/sections/docs-features/docs-features.component';
import { DocsDockerComponent } from './docs/sections/docs-docker.component';
import { DocsConfigsComponent } from './docs/sections/docs-configs.component';
import { DocsContributorsComponent } from './docs/sections/docs-contributors.component';
import { LungCancerExampleComponent } from './examples/use-cases/lung-cancer.component';
import { Type2DiabetesExampleComponent } from './examples/use-cases/type-2-diabetes.component';

const routes: Routes = [
  { path: 'browser', component: SyntenyBrowserComponent },
  { path: 'about', component: AboutComponent },
  { path: 'docs', component: DocsComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'browser-features' },
      { path: 'tutorial', component: DocsTutorialComponent },
      { path: 'data-prep', component: DocsDataPrepComponent },
      { path: 'browser-features', component: DocsFeaturesComponent },
      { path: 'docker', component: DocsDockerComponent },
      { path: 'configs', component: DocsConfigsComponent },
      { path: 'contributors', component: DocsContributorsComponent },
    ]
  },
  { path: 'examples', component: ExamplesComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'human-lung-cancer' },
      { path: 'human-lung-cancer', component: LungCancerExampleComponent },
      { path: 'mouse-T2-diabetes', component: Type2DiabetesExampleComponent },
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'browser' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
