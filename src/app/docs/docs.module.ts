import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';

import { ClarityModule, ClrFormsNextModule, ClrSelectModule} from '@clr/angular';

import { DocsComponent } from './docs.component';

@NgModule({
  imports: [
    ClarityModule,
    ClrFormsNextModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    DocsComponent
  ]
})

export class DocsModule { }