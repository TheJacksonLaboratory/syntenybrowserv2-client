import { Component } from '@angular/core';

@Component({
  selector: 'ex-lung-cancer',
  template: `
    <div class="content-container">
      <div class="content-area">
        <!-- Right-hand Image Column -->
        <div class="clr-col-5 float-right">
          <div class="image-container">
            <img
              #image1
              src="../assets/selecting-human-chr-6.png"
              alt="Selecting human chromosome 6 in the genome view circos plot"
              title="Selecting human chromosome 6 in the genome view circos plot"
              (click)="zoomedPhoto = image1.src"
            />
            <p class="p6">
              Selecting human chromosome 6 in the genome view circos plot
            </p>
          </div>

          <div class="image-container">
            <img
              #image2
              src="../assets/GRCm38-in-block-view.png"
              alt="Jumping to the genomic interval"
              title="Jumping to the genomic interval"
              (click)="zoomedPhoto = image2.src"
            />
            <p class="p6">
              Jumping to the genomic interval associated with human lung cancer susceptibility
            </p>
          </div>

          <div class="image-container">
            <img
              #image3
              src="../assets/filtering-on-GO-term.png"
              alt="Filter to find matches in either species on a GO term"
              title="Filter to find matches in either species on a GO term"
              (click)="zoomedPhoto = image3.src"
            />
            <p class="p6">
              Filter to find matches in either species on the GO term "positive regulation of cell
              death" (GO:0010942)
            </p>
          </div>
        </div>

        <!-- Text -->
        <div class="clr-col-7">
          <h2>
            Identifying candidate genes in a mapped interval for human lung cancer susceptibility
          </h2>
          <hr />
          <p class="p6">
            An updated version of use case found in the
            <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4">
              JAX Synteny Browser manuscript
            </a>
          </p>
          <p>
            A region of human chromosome 6 (6q23–25; GRCm38 chr6:130300000–161000000 bp) was
            identified previously as a linkage interval associated with human lung cancer
            susceptibility (Bailey-Wilson et al.
            <a
              href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR3"
              target="_blank"
              >2004</a
            >). Because this linkage interval overlapped regions of allelic loss observed in several
            different types of cancer, the authors hypothesized that genes involved in regulating
            apoptosis (tumor suppressor genes) would be likely candidates for the susceptibility
            phenotype.
          </p>
          <p>
            To use the JAX Synteny Browser to find potential candidate genes for the human lung
            cancer susceptibility locus a researcher would first select ‘human’ as the Reference
            species using the select menus in the first step. Next, they would navigate to the
            region of interest on human chromosome 6 by selecting the human chromosome 6 in the
            outer ring of the Genome View circos plot and clicking on the 'See selection in block
            view' button below the plot. Upon doing so, a Block View Browser panel will appear below
            the Feature Search and Genome View plot and render the human entire chromosome 6. The
            display interval could then be refined either by using the zoom and pan navigation
            buttons directly above the Block View Browser plot or by entering a genomic interval for
            the region of interest into the 'Jump to Interval' tool, also located above the plot.
          </p>
          <p>
            Once the extent of the genome region displayed in the Block View Browser plot has been
            finalized, a researcher could search for genome features according to their biological
            and functional annotations using the filtering function, accessible by clicking the blue
            'Edit' button under the 'Block View Filters' tool. A modal should appear where the
            researcher can then create a series of filters that will display feature matches in the
            Block View Browser. For the lung cancer susceptibility interval, a new filter can be
            created to search for genome features that are annotated to the GO biological process
            term “positive regulation of cell death”.
          </p>
          <p>
            To do this, make sure that the filter mode is set to 'Highlight' and click through the
            dropdown menu series, first selecting 'In Either Species', then 'By Ontology Term', and
            last, 'From Gene Ontology'. Doing this will cause an autocomplete to display, where the
            researcher can start typing “positive regulation of cell death” in and then select the
            term when it appears as an option. Clicking 'Done' will create the filter.
          </p>
          <p>
            Closing the filtering modal will reveal that there are eleven genes highlighted in the
            Block View Browser at the current interval: MYB, CCN2, MAP3K5, HEBP2, BCLAF1, TIAM2,
            IL20RA, LATS1, FNDC1, IGF2R, and PRKN. One of these genes, PRKN, is returned because of
            annotations for the mouse gene only; MYB and TIAM2 are returned based on human gene
            annotations only. Four of the genes (CCN2, IL20RA, IGF2R, and PRKN) were identified by
            the authors of the mapping paper as likely candidate genes.
          </p>
        </div>
      </div>
    </div>

    <clr-modal
      id="image-zoom"
      clrModalSize="xl"
      [(clrModalOpen)]="!!zoomedPhoto"
      [clrModalClosable]="true"
      (close)="zoomedPhoto = null"
    >
      <h3 class="title">Header</h3>
      <div class="modal-body">
        <img *ngIf="zoomedPhoto" src="{{ zoomedPhoto }}" />
      </div>
    </clr-modal>
  `,
  styleUrls: ['../examples.component.scss'],
})
export class LungCancerExampleComponent {
  zoomedPhoto: any = null;
}
