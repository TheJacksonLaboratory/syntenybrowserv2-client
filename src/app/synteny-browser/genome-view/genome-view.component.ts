import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Feature } from '../classes/feature';
import { CartesianCoordinate, CircularGenomeMap } from '../classes/circular-genome-map';
import { Species } from '../classes/species';
import { SyntenyBlock } from '../classes/synteny-block';
import { DownloadService } from '../services/download.service';
import { DataStorageService } from '../services/data-storage.service';

@Component({
  selector: 'genome-view',
  templateUrl: './genome-view.component.html',
  styleUrls: ['./genome-view.component.scss'],
})
export class GenomeViewComponent implements OnInit {
  // currently selected reference species
  ref: Species;

  // currently selected comparison species
  comp: Species;

  // genome map used to draw the outer ring of the plot
  refGMap: CircularGenomeMap;

  // genome map used to draw the inner ring of the plot
  compGMap: CircularGenomeMap;

  // dictionary that adds an extra spot for a selected reference chromosome
  tempCompGenome: object;

  // width of the SVG
  width = 500;

  // height of the SVG
  height = 510;

  // thickness of the circular bands
  bandThickness: number;

  // radius data for reference band inner and outer edges and labels
  refRadii: RadiiDictionary;

  // radius data for comparison band inner and outer edges and labels
  compRadii: RadiiDictionary;

  // radius data for blocks containing selected features sticking out from ref band
  featureRadii: RadiiDictionary;

  // currently selected reference chromosome (if any)
  refChr: ReferenceChr;

  // list of all currently selected features to view in the plot
  features: Feature[];

  // list of currently selected features that do no occur in a syntenic region
  featuresNoBlocks: Feature[];

  // list of syntenic blocks that contain at least one selected feature
  featureBlocks: SyntenyBlock[];

  // data to display in a tooltip
  tooltipContent: any = null;

  // user-entered name they want their downloaded image saved as
  downloadFilename = '';

  // controls if the download dialog for the user to enter a filename is visible
  filenameModalOpen = false;

