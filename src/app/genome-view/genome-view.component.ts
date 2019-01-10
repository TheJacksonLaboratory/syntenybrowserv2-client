import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from '../services/api.service';
import {Species} from '../classes/species';
import {GenomeMap} from '../classes/genome-map';
import {CartesianCoordinate, Metadata, SelectedFeatures} from '../classes/interfaces';
import {TooltipComponent} from '../tooltip/tooltip.component';
import {SyntenyBlock} from '../classes/synteny-block';

@Component({
  selector: 'app-genome-view',
  templateUrl: './genome-view.component.html',
  styleUrls: ['./genome-view.component.scss']
})
export class GenomeViewComponent implements OnInit {
  @ViewChild('tooltip') tooltip: TooltipComponent;

  reference: Species;
  comparison: Species;
  genomeColors: any;
  genomeData: Array<SyntenyBlock>;
  refGenomeMap: GenomeMap;
  compGenomeMap: GenomeMap;
  tempCompGenome: any;

  // rendering constants
  width: number = 500;
  radius: number = this.width * 0.5;
  bandThickness: number = 20;
  refRadii: any;
  compRadii: any;
  featureRadii: any;

  refChromosome: any;

  features: Array<Metadata>;
  featureBlocks: Array<SyntenyBlock>;

  constructor(private http: ApiService) { }

  ngOnInit() {
    // generate a radii dictionary to help with rendering the reference plot
    let refRadius = Math.round(this.radius * (2/3) + 30);

    this.refRadii = {
      ringInner: refRadius,
      ringOuter: refRadius + this.bandThickness,
      labels: refRadius + 35,
      featureIndicators: refRadius - 15
    };

    // generate a radii dictionary for feature blocks
    this.featureRadii = {
      ringInner: this.refRadii.ringInner - this.bandThickness,
      ringOuter: this.refRadii.ringInner
    };

    // generate a radii dictionary to help with rendering the comparison plot
    let compRadius = (this.radius * 0.4) + 30;
    this.compRadii = {
      ringInner: compRadius,
      ringOuter: compRadius + this.bandThickness,
      labels: compRadius + 30
    };
  }


  // Operational Methods

  /**
   * Renders a genome view from a specified reference species and comparison species
   * @param {Species} reference - the current reference species
   * @param {Species} comparison - the current comparison species
   * @param {object} genomeColors - the dictionary to map colors to chromosomes
   */
  render(reference: Species, comparison: Species, genomeColors: object): void {
    this.reference = reference;
    this.comparison = comparison;
    this.genomeColors = genomeColors;

    // get genome-wide syntenic blocks from API
    this.http.getGenomeSynteny(this.reference.getID(), this.comparison.getID()).subscribe(blocks => {
      this.refGenomeMap = new GenomeMap(this.reference.genome);
      this.compGenomeMap = new GenomeMap(this.comparison.genome);

      // set the color for each block
      blocks.forEach(block => block.setColor(genomeColors[block.compChr]));
      this.genomeData = blocks;
    });
  }

  /**
   * Renders chord mapping of syntenic blocks for an entire selected chromosome
   * @param {string} chr - the selected chromosome
   */
  renderChordMapForChr(chr: string): void {
    // get the blocks that should be shown in the comparison plot's reference chromosome
    let featureBlocks = (this.featureBlocks) ? this.featureBlocks.filter(block => block.matchesRefChr(chr)) : [];
    let blocks = (featureBlocks.length > 0) ? featureBlocks : this.genomeData.filter(block => block.matchesRefChr(chr));

    // make a new comparison genome dictionary with the temporary reference chromosome
    let newCompGenome = Object.assign({}, this.comparison.genome);
    newCompGenome['ref'+ chr] = this.reference.genome[chr];

    this.tempCompGenome = newCompGenome;
    this.compGenomeMap = new GenomeMap(newCompGenome);

    // set the reference chromosome
    this.refChromosome = {
      chr: 'ref'+ chr,
      size: this.reference.genome[chr],
      blocks: blocks.map(block => block.markAsSelected())
    };
  }

