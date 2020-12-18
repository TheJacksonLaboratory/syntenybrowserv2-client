import { Component } from '@angular/core';

@Component({
  selector: 'docs-tutorial',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Tutorial</h2>
        <p>
          This tutorial describes how you can use the JAX Synteny Browser online with pre-loaded
          mouse and human data or how to install the application locally and use it with your
          personal data. First, let's look at the application's architecture.
        </p>
        <h4>Prerequisites</h4>
        <p>
          To follow the steps in this tutorial you will require the followng packages:
        </p>
        <ul>
          <li>
            Docker(<a href="https://www.docker.com/community-edition" target="_blank"
              >https://www.docker.com/community-edition</a
            >): Docker is a program that lets you run "containers" hosting software and its
            dependencies
          </li>
          <li>Python 3.x</li>
          <li>synbrowser-manage:</li>
        </ul>
        <h4><b>Application Architecture</b></h4>
        <br />
        <img
          id="sb-architecture-diagram"
          src="../assets/sb-fig2-architecture-02072019.png"
          alt="The JAX Synteny Browser Architecture Diagram"
          width="467"
          height="191"
        />
        <p style="float: none">
          The main components behind the JAX Synteny Browser's implementation are listed below:
        </p>
        <ul>
          <li><b>Data Sources and Processing</b>:</li>
          <li>
            <b>Database &amp; Config Files</b>: the data is stored and extracted from an SQLite
            database, which is updated quarterly. In addition, two user-defined configuration files,
            one for each species (reference and comparison), provide specific application level
            settings and meta-data such as ontologies and features.
          </li>
          <li>
            <b>Application Layer and Service API</b>: the application layer exposes the data as a
            microserivce to clients. The microservie is callable from external web clients via
            several available endpoints.
          </li>
          <li><b>User Interface and Visualization</b>:</li>
        </ul>
        <div style="clear: both;"></div>
        <h4><b>Use Online</b></h4>
        <p>
          The easiest way to start using the application is online. You don't need to load any data
          or setup any configuration files. The online version comes with preloaded mouse and human
          data, and pre-configured. Check our detailed user manual or look through our examples to
          start quickly exploring some possible scenarios.
        </p>
        <h4><b>Running Synteny Browser Locally</b></h4>
        <br />
        <ul>
          <li>
            <b>Install Client</b>
            <p>
              The Client is implemented using Angular and can be downloaded from this location. You
              can install it locally and run it from your computer. To do so follow the following
              steps. First, install Angular following the steps at this page:
              <br />
              Then, download the client code from this link and put it in folder.
            </p>
          </li>
          <li>
            <b>Complete Installation</b>
            <p>
              Installing the complete application will require you to download and install the
              client using the instructions in the section above. In addition, you will need to
              install a Python-enabled server. We have a Docker instance. Check our Docker section.
              If you do not want to use Docker you can follow the steps below.
            </p>
          </li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsTutorialComponent {}
