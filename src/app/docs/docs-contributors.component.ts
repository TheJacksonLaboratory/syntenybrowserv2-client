import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-contributors',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Contributor Guidelines</h2>
        <p>
          Contributions are in the form of issues, code, documentation are 
          always very welcome. The following are a set of guidelines to help 
          ensure that contributions can be smoothly merged into the existing code base:
        </p>
        <ol>
          <li>
            All code contributions should be accompanied by a test. Tests can be placed into the test folder.
          </li>
          <li>
            All added functions should include a jsdoc string for javascript code or a numpy style docstring for python code.
          </li>
        </ol>
      </div>
      <!-- nav element should be kept in 
      the parent component to preserve layout -->
      <nav class="sidenav">
        <sb-docs-menu></sb-docs-menu>
      </nav>
    </div>
  `,
  styleUrls: ['./docs.component.scss']  
})

export class DocsContributorsComponent {
	
}