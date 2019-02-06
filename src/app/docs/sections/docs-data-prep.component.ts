import { Component } from '@angular/core';

@Component({
  selector: 'sb-docs-data-prep',
  template: `
    <div class="content-container">
      <div class="content-area">
        <h2>Data Sources and Formats</h2>
        
        <table class="table table-compact">
        <thead>
          <tr>
            <th class="left">Data Type</th>
            <th class="left">File Name</th>
            <th class="left">File Format</th>
            <th class="left">File Source</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>1. Syntenyc Relationships</b></td>
            <td class="left"></td>
            <td class="left"></td>
            <td class="left"></td>
          </tr>
          <tr>
            <td class="left">1.1. Human-Mouse Syntenic Blocks</td>
            <td class="left"><a href="" target="_blank">MouseMineSynteny.blocks</a></td>
            <td class="left">custom</td>
            <td class="left">Mouse Mine</td>
          </tr>
          <tr><td colspan="4">&nbsp;</td></tr>
          <tr>
            <td class="left"><b>2. Genomic Features (gene, QTL, mRNA, ...)</b></td>
            <td class="left"></td>
            <td class="left"></td>
            <td class="left"></td>
          </tr>
          <tr>
            <td class="left">2.1. Human Features - Genes</td>
            <td class="left"><a href="" target="_blank">NCBI_Human_forSynteny.gff3</a></td>
            <td class="left">GFF3</td>
            <td class="left">NCBI</td>
          </tr>
          <tr>
            <td class="left">2.2. Mouse Features - Genes</td>
            <td class="left"><a href="" target="_blank">MGI_GenomeFeature_forSynteny.gff3</a></td>
            <td class="left">GFF3</td>
            <td class="left">MGI</td>
          </tr>
          <tr>
            <td class="left">2.3. Mouse Features - QTL</td>
            <td class="left"><a href="" target="_blank">QTL_JBrowse.gff3</a></td>
            <td class="left">GFF3</td>
            <td class="left">N/A</td>
          </tr>
          <tr><td colspan="4">&nbsp;</td></tr>
          <tr>
            <td class="left"><b>3. Homologous Feature Pairings</b></td>
            <td class="left"></td>
            <td class="left"></td>
            <td class="left"></td>
          </tr>
          <tr>
            <td class="left">3.1. Human to Mouse Homologous Gene Pairings</td>
            <td class="left"><a href="">MMHomologs.tsv</a></td>
            <td class="left">custom</td>
            <td class="left">MouseMine</td>
          </tr>
          <tr><td colspan="4">&nbsp;</td></tr>
          <tr>
            <td class="left"><b>4. Ontologies</b></td>
            <td class="left"></td>
            <td class="left"></td>
            <td class="left"></td>
          </tr>
          <tr>
            <td class="left">4.1. Mouse GO (Gene Ontology)</td>
            <td class="left"><a href="">go-basic.obo</a></td>
            <td class="left">OBO</td>
            <td class="left">Genome Ontology Consortium</td>
          </tr>
          <tr>
            <td class="left">4.2. Human GO (Gene Ontology)</td>
            <td class="left"><a href="">go-basic.obo</a></td>
            <td class="left">OBO</td>
            <td class="left">Genome Ontology Consortium</td>
          </tr>
          <tr>
            <td class="left">4.3. Mouse MP (Mammalian Phenotype)</td>
            <td class="left"><a href="">MPheno_OBO.ontology</a></td>
            <td class="left">OBO</td>
            <td class="left">MGI</td>
          </tr>
          <tr>
            <td class="left">4.4. Human DO (Disease Ontology)</td>
            <td class="left"><a href="">HumanDO.obo</a></td>
            <td class="left">OBO</td>
            <td class="left">The OBO Foundry</td>
          </tr>
          <tr><td colspan="4">&nbsp;</td></tr>
          <tr>
            <td class="left"><b>5. Annotations (QTL, genes, mRNA, ...)</b></td>
            <td class="left"></td>
            <td class="left"></td>
            <td class="left"></td>
          </tr>
          <tr>
            <td class="left">5.1. Human GO to Human Genes</td>
            <td class="left"><a href="">goa_human.gaf</a></td>
            <td class="left">GAF2</td>
            <td class="left">NCBI</td>
          </tr>
          <tr>
            <td class="left">5.2. Human DO to Human Genes</td>
            <td class="left"><a href="">MGI_DO.rpt</a></td>
            <td class="left">GAF2</td>
            <td class="left">MGI</td>
          </tr>
          <tr>
            <td class="left">5.3. Mouse GO to Species Genes</td>
            <td class="left"><a href="">gene_association.mgi</a></td>
            <td class="left">GAF2</td>
            <td class="left">MGI</td>
          </tr>
          <tr>
            <td class="left">5.4. Mouse MP to Mouse Genes</td>
            <td class="left"><a href="">MouseMP_to_gene.txt</a></td>
            <td class="left">custom</td>
            <td class="left">MGI</td>
          </tr>
		  
        </tbody>
      </table>
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

export class DocsDataPrepComponent {
	
}
