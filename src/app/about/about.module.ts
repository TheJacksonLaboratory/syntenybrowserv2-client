import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule, ClrSelectModule } from '@clr/angular';
import { AppRoutingModule } from '../app-routing.module';

import { AboutComponent } from './about.component';

@NgModule({
  imports: [AppRoutingModule, ClarityModule, ClrSelectModule, CommonModule],
  declarations: [AboutComponent],
})
export class AboutModule {}
