import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-tutorial',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Tutorial</h2>
        <p>
          The tutorial describes how you can start using the JAX Synteny Browser online with pre-loaded data 
          and configuration or how you can install the application locally to use it with personal data. To begin, 
          let's take a high-level look to understand the application's architecture. 
        </p>
        <h4><b>Application Architecture</b></h4>
        <br>
        <img id="sb-architecture-diagram" src="../assets/sb-fig2-architecture-02072019.png" 
          alt="The JAX Synteny Browser Architecture Diagram" width="467" height="191" 
          style="float: left; padding-right: 10px; padding-bottom: 10px;">
        <p style="float: none">
          The main components, which constitute the JAX Synteny Browser's implementation are:
        </p>  
		<ul>
          <li><b>Data Sources and Processing</b>:</li>
          <li><b>Database &amp; Config Files</b>: the data is stored and extracted from an SQLite 
            database, which is updated quarterly. In addition, two user-defined configuration files, 
            one for each species (reference and comparison), provide specific application level 
            settings and meta-data such as ontologies and features.
          </li>
          <li><b>Application Layer and Service API</b>: the application layer exposes the data 
            as a microserivce to clients. The microservie is callable from external web clients 
            via several available endpoints.
          </li>
          <li><b>User Interface and Visualization</b>:  
		  
          </li>
		</ul>
        <div style="clear: both;"></div>
        <h4><b>Use Online</b></h4>
		<p>
		The easiest way to start using the application is online. You don't need to load any data or setup any configuration files. The online version 
        comes with preloaded mouse and human data, and pre-configured. Check our detailed user manual or look through our examples to start 
        quickly exploring some possible scenarios.
		</p>
        <h4><b>Running Synteny Browser Locally</b></h4>
		<ul>
            <li>Install Client</li>
			<li>Complete Installation</li>
        </ul>
      </div>
      <!-- nav element should be kept in 
      the parent component to preserve layout -->
      <nav class="sidenav">
        <sb-docs-menu></sb-docs-menu>
      </nav>
    </div>
  `,
  styleUrls: ['../docs.component.scss']
})

export class DocsTutorialComponent {
	
}
