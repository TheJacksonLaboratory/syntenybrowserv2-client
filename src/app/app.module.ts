import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { ClarityModule } from '@clr/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AboutModule } from './about/about.module';
import { DocsModule } from './docs/docs.module';
import { ExamplesModule } from './examples/examples.module';
import { SyntenyBrowserModule } from './synteny-browser/synteny-browser.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AboutModule,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    DocsModule,
    ExamplesModule,
    SyntenyBrowserModule,
    DeviceDetectorModule.forRoot(),
    ClarityModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
