import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  active: string = 'browser';
  pages: object = {
    browser: [''],
    about: ['/about'],
    examples: ['/examples'],
    docs: ['/docs']
  };

  constructor() { }


  // Operational Methods

  /**
   * Sets the active page to the page associated with the specified page name
   * @param {string} pageName - the name of the page being set to active
   */
  setActive(pageName: string): void { this.active = pageName; }


  // Getter Methods

  /**
   * Returns the list of page names
   */
  getPages(): Array<string> { return Object.keys(this.pages); }


  // Condition Checks

  /**
   * Returns whether the page associated with the specified page name is
   * currently active
   * @param {string} pageName - the name of the page being checked
   */
  isActive(pageName: string): boolean { return pageName === this.active; }
}
