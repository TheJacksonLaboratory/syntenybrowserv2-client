import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';

import { ClarityModule, ClrFormsNextModule, ClrSelectModule} from '@clr/angular';

import { AboutComponent } from './about.component';

@NgModule({
  imports: [
    ClarityModule,
    ClrFormsNextModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    AboutComponent
  ]
})

export class AboutModule { }