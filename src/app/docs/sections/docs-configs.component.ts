import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-configs',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>View Configs</h2>
        <p>
           
        </p>
        <h4>Chromosome Sizes</h4>
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
  styleUrls: ['../docs.component.scss']
})

export class DocsConfigsComponent {
	
}
