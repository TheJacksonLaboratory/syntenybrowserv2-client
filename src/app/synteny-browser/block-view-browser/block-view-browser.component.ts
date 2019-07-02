import { ApiService } from '../services/api.service';
import { BrowserInterval } from '../classes/browser-interval';
import * as d3 from 'd3';
import { saveAs } from 'file-saver';
import { BrushBehavior, ScaleLinear, ZoomBehavior } from 'd3';
import { BlockViewBrowserOptions, ComparisonScaling, Metadata, QTLMetadata } from '../classes/interfaces';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Feature } from '../classes/feature';
import { Gene } from '../classes/gene';
import { Legend } from '../classes/legend';
import { QTL } from '../classes/qtl';
import { Species } from '../classes/species';
import { SyntenyBlock } from '../classes/synteny-block';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { Filter } from '../classes/filter';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent {
  @ViewChild('tooltip', {static: false}) tooltip: TooltipComponent;

  ref: Species;
  comp: Species;
  legend: Legend;
  refChr: string;
  refInterval: string = '';

  options: BlockViewBrowserOptions;

  selectedRefGenes: Array<Gene> = [];
  selectedCompGenes: Array<Gene> = [];
  selectedQTLs: Array<QTL> = [];

  filters: Array<Filter> = [];

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
  refGenes: Array<Gene>;
  compGenes: Array<Gene>;
  staticRefBPToPixels: ScaleLinear<number, number>;
  staticCompBPToPixels: ComparisonScaling;
  refBPToPixels: ScaleLinear<number, number>;

  @Output() filter: EventEmitter<any> = new EventEmitter();

  constructor(private http: ApiService) {
    this.options = { symbols: false, anchors: false, trueOrientation: false };
    this.staticCompBPToPixels = { match: {}, true: {} };
  }


  // Operational Methods

  /**
   * Renders the block view with the specified reference and comparison species,
   * using the specified color dictionary for the genomes, a list of features to
   * highlight on the specified chromosome
   * @param {Species} ref - the reference species
   * @param {Species} comp - the comparison species
   * @param {object} colors - the genome color dictionary
   * @param {string} chr - the chromosome to get syntenic blocks and features for
   * @param {Array<Feature>} features - list of selected features to display
   */
  render(ref: Species, comp: Species, colors: object,
         chr: string, features: Array<Feature>): void {
    this.reset();

    this.ref = ref;
    this.comp = comp;

    this.refChr = chr;

    // this one is going to get updated with transformations
    this.refBPToPixels = this.getRefScale(this.getRefChrSize());

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.getRefScale(this.getRefChrSize());

    // get syntenic block data
    this.getSyntenicBlocks(features, colors);
  }

  /**
   * Triggers a download of the current view in the block view browser
   * TODO: let users choose the name they want to use for the download
   */
  download(): void {
    this.setObjectAttributes();

    let svg = document.querySelector('#browser-svg');
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
        let name = this.ref.commonName + '_' + this.refChr + ':' +
                   this.interval.refStart+ '-' + this.interval.refEnd;
        saveAs(blob, name);
      });
    };

    let serialized = new XMLSerializer().serializeToString(svg);
    image.src = `data:image/svg+xml;base64,${btoa(serialized)}`;
  }

  /**
   * Sets the attributes needed to get styles of items in the SVG to export
   * into the downloaded image; these items are all D3-generated so they can't
   * be set in the template beforehand as they don't exist before being created
   */
  setObjectAttributes(): void {
    let chrViewOverlay = document.querySelector('rect.selection');
    chrViewOverlay.setAttribute('fill', '#DDD');
    chrViewOverlay.setAttribute('stroke', '#000');
    chrViewOverlay.setAttribute('stroke-width', '0.3');

    let selectors = '#browser-axis line,#browser-axis path,' +
                    '#chr-view-axis line,#chr-view-axis path';
    document.querySelectorAll(selectors)
            .forEach(obj => obj.setAttribute('stroke-width', '0.5'));

    document.querySelectorAll('#browser-axis text, #chr-view-axis text')
            .forEach(obj => obj.setAttribute('font-size', '8px'));
    document.querySelectorAll('line, rect')
            .forEach(obj => obj.setAttribute('shape-rendering', 'crispEdges'));
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
  jumpToFeature(feature: any): void {
    this.brushView(Math.max(0, feature.start - 1000000),
                   Math.min(this.getRefChrSize(), feature.end + 1000000));
  }

  /**
   * Changes the current browser view to the interval entered into the reference
   * interval field in the interface; if the interval only contains one value
   * followed by a hyphen then interpret the interval as starting from the
   * specified value to the end of the reference chromsome; if the single value
   * is preceded by a hyphen, interpret as starting from the start of the
   * reference chromsome to the specified value
   */
  jumpToInterval(): void {
    if(this.refInterval.length > 0) {
      let pts = this.refInterval.replace(/\s+/g, '')
                                .replace(/,/g, '')
                                .split('-');

      if(pts.length === 2) {
        let start = pts[0].length > 0 ? pts[0]: 0;
        let end = pts[1].length > 0 ? pts[1]: this.getRefChrSize();

        if(Number(start) && Number(end)) {
          this.brushView(Number(start), Number(end));
        }
      }
    }
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
   * @param {boolean} simple - a default false flag indicating whether the
   *                                 call is from the overview or browser
   */
  highlightRefGene(gene: Gene, e: MouseEvent, simple: boolean = false): void {
    if(!simple) {
      gene.highlight();

      // highlight gene's homologs comparison
      this.getComparisonHomologs(gene.homologIDs[0]).forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.tooltip.display(gene.getTooltipData(),
                         e.offsetX, e.offsetY + 10, gene.symbol);
  }

  /**
   * Highlights the specified (comparison) gene and all reference homolog genes
   * @param {Gene} gene - the gene to have its reference homologs highlighted
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   * @param {boolean} simple - a default false flag indicating whether the
   *                                 call is from the overview or browser
   */
  highlightCompGene(gene: Gene, e: MouseEvent, simple: boolean = false): void {
    if(!simple) {
      gene.highlight();

      // highlight gene's homologs in the reference
      this.getReferenceHomologs(gene.homologIDs).forEach(g => g.highlight());
    }

    // generate the tooltip for the gene
    this.tooltip.display(gene.getTooltipData(),
                         e.offsetX, e.offsetY + 10, gene.symbol);
  }

  /**
   * Marks all genes that are currently highlighted as unhighighlighted
   * @param {boolean} metadataOnly - a default false flag indicating if the call
   *                                 is from the overview or browser
   */
  unhighlightGene(metadataOnly: boolean = false): void {
    if(!metadataOnly) {
      // remove highlighted status of any genes marked as highlighted
      this.compGenes.filter(g => g.highlighted)
                    .forEach(g => g.unhighlight());
      this.refGenes.filter(g => g.highlighted)
                   .forEach(g => g.unhighlight());
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
      let speciesName = isComp ? this.comp.name : this.ref.name;
      this.tooltip.display(block.getTooltipData(isComp),
                           e.offsetX, e.offsetY + 40, speciesName);
    }
  }

  /**
   * Shows a tooltip for the specified QTL
   * @param {QTLMetadata} qtl - the qtl to generate the tooltip for
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   */
  hoverQTL(qtl: QTL, e: MouseEvent): void {
    this.tooltip.display(qtl.getTooltipData(),
                         e.offsetX, e.offsetY + 40, qtl.symbol);
  }


  // Getter Methods

  /**
   * Returns a list of reference genes that are in the current browser's view
   */
  getRefGenesInView(): Array<Gene> {
    return this.refGenes.filter(g => {
                           return g.isInRefView(this.refBPToPixels, this.width);
                         });
  }

  /**
   * Returns a list of reference genes that are homologous (have at least one
   * syntenic homolog)
   */
  getHomologousRefGenes(): Array<Gene> {
    return this.refGenes.filter(g => g.isHomologous());
  }

  /**
   * Returns a list of comparison genes that are in the current browser's view
   */
  getCompGenesInView(): Array<Gene> {
    return this.compGenes.filter(g => {
      return g.isInCompView(this.getScale(g),
                            this.width,
                            this.options.trueOrientation);
    });
  }

  /**
   * Returns the comparison scale matching the block ID of the specified gene
   * @param {Gene} gene - the gene to get the comp scale for by its blockID
   */
  getScale(gene: Gene): ScaleLinear<number, number> {
    return this.blockLookup[gene.blockID].getScale(this.options.trueOrientation);
  }

  /**
   * Returns the scale of the syntenic block the specified comp gene is in
   * @param {Gene} gene - the gene to use to a block ID from
   */
  getStaticCompScale(gene: Gene): ScaleLinear<number, number> {
    let type = this.options.trueOrientation ? 'true' : 'match';
    return this.staticCompBPToPixels[type][gene.blockID];
  }

  /**
   * Returns the size of the reference chromosome
   */
  getRefChrSize(): number { return this.ref.genome[this.refChr]; }

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
    return `M${block.getPxStart()},${this.trackHeight}
            L${block.getPxEnd()},${this.trackHeight + 30}
            M${block.getPxEnd()},${this.trackHeight}
            L${block.getPxStart()},${this.trackHeight + 30}Z`;
  }

  /**
   * Returns the path command for all of the anchors of the specified gene and
   * homologs (2 lines per homolog)
   * @param {Gene} gene - the gene to determine path commands for
   */
  getAnchorPathCommand(gene: Gene): string {
    let command = '';
    let refStart = this.refBPToPixels(gene.start);
    let refEnd = this.refBPToPixels(gene.end);
    let homologs = this.getComparisonHomologs(gene.homologIDs[0]);

    homologs.forEach(hom => {
      let scale = this.getScale(hom);
      let homStart = scale(hom.getStart(this.options.trueOrientation));
      let homEnd = scale(hom.getEnd(this.options.trueOrientation));

      command += `M${refStart},${gene.yPos + 2}
                  V${this.trackHeight}
                  L${homStart},${this.trackHeight + 30}
                  V${this.trackHeight + 30 + hom.yPos + 2}
                  M${refEnd},${gene.yPos + 2}
                  V${this.trackHeight}
                  L${homEnd},${this.trackHeight + 30}
                  V${this.trackHeight + 30 + hom.yPos + 2}`;
    });

    return command;
  }

  /**
   * Returns the label text for the specified condition title (adds formatting)
   * @param {string} conditionTitle - the title of the condition
   */
  getConditionLabel(conditionTitle: string): string {
    return conditionTitle.replace(/=/g, ' = ')
                         .replace(/!/g, '')
                         .replace(/\+/g, ' ');
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
            [this.staticRefBPToPixels(start), this.staticRefBPToPixels(end)]);
  }

  /**
   * Gets the synteny information and constructs dictionaries with important
   * information for each syntenic region
   * @param {Array<Feature>} features - list of features for gene coloring
   * @param {object} colors - the genome color dictionary
   */
  private getSyntenicBlocks(features: Array<Feature>, colors: object): void {
    let refID = this.ref.getID();
    let compID = this.comp.getID();

    this.http.getChromosomeSynteny(refID, compID, this.refChr)
             .subscribe(blocks => {
               let activeChrs = [];
               // create list of necessary block data dictionaries
               blocks.forEach(b => {

                 // don't worry about repeats
                 activeChrs.push(b.compChr);

                 b.setScales(this.refBPToPixels);
                 b.setColor(colors[b.compChr]);
                 this.blockLookup[b.id] = b;

                 this.staticCompBPToPixels.match[b.id] = b.compMatchScale;
                 this.staticCompBPToPixels.true[b.id] = b.compTrueScale;
               });

               this.blocks = blocks;
               this.legend = new Legend(this.comp.genome,
                                        colors,
                                        activeChrs,
                                        this.width);

               this.interval = new BrowserInterval(this.refChr,
                                                   this.getRefChrSize(),
                                                   blocks,
                                                   this.refBPToPixels,
                                                   this.options.trueOrientation);

               // only update this once because it won't
               this.progress += 0.70;

               // create the chromosome view (static) axis
               d3.select('#chr-view-axis')
                 .call(d3.axisBottom(this.staticRefBPToPixels)
                   .tickValues(this.getAxisTickValues(0, this.getRefChrSize()))
                   .tickFormat((d: number) => Math.round(d / 1000000) + " Mb"))
                 .selectAll('text')
                   .attr('text-anchor', (d, i, x) => {
                     return this.getLabelPos(i, x.length);
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
   * @param {Array<Feature>} features - the selected features from the genome view
   */
  private getGenes(refID: string, compID: string, features: Array<Feature>): void {
    this.http.getGenes(refID, compID, this.refChr)
             .subscribe(genes => {
               // stores homolog id arrays by comparison gene symbol
               let homIDs = {};

               // comparison genes (reference genes' new/distinct homologs)
               let compGenes = [];

               let featureSymbols = features.map(f => f.symbol);

               // add a homolog id to all of the reference genes
               this.refGenes = genes.map(g => {
                 g.gene_chr = this.refChr;
                 // if there are homologs, figure out homolog information
                 if(g.homologs.length !== 0) {
                   // load the homIDs dictionary and the compGenes array
                   // with distinct values/genes
                   g.homologs.forEach(hom => {
                     if(homIDs[hom.gene_symbol]) {
                       homIDs[hom.gene_symbol].push(g.gene_id);
                     } else {
                       homIDs[hom.gene_symbol] = [g.gene_id];
                       compGenes.push(hom);
                     }
                   });

                   if(featureSymbols.indexOf(g.gene_symbol) >= 0) {
                     // set a temporary flag
                     g.sel = true;
                     g.homologs.forEach(hom => hom.sel = true);

                     return new Gene(g, [g.gene_id], this.trackHeight);
                   }

                   return new Gene(g, [g.gene_id], this.trackHeight);
                 } else {
                   g.sel = featureSymbols.indexOf(g.gene_symbol) >= 0;

                   return new Gene(g, [], this.trackHeight);
                 }
               });

               // create a list of comparison genes from the temp compGenes array,
               // add the list of homolog IDs for each, as found from homIDs,
               // and add block ID for genes in a syntenic region, then filter
               // that list to only genes that have a block ID
               this.compGenes = compGenes.map(g => {
                                           let homs = homIDs[g.gene_symbol];
                                           return new Gene(g,
                                                           homs,
                                                           this.trackHeight,
                                                           this.blocks);
                                         }).filter(g => g.isSyntenic());

               // go through reference genes to remove homolog IDs that are
               // associated with comparison genes that were just filtered out
               this.refGenes.filter(g => g.isHomologous())
                            .forEach(g => {
                              g.homologIDs = g.homologIDs.filter(h => {
                                return this.getComparisonHomologs(h).length > 0;
                              });
                            });

               // get selected features
               this.selectedRefGenes = this.refGenes.filter(g => g.selected);
               this.selectedCompGenes = this.compGenes.filter(g => g.selected);

               // Keeping here until QTL arrangement is completely finished
               /* this.http.getQTLsByChr(this.ref.getID(), this.refChr)
                           .subscribe(qtls => {
                             let heightQTLS = this.arrangeQTLs(qtls);
                             this.selectedQTLs = heightQTLS.map((q, i) => {
                                 return new QTL(q, i, this.staticRefBPToPixels);
                               });
                           });
               */

               let formattedQTLs = this.arrangeQTLs(features.filter(f => !f.gene));
               this.selectedQTLs = formattedQTLs.map((q, i) => {
                                                   return new QTL(q,
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
   * Returns the array of QTLs with added data about offset and height
   * @param {Array<any>} qtls - an array of QTLs
   */
  private arrangeQTLs(qtls: Array<any>): Array<any> {
    let tempQs = JSON.parse(JSON.stringify(qtls));

    let pointData = {};

    // log start (and end) point(s) of each QTL
    tempQs.forEach(q => {
      if(q.start === q.end) {
        q['points'] = [q.start];

        // log point data
        if(!pointData[q.start]) {
          pointData[q.start] = [{ id: q.qtl_id, isStart: true, isEnd: true }];
        } else {
          pointData[q.start].push({ id: q.qtl_id, isStart: true, isEnd: true });
        }
      } else {
        q['points'] = [q.start, q.end];

        // log start point data
        if(!pointData[q.start]) {
          pointData[q.start] = [{ id: q.qtl_id, isStart: true, isEnd: false }];
        } else {
          pointData[q.start].push({ id: q.qtl_id, isStart: true, isEnd: false });
        }

        // log end point data
        if(!pointData[q.end]) {
          pointData[q.end] = [{ id: q.qtl_id, isStart: false, isEnd: true }];
        } else {
          pointData[q.end].push({ id: q.qtl_id, isStart: false, isEnd: true });
        }
      }
    });

    // do one more pass of the QTLs to add information to pointData for a QTL
    // that neither starts or ends and the "point of interests"
    tempQs.forEach(q => {
      Object.keys(pointData).forEach(pt => {
        if(q.start < pt && q.end > pt) {
          q.points.push(Number(pt));
          pointData[pt].push({ id: q.qtl_id, isStart: false, isEnd: false });
        }
      });

      q.points.sort(); // sort the points so we do them in order
    });

    // an 1D array representing vertically stacked spaces (lanes) that can be
    // allotted to a single QTL at a time
    let lanes = [];
    // keeps track of smallest height for each QTL
    let qtlHeights = {};
    // keeps track of QTLs that need to be referenced to get their height to
    // affect offsets of other QTLs
    let qtlOffsets = {};

    let points = Object.keys(pointData).map(pt => Number(pt))
                                       .sort((a, b) => a - b);

    points.forEach(pt => {
      let qs = pointData[pt];
      let starts = qs.filter(q => q.isStart);
      let ends = qs.filter(q => q.isEnd && !q.isStart);

      // assign each starting QTL to a lane
      if(starts.length > 0) {
        starts.forEach(s => {
          // if there are open lanes, use them for starting QTLs
          if(lanes.filter(lane => !lane).length > 0) {
            // iterate through the lanes to find the first available one
            for(let i = 0; i < lanes.length; i++) {
              if(!lanes[i]) {
                // store the index of the lane
                s['lane'] = i;
                lanes[i] = s;
                break;
              }
            }
          } else { // if there aren't any open lanes, let's add a new one
            s['lane'] = lanes.length;
            lanes.push(s);
          }
        });
      }

      // load heights and offsets for each QTL
      lanes.forEach((q, i, all) => {
        if(q) {
          // update height
          qtlHeights[q.id] = qtlHeights[q.id] ?
                             Math.min(1 / all.length, qtlHeights[q.id]) :
                             1 / all.length;

          // get QTLs that affect the current QTL's offset
          let qtlsToRef = [];
          for(let j = 0; j < i; j++) {
            if(all[j]) {
              qtlsToRef.push(all[j].id);
            }
          }
          if(!qtlOffsets[q.id] || i - 1 > qtlOffsets[q.id].length) {
            qtlOffsets[q.id] = qtlsToRef;
          }
        }
      });

      // if there are QTLs that are ending, let's process them first to open up
      // any lanes that might need to be reassigned
      if(ends.length > 0) {
        // free up lanes
        ends.forEach(e => {
          // check that the QTL isn't one that starts and ends at the same bp
          if(!e.isStart) {
            for(let i = 0; i < lanes.length; i++) {
              if(lanes[i] && lanes[i].id === e.id) {
                lanes[i] = null;
                break;
              }
            }
          }
        });
      }

      // remove unused excess appended lanes
      let lastLane = -1;
      lanes.forEach((lane, i) => {
        if(lane) {
          lastLane = i + 1;
        }
      });
      // get the index of the last used lane and slice lanes to only contain indices 0 through the last used lane;
      lanes = lastLane > 0 ? (lastLane === lanes.length ? lanes : lanes.slice(0, lastLane)) : [];
    });

    tempQs.forEach(q => {
      let id = q.qtl_id;
      let numsOfOverlaps = [];
      // get the lengths of all the points that the current QTL covers
      q['lane'] = pointData[q.start].filter(e => e.isStart && e.id === q.qtl_id)
                                    .map(e => e.lane)[0];

      q.points.forEach(pt => {
          numsOfOverlaps.push(pointData[pt].length);
      });

      qtlOffsets[id] = qtlOffsets[id].length > 0 ?
                   qtlOffsets[id].map(i => qtlHeights[i])
                                 .reduce((tot, val) => tot + val) :
                   0;

      // calculate the final height of the QTL by dividing the total vertical
      // space by the maximum value of overlaps
      q['height'] = this.trackHeight * qtlHeights[id];

    });

    tempQs.forEach(q => {
      q['offset'] = this.trackHeight * qtlOffsets[q.qtl_id];
      q['indOffset'] = (this.chromosomeViewHeight - 25) * qtlOffsets[q.qtl_id];
    });

    return tempQs;
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
                    this.blocks.forEach(b => b.setScales(this.refBPToPixels));

                    // zoom the browser to same section
                    d3.select('#browser')
                      .call(this.zoom.transform,
                            d3.zoomIdentity.scale(this.width / (s[1] - s[0]))
                                           .translate(-s[0], 0)
                            );

                    this.interval.moveTo(this.staticRefBPToPixels.invert(s[0]),
                                         this.staticRefBPToPixels.invert(s[1]),
                                         this.refBPToPixels);

                    // update the axis above the reference track
                    d3.select('#browser-axis')
                      .call(browserAxis);
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
                                              .domain());

                   // update the comparison scale dictionaries to use new ref scale
                   this.blocks.forEach(b => b.setScales(this.refBPToPixels));

                   // get start and end pixel and bp points of the current interval
                   let pxExtents = this.refBPToPixels.range().map(t.invertX, t);
                   let bpExtents = this.refBPToPixels.domain();

                   // move the brush in the chromosome view to match
                   d3.select('#chr-view-inv-cover')
                     .call(this.brush.move, pxExtents);

                   // update the interval values
                   this.interval.moveTo(bpExtents[0],
                                        bpExtents[1],
                                        this.refBPToPixels);

                   // update the axis above the reference track
                   d3.select('#browser-axis')
                     .call(browserAxis);
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
             this.staticRefBPToPixels(this.interval.refEnd)]);
  }

  /**
   * Returns a linear scale that will convert a genomic location or distance to
   * pixels (or the other way around if inverted)
   * @param {number} BPwidth - the size of the current reference chromosome
   */
  private getRefScale(BPwidth: number): ScaleLinear<number, number> {
    // set the range max to 'width - 1' to keep the last tick line of axes
    // from hiding on the right side of the svg
    return d3.scaleLinear()
             .domain([0, BPwidth])
             .range([0, this.width - 1]);
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
  private getLabelPos(index: number, listLength: number): string {
    if(index === 0) {
      return 'start';
    } else if(index === listLength - 1) {
      return 'end';
    } else {
      return 'middle';
    }
  }

  /**
   * Returns a list of comparison genes that have a homolog ID that matches
   * the specified homolog ID of a reference gene
   * @param {number} homID - the homolog ID to search for comparison matches
   */
  private getComparisonHomologs(homID: string): Array<Gene> {
    return this.compGenes.filter(g => g.homologIDs.indexOf(homID) >= 0);
  }

  /**
   * Returns a list of reference genes that have a homolog ID that matches
   * the any of specified homolog IDs of a comparison gene
   * @param {Array<number>} homIDs - the homolog IDs to search for reference matches
   */
  private getReferenceHomologs(homIDs: Array<string>): Array<Gene> {
    return this.refGenes.filter(g => {
                           let match = false;
                           g.homologIDs.forEach(h => {
                                         homIDs.indexOf(h) >= 0 ?
                                           match = true : null
                                        });
                           return match;
                         });
  }
}
