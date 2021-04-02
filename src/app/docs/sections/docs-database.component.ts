import { Component } from '@angular/core';

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
              <em>(if you went with Option 1, skip to 'Setting Up the Application')</em>
              To load your own database, you'll need a virtual environment that runs in > Python3.7:
            </p>
            <pre><code>python -m venv venv-db</code></pre>
            <p>Once created, activate the virtual environment:</p>
            <pre><code>source venv-db/scripts/activate</code></pre>
            <p>Install necessary packages:</p>
            <pre><code>pip install -r requirements.txt</code></pre>
            <p>Run the database creation script with the required parameter:</p>
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
export class DocsDatabaseComponent {}
