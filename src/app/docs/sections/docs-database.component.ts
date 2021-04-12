import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'docs-database',
  template: `
    <div class="content-container">
      <div class="content-area">
      <div class="clr-row">
        <div class="clr-col-md-12">
          <h2 class="top-0">Database Setup</h2>
        </div>
      </div>
        <div class="clr-row">
          <div class="clr-col-md-12 clr-col-lg-6">
            <h3>Option 1: Download a preloaded database</h3>
            <br/>
            <p>
              A ready-made database is available from Box
              <a href="https://thejacksonlaboratory.box.com/s/i7ru2r9mx2dmzx5m0mbb5w80l6ovd6az" target="_blank">here</a>
              named 'syntenybrowser-db.zip' and, when decompressed, will yield a
              file named 'synteny.db'. This .db file will need to be located in
              the root syntenybrowser/ directory before running the application,
              otherwise the application will not run.
            </p>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h3>Option 2: Load a database yourself</h3>
            <br />
            <p>
              &bull; To create and load your own database, clone the loading scripts from
              <a href="{{githubETL}}" target="_blank">GitHub</a>
              and navigate to the cloned project's root directory.
            </p>
            <pre><code>git clone {{githubETL}}.git</code></pre>
            <p>
              Next, create a new <em>data/</em>
              directory and download all your source files in it. To find more
              about the applicable data and formats, read the
              <a [routerLink]="['/docs/data-prep']">Data Sources/Formats</a> page.
              The curated source files currenly used in
              the application can be found in this <a href="{{dataUrl}}" target="_blank">public repo</a>.
              And the newest ontology files can be downloaded from their respective respositories.
              <br/>
              &bull; Create an empty (Python3 recommended) virtual environment in the project's root.
            </p>
            <pre><code>python -m venv venv-db</code></pre>
            <p>&bull; Once created, activate the virtual environment:</p>
            <pre><code>source venv-db/bin/activate</code></pre>
            <p>&bull; Install necessary packages:</p>
            <pre><code>pip install -r requirements.txt</code></pre>
            <p>
              &bull; Run the database creation script with the required parameter
              (On Windows, one option is to use Git Bash):
            </p>
            <pre><code>./create_database.sh synteny.db</code></pre>
            <p>
              This will take several minutes and when it's finished, it will yield a file named 'synteny.db'
              in root syntenybrowser/ directory (the database file needs to be located here so don't move it).
              Shut down the venv-db virtual environment:
            </p>
            <pre><code>deactivate</code></pre>
          </div>
        </div>

        <div class="clr-row">
          <div class="clr-col-md-12">
            <h2 class="top-0">System Architecture</h2>
            <img
              id="sb-architecture-diagram"
              src="../assets/synbrowser-architecture1.png"
              alt="The JAX Synteny Browser Architecture Diagram"
              title="The JAX Synteny Browser Architecture Diagram"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsDatabaseComponent {
  dataUrl: string = environment.sourceData;
  githubETL: string = environment.GitHubETL;
}
