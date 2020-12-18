import { Component } from '@angular/core';

@Component({
  selector: 'docs-contributors',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Contributor Guidelines</h2>
        <p>
          Contributions are in the form of issues, code, documentation are always very welcome. The
          following are a set of guidelines to help ensure that contributions can be smoothly merged
          into the existing code base:
        </p>
        <ol>
          <li>
            All code contributions should be accompanied by a test. Tests can be placed into the
            test folder.
          </li>
          <li>
            All added functions should include a jsdoc string for javascript code or a numpy style
            docstring for python code.
          </li>
        </ol>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsContributorsComponent {}
