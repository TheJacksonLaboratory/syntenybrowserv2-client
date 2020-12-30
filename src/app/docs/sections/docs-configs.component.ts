import { Component } from '@angular/core';
import { EMPTY_MOUSE, MOUSE } from '../../synteny-browser/testing/constants/mock-species';

@Component({
  selector: 'docs-configs',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Species Configs Files</h2>
        <p>
          Each species loaded into Synteny Browser, such as
          <i>M. musculus</i> and <i>H. sapiens</i>, requires its own configuration file, which
          specifies species chromosome sizes, searching options, as well as external resources. All
          of the JSON examples below are from the configuration file for Mus musculus.
        </p>
        <div class="clr-row clr-col-12">
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Available Configuration Files</h4>
            <table>
              <tbody class="table">
                <tr>
                  <td class="left"><b>Homo sapiens</b></td>
                  <td class="left">9606_config.json</td>
                  <td class="left">
                    <a
                      target="_blank"
                      href="https://github.com/TheJacksonLaboratory/syntenybrowser/blob/master/synbrowser/synbrowser/static/js/data/9606_config.json"
                    >
                      See file
                    </a>
                  </td>
                </tr>
                <tr>
                  <td class="left"><b>Mus musculus</b></td>
                  <td class="left">10090_config.json</td>
                  <td class="left">
                    <a
                      target="_blank"
                      href="https://github.com/TheJacksonLaboratory/syntenybrowser/blob/master/synbrowser/synbrowser/static/js/data/10090_config.json"
                    >
                      See file
                    </a>
                  </td>
                </tr>
                <tr>
                  <td class="left"><b>Rattus norvegicus</b></td>
                  <td class="left">10116_config.json</td>
                  <td class="left">
                    <a
                      target="_blank"
                      href="https://github.com/TheJacksonLaboratory/syntenybrowser/blob/master/synbrowser/synbrowser/static/js/data/10090_config.json"
                    >
                      See file
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Configuration File Requirements</h4>
            <ul>
              <li>JSON format</li>
              <li>
                File should be named "[NCBI taxon ID of new species]_config.json"
              </li>
              <li>
                If running the API locally, the config file should be located in the
                <code>/service/src/static/data/</code> directory
              </li>
              <li>
                The base-level properties in the JSON should be
                <code>order</code> and <code>organism</code> (see more in the 'Order' and 'Organism'
                sections for more information)
              </li>
            </ul>
            <br />
          </div>
        </div>
        <div class="clr-row clr-col-12">
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Order</h4>
            <p>
              The <code>order</code> in a configuration file identifies the order in which that
              species will be presented in the list of available species from the API and will
              affect what the default reference and comparison species are (the default reference
              species will be the species with <code>order: 0</code> and the default comparison
              species will be that with <code>order: 1</code>. Each value in the configuration files
              being used should be unique, starting with 0.
            </p>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Organism</h4>
            <p>
              The <code>organism</code> contains all of the information regarding the species
              itself. The required values needed for <code>organism</code> are
              <code>name</code> (the formal latin name of the species), <code>alias</code> (the
              English common name for the species), <code>id</code> (the numeric NCBI taxon ID of
              the species), <code>resources</code> (see 'Resources' section below),
              <code>genome</code> (see 'Genome' section below), <code>qtls</code> (whether QTL data
              has been loaded into the database for this species), <code>searches</code> (see
              'Searches' section below), and <code>ontologies</code>
              (see 'Ontologies section below).
            </p>
            <pre><code>"organism": {{ formattedJSON() }}</code></pre>
          </div>
        </div>
        <div class="clr-row clr-col-12">
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Genome</h4>
            <p>
              The <code>genome</code> property is a dictionary/object with key-value pairs for each
              chromosome for the species' genome and the numeric size of each chromosome in
              basepairs. Below is an example from the configuration file for mouse:
            </p>
            <pre><code>"genome": {{ formattedJSON('genome') }}</code></pre>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Searches</h4>
            <p>
              The purpose of the <code>searches</code> property is to list ways that a user can
              search species features by. By default, a species should have a search by feature
              attribute (i.e. symbol, ID, or type). If you have loaded ontology annotations for any
              ontologies for the species, then adding an ontology search would also make sense to
              allow users to search for features in the species annotated/associated with ontology
              terms from the available ontologies (see the section below on ontologies). The
              <code>name</code> of a search will be listed in the select dropdown in the UI so it
              should be human-readable whereas the <code>value</code> should be succinct, and
              ideally a single keyword.
            </p>
            <pre><code>"searches": {{ formattedJSON('searches') }}</code></pre>
          </div>
        </div>
        <div class="clr-row clr-col-12">
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Ontologies</h4>
            <p>
              The purpose of the configuration's
              <code>ontologies</code> property is to identify the ontologies that have been loaded
              into the database with annotations for the species in the configuration file. Each
              'ontology' has has 2 properties, <code>name</code> and <code>value</code>. The name
              should be the formal and full name of the ontology and the value should be the prefix
              for the ontology term IDs (e.g. for Gene Ontology, the prefix is 'GO' and for Disease
              Ontology, the prefix is 'DOID'). If there are currently no ontologies with annotations
              for the new species, this should be an empty array and there should not be an ontology
              search in the <code>searches</code> array.
            </p>
            <pre><code>"ontologies": {{ formattedJSON('ontologies') }}</code></pre>
          </div>
          <div class="clr-col-md-12 clr-col-lg-6">
            <h4>Resources</h4>
            <p>
              The purpose of the configuration's <code>resources</code> property is to make more
              information on features available via links to other sites in tooltips. Each
              'resource' has 2 properties, <code>url</code> and <code>name</code>. The name should
              be the name of the resource and the URL should be the base URL where by adding a
              feature symbol or ID could create a valid link for more information on features. If
              the new species has no available resources, this property should be assigned an empty
              array (as opposed to being excluded from the JSON).
            </p>
            <pre><code>"resources": {{ formattedJSON('resources') }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsConfigsComponent {
  formattedJSON(property: string = null): string {
    if (!property) {
      return JSON.stringify(EMPTY_MOUSE, null, '  ');
    }

    return JSON.stringify(MOUSE.organism[property], null, '  ');
  }
}
