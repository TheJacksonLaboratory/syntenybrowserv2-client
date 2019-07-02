import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';
import { ClarityModule, ClrSelectModule} from '@clr/angular';

import { AboutComponent } from './about.component';

@NgModule({
  imports: [
    AppRoutingModule,
    ClarityModule,
    ClrSelectModule,
    CommonModule
  ],
  declarations: [
    AboutComponent
  ]
})

export class AboutModule { }
