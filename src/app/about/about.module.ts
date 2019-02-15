import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';

import { ClarityModule, ClrSelectModule} from '@clr/angular';

import { AboutComponent } from './about.component';

@NgModule({
  imports: [
    ClarityModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    AboutComponent
  ]
})

export class AboutModule { }