  /**
   * Updates the list of features to display in the circos plot
   * @param {Array<Metadata>} features - the current list of features to display
   */
  updateFeatures(features: Array<Metadata>): void {
    this.features = features;

    // generate a list of syntenic blocks to highlight; the features.map() is going to produce an array of arrays
    // (some features may span more than one block) which needs to be flattened which is done with the [].concat.apply()
    let blocks = [].concat.apply([], features.map(f => this.genomeData.filter(block => block.isAFeatureBlock(f))));

    // create a list of distinct blocks (we don't want to render the same block more than once)
    this.featureBlocks = Array.from(new Set(blocks));
  }

  /**
   * Shows the tooltip for the specified chromosome and species by getting the location of the cursor
   * @param {string} chr - the chromosome that needs the tooltip
   * @param {Species} species - the species the specified chromosome belongs to
   * @param {MouseEvent} event - the hover event we use to get cursor location
   */
  revealTooltip(chr: string, species: Species, event: MouseEvent): void {
    this.tooltip.display(this.getTooltipContent(chr, species), event.offsetX + 10, event.offsetY - 60, species.name);
  }


  // Getter Methods

  /**
   * Returns the chromosome the user chose as well as a list of any features to render in the block view
   */
  getChromosomeFeaturesToView(): SelectedFeatures {
    let features = (this.features) ? this.features.filter(feature => feature.chr === this.refChromosome.chr.replace('ref', '')) : [];

    return {
      chr: this.refChromosome.chr.replace('ref', ''),
      features: features
    }
  }

  /**
   * Returns a path command for a chromosome band
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {GenomeMap} genomeMap - the genome map for the specified genome (reference or comparison)
   * @param {string} chr - the chromosome the band is for
   * @param {any} genome - the genome of the specified species (dictionary describing chr sizes)
   */
  getChrBandPath(radiiDict: any, genomeMap: GenomeMap, chr: string, genome: any): string {
    return this.getBandPathCommand(genomeMap.convertBPToCartesian(chr, 0, radiiDict.ringInner),
                                   genomeMap.convertBPToCartesian(chr, genome[chr], radiiDict.ringInner),
                                   genomeMap.convertBPToCartesian(chr, 0, radiiDict.ringOuter),
                                   genomeMap.convertBPToCartesian(chr, genome[chr], radiiDict.ringOuter),
                                   radiiDict.ringInner,
                                   radiiDict.ringOuter);
  }

  /**
   * Returns a path command for a syntenic block
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {GenomeMap} genomeMap - the genome map for the specified genome (reference or comparison)
   * @param {SyntenyBlock} block - the synteny block to render the band for
   * @param {boolean} inner - the default false boolean flag that indicates if the block band is for the inner plot
   */
  getBlockBandPath(radiiDict: any, genomeMap: GenomeMap, block: SyntenyBlock, inner: boolean = false): string {
    // if the block is located in the inner plot and it has a temporary chr (only the reference chr), use the temp chr
    let chr = (inner && block.tempChr) ? block.tempChr : block.refChr;

    return this.getBandPathCommand(genomeMap.convertBPToCartesian(chr, block.refStart, radiiDict.ringInner),
                                   genomeMap.convertBPToCartesian(chr, block.refEnd, radiiDict.ringInner),
                                   genomeMap.convertBPToCartesian(chr, block.refStart, radiiDict.ringOuter),
                                   genomeMap.convertBPToCartesian(chr, block.refEnd, radiiDict.ringOuter),
                                   radiiDict.ringInner,
                                   radiiDict.ringOuter);
  }

  /**
   * Returns the path command specifically for the selected reference chromosome for the inner plot
   */
  getInnerRefBlockBandPath(): string {
    return this.getChrBandPath(this.compRadii, this.compGenomeMap, this.refChromosome.chr, this.tempCompGenome);
  }

