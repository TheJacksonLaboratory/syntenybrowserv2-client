import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // currently active page (should be the browser by default)
  active = 'browser';

  // all of the pages the user can navigate to with their route names
  pages = {
    browser: [''],
    about: ['/about'],
    examples: ['/examples'],
    docs: ['/docs'],
  };

  /**
   * Sets the active page to the page associated with the specified page name
   * @param {string} pageName - the name of the page being set to active
   */
  setActive(pageName: string): void {
    this.active = pageName;
  }

  /**
   * Returns the list of page names
   */
  getPages(): string[] {
    return Object.keys(this.pages);
  }

  /**
   * Returns whether the page associated with the specified page name is
   * currently active
   * @param {string} pageName - the name of the page being checked
   */
  isActive(pageName: string): boolean {
    return pageName === this.active;
  }
}
