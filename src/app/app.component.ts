import { Component, OnInit } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { NavigationEnd, Router } from '@angular/router';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // all of the pages the user can navigate to
  pages = ['browser', 'about', 'examples', 'docs'];

  browser: string;

  browserIssue: boolean;

  constructor(private browserInfo: DeviceDetectorService, public router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'UA-181089511-1', {
          page_path: event.urlAfterRedirects,
        });
      }
    });
  }

  ngOnInit(): void {
    this.browser = this.browserInfo.browser;

    // if we run into issues down the road with different browsers/devices
    // that we need to inform users of, we can check for those here
    this.browserIssue = this.browser === 'IE';
  }
}
