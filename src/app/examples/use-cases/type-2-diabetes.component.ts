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
        <br/>
        <p>
          To explore annotated functions and phenotype associations of mouse genes within and around
          the QTL region the researcher could limit the annotation searches to the mouse (reference)
          genome using the Block View Filtering tool to find genes annotated to relevant phenotype
          terms from the Mammalian Phenotype (MP) ontology
          (Smith and Eppig <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR29" target="_blank">2012</a>).
          Creating a new filter that highlights matches in mouse annotated with a Mammalian Phenotype
          ontology term and then searching for and selecting "impaired glucose tolerance", identifies
          thirteen genes that fall within the boundaries of the T2dm2sa QTL interval: Pkn3, Lcn2,
          Dpm2, Zbtb43, Bbs5, Commd9, Hipk3, Pax6, Hdc, Ap4e1,Chgb, and Pcsk2.
        </p>
        <br/>
        <p> The researcher could then create another filter on the MP term "increased circulating
          insulin level" (hyperinsulinemia), returns seven genes: Lcn2, Slc2a8, Dpp4, Bdnf, Hdc,
          Snap25, and Pcsk2. The Snap25 gene also matches a filter on the MP term "increased body
          mass index". The candidate gene suggested by the authors for the T2dm2sa QTL was Nr1h3
          (nuclear receptor subfamily 1, group H, member 3), a transcription activity regulator with
          a well-documented role in lipid homeostasis according to GO annotations available from
          <a href="http://www.informatics.jax.org/go/marker/MGI:1352462" target="_blank">MGI</a>.
          The suggested association of this gene with the T2dm2sa was based on the analysis of genes
          differentially expressed in mice with targeted mutations in Nr1h3 compared to wild type mice
          (Stulnig et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR32" target="_blank">2002</a>);
          however, the insulin levels and glucose tolerance in Nr1h3 knockout mice evaluated by the
          International Mouse Phenotyping Consortium (IMPC)
          (Munoz-Fuentes et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR20" target="_blank">2018</a>)
          are within normal levels
          (<a href="https://www.mousephenotype.org/data/genes/MGI:1352462" target="_blank">https://www.mousephenotype.org/data/genes/MGI:1352462</a>)
          suggesting that Nr1h3 may not be directly responsible for the phenotypes observed by
          Kobayashi et al.
          (<a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR13" target="_blank">2006</a>).
        </p>
        <p>
          MP terms are relevant only for mouse genes. To identify mouse orthologs of human genes
          relevant to type 2 diabetes phenotypes, a researcher could limit annotation searches to the
          human (comparison) genome. and then search for genes annotated to the Disease Ontology term,
          type 2 diabetes mellitus. Creating another filter to highlight matches in human annotated
          with a Disease Ontology term and then searching for and selecting "type 2 diabetes mellitus"
          which matches three genes in the human syntenic genome interval for mouse T2dm2sa: GPD2,
          NEUROD1, and MAPK8IP1. According to the annotation in MGI, the mouse orthologs of these
          genes are associated with phenotypes relevant to type 2 diabetes, but not specifically to
          the phenotypes of impaired glucose tolerance, hyperinsulinemia, or high BMI. In mice, loss
          of Gpd2 is associated with decreased insulin secretion
          (Eto et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR9" target="_blank">1999</a>);
          loss of Neurod1 is associated with hyperglycemia
          (Naya et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR23" target="_blank">1997</a>);
          loss of Mapk8ip1 is associated with abnormal gluconeogenesis and increased insulin sensitivity
          (Morel et al. <a href="https://link.springer.com/article/10.1007/s00335-019-09821-4#ref-CR19" target="_blank">2010</a>).
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../examples.component.scss'],
})
export class Type2DiabetesExampleComponent {}