  /**
   * Returns a path command for the given syntenic mapping region and radius
   * @param {number} radius - the inner radius of the comparison (inner) ring
   * @param {GenomeMap} genomeMap - the genome map (NOTE: must be updated with the ref chr accessed by 'ref<chr value>'
   * @param {SyntenyBlock} block - the syntenic region to render a chord for (NOTE: ref_chr must be in the form 'ref<chr value>'
   */
  getChordPath(radius: number, genomeMap: GenomeMap, block: SyntenyBlock) {
    // get all 4 points of the chord
    let refStart = genomeMap.convertBPToCartesian(block.tempChr, block.refStart, radius);
    let refEnd = genomeMap.convertBPToCartesian(block.tempChr, block.refEnd, radius);
    let compStart = genomeMap.convertBPToCartesian(block.compChr, block.compStart, radius);
    let compEnd = genomeMap.convertBPToCartesian(block.compChr, block.compEnd, radius);

    return `M${refStart.x},${refStart.y}A205,205 0 0,1 ${refEnd.x},${refEnd.y}Q0,0 ${compEnd.x},${compEnd.y}
            A 205,205 0 0,1${compStart.x},${compStart.y}Q0,0 ${refStart.x},${refStart.y}Z`;
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   * @param {GenomeMap} genomeMap - the genome map for the specified genome (reference or comparison)
   * @param {any} genome - the genome of the specified species (dictionary describing chr sizes)
   * @param {number} radius - the radius to which the labels need to be rendered
   */
  getLabelPosition(chr: string, genomeMap: GenomeMap, genome: any, radius: any): string {
    let pos = genomeMap.convertBPToCartesian(chr, genome[chr] * 0.5, radius.labels);

    // a few small manual adjustments for the x and y values as I notice they don't center with the
    // rings as well when not rotated; this is probably due to not rotating them with the bands
    return this.translate(pos.x - 2, pos.y + 4);
  }

  /**
   * Returns the translation to the center of the plot
   */
  getCenter(): string { return this.translate(this.radius, this.radius) }

  /**
   * Returns array of chromosome for the specified genome
   * @param {any} genome - the genome of the specified species (dictionary describing chr sizes)
   */
  getChromosomes(genome: any): Array<string> { return Object.keys(genome); }

  /**
   * Returns the color for the specified chromosome
   * @param {string} chr - the chromosome to get the color of
   */
  getChrColor(chr: string): string { return this.genomeColors[chr]; }


  // Private Methods

  /**
   * Returns the content to be displayed in the tooltip based on the specified chromosome and species
   * @param {string} chr - the chromosome that needs the tooltip
   * @param {Species} species - the species that the specified chromosome belongs to
   */
  private getTooltipContent(chr: string, species: Species): object {
    let data = {
      'Chromosome': chr
    };

    // if the species is reference and there are features, display the symbols in the tooltip
    if(species.taxonID === this.reference.taxonID && (this.features && this.features.length > 0)) {
      let genes = this.features.filter(feature => feature.gene_id && feature.chr === chr);
      let qtls = this.features.filter(feature => feature.qtl_id && feature.chr === chr);

      if(genes.length > 0) data['Selected Genes'] = genes.map(gene => gene.gene_symbol).join(', ');
      if(qtls.length > 0) data['Selected QTLs'] = qtls.map(qtl => qtl.qtl_symbol).join(', ');
    }

    return data;
  }

  /**
   * Returns a path command for the given four specified coordinates (x, y pairs) and the desired radii
   * @param {CartesianCoordinate} inStrt - (if band is positioned horizontally) this is the bottom left corner of band
   * @param {CartesianCoordinate} inEnd - ("") this is the bottom right corner of band
   * @param {CartesianCoordinate} outStrt - ("") this is the top left corner of band
   * @param {CartesianCoordinate} outEnd - ("") this is the top right corner of band
   * @param {number} inRad - the radius of the inner edge of the band
   * @param {number} outRad - the radius of the outer edge of the band
   */
  private getBandPathCommand(inStrt: CartesianCoordinate, inEnd: CartesianCoordinate, outStrt: CartesianCoordinate,
                             outEnd: CartesianCoordinate, inRad: number, outRad: number): string {
    return `M${inStrt.x},${inStrt.y}A${inRad},${inRad} 0 0,1 ${inEnd.x},${inEnd.y}L${outEnd.x},${outEnd.y}
            A${outRad},${outRad} 0 0,0 ${outStrt.x},${outStrt.y}Z`;
  }

  /**
   * Returns a translate command in the form of a string to be used in the template for custom translations
   * @param {number} dx - the number of pixels horizontally away from (0, 0), the top left of parent container
   * @param {number} dy - the number of pixels vertically away from (0, 0), the top left of parent container
   */
  private translate(dx: number, dy: number): string { return `translate(${dx}, ${dy})` }
}
