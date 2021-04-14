import { Component } from '@angular/core';

@Component({
  selector: 'docs-contributors',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Contributor Guidelines</h2>
        <p>
          Contributions in the form of issues, code, or documentation are always very welcome. The
          following are a set of guidelines to help ensure that contributions can be smoothly merged
          into the existing code base, but please also refer to each repository README and documentation for other repository-specific guidelines:
        </p>
        <ol>
          <li>
            All code contributions should be accompanied by at least one test. Test files should be organized following the current conventions in the respective repository. If these conventions are not clear or if you have questions about where to write tests, feel free to reach out to our support
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
