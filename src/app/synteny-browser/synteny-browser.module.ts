import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgSelectModule} from '@ng-select/ng-select';

import { HttpClient, HttpClientModule } from '@angular/common/http';

import { ClarityModule, ClrSelectModule} from '@clr/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// components
import { SyntenyBrowserComponent } from './synteny-browser.component';
import { BlockViewFilterComponent } from './block-view-filter/block-view-filter.component';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';
import { ConditionConstructorComponent } from './block-view-filter/condition-constructor/condition-constructor.component';
import { OntologySearchComponent } from './feature-selection/ontology-search/ontology-search.component';
import { FeatureSearchComponent } from './feature-selection/feature-search/feature-search.component';

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
    ReactiveFormsModule
  ],
  declarations: [
    SyntenyBrowserComponent,
    BlockViewBrowserComponent,
    FeatureSelectionComponent,
    GenomeViewComponent,
    SpeciesSelectionComponent,
    BlockViewFilterComponent,
    ConditionConstructorComponent,
    OntologySearchComponent,
    FeatureSearchComponent,
  ],
  providers: [
    ApiService,
    HttpClient
  ]
})

export class SyntenyBrowserModule { }
