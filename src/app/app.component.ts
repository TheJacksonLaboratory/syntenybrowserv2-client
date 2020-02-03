import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // all of the pages the user can navigate to
  pages = ['browser', 'about', 'examples', 'docs'];
}
