import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // all of the pages the user can navigate to with their route names
  pages = {
    browser: ['/browser'],
    about: ['/about'],
    examples: ['/examples'],
    docs: ['/docs'],
  };

  /**
   * Returns the list of page names
   */
  getPages(): string[] {
    return Object.keys(this.pages);
  }
}
