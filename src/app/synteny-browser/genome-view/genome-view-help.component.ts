import { Component } from '@angular/core';

@Component({
  selector: 'genome-view-help',
  template: `
    <clr-modal clrModalSize="lg" [(clrModalOpen)]="open">
      <h3 class="modal-title">Using the Genome View</h3>

      <div class="modal-body">
        <ul>
          <li>
            The genome view consists of two rings: the outer ring represents the reference genome,
            separated into chromosomes and the inner ring which represents the comparison genome,
            also separated into chromosomes.
          </li>
          <li>
            Each reference chromosome band consists of a series of syntenic regions that are colored
            based on the chromosome in the comparison genome (the inner ring) that the region is
            mapped to.
          </li>
          <li>
            Hovering over any of these chromosome bands, whether it is in the reference or
            comparison genome will show the chromosome value and species for that chromosome.
          </li>
          <li>
            If you hover over a reference chromosome that has selected features, the tags of those
            selected features will be highlighted in the 'Current selections' field below the table
            to help you identify which ones are located in that chromosome. This can be especially
            handy if you have several features selected in the same chromosome.
          </li>
          <li>
            If you click on a reference chromosome without any feature selections, you will see the
            comparison genome ring rotate and all of the syntenic regions in that said chromosome
            will be extend to the location in the respective chromosome in the comparison genome
            where the region maps to.
          </li>
          <li>
            When features are selected, if they are located within a syntenic region, that region
            extends out from the inner edge of the reference chromosome a bit to give you an
            indication as to where it is. If a feature has been selected that is not located within
            a syntenic region, it will be listed in the upper left-hand corner of the plot so that
            you know that it has been selected but won't show as being in a region and be mapped.
          </li>
          <li>
            If you click on a reference chromosome that contains features you selected from the
            feature/ontology search, only the regions that contain at least one feature will extend
            to the locations in the comparison genome as opposed to all of them.
          </li>
          <li>
            You may download the genome at any time using the 'Download' button above the plot. Keep
            in mind that the download essentially grabs a snapshot of the SVG containing the plot so
            whatever is visible at the time of the download will be what is contained in the
            downloaded PNG.
          </li>
          <li>
            Once the chromosome you wish to view in more detail has been selected, click the 'See
            selection in block view' to render it in the block view browser.
          </li>
        </ul>
      </div>
    </clr-modal>
  `,
})
export class GenomeViewHelpComponent {
  // indicates if the modal is open or not
  open: boolean;
}
