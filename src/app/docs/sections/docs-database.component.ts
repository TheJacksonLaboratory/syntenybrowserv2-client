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
            <br />
            <p>
              A ready-made database is available from Box
              <a
                href="https://thejacksonlaboratory.box.com/s/i7ru2r9mx2dmzx5m0mbb5w80l6ovd6az"
                target="_blank"
                >here</a
              >
              named 'synteny-v2-db.zip' and, when decompressed, will yield a file named
              'synteny.db'. This .db file will need to be located in the service's root directory
              before running the application, otherwise the application will not run. Also available
              from this Box directory is 'syntenybrowser-db.zip' which is the database powering the
              first version of Synteny Browser. If you're interested in working with Synteny Browser
              v1, you'll want 'syntenybrowser-db.zip'.
            </p>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h3>Option 2: Load a database yourself</h3>
            <br />
            <p>
              &bull; To create and load your own database, clone the loading scripts from
              <a href="{{ etlSourceCode }}" target="_blank">GitHub</a>.
            </p>
            <pre><code>git clone {{etlSourceCode}}.git</code></pre>
            <p>
              &bull; Create a new <em>data/</em> directory in the cloned project's
              root directory and download all your source files in it. To find more about
              data sources and formats, refer to the
              <a [routerLink]="['/docs/data-prep']">Data Sources/Formats</a>
              page. The curated source files currently used in the application can be found in this
              <a href="{{ dataUrl }}" target="_blank">public server</a>. The most current ontology files
              should be accessible from their respective official ontology websites.
              <br />
              &bull; Create an empty (Python3 recommended) virtual environment in the project's
              root directory.
            </p>
            <pre><code>python -m venv venv-db</code></pre>
            <p>&bull; Once created, activate the virtual environment:</p>
            <pre><code>source venv-db/bin/activate</code></pre>
            <p>&bull; Install necessary packages:</p>
            <pre><code>pip install -r requirements.txt</code></pre>
            <p>
              &bull; Run the database creation script with the name of the database file as the single
              required parameter (if on Windows, you may need to use a tool like Git Bash for this):
            </p>
            <pre><code>./create_database.sh synteny.db</code></pre>
            <p>
              This will take several minutes and when it's finished, it will yield a file named
              'synteny.db' (the database file needs to be located in the service's root directory).
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
              src="../assets/architecture-diagram.png"
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

  etlSourceCode: string = environment.sourceCode.etl;
}
