import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';

import { ExamplesComponent } from './examples.component';
import { LungCancerExampleComponent } from './use-cases/lung-cancer.component';
import { Type2DiabetesExampleComponent } from './use-cases/type-2-diabetes.component';

@NgModule({
  imports: [CommonModule, AppRoutingModule],
  declarations: [
    ExamplesComponent,
    LungCancerExampleComponent,
    Type2DiabetesExampleComponent,
  ],
})
export class ExamplesModule {}
