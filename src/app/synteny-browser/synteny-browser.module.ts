import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ClarityModule, ClrSelectModule } from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// components
import { SyntenyBrowserComponent } from './synteny-browser.component';
import { BlockViewFilterComponent } from './block-view-filter/block-view-filter.component';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';
import { OntologySearchComponent } from './feature-selection/ontology-search/ontology-search.component';
import { FeatureSearchComponent } from './feature-selection/feature-search/feature-search.component';
import { RowDetailComponent } from './feature-selection/ontology-search/row-detail.component';
import { SpeciesSelectionHelpComponent } from './species-selection/species-selection-help.component';
import { FeatureSelectionHelpComponent } from './feature-selection/feature-selection-help.component';
import { GenomeViewHelpComponent } from './genome-view/genome-view-help.component';
import { BlockViewBrowserHelpComponent } from './block-view-browser/block-view-browser-help.component';

// services
import { ApiService } from './services/api.service';

@NgModule({
  imports: [
    ClarityModule,
    ClrSelectModule,
    CommonModule,
    NgSelectModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
  ],
  declarations: [
    SyntenyBrowserComponent,
    BlockViewBrowserComponent,
    FeatureSelectionComponent,
    GenomeViewComponent,
    SpeciesSelectionComponent,
    BlockViewFilterComponent,
    OntologySearchComponent,
    FeatureSearchComponent,
    RowDetailComponent,
    SpeciesSelectionHelpComponent,
    FeatureSelectionHelpComponent,
    GenomeViewHelpComponent,
    BlockViewBrowserHelpComponent,
  ],
  providers: [ApiService, HttpClient],
})
export class SyntenyBrowserModule {}
