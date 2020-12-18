import { Component } from '@angular/core';

@Component({
  selector: 'docs-docker',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Docker</h2>
        <b>Note</b>: the content on this page is not real and serves only as a placeholder. For
        questions contact: georgi.kolishovski@jax.org
        <h4>Running locally</h4>
        <br />
        <p>
          The JAX Synteny Browser can also be run locally as a docker container. The
          [synbrowser-docker] (<a href="https://github.com/syntenybrowser/synbrowser-docker"
            >https://github.com/syntenybrowser/synbrowser-docker</a
          >) repository contains detailed information about how to set it up and run it.
          <br />
          The simple example below stops any running synteny browser containers, removes them, pulls
          the latest version and runs it.
        </p>
        <pre>
          <code>{{"
            docker stop higlass-container;
            docker rm higlass-container;

            docker pull gehlenborglab/higlass:v0.4.33 # higher versions are experimental and may or may not work

            docker run --detach
                       --publish 8989:80
                       --volume ~/hg-data:/data
                       --volume ~/tmp:/tmp
                       --name higlass-container
                   gehlenborglab/higlass:v0.4.17
          "}}</code>
        </pre>
        <p>
          The JAX Synteny Browser should now be visible at http://localhost:8989. Take a look at the
          user documentation for loading and displaying data.
        </p>
        <h4>Running remotely</h4>
        <br />
        <p>
          For security reasons, an instance created this way will not be accessible from hosts other
          than "localhost". To make it accessible to other hosts, please specif a hostname using the
          SITE_URL environment variable:
        </p>
        <pre></pre>
        <br />
        <p>
          Once a username and password are created, the admin interface can be accessed at
          http://localhost:8989/admin
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsDockerComponent {}
