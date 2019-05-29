import { ApiService } from '../services/api.service';
import { CartesianCoordinate, SelectedFeatures } from '../classes/interfaces';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Feature } from '../classes/feature';
import { GenomeMap } from '../classes/genome-map';
import { saveAs } from 'file-saver';
import { Species } from '../classes/species';
import { SyntenyBlock } from '../classes/synteny-block';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'app-genome-view',
  templateUrl: './genome-view.component.html',
  styleUrls: ['./genome-view.component.scss']
})
export class GenomeViewComponent implements OnInit {
  @ViewChild('tooltip') tooltip: TooltipComponent;

  ref: Species;
  comp: Species;
  colors: object;
  genomeData: Array<SyntenyBlock>;
  refGMap: GenomeMap;
  compGMap: GenomeMap;
  tempCompGenome: object;

  // rendering constants
  width: number = 500;
  radius: number = this.width * 0.5;
  bandThickness: number = 20;
  refRadii: any;
  compRadii: any;
  featureRadii: any;

  refChr: any;

  features: Array<Feature>;
  featureBlocks: Array<SyntenyBlock>;

  constructor(private http: ApiService) { }

  ngOnInit() {
    // generate a radii dictionary to help with rendering the reference plot
    let refRadius = Math.round(this.radius * (2/3) + 30);

    this.refRadii = {
      ringInner: refRadius,
      ringOuter: refRadius + this.bandThickness,
      labels: refRadius + 35,
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
   * Renders a genome view from a specified reference and comparison species
   * @param {Species} reference - the current reference species
   * @param {Species} comparison - the current comparison species
   * @param {object} colors - the dictionary to map colors to chromosomes
   */
  render(reference: Species, comparison: Species, colors: object): void {
    this.reset();

    this.ref = reference;
    this.comp = comparison;
    this.colors = colors;

    let refID = this.ref.getID();
    let compID = this.comp.getID();

    // get genome-wide syntenic blocks from API
    this.http.getGenomeSynteny(refID, compID)
             .subscribe(blocks => {
               this.refGMap = new GenomeMap(this.ref.genome);
               this.compGMap = new GenomeMap(this.comp.genome);

               // set the color for each block
               blocks.forEach(b => b.setColor(colors[b.compChr]));
               this.genomeData = blocks;
             });
  }

  /**
   * Triggers a download of the current view in the block view browser
   * TODO: let users choose the name they want to use for the download
   */
  download(): void {
    let svg = document.querySelector('#genome-view-svg');
    svg.setAttribute('xlink', 'http://www.w3.org/1999/xlink');

    let canvas = document.createElement('canvas');
    canvas.width = Number(svg.clientWidth);
    canvas.height = Number(svg.clientHeight);

    let ctx = canvas.getContext('2d');
    let image = new Image();

    image.onload = () => {
      ctx.clearRect(0, 0, svg.clientWidth, svg.clientHeight);
      ctx.drawImage(image, 0, 0, svg.clientWidth, svg.clientHeight);

      canvas.toBlob((blob) => {
        let name = this.ref.commonName + '_' + (this.refChr ? this.refChr.chr : '');
        saveAs(blob, name);
      });
    };

    let serialized = new XMLSerializer().serializeToString(svg);
    image.src = `data:image/svg+xml;base64,${btoa(serialized)}`;
  }

  /**
   * Renders chord mapping of syntenic blocks for an entire selected chromosome
   * @param {string} chr - the selected chromosome
   */
  renderChordMapForChr(chr: string): void {
    // get the blocks that should be shown in the comparison plot's ref chromosome
    let featureBlocks = (this.featureBlocks) ?
                        this.featureBlocks.filter(b => b.matchesRefChr(chr)) : [];
    let blocks = (featureBlocks.length > 0) ?
                 featureBlocks : this.genomeData.filter(b => b.matchesRefChr(chr));

    // make a new comparison genome dictionary with the temp reference chromosome
    let newCompGenome = Object.assign({}, this.comp.genome);
    newCompGenome['ref'+ chr] = this.ref.genome[chr];

    this.tempCompGenome = newCompGenome;
    this.compGMap = new GenomeMap(newCompGenome);

    // set the reference chromosome
    this.refChr = {
      chr: 'ref'+ chr,
      size: this.ref.genome[chr],
      blocks: blocks.map(b => b.markAsSelected())
    };
  }

  /**
   * Updates the list of features to display in the circos plot
   * @param {Array<Feature>} features - the current list of features to display
   */
  updateFeatures(features: Array<Feature>): void {
    this.features = features;

    // generate a list of syntenic blocks to highlight; the features.map() is
    // going to produce an array of arrays (some features may span more than one
    // block) which needs to be flattened which is done with the [].concat.apply()
    let blocks = [].concat
                   .apply([],
                          features.map(f => {
                            return this.genomeData.filter(b => b.isAFeatureBlock(f))
                          }));

    // create a list of distinct blocks (we don't want to render 
    // the same block more than once)
    this.featureBlocks = Array.from(new Set(blocks));
  }

  /**
   * Shows the tooltip for the specified chromosome and species
   * @param {string} chr - the chromosome that needs the tooltip
   * @param {Species} species - the species the specified chromosome belongs to
   * @param {MouseEvent} event - the hover event we use to get cursor location
   */
  revealTooltip(chr: string, species: Species, event: MouseEvent): void {
    let offsetY = (this.features && this.chrFeatures(chr).length > 0) ?
                  event.offsetY - 75 : event.offsetY - 60;

    this.tooltip.display(this.getTooltipContent(chr, species),
                         event.offsetX - 65, offsetY, species.name);
  }


  // Getter Methods

  /**
   * Returns the chromosome the user chose as well as a list of any features to 
   * render in the block view
   */
  getChromosomeFeaturesToView(): SelectedFeatures {
    let trueChr = this.refChr.chr.replace('ref', '');

    return {
      chr: trueChr,
      features: this.features ? this.chrFeatures(trueChr) : []
    }
  }

  /**
   * Returns a path command for a chromosome band
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {GenomeMap} gMap - the genome map for the specified genome
 *                             (reference or comparison)
   * @param {string} chr - the chromosome the band is for
   * @param {any} genome - the genome of the specified species (dictionary describing chr sizes)
   */
  getChrBandPath(radiiDict: any, gMap: GenomeMap, chr: string, genome: any): string {
    let end = genome[chr];
    let inner = radiiDict.ringInner;
    let outer = radiiDict.ringOuter;
    return this.getBandPathCommand(gMap.bpToCartesian(chr, 0, inner),
                                   gMap.bpToCartesian(chr, end, inner),
                                   gMap.bpToCartesian(chr, 0, outer),
                                   gMap.bpToCartesian(chr, end, outer),
                                   inner,
                                   outer);
  }

  /**
   * Returns a path command for a syntenic block
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {GenomeMap} gMap - the genome map for the specified genome
   *                           (reference or comparison)
   * @param {SyntenyBlock} block - the synteny block to render the band for
   * @param {boolean} comp - the default false flag that indicates if the block
   *                         band is for the inner plot
   */
  getBlockBandPath(radiiDict: any, gMap: GenomeMap,
                   block: SyntenyBlock, comp: boolean = false): string {
    // if the block is located in the inner plot and it has a temporary chr
    // (only the reference chr), use the temp chr
    let chr = (comp && block.tempChr) ? block.tempChr : block.refChr;
    let start = block.refStart;
    let end = block.refEnd;
    let inner = radiiDict.ringInner;
    let outer = radiiDict.ringOuter;

    return this.getBandPathCommand(gMap.bpToCartesian(chr, start, inner),
                                   gMap.bpToCartesian(chr, end, inner),
                                   gMap.bpToCartesian(chr, start, outer),
                                   gMap.bpToCartesian(chr, end, outer),
                                   inner,
                                   outer);
  }

  /**
   * Returns the path command of the reference chromosome for the inner plot
   */
  getInnerRefBlockBandPath(): string {
    return this.getChrBandPath(this.compRadii,
                               this.compGMap,
                               this.refChr.chr,
                               this.tempCompGenome);
  }

  /**
   * Returns a path command for the given syntenic mapping region and radius
   * @param {number} radius - the inner radius of the comparison (inner) ring
   * @param {GenomeMap} gMap - the genome map (NOTE: must be updated with
   *                                the ref chr accessed by 'ref<chr>')
   * @param {SyntenyBlock} block - the syntenic region to render a chord for
   *                               (NOTE: refChr must be in the form 'ref<chr>')
   */
  getChordPath(radius: number, gMap: GenomeMap, block: SyntenyBlock) {
    // get all 4 points of the chord
    let refStart = gMap.bpToCartesian(block.tempChr, block.refStart, radius);
    let refEnd = gMap.bpToCartesian(block.tempChr, block.refEnd, radius);
    let compStart = gMap.bpToCartesian(block.compChr, block.compStart, radius);
    let compEnd = gMap.bpToCartesian(block.compChr, block.compEnd, radius);

    return `M${refStart.x},${refStart.y}
            A205,205 0 0,1 ${refEnd.x},${refEnd.y}
            Q0,0 ${compEnd.x},${compEnd.y}
            A 205,205 0 0,1${compStart.x},${compStart.y}
            Q0,0 ${refStart.x},${refStart.y}Z`;
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   * @param {GenomeMap} gMap - the genome map for the specified genome
   */
  getRefLabelPos(chr: string, gMap: GenomeMap): string {
    let pos = gMap.bpToCartesian(chr,
                                 this.ref.genome[chr] * 0.5,
                                 this.refRadii.labels);

    // a few small manual adjustments for the x and y values as I notice they
    // don't center with the rings as well when not rotated; this is probably
    // due to not rotating them with the bands
    return this.translate(pos.x - 2, pos.y + 4);
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   * @param {GenomeMap} gMap - the genome map for the specified genome
   * @param {boolean} temp - the default false flag indicating whether to use
 *                           the temp genome or the true comp genome dictionary
   */
  getCompLabelPos(chr: string, gMap: GenomeMap, temp: boolean = false): string {
    let genome = temp ? this.tempCompGenome : this.comp.genome;
    let pos = gMap.bpToCartesian(chr,
                                 genome[chr] * 0.5,
                                 this.compRadii.labels);

    // a few small manual adjustments for the x and y values as I notice they
    // don't center with the rings as well when not rotated; this is probably
    // due to not rotating them with the bands
    return this.translate(pos.x - 2, pos.y + 4);
  }

  /**
   * Returns the translation to the center of the plot
   */
  getCenter(): string { return this.translate(this.radius, this.radius) }

  /**
   * Returns array of chromosome for the specified genome
   * @param {any} genome - the genome dictionary of the specified species
   */
  getChromosomes(genome: any): Array<string> { return Object.keys(genome); }

  /**
   * Returns the color for the specified chromosome
   * @param {string} chr - the chromosome to get the color of
   */
  getChrColor(chr: string): string { return this.colors[chr]; }


  // Private Methods

  /**
   * Returns the content for a tooltip for the specified chromosome and species
   * @param {string} chr - the chromosome that needs the tooltip
   * @param {Species} species - the species of the specified chromosome
   */
  private getTooltipContent(chr: string, species: Species): object {
    let data = { 'Chr': chr };
    let hasFeatures = this.features && this.features.length > 0;

    // if tooltip is for reference species and there are features, display
    // the feature symbols in the tooltip
    if(species.taxonID === this.ref.taxonID && hasFeatures) {
      let genes = this.features.filter(f => f.gene && f.chr === chr);
      let qtls = this.features.filter(f => !f.gene && f.chr === chr);

      if(genes.length > 0) data['Genes'] = genes.map(g => g.symbol).join(', ');

      if(qtls.length > 0) data['QTLs'] = qtls.map(qtl => qtl.symbol).join(', ');
    }

    return data;
  }

  /**
   * Returns a path command for the given four specified coordinates (x, y pairs)
   * and the desired radii
   * @param {CartesianCoordinate} inStrt - (if band is positioned horizontally)
 *                                         the bottom left corner of band
   * @param {CartesianCoordinate} inEnd - ("") the bottom right corner of band
   * @param {CartesianCoordinate} outStrt - ("") the top left corner of band
   * @param {CartesianCoordinate} outEnd - ("") the top right corner of band
   * @param {number} inRad - the radius of the inner edge of the band
   * @param {number} outRad - the radius of the outer edge of the band
   */
  private getBandPathCommand(inStrt: CartesianCoordinate,
                             inEnd: CartesianCoordinate,
                             outStrt: CartesianCoordinate,
                             outEnd: CartesianCoordinate,
                             inRad: number, outRad: number): string {
    return `M${inStrt.x},${inStrt.y}
            A${inRad},${inRad} 0 0,1 ${inEnd.x},${inEnd.y}
            L${outEnd.x},${outEnd.y}
            A${outRad},${outRad} 0 0,0 ${outStrt.x},${outStrt.y}Z`;
  }

  /**
   * Returns a translate command in the form of a string to be used in the
   * template for custom translations
   * @param {number} dx - the number of pixels horizontally away from (0, 0),
   *                      the top left of parent container
   * @param {number} dy - the number of pixels vertically away from (0, 0),
   *                      the top left of parent container
   */
  private translate(dx: number, dy: number): string {
    return `translate(${dx}, ${dy})`
  }

  /**
   * Returns the features that are in the specified chromosome
   * @param {string} chr - the chromosome to check
   */
  private chrFeatures(chr: string): Array<Feature> {
    return this.features.filter(f => f.chr === chr);
  }

  /**
   * Resets variables associated with rendering the genome view
   */
  private reset(): void {
    this.ref = null;
    this.comp = null;
    this.refGMap = null;
    this.compGMap = null;
    this.genomeData = null;
    this.refChr = null;
    this.tempCompGenome = null;

    this.features = [];
    this.featureBlocks = [];
  }
}
