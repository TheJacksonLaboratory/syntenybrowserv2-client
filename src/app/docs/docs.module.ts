import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule, ClrSelectModule } from '@clr/angular';
import { AppRoutingModule } from '../app-routing.module';

import { DocsComponent } from './docs.component';

import { DocsConfigsComponent } from './sections/docs-configs/docs-configs.component';
import { DocsContributorsComponent } from './sections/docs-contributors.component';
import { DocsDataPrepComponent } from './sections/docs-data-prep/docs-data-prep.component';
import { DocsDockerComponent } from './sections/docs-docker/docs-docker.component';
import { DocsFeaturesComponent } from './sections/docs-features/docs-features.component';
import { DocsDatabaseComponent } from './sections/docs-database.component';

@NgModule({
  imports: [AppRoutingModule, ClarityModule, ClrSelectModule, CommonModule],
  declarations: [
    DocsComponent,
    DocsConfigsComponent,
    DocsContributorsComponent,
    DocsDataPrepComponent,
    DocsDockerComponent,
    DocsFeaturesComponent,
    DocsDatabaseComponent,
  ],
  exports: [],
})
export class DocsModule {}
