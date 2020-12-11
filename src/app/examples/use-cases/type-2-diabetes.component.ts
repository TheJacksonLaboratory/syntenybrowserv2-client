import { Component } from '@angular/core';

@Component({
  selector: 'ex-T2-diabetes',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Identifying candidate genes for Type 2 diabetes QTL in mice</h2>
        <p>
          The Quantitative Trait Locus (QTL) T2dm2sa (type 2 diabetes mellitus 2 in SMXA RI mice) was
          identified as a region of mouse chromosome 2 associated with impaired glucose tolerance,
          hyperinsulinemia, and high body mass index (BMI)
          (Kobayashi et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR13" target="_blank">2006</a>).
          To identify possible candidate genes in the QTL interval using prior biological knowledge
          about the genome features in this chromosomal region, a user would check to ensure that
          the Reference species is set to 'mouse', then using the Feature Search to look for the
          T2dm2sa QTL (GRCm28; Chr2:29417935-148533014) from the Mouse Genome Informatics (MGI)
          database. Selecting T2dm2sa in the table results table shows the syntenic blocks T2dm2sa
          spans in mouse chromosome 2 in the Genome View circos plot. Clicking on mouse chromosome 2
          and then the 'See selection in block view' below the plot opens the Block View Browser panel
          to appear and render in the interval that T2dm2sa spans on mouse chromosome 2.
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../examples.component.scss'],
})
export class Type2DiabetesExampleComponent {}
