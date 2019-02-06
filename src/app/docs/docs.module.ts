import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';

import { ClarityModule, ClrSelectModule} from '@clr/angular';

import { DocsComponent } from './docs.component';

import { DocsClientAPIComponent } from './docs-client-api.component';
import { DocsConfigsComponent } from './docs-configs.component';
import { DocsContributorsComponent } from './docs-contributors.component';
import { DocsDataPrepComponent } from './docs-data-prep.component';
import { DocsDockerComponent } from './docs-docker.component';
import { DocsFeaturesComponent } from './docs-features.component';
import { DocsMenuComponent } from './docs-menu.component';
import { DocsServiceAPIComponent } from './docs-python-api.component';
import { DocsTutorialComponent } from './docs-tutorial.component';

@NgModule({
  imports: [
    AppRoutingModule,
    ClarityModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    DocsComponent,
    DocsClientAPIComponent,
    DocsConfigsComponent,
    DocsContributorsComponent,
    DocsDataPrepComponent,
    DocsDockerComponent,
    DocsFeaturesComponent,
    DocsMenuComponent,
    DocsServiceAPIComponent,
    DocsTutorialComponent
  ], 
  exports: [
    DocsMenuComponent
  ]
})

export class DocsModule { }
