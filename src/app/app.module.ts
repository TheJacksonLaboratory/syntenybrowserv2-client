import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ClarityModule, ClrFormsNextModule, ClrSelectModule} from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {ApiService} from './services/api.service';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';

@NgModule({
  declarations: [
    AppComponent,
    SpeciesSelectionComponent,
    FeatureSelectionComponent,
    GenomeViewComponent,
    BlockViewBrowserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ClarityModule,
    ClrFormsNextModule,
    ClrSelectModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ApiService, HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule { }
