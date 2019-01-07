import {Component, ViewChild} from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {BrowserInterval, ComparisonMapping, ComparisonScaling, Metadata, QTLMetadata} from '../classes/interfaces';
import {BrushBehavior, ScaleLinear, ZoomBehavior} from 'd3';
import {Gene} from '../classes/gene';
import {TooltipComponent} from '../tooltip/tooltip.component';
import {SyntenyBlock} from '../classes/synteny-block';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent {
  reference: Species;
  comparison: Species;
  genomeColors: object;
  activeChromosomes: Array<string> = [];
  hoverChr: string = null;

  chromosome: string;
  selectedGenes = {
    reference: [],
    comparison: []
  };
  selectedQTLs: Array<QTLMetadata> = [];
  progress: number = 0;
  zoom: ZoomBehavior<any, any>;
  brush: BrushBehavior<any>;

  width: number = 1200;
  height: number = 520;
  chromosomeViewHeight = 80;
  browserOffset = 175;
  legendOffset = 460;
  trackHeight = 100;
  minimumIntervalSize = 3000;

  interval: BrowserInterval;
  blocks: Array<SyntenyBlock>;
  blockLookup: object = {};
  blockStartPts: object = {};
  blockEndPts: object = {};
  referenceGenes: Array<Gene>;
  comparisonGenes: Array<Gene>;
  staticRefBPToPixels: ScaleLinear<number, number>;
  staticCompBPToPixels: ComparisonScaling = {
    matchOrientation: {},
    trueOrientation: {}
  };
  refBPToPixels: ScaleLinear<number, number>;
  trueOrientation: boolean = false;

  showTooltip: boolean = false;
  tooltipCoords: Array<string> = ['0px', '0px'];
  format: Function = d3.format(',');
  @ViewChild('tooltip') tooltip: TooltipComponent;


  constructor(private http: ApiService) { }

  /**
   * Renders the block view with the specified reference and comparison species, using the specified color dictionary for the
   * genomes, a list of features to highlight on the specified chromosome
   * @param {Species} reference - the reference species
   * @param {Species} comparison - the comparison species
   * @param {object} genomeColors - the genome color dictionary
   * @param {string} chr - the chromosome to get syntenic blocks and features for
   * @param {Array<Metadata>} features - list of selected features to display in red
   */
  render(reference: Species, comparison: Species, genomeColors: object, chr: string, features: Array<Metadata>): void {
    this.reset();

    this.reference = reference;
    this.comparison = comparison;
    this.genomeColors = genomeColors;

    this.chromosome = chr;

    // this one is going to get updated with transformations
    this.refBPToPixels = this.createRefScale(this.getRefChrSize(), this.width);

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.createRefScale(this.getRefChrSize(), this.width);

    // get syntenic block data
    this.getSyntenicBlocks(features);
  }

  /**
   * Resets all of the core variables to make room for a new set of data
   */
  reset(): void {
    this.referenceGenes = null;
    this.comparisonGenes = null;
    this.progress = 0;
    this.blocks = null;
    this.blockStartPts = {};
    this.blockEndPts = {};
    this.refBPToPixels = null;
    this.staticRefBPToPixels = null;
    this.hoverChr = null;
    this.selectedGenes.reference = [];
    this.selectedGenes.comparison = [];
    this.selectedQTLs = [];
    this.staticCompBPToPixels.matchOrientation = {};
    this.staticCompBPToPixels.trueOrientation = {};
    this.activeChromosomes = [];
  }

  /**
   * Returns a list of the reference genes that are in the current browser's view
   */
  getRefGenesInView(): Array<Gene> {
    return this.referenceGenes.filter(gene => gene.isInRefView(this.refBPToPixels, this.width));
  }

  /**
   * Returns a list of the comparison genes that are in the current browser's view
   */
  getCompGenesInView(): Array<Gene> {
    return this.comparisonGenes.filter(gene => gene.isInCompView(this.getScale(gene), this.width, this.trueOrientation));
  }

  /**
   * Returns a comparison location of the start of the interval in view in the browser; if the start of the
   * interval is within a syntenic region, the location is a conversion of the reference location; if the
   * location is outside of a region, the location is the start of the left-most block in view
   */
  getCompStartForInterval(): ComparisonMapping {
    // get the list of end positions of all the blocks and reverse so we start checking from the end of the chromosome
    let endPts = Object.keys(this.blockEndPts).reverse();

    let startBlock: SyntenyBlock;
    // iterate through the end positions and once we find a block end point that is less than the start of the interval,
    // the block we want is the previous block (which in this case is the block to the right, visually, since we reversed
    // the array) and break from the loop
    for(let i = 0; i < endPts.length; i++) {
      if(Number(endPts[i]) < this.interval.start) {
        startBlock = (i > 0) ? this.blockEndPts[endPts[i-1]] : this.blockEndPts[endPts[0]];
        break;
      }
    }

    // if we didn't find a block, assume that the starting block is the first one
    if(!startBlock) startBlock = this.blockEndPts[endPts[endPts.length - 1]];

    // TODO: handle cases where the current interval start and end are in between regions
    // if the start position is inside the region, convert the ref position, else, get the start of the block
    if(this.interval.start <= startBlock.refEnd && this.interval.start >= startBlock.refStart) {
      return {
        chr: startBlock.compChr,
        loc: Math.round(startBlock.getScale(this.trueOrientation)
                 .invert(this.refBPToPixels(this.interval.start)))
      };
    } else {
      return {
        chr: startBlock.compChr,
        loc: startBlock.getStart(this.trueOrientation)
      };
    }
  }

  /**
   * Returns a comparison location of the end of the interval in view in the browser; if the end of the interval
   * is within a syntenic region, the location is a conversion of the reference location; if the location is
   * outside of a region, the location is the end of the right-most block in view
   */
  getCompEndForInterval(): ComparisonMapping {
    // get the list of start positions of all the blocks
    let startPts = Object.keys(this.blockStartPts);

    let endBlock;
    // iterate through the start positions and once we find a block start point that is less than the end of the interval,
    // the block we want is the previous block (which in this case is the block to the left, visually) and break from the loop
    for(let i = 0; i < startPts.length; i++) {
      if(Number(startPts[i]) > this.interval.end) {
        endBlock = (i > 0) ? this.blockStartPts[startPts[i-1]] : this.blockStartPts[startPts[0]];
        break;
      }
    }

    // if we didn't find a block, assume that the starting block is the last one
    if(!endBlock) endBlock = this.blockStartPts[startPts[startPts.length - 1]];

    // TODO: handle cases where the current interval start and end are in between regions
    // if the end position is inside the region, convert the ref position, else, get the end of the block
    if(this.interval.start <= endBlock.refEnd && this.interval.start >= endBlock.refStart) {
      return {
        chr: endBlock.compChr,
        loc: Math.round(endBlock.getScale(this.trueOrientation)
                 .invert(this.refBPToPixels(this.interval.start)))
      };
    } else {
      return {
        chr: endBlock.compChr,
        loc: endBlock.getEnd(this.trueOrientation)
      };
    }
  }

  /**
   * Returns the absolute value of the specified QTL based on the specified scale
   * @param {QTLMetadata} qtl - the specified QTL to calcule the width of
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the width
   * @param {number} defaultSize - the width to use if the scaled width is less than (i.e. 1 or 2 to make the QTL visible)
   */
  getQTLWidth(qtl: QTLMetadata, scale: ScaleLinear<number, number>, defaultSize: number): number {
    return Math.max(defaultSize, Math.abs(scale(qtl.end) - scale(qtl.start)));
  }

  /**
   * Returns the comparison scale matching the block ID of the specified gene
   * @param {Gene} gene - the gene to get the comparison scale for by the block ID of the block it's located in
   */
  getScale(gene: Gene): ScaleLinear<number, number> {
    return this.blockLookup[gene.blockID].getScale(this.trueOrientation);
  }

  /**
   * Returns the comparison scale of the syntenic block the specified gene is located in
   * @param {Gene} gene - the gene to use to get the associated block ID for
   */
  getStaticCompScale(gene: Gene): ScaleLinear<number, number> {
    return this.staticCompBPToPixels[this.trueOrientation ? 'trueOrientation' : 'matchOrientation'][gene.blockID];
  }

  /**
   * Returns true/false if at least 1 QTL or gene is selected
   */
  featuresAreSelected(): boolean {
    return this.selectedQTLs.length > 0 || this.selectedGenes.reference.length > 0;
  }

  /**
   * Returns a translate command in the form of a string to be used in the template for custom translations
   * @param {Array<number>} coords - a two value array where [0] = dx and [1] = dy translations
   */
  translate(coords: Array<number>): string {
    return `translate(${coords[0]}, ${coords[1]})`;
  }

  /**
   * Changes the current browser view the location of the specified feature (gene or QTL) with a margin
   * of 1 Mb on both sides or the chromosome edge, as applicable
   * @param {any} feature - the feature to jump the location to
   */
  jumpTo(feature: any): void {
    this.brushView(Math.max(0, feature.start - 1000000), Math.min(this.getRefChrSize(), feature.end + 1000000));
  }

  /**
   * Zoomes the view in by a total of 30%, assuming the interval width would be at least the minimum
   * interval size; if not, zoom down to the minimum interval size
   */
  zoomIn(): void {
    let basesZoom = this.interval.width * 0.15;

    if(this.interval.width * 0.7 >= this.minimumIntervalSize) {
      this.brushView(this.interval.start + basesZoom, this.interval.end - basesZoom);
    } else {
      let diff = (this.interval.width - this.minimumIntervalSize) / 2;
      this.brushView(this.interval.start + diff, this.interval.end - diff);
    }
  }

  /**
   * Zooms the view out by a total of 30%, assuming boundaries aren't hit yet; if zoom start or
   * end would go above or below chromosome extents, zoom only to the extent on that edge
   */
  zoomOut(): void {
    let basesZoom = this.interval.width * 0.15;

    // if the new width would still be a valid width, check for start and end points
    if(this.interval.width * 1.3 <= this.getRefChrSize()) {
      // if neither edge conflicts with chromosome start or end, zoom out 15% on each end
      if(this.interval.start - basesZoom >= 0 && this.interval.end + basesZoom <= this.getRefChrSize()) {
        this.brushView(this.interval.start - basesZoom, this.interval.end + basesZoom);
      // if only ew start edge of view is a problem, start = chromosome start, increment end
      } else if(this.interval.start - basesZoom < 0) {
        this.brushView(0, this.interval.end + basesZoom);
      // if only new end edge of view is a problem, end = chromosome end, decrement start
      } else if(this.interval.end + basesZoom > this.getRefChrSize()) {
        this.brushView(this.interval.start - basesZoom, this.getRefChrSize());
      }
    } else {
      // get the difference of widths; divide by 2 to get the number for each edge
      let diff = (this.getRefChrSize() - this.interval.width) / 2;

      // if both edges are within the boundaries of the chromosome, zoom out by diff on each edge
      if(this.interval.start - diff >= 0 && this.interval.end + diff <= this.getRefChrSize()) {
        this.brushView(this.interval.start - diff, this.interval.end + diff);
      // if only new start edge of view is a problem, start = chromosome start, increment end by 2 * diff
      } else if(this.interval.start - diff < 0) {
        this.brushView(0, this.interval.end + (2 * diff));
      // if only new end edge of view is a problem, end = chromosome end,decrement start by 2 * diff
      } else if(this.interval.end + diff > this.getRefChrSize()) {
        this.brushView(this.interval.start - (2 * diff), this.getRefChrSize());
      }
    }
  }

  /**
   * Moves the view 15% of the current width to the left without changing the width
   */
  panLeft(): void {
    let basesPan = this.interval.width * 0.15;

    if(this.interval.start - basesPan >= 0) {
      this.brushView(this.interval.start - basesPan, this.interval.end - basesPan);
    } else {
      this.brushView(0, this.interval.end - this.interval.start);
    }
  }

  /**
   * Moves the view 15% of the current width to the right without changing the width
   */
  panRight(): void {
    let basesPan = this.interval.width * 0.15;

    if(this.interval.end + basesPan <= this.getRefChrSize()) {
      this.brushView(this.interval.start + basesPan, this.interval.end + basesPan);
    } else {
      let diff = this.getRefChrSize() - this.interval.end;
      this.brushView(this.interval.start + diff, this.getRefChrSize());
    }
  }

  /**
   * Changes the view (moves the brush, which also zooms the browser) to the specified start and end points
   * @param {number} start - the starting position of the new interval (in bp)
   * @param {number} end - the ending position of the new interval (in bp)
   */
  brushView(start: number, end: number): void {
    d3.select('#chr-view-inv-cover')
      .call(this.brush.move, [this.staticRefBPToPixels(start), this.staticRefBPToPixels(end)]);
  }

  /**
   * Returns the horizontal translation for the legend that is calculated by the number of chromosomes need to be represented
   */
  getLegendXTrans(): number {
    return (this.width - (((this.getCompChromosomes().length - 1) * 35) + 20)) / 2;
  }

  /**
   * Returns true/false if the specified chromosome is in the list of active chromosomes (is represented in block view)
   * @param {string} chr - the chromosome value to be searched for in active chromosomes
   */
  isChrActive(chr: string): boolean { return this.activeChromosomes.indexOf(chr) >= 0; }

  /**
   * Returns the horizontal translation for a specified chromosome label
   * @param {string} chr - the value of the chromosome to get the translation for
   */
  getLegendItemXTrans(chr: string): number { return this.getCompChromosomes().indexOf(chr) * 35; }

  /**
   * Returns the opacity for a chromosome label based on whether it is "active" (represented in the current chromosome)
   * @param {string} chr - the value of the chromosome to get the opacity for
   */
  getLegendItemOpacity(chr: string): number { return (this.isChrActive(chr)) ? 1 : 0.1; }

  /**
   * Returns the vertical translation for a QTL based on its index in the array of QTLs
   * @param {QTLMetadata} qtl - the qtl to calculate the translation for
   */
  getQTLMarkY(qtl: QTLMetadata): number {
    return (this.selectedQTLs.map(qtl => qtl.qtl_symbol).indexOf(qtl.qtl_symbol) * 10) + 20;
  }

  /**
   * Highlights the specified (reference) gene and all of the gene's homologs in the comparison
   * @param {Gene} gene - the comparison gene that needs to have its reference homologs highlighted
   * @param {MouseEvent} event - the mouseover event to get cursor coordinates
   * @param {boolean} metadataOnly - a default false boolean indicating whether the the highlighting
   *                                 is coming from the overview or browser
   */
  highlightRefGene(gene: Gene, event: MouseEvent, metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      gene.highlight();

      // highlight gene's homologs comparison
      this.comparisonGenes.filter(g => g.homologIDs.indexOf(gene.homologIDs[0]) >= 0).forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.revealTooltip(event, 0, 10);
    this.tooltip.display(gene.getTooltipData(), gene.symbol);
  }

  /**
   * Highlights the specified (comparison) gene and all reference homolog genes
   * @param {Gene} gene - the comparison gene that needs to have its reference homologs highlighted
   * @param {MouseEvent} event - the mouseover event to get cursor coordinates
   * @param {boolean} metadataOnly - a default false boolean indicating whether the the highlighting
   *                                 is coming from the overview or browser
   */
  highlightCompGene(gene: Gene, event: MouseEvent, metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      gene.highlight();

      // highlight gene's homologs in the reference
      this.referenceGenes.filter(g => gene.homologIDs.indexOf(g.homologIDs[0]) >= 0).forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.revealTooltip(event, 0, 10);
    this.tooltip.display(gene.getTooltipData(), gene.symbol);
  }

  /**
   * Marks all reference and comparison genes that are currently highlighted as unhighighlighted
   * @param {boolean} metadataOnly - a default false boolean indicating whether the the highlighting
   *                                 is coming from the overview or browser
   */
  unhighlightGene(metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      // remove highlighted status of any genes marked as highlighted
      this.comparisonGenes.filter(gene => gene.highlighted).forEach(gene => gene.unhighlight());
      this.referenceGenes.filter(gene => gene.highlighted).forEach(gene => gene.unhighlight());
    }

    // hide the tooltip for the gene
    this.hideTooltip();
  }

  /**
   * Shows a tooltip for the specified syntenic block if the block is too small to have block coordinates showing
   * @param {SyntenyBlock} block - the syntenic block to potentially highlight
   * @param {MouseEvent} event - the mouseover event to get cursor coordinates
   * @param {boolean} isComp - the default false boolean flag indicating species for tooltip title
   */
  highlightBlock(block: SyntenyBlock, event: MouseEvent, isComp: boolean = false): void {
    // if the block is small enough to not have its block coordinates showing, generate a tooltip
    if(block.getPxWidth() <= 125) {
      this.revealTooltip(event, 0, 40);
      this.tooltip.display(block.getTooltipData(isComp), isComp ? this.comparison.name : this.reference.name)
    }
  }

  /**
   * Shows the tooltip based on the current mouseover location with consideration of manual extra space (dx, dy)
   * @param {MouseEvent} event - the mouseover event to get cursor coordinates
   * @param {number} dx - the manual extra horizontal space to add to the x position of the cursor
   * @param {number} dy - the manual extra vertical space to add to the y position of the cursor
   */
  private revealTooltip(event: MouseEvent, dx: number, dy: number): void {
    this.showTooltip = true;
    this.tooltipCoords = [`${event.offsetX + dx}px`, `${event.offsetY + dy}px`];
  }

  /**
   * Hides the tooltip and clears the content
   */
  hideTooltip(): void {
    this.showTooltip = false;
    this.tooltip.clear();
  }

  /**
   * Shows a tooltip for the specified QTL
   * @param {QTLMetadata} qtl - the qtl to generate the tooltip for
   * @param {MouseEvent} event - the mouseover event to get cursor coordinates
   */
  highlightQTL(qtl: QTLMetadata, event: MouseEvent): void {
    this.revealTooltip(event, 0, 40);
    this.tooltip.display(this.getTooltipQTLData(qtl), qtl.qtl_symbol)
  }

  /**
   * Returns the content for a tooltip for the specified QTL which includes the QTL id, the chromosome it is located
   * in as well as the basepair start and end points
   * @param {QTLMetadata} qtl - the qtl to generate a tooltip for
   */
  private getTooltipQTLData(qtl: QTLMetadata): object {
    return {
      'QTL ID': qtl.qtl_id,
      'chromosome': qtl.chr,
      'Location': `${this.format(qtl.start)}bp - ${this.format(qtl.end)}bp`
    }
  }

  /**
   * Returns a config that will generate ngStyles for the tooltip for when and where it should appear
   */
  getTooltipStyles(): object {
    return {
      left: this.tooltipCoords[0],
      top: this.tooltipCoords[1],
      display: this.showTooltip ? 'initial' : 'none',
    }
  }

  /**
   * Helper method used in this file as well as the template to quickly access the size of the current reference chromosome
   */
  getRefChrSize(): number { return this.reference.genome[this.chromosome]; }

  /**
   * Returns the list of syntenic blocks where orientation between reference and comparison regions do not align
   */
  getNonMatchedBlocks(): Array<SyntenyBlock> { return this.blocks.filter(block => !block.orientationMatches); }

  /**
   * Returns a path command for a vertical line, starting at specified x, with specified length and optional specified y
   * @param {number} x - the x position, from the origin point of the parent element for the vertical line
   * @param {number} length - the desired length of the line
   * @param {number} start - if provided, the y value from the origin point of the parent element for the vertical line
   */
  getVLinePath(x: number, length: number, start: number = null): string {
    return `M${x},${(start) ? start : 0}L${x},${(start) ? length + start : length}Z`;
  }

  /**
   * Returns a path command for a horizontal line, starting at specified y, with specified length and optional specified x
   * @param {number} y - the y position, from the origin point of the parent element for the horizontal line
   * @param {number} length - the desired length of the line
   * @param {number} start - if provided, the x value from the origin point of the parent element for the horizontal line
   */
  getHLinePath(y: number, length: number, start: number = null): string {
    return `M${(start) ? start : 0},${y}L${(start) ? length + start : length},${y}Z`;
  }

  /**
   * Returns the X-like path command for the orientation indicators between the reference and comparison tracks
   * @param {SyntenyBlock} block - the syntenic block to draw orientation indicators for
   */
  getOrientationIndPathCommand(block: SyntenyBlock): string {
    return `M${this.refBPToPixels(block.refStart)},${this.trackHeight}` +
           `L${this.refBPToPixels(block.refEnd)},${this.trackHeight + 30}` +
           `M${this.refBPToPixels(block.refEnd)},${this.trackHeight}` +
           `L${this.refBPToPixels(block.refStart)},${this.trackHeight + 30}Z`;
  }

  /**
   * Returns the list of all chromosome values for the comparison genome
   */
  getCompChromosomes(): Array<string> {
    return Object.keys(this.comparison.genome);
  }

  /**
   * Gets the synteny information and constructs dictionaries with important information for each syntenic region
   * @param {Array<Metadata>} features = list of features for gene coloring
   */
  private getSyntenicBlocks(features: Array<Metadata>): void {
    this.http.getChromosomeSynteny(this.reference.getID(), this.comparison.getID(), this.chromosome)
             .subscribe(blocks => {
               // create list of necessary block data dictionaries
               blocks.forEach(block => {

                 // don't worry about repeats
                 this.activeChromosomes.push(block.compChr);

                 this.blockStartPts[block.refStart] = block;
                 this.blockEndPts[block.refEnd] = block;

                 block.setScales(this.refBPToPixels);
                 block.setColor(this.genomeColors[block.compChr]);
                 this.blockLookup[block.id] = block;

                 this.staticCompBPToPixels.matchOrientation[block.id] = block.compMatchScale;
                 this.staticCompBPToPixels.trueOrientation[block.id] = block.compTrueScale;
               });

               this.blocks = blocks;

               // only update this once because it won't
               this.progress += 0.70;

               // create the chromosome view (static) axis
               d3.select('#chr-view-axis')
                 .call(d3.axisBottom(this.staticRefBPToPixels)
                   .tickValues(this.getAxisTickValues(0, this.reference.genome[this.chromosome]))
                   .tickFormat((d: number) => Math.round(d / 1000000).toString() + " Mb"))
                 .selectAll('text')
                   .attr('text-anchor', (d, i, x) => this.getAxisTickLabelPosition(i, x.length));

               this.getGenes(features);
             });
  }

  /**
   * Gets the genes for the reference chromosome and their homologs within the syntenic regions; forms the list of reference genes,
   * comparison genes, selected features, and generates homolog IDs
   * @param {Array<any>} features - the selected features from the genome view
   */
  private getGenes(features: Array<any>): void {
    this.http.getGenes(this.reference.getID(), this.comparison.getID(), this.chromosome)
             .subscribe(genes => {
               // stores homolog id arrays by comparison gene symbol
               let homIDs = {};

               // comparison genes; updated every time a reference gene has new/distinct homologs
               let compGenes = [];

               // add a homolog id to all of the reference genes
               this.referenceGenes = genes.map((gene, i) => {
                 // if there are homologs, figure out homolog ID information and add to compGenes if new
                 if(gene.homologs.length !== 0) {
                   // for each of the homologs, if the homolog's gene_symbol already has a key/value pair in the
                   // homolog lookup, push the reference gene homolog ID to that value list. If the homolog's
                   // gene symbol isn't there, make a new key/value pair for the homolog and push the homolog
                   // to the compGenes array
                   gene.homologs.forEach(hom => {
                     if(homIDs[hom.gene_symbol]) {
                       homIDs[hom.gene_symbol].push(i);
                     } else {
                       homIDs[hom.gene_symbol] = [i];
                       compGenes.push(hom);
                     }
                   });

                   let featureSymbols = features.map(feature => feature.gene_symbol);
                   if(featureSymbols.indexOf(gene.gene_symbol) >= 0) {
                     gene.homologs.forEach(hom => {
                       hom.sel = true; // temporary flag
                     });
                     return new Gene(gene, [i], true, this.trackHeight);
                   }

                   return new Gene(gene, [i], false, this.trackHeight);
                 } else {
                   let featureSymbols = features.map(feature => feature.gene_symbol);

                   return new Gene(gene, [], featureSymbols.indexOf(gene.gene_symbol) >= 0, this.trackHeight);
                 }
               });

               // create a list of comparison genes from the temp compGenes array, add the list of homolog IDs for each, as found from
               // homLookup, and add block ID for genes in a syntenic region, then filter that list to only genes that have a block ID
               this.comparisonGenes = compGenes.map(gene => {
                 return new Gene(gene, homIDs[gene.gene_symbol], gene.sel, this.trackHeight, this.blocks);
               }).filter(gene => gene.isSyntenic());

               // get selected features
               this.selectedGenes.reference = this.referenceGenes.filter(gene => gene.selected);
               this.selectedGenes.comparison = this.comparisonGenes.filter(gene => gene.selected);
               this.selectedQTLs = features.filter(feature => feature.qtl_id);

               // set interval to roughly 5Mb with the first reference feature centered if features are selected,
               // otherwise set interval to entire chr
               (this.selectedGenes.reference.length > 0) ?
                 this.setInterval(Math.max(0, this.selectedGenes.reference[0].start - 2500000),
                                  Math.min(this.getRefChrSize(), this.selectedGenes.reference[0].end + 2500000)) :
                 this.setInterval(0, this.getRefChrSize());

               // set the zoom, brush and dynamic axis behaviors/interactions
               this.bindBrowserBehaviors();
             });
  }

  /**
   * Sets the brush and zoom behaviors as well as draws the dynamic axis above the reference track
   */
  private bindBrowserBehaviors(): void {
    let chrSize = this.getRefChrSize();

    // create an axis using the dynamic scale with more precise tick labels in Mb
    let browserAxis = d3.axisTop(this.refBPToPixels)
                        .tickSizeOuter(0)
                        .tickFormat((d: number) => (d / 1000000).toString() + " Mb");

    /*
    CREDIT: I would not have been able to get these behaviors so clean and concise without dear Mike Bostock's example,
            found here: https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172. All hail Mike Bostock!
    NOTE: I've been making a large effort to keep separate variables to a minimum, but it's worth mentioning for any
          future devs that keeping these zoom and brush variables are in our best interest to keep these separate
          as you are able to use 'this'. I found that if I did something like d3.select('#browser').call(d3.zoom()...),
          I would have to set a 'let that = this' and then have to send 'that' to any methods called from inside the
          .on() which involved adding an extra optional parameter to all of them. I also noticed a a bug where the
          zoom function would have reset transformation values after brushing. I'm not seeing the aforementioned bug
          using this way of format, so change at your own risk!

          ~ A.L.
     */
    this.brush = d3.brushX()
                  .extent([[0, 10], [this.width, this.chromosomeViewHeight - 4]])
                  .on('brush', () => {
                    // ignore brush via zoom occurrences
                    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;

                    let s: Array<number> = d3.event.selection;

                    // adjust refBPToPixels by scaling start, s[0], and end, s[1], with static scale (used for chromosome view)
                    this.refBPToPixels.domain(s.map(this.staticRefBPToPixels.invert, this.staticRefBPToPixels));

                    // update the comparison scale dictionaries that use refBPToPixels to use new ref scale
                    this.blocks.forEach(block => block.setScales(this.refBPToPixels));

                    // zoom the browser to same section
                    d3.select('#browser')
                      .call(this.zoom.transform, d3.zoomIdentity.scale(this.width / (s[1] - s[0])).translate(-s[0], 0));

                    this.setInterval(this.staticRefBPToPixels.invert(s[0]), this.staticRefBPToPixels.invert(s[1]));

                    // update the axis above the reference track
                    d3.select('#browser-axis').call(browserAxis).select('text').attr('text-anchor', 'start');
                  });

    this.zoom = d3.zoom()
                 .scaleExtent([1, (chrSize / this.minimumIntervalSize)])
                 .translateExtent([[0, 0], [this.width, this.height]])
                 .extent([[0, 0], [this.width, this.height]])
                 .on('zoom', () => {
                   // ignore zoom via brush occurrences
                   if(d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;

                   let t = d3.event.transform;

                   // adjust the refBPToPixels using a t's rescaled x on the static scale (used for chromosome view)
                   this.refBPToPixels.domain(t.rescaleX(this.staticRefBPToPixels).domain());

                   // update the comparison scale dictionaries that use refBPToPixels to use new ref scale
                   this.blocks.forEach(block => block.setScales(this.refBPToPixels));

                   // get the start and end pixel and bp points of the current interval
                   let pxExtents: Array<number> = this.refBPToPixels.range().map(t.invertX, t);
                   let bpExtents: Array<number> = this.refBPToPixels.domain();

                   // move the brush in the chromosome view to match
                   d3.select('#chr-view-inv-cover').call(this.brush.move, pxExtents);

                   // update the interval values
                   this.setInterval(bpExtents[0], bpExtents[1]);

                   // update the axis above the reference track
                   d3.select('#browser-axis').call(browserAxis).select('text').attr('text-anchor', 'start');
                 });

    // bind the zoom behavior
    d3.select('#browser')
      .call(this.zoom);

    // bind the brush behavior and set the brush to match the current interval (either the entire chr or the focused section)
    d3.select('#chr-view-inv-cover')
      .call(this.brush)
      .call(this.brush.move, [this.staticRefBPToPixels(this.interval.start), this.staticRefBPToPixels(this.interval.end)]);
  }

  /**
   * Returns a linear scale that will convert a genomic location or distance to pixels (or the other way around if inverted)
   * @param {number} BPwidth - the size of the current reference chromosome
   * @param {number} pixelWidth - the width of the SVG we're translating the chromosome to
   */
  private createRefScale(BPwidth: number, pixelWidth: number): ScaleLinear<number, number> {
    // set the range max to 'width - 1' to keep the last tick line of axes from hiding on the right side of the svg
    return d3.scaleLinear().domain([0, BPwidth]).range([0, pixelWidth - 1]);
  }

  /**
   * Assigns the three reference interval-associated variables based on specified start and end numeric values as well
   * as the comparison start and end positions
   * @param {number} start - the starting value (bp) of the interval
   * @param {number} end - the end value (bp) of the interval
   */
  private setInterval(start: number, end: number): void {
    this.interval = {
      start: Math.round(start),
      end: Math.round(end),
      width: Math.round(end - start)
    };
    this.interval.compStart = this.getCompStartForInterval();
    this.interval.compEnd = this.getCompEndForInterval();
  }

  /**
   * Takes a chromosome value/name and generates a list of 11 values including 0 and the last BP of the chromosome where
   * the other 9 values are equally spaced locations for tick values on the chromosome view axis
   * @param {number} start - the starting point to start generating tick values for
   * @param {number} end - the ending point to start generating tick values for
   */
  private getAxisTickValues(start: number, end: number): Array<number> {
    let values = [];

    // add all but the last interval values to the list
    // total - 2 ensures the final tick isn't added by rounding error
    for(let i = start; i < end - 2; i += (end - start) / 10) {
      values.push(Math.round(i));
    }

    values.push(end);

    return values;
  }

  /**
   * This is a quick method that basically just generates anchor position to assign to each tick mark. All tick marks
   * minus the first and last should have their labels centered whereas the first label should appear to the right of
   * its tick mark and the last label should appear to the left of its tick mark so as both will be completely visible
   * @param {number} index - the index of the tick we're checking
   * @param {number} listLength - the length of the list of ticks
   */
  private getAxisTickLabelPosition(index: number, listLength: number): string {
    if(index === 0) { // if it's the first tick label:
      return 'start';
    } else if(index === listLength - 1) { // if it's the last tick label (we know the list is 11 elements long)
      return 'end';
    } else { // otherwise, use default value
      return 'middle';
    }
  }
}
