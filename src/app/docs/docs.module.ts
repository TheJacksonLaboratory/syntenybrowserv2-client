import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';

import { ClarityModule, ClrSelectModule} from '@clr/angular';

import { DocsComponent } from './docs.component';

@NgModule({
  imports: [
    ClarityModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    DocsComponent
  ]
})

export class DocsModule { }
