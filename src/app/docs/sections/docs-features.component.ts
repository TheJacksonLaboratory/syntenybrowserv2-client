import { Component } from '@angular/core';

@Component({
  selector: 'docs-features',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Browser Features</h2>
        <div>
          <h5>Feature Search</h5>
          <p>
            <img
              id="sb-architecture-diagram"
              src="../assets/jax-synbrowser-feature-search-panel.png"
              alt="The JAX Synteny Browser Feature Search Panel"
              width="348"
              height="401"
            />
            The <b>feature search</b> panel allows you to search for genomic features such as QTLs
            and individual (or groups of) genes. Searches could be done by gene symbol, or
            ontologies containing function and phenotypic annotations. The
            <b>feature search</b> will always search and display results for the reference species,
            which can be changed from the select options. The <b>search feature</b> table can be
            filtered to narrow the results and the selected features will appear in the area below.
          </p>
          <h6>The reference species (default M. musculus)</h6>
          if there are only two genomes uploaded, when the reference species is changed from the
          dropdown menu, the comparison species will automatically become the other species. The
          Genome View will automatically reflect the current state of the two selections.
          <h6>The comparison species (default H. sapiens)</h6>
          <p>
            if only two species are uploaded, the only way of changing the comparison is to change
            the reference. If there are more than two species loaded, the comparison dropdown menu
            will have options to choose from.
          </p>
        </div>
        <div>
          <h5>Genome View</h5>
          <p>
            <img
              id="sb-architecture-diagram"
              src="../assets/jax-synbrowser-genome-view.png"
              alt="The JAX Synteny Browser "
              width="241"
              height="319"
            />
          </p>
        </div>
        <div>
          <h5>Block Detail View</h5>
        </div>

        <div>
          <h5>Feature Display Filters</h5>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../docs.component.scss'],
})
export class DocsFeaturesComponent {}
