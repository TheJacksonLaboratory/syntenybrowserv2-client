import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AboutModule } from './about/about.module';
import { DocsModule } from './docs/docs.module';
import { ExamplesModule } from './examples/examples.module';
import { SyntenyBrowserModule } from './synteny-browser/synteny-browser.module';
import { FeatureSearchComponent } from './synteny-browser/feature-selection/feature-search/feature-search.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AboutModule,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    DocsModule,
    ExamplesModule,
    SyntenyBrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
