import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';

import { ExamplesComponent } from './examples.component';

@NgModule({
  imports: [CommonModule, AppRoutingModule],
  declarations: [ExamplesComponent],
})
export class ExamplesModule {}
