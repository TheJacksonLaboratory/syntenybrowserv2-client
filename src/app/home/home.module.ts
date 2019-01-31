import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HttpClient, HttpClientModule } from '@angular/common/http';

import { ClarityModule, ClrFormsNextModule, ClrSelectModule} from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// components
import { HomeComponent } from './home.component';

import { BlockViewBrowserComponent } from '../block-view-browser/block-view-browser.component';
import { FeatureSelectionComponent } from '../feature-selection/feature-selection.component';
import { GenomeViewComponent } from '../genome-view/genome-view.component';
import { SpeciesSelectionComponent } from '../species-selection/species-selection.component';
import { TooltipComponent } from '../tooltip/tooltip.component';

// services
import { ApiService } from '../services/api.service';

@NgModule({
  imports: [
    ClarityModule,
    ClrFormsNextModule,
    ClrSelectModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  declarations: [
    HomeComponent,
    BlockViewBrowserComponent,
    FeatureSelectionComponent,
    GenomeViewComponent,
    SpeciesSelectionComponent,
    TooltipComponent
  ], 
  providers: [ApiService, HttpClient]
})

export class HomeModule { }