  // emits when user overs over a reference chromosome that contains selected features to highlight
  @Output() highlightFeatures: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private data: DataStorageService,
    private http: ApiService,
    private downloader: DownloadService,
  ) {}

  ngOnInit(): void {
    this.setDimensions(0.75, 0.5, 21);
  }

  /**
   * Renders a genome view for the current reference and comparison species
   */
  render(): void {
    this.reset();

    this.ref = this.data.refSpecies;
    this.comp = this.data.compSpecies;

    const refID = this.ref.getID();
    const compID = this.comp.getID();

    // get genome-wide syntenic blocks from API
    this.http.getGenomeSynteny(refID, compID).subscribe(blocks => {
      this.refGMap = new CircularGenomeMap(this.ref.genome);
      this.compGMap = new CircularGenomeMap(this.comp.genome);

      const genomicBlocks = blocks.filter(b => b.compChr !== 'MT' && b.refChr !== 'MT');

      // set the color for each block
      genomicBlocks.forEach(b => b.setColor(this.data.genomeColorMap[b.compChr]));
      this.data.genomeData = genomicBlocks;
    });
  }

  /**
   * Triggers a download of the current view in the block view browser
   */
  download(): void {
    this.downloader.downloadSVG('genome-view-svg', this.downloadFilename);
    this.filenameModalOpen = false;
    this.downloadFilename = '';
  }

  /**
   * Renders chord mapping of syntenic blocks for an entire selected chromosome
   * @param {string} chr - the selected chromosome
   */
  renderChordMapForChr(chr: string): void {
    // get the blocks that should be shown in the comparison plot's ref chromosome
    const featureBlocks = this.featureBlocks ? this.data.getChrBlocks(chr, this.featureBlocks) : [];
    const blocks = featureBlocks.length ? featureBlocks : this.data.getChrBlocks(chr);
    // TODO: If it's more accurate to not show ANY blocks to map if only
    //  non-syntenic features are in that chr, use the below blocks const instead
    //  of the above
    // const blocks = featureBlocks.length || this.getChrFeatures(chr).length ?
    //   featureBlocks : this.data.getChrBlocks(chr);

    // get the index of the selected chromosome
    const chrIndex = this.ref.getChromosomes().indexOf(chr);

    this.setTempCompGenome(chr);

    // calculate the number of radians to rotate the new comp genome
    const radsToRotate = this.refGMap.getChrRadianStart(chrIndex + 1);
    this.compGMap = new CircularGenomeMap(this.tempCompGenome, radsToRotate);

    // set the reference chromosome
    this.refChr = {
      chr: `ref${chr}`,
      size: this.ref.genome[chr],
      blocks: blocks.map(b => b.markAsSelected()),
    };
  }

  /**
   * Updates the list of features to display in the circos plot
   * @param {Feature[]} features - the current list of features to display
   */
  updateFeatures(features: Feature[]): void {
    this.features = features;

    // if there are features selected, scale the visualization down to fit the
    // legends and text; if selected features are removed, scale it back up
    this.features.length ? this.setDimensions(0.62, 0.4, 18) : this.setDimensions(0.75, 0.5, 21);

    const blocks = this.data.getFeatureBlocks(features);

    this.featuresNoBlocks = features.filter(f => this.data.isFeatureNonSyntenic(f));

    // create a list of distinct blocks (we don't want to render
    // the same block more than once)
    this.featureBlocks = Array.from(new Set(blocks));
  }

  /**
   * Hides the tooltip content as well as clears the highlighted features in
   * the feature selection
   */
  hideTooltip(): void {
    this.tooltipContent = null;
    this.highlightFeatures.emit([]);
  }

  /**
   * Stores the chromosome the user chose as well as a list of any features to
   * render in the block view
   */
  setChromosomeFeaturesToView(): void {
    const trueChr = this.refChr.chr.replace('ref', '');

    this.data.features = {
      chr: trueChr,
      features: this.features ? this.getChrFeatures(trueChr) : [],
    };
  }

  /**
   * Returns a path command for a chromosome band
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {CircularGenomeMap} gMap - the genome map for the specified genome
   *                                   (reference or comparison)
   * @param {string} chr - the chromosome the band is for
   * @param {any} genome - the genome of the specified species (dictionary
   *                       describing chr sizes)
   */
  getChrBandPath(radiiDict: any, gMap: CircularGenomeMap, chr: string, genome: any): string {
    const end = genome[chr];
    const inner = radiiDict.ringInner;
    const outer = radiiDict.ringOuter;

    return this.getBandPathCommand(
      gMap.bpToCartesian(chr, 0, inner),
      gMap.bpToCartesian(chr, end, inner),
      gMap.bpToCartesian(chr, 0, outer),
      gMap.bpToCartesian(chr, end, outer),
      inner,
      outer,
    );
  }

  /**
   * Returns the path command for the legend chromosome lines for the specified
   * chromosome
   * @param {string} chr - the chromosome to get the legend path command for
   */
  getLegendPath(chr: string): string {
    const end = this.ref.genome[chr];
    const inner = this.refRadii.ringOuter;
    const outer = this.refRadii.labels;
    const getCoords = (c, bp, rad): CartesianCoordinate => this.refGMap.bpToCartesian(c, bp, rad);

    const inStrt = getCoords(chr, 0, inner);
    const inEnd = getCoords(chr, end, inner);
    const outStrt = getCoords(chr, 0, outer);
    const outEnd = getCoords(chr, end, outer);
    const cntrIn = getCoords(chr, end * 0.5, outer);
    const cntrOut = getCoords(chr, end * 0.5, outer + this.bandThickness / 2);
    const vLineLength = Math.abs(cntrOut.x) < 50 ? 5 : 10;
    const vLine = cntrOut.y < 0 ? cntrOut.y - vLineLength : cntrOut.y + vLineLength;

    return (
      `M${inStrt.x},${inStrt.y}` +
      `L${outStrt.x},${outStrt.y}` +
      `A${outer},${outer} 0 0,1 ${outEnd.x},${outEnd.y}` +
      `L${inEnd.x},${inEnd.y}` +
      `M${cntrIn.x},${cntrIn.y} L${cntrOut.x},${cntrOut.y} V${vLine}`
    );
  }

  /**
   * Returns a path command for a syntenic block
   * @param {any} radiiDict - the radius dictionary of the specified genome
   * @param {CircularGenomeMap} gMap - the genome map for the specified genome
   *                            (reference or comparison)
   * @param {SyntenyBlock} block - the synteny block to render the band for
   */
  getBlockBandPath(radiiDict: any, gMap: CircularGenomeMap, block: SyntenyBlock): string {
    // if the block is located in the inner plot and it has a temporary chr
    // (only the reference chr), use the temp chr
    const chr = block.refChr;
    const start = block.refStart;
    const end = block.refEnd;
    const inner = radiiDict.ringInner;
    const outer = radiiDict.ringOuter;

    return this.getBandPathCommand(
      gMap.bpToCartesian(chr, start, inner),
      gMap.bpToCartesian(chr, end, inner),
      gMap.bpToCartesian(chr, start, outer),
      gMap.bpToCartesian(chr, end, outer),
      inner,
      outer,
    );
  }

  /**
   * Returns the path command of the reference chromosome for the inner plot
   */
  getInnerRefBlockBandPath(): string {
    return this.getChrBandPath(this.compRadii, this.compGMap, this.refChr.chr, this.tempCompGenome);
  }

  /**
   * Returns a path command for the given syntenic mapping region and radius
   * @param {CircularGenomeMap} gMap - the genome map (NOTE: must be updated with
   *                                   the ref chr accessed by 'ref<chr>')
   * @param {SyntenyBlock} block - the syntenic region to render a chord for
   *                               (NOTE: refChr must be in the form 'ref<chr>')
   */
  getChordPath(gMap: CircularGenomeMap, block: SyntenyBlock): string {
    // get all 4 points of the chord
    const startRad = this.refRadii.ringInner;
    const endRad = this.compRadii.ringInner;
    const refStart = this.refGMap.bpToCartesian(block.refChr, block.refStart, startRad);
    const refEnd = this.refGMap.bpToCartesian(block.refChr, block.refEnd, startRad);
    const compStart = gMap.bpToCartesian(block.compChr, block.compStart, endRad);
    const compEnd = gMap.bpToCartesian(block.compChr, block.compEnd, endRad);

    return (
      `M${refStart.x},${refStart.y}` +
      `A205,205 0 0,1 ${refEnd.x},${refEnd.y}` +
      `Q0,0 ${compEnd.x},${compEnd.y}` +
      `A 205,205 0 0,1${compStart.x},${compStart.y}` +
      `Q0,0 ${refStart.x},${refStart.y}Z`
    );
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   * @param {CircularGenomeMap} gMap - the genome map for the specified genome
   */
  getRefLabelPos(chr: string, gMap: CircularGenomeMap): string {
    const pos = gMap.bpToCartesian(chr, this.ref.genome[chr] * 0.5, this.refRadii.labels);

    // a few small manual adjustments for the x and y values as I notice they
    // don't center with the rings as well when not rotated; this is probably
    // due to not rotating them with the bands
    const adj = {
      x: pos.x < 0 ? 1 : -1,
      y: pos.y < 0 ? 4 : 3,
    };
    return this.translate(pos.x + adj.x, pos.y + adj.y);
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   * @param {CircularGenomeMap} gMap - the genome map for the specified genome
   * @param {boolean} temp - the default false flag indicating whether to use
   *                         the temp genome or the true comp genome dictionary
   */
  getCompLabelPos(chr: string, gMap: CircularGenomeMap, temp = false): string {
    const genome = temp ? this.tempCompGenome : this.comp.genome;
    const pos = gMap.bpToCartesian(chr, genome[chr] * 0.5, this.compRadii.labels);

    // a few small manual adjustments for the x and y values as I notice they
    // don't center with the rings as well when not rotated; this is probably
    // due to not rotating them with the bands
    const adj = {
      x: pos.x < 0 ? 0 : -1,
      y: pos.y < 0 ? 4 : 3,
    };
    return this.translate(pos.x + adj.x, pos.y + adj.y);
  }

  /**
   * Returns the translation to the center of the plot
   */
  getCenter(): string {
    return this.translate(this.width * 0.5, this.height * 0.5);
  }

  /**
   * Returns the color for the specified chromosome
   * @param {string} chr - the chromosome to get the color of
   */
  getChrColor(chr: string): string {
    return this.data.genomeColorMap[chr];
  }

  /**
   * Returns the content for a tooltip for the specified chromosome and species
   * @param {Species} species - the species of the specified chromosome
   * @param {string} chr - the chromosome that needs the tooltip
   */
  getTooltipContent(species: Species, chr: string = null): void {
    this.tooltipContent = {
      title: species.name,
      chr,
    };

    const chrFeatures = this.getChrFeatures(chr);
    const hasFeatures = this.features && chrFeatures.length;

    // if tooltip is for reference species and there are features, display
    // the feature symbols in the tooltip
    if (species.taxonID === this.ref.taxonID && hasFeatures) {
      const genes = chrFeatures.filter(f => f.isGene).map(g => g.id);
      const qtls = chrFeatures.filter(f => !f.isGene).map(qtl => qtl.id);
      const features = [];

      if (genes.length) features.push(...genes);
      if (qtls.length) features.push(...qtls);

      this.highlightFeatures.emit(features);
    } else {
      this.highlightFeatures.emit([]);
    }
  }

  /**
   * Returns the features that are in the specified chromosome
   * @param {string} chr - the chromosome to check
   */
  getChrFeatures(chr: string): Feature[] {
    return this.features.filter(f => f.chr === chr);
  }

  /**
   * Returns the chromosomes that currently contain selected features
   */
  getChrsWithFeatures(): string[] {
    return this.ref.getChromosomes().filter(c => this.getChrFeatures(c).length);
  }

  /**
   * Returns the x, y transform string for the list of selected features in the
   * specified chromosome with small adjustments depending on position in the SVG
   * @param {string} chr - the chromosome to get the list position for
   */
  getLegendListPosition(chr: string): string {
    const pos = this.getRawLegendListPos(chr);
    let x = pos[0];
    let y = pos[1];

    // if the position is above the vertical center of the SVG, move the list
    // position a little further up for padding purposes; if the position is
    // below the vertical center, move the position down the height of the first
    // line of the list
    if (y !== 0) {
      y = y < 0 ? y - 2 : y + 8;
    }

    // if the position is close to the left edge of the SVG, move the list a
    // couple pixels to the right and vice versa on the right edge of the SVG to
    // allow as much room as possible
    if (Math.abs(x) > 100) {
      x = x > 0 ? x - 8 : x + 5;
    }

    return this.translate(x, y);
  }

  /**
   * Returns the x, y (but the y-position is the only one that matters in this
   * case) transform string for the list item in the specified chromosome at the
   * specified index
   * @param {string} chr - the chromosome the list item belongs to
   * @param {number} index - the index in the list of features
   */
  getLegendListItemPosition(chr: string, index: number): string {
    let y = this.getRawLegendListPos(chr)[1];

    if (y !== 0) {
      y = y < 0 ? -(8 * index) : 8 * index;
    }

    return this.translate(0, y);
  }

  /**
   * Returns the text-anchor attribute for the list of the specified chromosome,
   * depending on the x-position of the list; if the list is within the center
   * 200px of the SVG, center the text, otherwise, have it left-aligned for the
   * right side of the SVG and right-aligned for the left side
   * @param {string} chr - the chromosome to get the text alignment for
   */
  getLegendListAlign(chr: string): string {
    const x = this.getRawLegendListPos(chr)[0];

    if (Math.abs(x) > 100) {
      return x > 0 ? 'start' : 'end';
    }

    return 'middle';
  }

  /**
   * Returns the list of synteny blocks in the reference genome
   */
  getGenomeBlocks(): SyntenyBlock[] {
    return this.data.genomeData;
  }

  /**
   * Returns a translate command in the form of a string to be used in the
   * template for custom translations
   * @param {number} dx - the number of pixels horizontally away from (0, 0),
   *                      the top left of parent container
   * @param {number} dy - the number of pixels vertically away from (0, 0),
   *                      the top left of parent container
   */
  translate(dx: number, dy: number): string {
    return `translate(${dx}, ${dy})`;
  }

  /**
   * Resets variables associated with rendering the genome view
   */
  reset(): void {
    this.ref = null;
    this.comp = null;
    this.refGMap = null;
    this.compGMap = null;
    this.data.genomeData = null;
    this.refChr = null;
    this.tempCompGenome = null;
    this.setDimensions(0.75, 0.5, 21);

    this.features = [];
    this.featureBlocks = [];
    this.featuresNoBlocks = [];
  }

  /**
   * Returns a path command for the given four specified coordinates (x, y pairs)
   * and the desired radii
   * @param {CartesianCoordinate} inStrt - (if band is positioned horizontally)
   *                                       the bottom left corner of band
   * @param {CartesianCoordinate} inEnd - ("") the bottom right corner of band
   * @param {CartesianCoordinate} outStrt - ("") the top left corner of band
   * @param {CartesianCoordinate} outEnd - ("") the top right corner of band
   * @param {number} inRad - the radius of the inner edge of the band
   * @param {number} outRad - the radius of the outer edge of the band
   */
  private getBandPathCommand(
    inStrt: CartesianCoordinate,
    inEnd: CartesianCoordinate,
    outStrt: CartesianCoordinate,
    outEnd: CartesianCoordinate,
    inRad: number,
    outRad: number,
  ): string {
    return (
      `M${inStrt.x},${inStrt.y}` +
      `A${inRad},${inRad} 0 0,1 ${inEnd.x},${inEnd.y}` +
      `L${outEnd.x},${outEnd.y}` +
      `A${outRad},${outRad} 0 0,0 ${outStrt.x},${outStrt.y}Z`
    );
  }

  /**
   * Returns the end coordinates of the legend path for the specified chromosome
   * in order to properly place the associated feature list
   * @param {string} chr - the chromosome to get the position for
   */
  private getRawLegendListPos(chr: string): number[] {
    // reduce the path command to a list of comma-separated coordinates
    const commands = this.getLegendPath(chr)
      .replace(/[^\d.,-/\s]/g, '')
      .split(' ');

    const len = commands.length;
    return [Number(commands[len - 2].split(',')[0]), Number(commands[len - 1])];
  }

  /**
   * Sets the temporary comparison genome to include the selected reference
   * chromosome with a size adjusted to be measured in radians, converted to bp
   * @param {string} chr - the selected reference chromosome
   */
  private setTempCompGenome(chr: string): void {
    // copy the comp genome object (we don't want to alter the original)
    const tempComp = { ...this.comp.genome };

    // get the radians the selected chromosome takes in the reference plot and
    // scale it to the comparison using the current comparison's radsToBP
    // conversion value
    tempComp[`ref${chr}`] = this.refGMap.getRadiansOfChromosome(chr) * this.compGMap.radsToBP;

    // since the last measurement will be slightly off because the current
    // comparison's "genome" doesn't include the selected chromosome, make a temp
    // genome map for the comparison chromosome with the selected reference
    // chromosome to get the genome map's radsToBP conversion value to size the
    // reference chromosome
    tempComp[`ref${chr}`] =
      this.refGMap.getRadiansOfChromosome(chr) * new CircularGenomeMap(tempComp).radsToBP;

    this.tempCompGenome = tempComp;
  }

  /**
   * Sets dimensions for rendering the genome view including radii for
   * reference ring, comparison ring, and feature information
   * @param {number} refMulti - radius multiplier for the reference ring elements
   * @param {number} compMulti - radius multiplier for the comparison ring elements
   * @param {number} bandWidth - thickness of the chromosome bands in both rings
   * @private
   */
  private setDimensions(refMulti: number, compMulti: number, bandWidth: number): void {
    this.bandThickness = bandWidth;

    // generate a radii dictionary to help with rendering the reference plot
    const radius = this.width * 0.5;
    const refRadius = Math.round(radius * refMulti);
    const compRadius = Math.round(radius * compMulti);

    this.refRadii = {
      ringInner: refRadius,
      ringOuter: refRadius + bandWidth,
      labels: refRadius + bandWidth + 10,
    };

    // generate a radii dictionary for feature blocks
    this.featureRadii = {
      ringInner: this.refRadii.ringInner - bandWidth * 0.75,
      ringOuter: this.refRadii.ringInner,
    };

    // generate a radii dictionary to help with rendering the comparison plot
    this.compRadii = {
      ringInner: compRadius,
      ringOuter: compRadius + bandWidth,
      labels: compRadius + bandWidth + 10,
    };
  }
}

export interface ReferenceChr {
  chr: string;
  size: number;
  blocks: SyntenyBlock[];
}

export interface RadiiDictionary {
  ringInner: number;
  ringOuter: number;
  labels?: number;
}
