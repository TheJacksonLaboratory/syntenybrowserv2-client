import {Component, ViewChild} from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {ComparisonScaling, Metadata, QTLMetadata} from '../classes/interfaces';
import {BrushBehavior, ScaleLinear, ZoomBehavior} from 'd3';
import {Gene} from '../classes/gene';
import {TooltipComponent} from '../tooltip/tooltip.component';
import {SyntenyBlock} from '../classes/synteny-block';
import {QTL} from '../classes/qtl';
import {Legend} from '../classes/legend';
import {BrowserInterval} from '../classes/browser-interval';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent {
  @ViewChild('tooltip') tooltip: TooltipComponent;

  reference: Species;
  comparison: Species;
  legend: Legend;
  chromosome: string;

  selectedRefGenes: Array<Gene> = [];
  selectedCompGenes: Array<Gene> = [];
  selectedQTLs: Array<QTL> = [];

  progress: number = 0;
  zoom: ZoomBehavior<any, any>;
  brush: BrushBehavior<any>;

  width: number = 1200;
  height: number = 520;
  chromosomeViewHeight = 80;
  browserOffset = 175;
  trackHeight = 100;
  minimumIntervalSize = 3000;

  interval: BrowserInterval;
  blocks: Array<SyntenyBlock>;
  blockLookup: object = {};
  blockStartPts: object = {};
  blockEndPts: object = {};
  refGenes: Array<Gene>;
  compGenes: Array<Gene>;
  staticRefBPToPixels: ScaleLinear<number, number>;
  staticCompBPToPixels: ComparisonScaling = {
    match: {},
    true: {}
  };
  refBPToPixels: ScaleLinear<number, number>;
  trueOrientation: boolean = false;

  constructor(private http: ApiService) { }


  // Operational Methods

  /**
   * Renders the block view with the specified reference and comparison species,
   * using the specified color dictionary for the genomes, a list of features to
   * highlight on the specified chromosome
   * @param {Species} reference - the reference species
   * @param {Species} comparison - the comparison species
   * @param {object} colors - the genome color dictionary
   * @param {string} chr - the chromosome to get syntenic blocks and features for
   * @param {Array<Metadata>} features - list of selected features to display
   */
  render(reference: Species, comparison: Species, colors: object,
         chr: string, features: Array<Metadata>): void {
    this.reset();

    this.reference = reference;
    this.comparison = comparison;

    this.chromosome = chr;

    // this one is going to get updated with transformations
    this.refBPToPixels = this.getRefScale(this.getRefChrSize());

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.getRefScale(this.getRefChrSize());

    // get syntenic block data
    this.getSyntenicBlocks(features, colors);
  }

  /**
   * Returns a translate command in the form of a string to be used in the
   * template for custom translations
   * @param {Array<number>} coords - a two value array where [0] = dx and
   *                                [1] = dy translations
   */
  translate(coords: Array<number>): string {
    return `translate(${coords[0]}, ${coords[1]})`;
  }

  /**
   * Changes the current browser view the location of the specified feature
   * (gene or QTL) with a margin of 1 Mb on both sides, if possible
   * @param {any} feature - the feature to jump the location to
   */
  jumpTo(feature: any): void {
    this.brushView(Math.max(0, feature.start - 1000000),
                   Math.min(this.getRefChrSize(), feature.end + 1000000)
                  );
  }

  /**
   * Zooms the view in by a total of 30%, if the interval width would be at least
   * the minimum interval size; if not, zoom down to the minimum interval size
   */
  zoomIn(): void {
    let basesZoom = this.interval.width * 0.15;
    let intStart = this.interval.refStart;
    let intEnd = this.interval.refEnd;

    if(this.interval.width * 0.7 >= this.minimumIntervalSize) {
      this.brushView(intStart + basesZoom, intEnd - basesZoom);
    } else {
      let diff = (this.interval.width - this.minimumIntervalSize) / 2;
      this.brushView(intStart + diff, intEnd - diff);
    }
  }

  /**
   * Zooms the view out by a total of 30%, if chromosome boundaries aren't hit;
   * if zoom edges would go outside chromosome extents, zoom only to that extent
   */
  zoomOut(): void {
    let basesZoom = this.interval.width * 0.15;
    let intStart = this.interval.refStart;
    let intEnd = this.interval.refEnd;
    let chrEnd = this.getRefChrSize();

    // if the new width would still be a valid width, check for start and end points
    if(this.interval.width * 1.3 <= chrEnd) {
      // if both edges are inside chromosome start or end, zoom out 15% on each end
      if(intStart - basesZoom >= 0 && intEnd + basesZoom <= chrEnd) {
        this.brushView(intStart - basesZoom, intEnd + basesZoom);
        // if only new start edge of view is a problem,
        // set start to chromosome start and increment end
      } else if(intStart - basesZoom < 0) {
        this.brushView(0, intEnd + basesZoom);
        // if only new end edge of view is a problem,
        // set end to chromosome end and decrement start
      } else if(intEnd + basesZoom > chrEnd) {
        this.brushView(intStart - basesZoom, chrEnd);
      }
    } else {
      // get the difference of widths; divide by 2 to get the number for each edge
      let diff = (chrEnd - this.interval.width) / 2;

      // if both edges are in chromosome start or end, zoom out by diff on each end
      if(intStart - diff >= 0 && intEnd + diff <= chrEnd) {
        this.brushView(intStart - diff, intEnd + diff);
        // if only new start edge of view is a problem,
        // set start to chromosome start and increment end by 2 * diff
      } else if(intStart - diff < 0) {
        this.brushView(0, intEnd + (2 * diff));
        // if only new end edge of view is a problem,
        // set end to chromosome end and decrement start by 2 * diff
      } else if(intEnd + diff > chrEnd) {
        this.brushView(intStart - (2 * diff), chrEnd);
      }
    }
  }

  /**
   * Moves the view 15% of the current width to the left without changing the width
   */
  panLeft(): void {
    let basesPan = this.interval.width * 0.15;
    let intStart = this.interval.refStart;

    if(intStart - basesPan >= 0) {
      this.brushView(intStart - basesPan, this.interval.refEnd - basesPan);
    } else {
      this.brushView(0, this.interval.width);
    }
  }

  /**
   * Moves the view 15% of the current width to the right without changing the width
   */
  panRight(): void {
    let basesPan = this.interval.width * 0.15;
    let intStart = this.interval.refStart;
    let intEnd = this.interval.refEnd;

    if(intEnd + basesPan <= this.getRefChrSize()) {
      this.brushView(intStart + basesPan, intEnd + basesPan);
    } else {
      let diff = this.getRefChrSize() - intEnd;
      this.brushView(intStart + diff, this.getRefChrSize());
    }
  }

  /**
   * Highlights the specified (reference) gene and all comparison homolog genes
   * @param {Gene} gene - the gene to have its comparison homologs highlighted
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   * @param {boolean} metadataOnly - a default false flag indicating whether the
   *                                 call is from the overview or browser
   */
  highlightRefGene(gene: Gene, e: MouseEvent, metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      gene.highlight();

      // highlight gene's homologs comparison
      this.compGenes.filter(g => g.homologIDs.indexOf(gene.homologIDs[0]) >= 0)
                          .forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.tooltip.display(gene.getTooltipData(), e.offsetX, e.offsetY + 10, gene.symbol);
  }

  /**
   * Highlights the specified (comparison) gene and all reference homolog genes
   * @param {Gene} gene - the gene to have its reference homologs highlighted
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   * @param {boolean} metadataOnly - a default false flag indicating whether the
   *                                 call is from the overview or browser
   */
  highlightCompGene(gene: Gene, e: MouseEvent, metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      gene.highlight();

      // highlight gene's homologs in the reference
      this.refGenes.filter(g => gene.homologIDs.indexOf(g.homologIDs[0]) >= 0)
                         .forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.tooltip.display(gene.getTooltipData(),
                         e.offsetX, e.offsetY + 10, gene.symbol
                        );
  }

  /**
   * Marks all genes that are currently highlighted as unhighighlighted
   * @param {boolean} metadataOnly - a default false flag indicating if the call
   *                                 is from the overview or browser
   */
  unhighlightGene(metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      // remove highlighted status of any genes marked as highlighted
      this.compGenes.filter(gene => gene.highlighted)
                          .forEach(gene => gene.unhighlight());
      this.refGenes.filter(gene => gene.highlighted)
                         .forEach(gene => gene.unhighlight());
    }

    // hide the tooltip for the gene
    this.tooltip.clear();
  }

  /**
   * Shows a tooltip for the specified syntenic block if the block is too small
   * to show its block coords
   * @param {SyntenyBlock} block - the syntenic block to potentially highlight
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   * @param {boolean} isComp - the default false flag indicating if block
   *                           belongs to comparison species
   */
  hoverBlock(block: SyntenyBlock, e: MouseEvent, isComp: boolean = false): void {
    // if the block too small to not have its block coords shown, show a tooltip
    if(block.getPxWidth() <= 125) {
      let speciesName = isComp ? this.comparison.name : this.reference.name;
      this.tooltip.display(block.getTooltipData(isComp),
                           e.offsetX, e.offsetY + 40, speciesName
                          );
    }
  }

  /**
   * Shows a tooltip for the specified QTL
   * @param {QTLMetadata} qtl - the qtl to generate the tooltip for
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   */
  hoverQTL(qtl: QTL, e: MouseEvent): void {
    this.tooltip.display(qtl.getTooltipData(),
                         e.offsetX, e.offsetY + 40, qtl.symbol
                        );
  }


  // Getter Methods

  /**
   * Returns a list of the reference genes that are in the current browser's view
   */
  getRefGenesInView(): Array<Gene> {
    return this.refGenes.filter(gene => {
      return gene.isInRefView(this.refBPToPixels, this.width);
    });
  }

  /**
   * Returns a list of the comparison genes that are in the current browser's view
   */
  getCompGenesInView(): Array<Gene> {
    return this.compGenes.filter(gene => {
      return gene.isInCompView(this.getScale(gene), this.width, this.trueOrientation);
    });
  }

  /**
   * Returns the comparison scale matching the block ID of the specified gene
   * @param {Gene} gene - the gene to get the comp scale for by its blockID
   */
  getScale(gene: Gene): ScaleLinear<number, number> {
    return this.blockLookup[gene.blockID].getScale(this.trueOrientation);
  }

  /**
   * Returns the scale of the syntenic block the specified comp gene is in
   * @param {Gene} gene - the gene to use to a block ID from
   */
  getStaticCompScale(gene: Gene): ScaleLinear<number, number> {
    let type = this.trueOrientation ? 'true' : 'match';
    return this.staticCompBPToPixels[type][gene.blockID];
  }

  /**
   * Returns the size of the reference chromosome
   */
  getRefChrSize(): number { return this.reference.genome[this.chromosome]; }

  /**
   * Returns a path command for a vertical line, starting at specified x, with
   * specified length and optional specified y
   * @param {number} x - the x position, from the origin point of the parent
   *                     element for the vertical line
   * @param {number} length - the desired length of the line
   * @param {number} start - if provided, the y value from the origin point of
   *                         the parent element for the vertical line
   */
  getVLinePath(x: number, length: number, start: number = null): string {
    return `M${x},${(start) ? start : 0}
            L${x},${(start) ? length + start : length}Z`;
  }

  /**
   * Returns a path command for a horizontal line, starting at specified y, with
   * specified length and optional specified x
   * @param {number} y - the y position, from the origin point of the parent
 *                       element for the horizontal line
   * @param {number} length - the desired length of the line
   * @param {number} start - if provided, the x value from the origin point of
   *                         the parent element for the horizontal line
   */
  getHLinePath(y: number, length: number, start: number = null): string {
    return `M${(start) ? start : 0},${y}
            L${(start) ? length + start : length},${y}Z`;
  }

  /**
   * Returns the list of syntenic blocks where orientation between reference and
   * comparison regions do not align
   */
  getNonMatchedBlocks(): Array<SyntenyBlock> {
    return this.blocks.filter(block => !block.orientationMatches);
  }

  /**
   * Returns the X-like path command for the orientation indicators between the
   * reference and comparison tracks
   * @param {SyntenyBlock} block - the block to draw orientation indicators for
   */
  getOrientationIndPathCommand(block: SyntenyBlock): string {
    return `M${this.refBPToPixels(block.refStart)},${this.trackHeight}
            L${this.refBPToPixels(block.refEnd)},${this.trackHeight + 30}
            M${this.refBPToPixels(block.refEnd)},${this.trackHeight}
            L${this.refBPToPixels(block.refStart)},${this.trackHeight + 30}Z`;
  }


  // Condition Checks

  /**
   * Returns true/false if at least 1 QTL or gene is selected
   */
  featuresAreSelected(): boolean {
    return this.selectedQTLs.length > 0 || this.selectedRefGenes.length > 0;
  }


  // Private Methods

  /**
   * Resets all of the core variables to make room for a new set of data
   */
  private reset(): void {
    this.refGenes = null;
    this.compGenes = null;
    this.progress = 0;
    this.blocks = null;
    this.blockStartPts = {};
    this.blockEndPts = {};
    this.refBPToPixels = null;
    this.staticRefBPToPixels = null;
    this.selectedRefGenes = [];
    this.selectedCompGenes = [];
    this.selectedQTLs = [];
    this.staticCompBPToPixels.match = {};
    this.staticCompBPToPixels.true = {};
    this.legend = null;
  }

  /**
   * Changes the view (moves the brush, which also zooms the browser) to the
   * specified start and end points
   * @param {number} start - the starting position of the new interval (in bp)
   * @param {number} end - the ending position of the new interval (in bp)
   */
  private brushView(start: number, end: number): void {
    d3.select('#chr-view-inv-cover')
      .call(this.brush.move,
            [this.staticRefBPToPixels(start), this.staticRefBPToPixels(end)]
           );
  }

  /**
   * Gets the synteny information and constructs dictionaries with important
   * information for each syntenic region
   * @param {Array<Metadata>} features - list of features for gene coloring
   * @param {object} colors - the genome color dictionary
   */
  private getSyntenicBlocks(features: Array<Metadata>, colors: object): void {
    let refID = this.reference.getID();
    let compID = this.comparison.getID();

    this.http.getChromosomeSynteny(refID, compID, this.chromosome)
             .subscribe(blocks => {
               let activeChrs = [];
               // create list of necessary block data dictionaries
               blocks.forEach(block => {

                 // don't worry about repeats
                 activeChrs.push(block.compChr);

                 block.setScales(this.refBPToPixels);
                 block.setColor(colors[block.compChr]);
                 this.blockLookup[block.id] = block;

                 this.staticCompBPToPixels.match[block.id] = block.compMatchScale;
                 this.staticCompBPToPixels.true[block.id] = block.compTrueScale;
               });

               this.blocks = blocks;
               this.legend = new Legend(this.comparison.genome,
                                        colors,
                                        activeChrs,
                                        this.width
                                        );

               this.interval = new BrowserInterval(this.chromosome,
                                                   this.getRefChrSize(),
                                                   blocks,
                                                   this.refBPToPixels,
                                                   this.trueOrientation
                                                  );

               // only update this once because it won't
               this.progress += 0.70;

               // create the chromosome view (static) axis
               d3.select('#chr-view-axis')
                 .call(d3.axisBottom(this.staticRefBPToPixels)
                   .tickValues(this.getAxisTickValues(0, this.getRefChrSize()))
                   .tickFormat((d: number) => Math.round(d / 1000000) + " Mb"))
                 .selectAll('text')
                   .attr('text-anchor', (d, i, x) => {
                     return this.getLabelPosition(i, x.length);
                   });

               this.getGenes(refID, compID, features);
             });
  }

  /**
   * Gets the genes for the reference chromosome and their homologs within the
   * syntenic regions; forms the list of reference genes, comparison genes,
   * selected features, and generates homolog IDs
   * @param {string} refID - the taxon ID of the reference species
   * @param {string} compID - the taxon ID of the comparison species
   * @param {Array<any>} features - the selected features from the genome view
   */
  private getGenes(refID: string, compID: string, features: Array<any>): void {
    this.http.getGenes(refID, compID, this.chromosome)
             .subscribe(genes => {
               // stores homolog id arrays by comparison gene symbol
               let homIDs = {};

               // comparison genes (reference genes' new/distinct homologs)
               let compGenes = [];

               // add a homolog id to all of the reference genes
               this.refGenes = genes.map((gene, i) => {
                 // if there are homologs, figure out homolog information
                 if(gene.homologs.length !== 0) {
                   // for each of the homologs, if the homolog's gene_symbol is
                   // already in homIDs, push the reference gene's homolog ID to
                   // that list. If it isn't there, make a new key/value pair
                   // for the homolog and push the homolog to the compGenes array
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
                     // set a temporary flag
                     gene.sel = true;
                     gene.homologs.forEach(hom => hom.sel = true);
                     return new Gene(gene, [i], this.trackHeight);
                   }

                   return new Gene(gene, [i], this.trackHeight);
                 } else {
                   let featureSymbols = features.map(feature => feature.gene_symbol);
                   gene.sel = featureSymbols.indexOf(gene.gene_symbol) >= 0;

                   return new Gene(gene, [], this.trackHeight);
                 }
               });

               // create a list of comparison genes from the temp compGenes array,
               // add the list of homolog IDs for each, as found from homIDs,
               // and add block ID for genes in a syntenic region, then filter
               // that list to only genes that have a block ID
               this.compGenes = compGenes.map(gene => {
                 let homs = homIDs[gene.gene_symbol];
                 return new Gene(gene, homs, this.trackHeight, this.blocks);
               }).filter(gene => gene.isSyntenic());

               // get selected features
               this.selectedRefGenes = this.refGenes.filter(gene => gene.selected);
               this.selectedCompGenes = this.compGenes.filter(gene => gene.selected);
               this.selectedQTLs = features.filter(feature => feature.qtl_id)
                                           .map((qtl, i) => {
                                             return new QTL(qtl,
                                                            i,
                                                            this.staticRefBPToPixels);
                                           });

               // set interval to center around the first reference feature, if
               // features are selected, otherwise set interval to entire chr
               if(this.selectedRefGenes.length > 0) {
                 let mb = 2500000;
                 let firstGene = this.selectedRefGenes[0];
                 let start = Math.max(0, firstGene.start - mb);
                 let end = Math.min(this.getRefChrSize(), firstGene.end + mb);

                 this.interval.moveTo(start, end, this.refBPToPixels);
               } else {
                 this.interval.moveTo(0, this.getRefChrSize(), this.refBPToPixels);
               }

               // set the zoom, brush and dynamic axis behaviors/interactions
               this.bindBrowserBehaviors();
             });
  }

  /**
   * Sets the brush and zoom behaviors
   */
  private bindBrowserBehaviors(): void {
    let chrSize = this.getRefChrSize();

    // create an axis using the dynamic scale with more precise tick labels in Mb
    let browserAxis = d3.axisTop(this.refBPToPixels)
                        .tickSizeOuter(0)
                        .tickFormat((d: number) => `${(d / 1000000)}Mb`);

    /*
    CREDIT: I would not have been able to get these behaviors so clean and
            concise without dear Mike Bostock's example, found here:
            https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172.
            All hail Mike Bostock!

          ~ A.L.
     */
    this.brush = d3.brushX()
                  .extent([[0, 10], [this.width, this.chromosomeViewHeight - 4]])
                  .on('brush', () => {
                    let e = d3.event;

                    // ignore brush via zoom occurrences
                    if(e.sourceEvent && e.sourceEvent.type === "zoom") return;

                    let s: Array<number> = e.selection;

                    // adjust refBPToPixels by scaling start, s[0], and end, s[1],
                    // with static scale (used for chromosome view)
                    this.refBPToPixels.domain(s.map(this.staticRefBPToPixels.invert,
                                              this.staticRefBPToPixels));

                    // update the comparison scale dictionaries to use new ref scale
                    this.blocks.forEach(block => block.setScales(this.refBPToPixels));

                    // zoom the browser to same section
                    d3.select('#browser')
                      .call(this.zoom.transform,
                            d3.zoomIdentity.scale(this.width / (s[1] - s[0]))
                                           .translate(-s[0], 0)
                            );

                    this.interval.moveTo(this.staticRefBPToPixels.invert(s[0]),
                                         this.staticRefBPToPixels.invert(s[1]),
                                         this.refBPToPixels
                                        );

                    // update the axis above the reference track
                    d3.select('#browser-axis').call(browserAxis)
                      .select('text')
                        .attr('text-anchor', 'start');
                  });

    this.zoom = d3.zoom()
                 .scaleExtent([1, (chrSize / this.minimumIntervalSize)])
                 .translateExtent([[0, 0], [this.width, this.height]])
                 .extent([[0, 0], [this.width, this.height]])
                 .on('zoom', () => {
                   let e = d3.event;

                   // ignore zoom via brush occurrences
                   if(e.sourceEvent && e.sourceEvent.type === "brush") return;

                   let t = e.transform;

                   // adjust the refBPToPixels using a t's rescaled x on the
                   // static scale (used for chromosome view)
                   this.refBPToPixels.domain(t.rescaleX(this.staticRefBPToPixels)
                                              .domain()
                                            );

                   // update the comparison scale dictionaries to use new ref scale
                   this.blocks.forEach(block => block.setScales(this.refBPToPixels));

                   // get start and end pixel and bp points of the current interval
                   let pxExtents = this.refBPToPixels.range().map(t.invertX, t);
                   let bpExtents = this.refBPToPixels.domain();

                   // move the brush in the chromosome view to match
                   d3.select('#chr-view-inv-cover')
                     .call(this.brush.move, pxExtents);

                   // update the interval values
                   this.interval.moveTo(bpExtents[0],
                                        bpExtents[1],
                                        this.refBPToPixels
                                       );

                   // update the axis above the reference track
                   d3.select('#browser-axis').call(browserAxis)
                     .select('text')
                       .attr('text-anchor', 'start');
                 });

    // bind the zoom behavior
    d3.select('#browser')
      .call(this.zoom);

    // bind the brush behavior and set the brush to match the current interval
    // (either the entire chr or the focused section)
    d3.select('#chr-view-inv-cover')
      .call(this.brush)
      .call(this.brush.move,
            [this.staticRefBPToPixels(this.interval.refStart),
             this.staticRefBPToPixels(this.interval.refEnd)]
           );
  }

  /**
   * Returns a linear scale that will convert a genomic location or distance to
   * pixels (or the other way around if inverted)
   * @param {number} BPwidth - the size of the current reference chromosome
   */
  private getRefScale(BPwidth: number): ScaleLinear<number, number> {
    // set the range max to 'width - 1' to keep the last tick line of axes
    // from hiding on the right side of the svg
    return d3.scaleLinear().domain([0, BPwidth]).range([0, this.width - 1]);
  }

  /**
   * Takes a chromosome value/name and generates a list of 11 values including
   * 0 and the last BP of the chromosome where the other 9 values are equally
   * spaced locations for tick values on the chromosome view axis
   * @param {number} start - the starting point to start generating tick values
   * @param {number} end - the ending point to start generating tick values
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
   * This is a quick method that basically just generates anchor position to
   * assign to each tick mark. All tick marks minus the first and last should
   * have their labels centered whereas the first label should appear to the
   * right of its tick mark and the last label should appear to the left of its
   * tick mark so as both will be completely visible
   * @param {number} index - the index of the tick we're checking
   * @param {number} listLength - the length of the list of ticks
   */
  private getLabelPosition(index: number, listLength: number): string {
    if(index === 0) {
      return 'start';
    } else if(index === listLength - 1) {
      return 'end';
    } else {
      return 'middle';
    }
  }
}
