import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule, ClrSelectModule } from '@clr/angular';
import { AppRoutingModule } from '../app-routing.module';

import { DocsComponent } from './docs.component';

import { DocsConfigsComponent } from './sections/docs-configs.component';
import { DocsContributorsComponent } from './sections/docs-contributors.component';
import { DocsDataPrepComponent } from './sections/docs-data-prep.component';
import { DocsDockerComponent } from './sections/docs-docker.component';
import { DocsFeaturesComponent } from './sections/docs-features.component';
import { DocsTutorialComponent } from './sections/docs-tutorial.component';

@NgModule({
  imports: [AppRoutingModule, ClarityModule, ClrSelectModule, CommonModule],
  declarations: [
    DocsComponent,
    DocsConfigsComponent,
    DocsContributorsComponent,
    DocsDataPrepComponent,
    DocsDockerComponent,
    DocsFeaturesComponent,
    DocsTutorialComponent,
  ],
  exports: [],
})
export class DocsModule {}
