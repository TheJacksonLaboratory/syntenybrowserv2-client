import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-configs',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Species Configs Files</h2>
        <p>
          Each species, such as <i>M. musculus</i> and <i>H. sapiens</i>, requires its own
          configuration file, which specifies species chromosome sizes, searching options, as well
          as external resources.
        </p>
        <br />
        <table>
          <tbody class="table">
            <tr>
              <td class="left"><i>H. sapines</i></td>
              <td class="left">
                <a
                  target="_blank"
                  href="https://github.com/TheJacksonLaboratory/syntenybrowser/blob/master/synbrowser/synbrowser/static/js/data/9606_config.json"
                >
                  9606_config.json
                </a>
              </td>
            </tr>
            <tr>
              <td class="left"><i>M. musculus</i></td>
              <td class="left">
                <a
                  target="_blank"
                  href="https://github.com/TheJacksonLaboratory/syntenybrowser/blob/master/synbrowser/synbrowser/static/js/data/10090_config.json"
                >
                  10090_config.json
                </a>
              </td>
            </tr>
          </tbody>
        </table>
        <br />
        <p>
          The different properties of the config file are described below. If you install the
          application locally you can write your own config files and put them in the
          /service/src/static/data directory. The files is in <a href="">JSON</a> format and are
          named as the NCBI id of the species followed by an underscor and the word 'config":
          "id_config.json".
        </p>
        <h4>Chromosome Sizes</h4>
        <p>
          Chromosome sizes are provided as an array of chromosome id, chromosome size pairs.
        </p>
        <pre>
          <code>{{"
            chromosome: [
              {'chr': '1', 'size': 249250621},
              {'chr': '2', 'size': 243199373},
              ...
              {'chr': '22', 'size': 51304566},
              {'chr': 'X', 'size': 155270560},
              {'chr': 'Y', 'size': 59373566}
            ],
          "}}</code>
        </pre>

        <h4>Search Categories</h4>
        <p>
          Different species can be searched fr different categories. This makes sense for example
          when some species have an associated ontology or annotation, and others do not. For
          example, mouse can be searched for QTL while Humans cannot. Each entry should have a name,
          value, search example, and a search_type. The search types are predefined and can be
          cheked here.
        </p>
        <pre>
          <code>{{"
            search_categories: [
              {
                'name': 'gene',
                'value': 'gene symbol',
                'search_example': 'Gene symbol (e.g. BRCA)',
                'search_type': 'GeneName'
              },
              {
                'name': 'GO',
                'value': 'Gene Ontology (GO)',
                'search_example': 'GO term (e.g. osmosensory signaling pathway)',
                'search_type': 'OntAnnotation'
              }, ...
            ],
          "}}</code>
        </pre>

        <h4>External Resources</h4>
        <p>
          External resources information is loaded on Block View tooltips. The string is constructed
          by appending the gene id to the external resource string.
        </p>
        <pre>
          <code>{{"
            external_resources: [
              {
                'name': 'NCBI',
                'url': 'https://www.ncbi.nlm.nih.gov/gene/'
              }
            ]
          "}}</code>
        </pre>
      </div>
      <!-- nav element should be kept in
      the parent component to preserve layout -->
      <nav class="sidenav">
        <sb-docs-menu></sb-docs-menu>
      </nav>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsConfigsComponent {}
