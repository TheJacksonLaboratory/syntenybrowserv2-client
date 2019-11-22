import { ApiService } from '../services/api.service';
import { BrowserInterval } from '../classes/browser-interval';
import * as d3 from 'd3';
import { BrushBehavior, ScaleLinear, ZoomBehavior } from 'd3';
import { BlockViewBrowserOptions, ComparisonScaling, QTLMetadata } from '../classes/interfaces';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Feature } from '../classes/feature';
import { Gene } from '../classes/gene';
import { Legend } from '../classes/legend';
import { QTL } from '../classes/qtl';
import { Species } from '../classes/species';
import { SyntenyBlock } from '../classes/synteny-block';
import { Filter } from '../classes/filter';
import { DownloadService } from '../services/download.service';
import { DataStorageService } from '../services/data-storage.service';
import { LinearGenomeMap } from '../classes/linear-genome-map';

@Component({
  selector: 'block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent {
  ref: Species;
  comp: Species;
  legend: Legend;
  refChr: string;
  refInterval: string = '';

  options: BlockViewBrowserOptions;

  selectedRefGenes: Gene[] = [];
  selectedCompGenes: Gene[] = [];
  selectedQTLs: QTL[] = [];

  filteredRefGenes: Gene[] = [];
  filteredCompGenes: Gene[] = [];

  filters: Filter[] = [];

  progress = 0;
  zoom: ZoomBehavior<any, any>;
  brush: BrushBehavior<any>;

  width: number = 1200;
  height: number = 430;
  chromosomeViewOffset: number = 35;
  chromosomeViewHeight = 60;
  browserOffset: number = 150;
  trackHeight = 80;
  minimumIntervalSize = 3000;

  interval: BrowserInterval;
  blocks: SyntenyBlock[];
  blockLookup: object = {};
  refGenes: Gene[];
  compGenes: Gene[];
  homRefGenes: string[];
  staticRefBPToPixels: ScaleLinear<number, number>;
  staticCompBPToPixels: ComparisonScaling;
  refBPToPixels: ScaleLinear<number, number>;
  refGMap: LinearGenomeMap;

  tooltip: any = null;
  clicktip: any = null;
  clicktipOpen = false;

  downloadFilename: string = '';
  filenameModalOpen = false;

  @Output() filter: EventEmitter<any> = new EventEmitter();

  constructor(private data: DataStorageService,
              private http: ApiService,
              private downloader: DownloadService) {
    this.options = { symbols: false, anchors: false, trueOrientation: false };
    this.staticCompBPToPixels = { match: {}, true: {} };
  }


  // Operational Methods

  /**
   * Renders the block view with the current reference and comparison species,
   * and a list of features to highlight on the current chromosome
   */
  render(): void {
    this.reset();

    this.ref = this.data.refSpecies;
    this.comp = this.data.compSpecies;
    this.refChr = this.data.features.chr;

    // this one is going to get updated with transformations
    this.refBPToPixels = this.getRefScale(this.getRefChrSize());

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.getRefScale(this.getRefChrSize());

    // this genome map is used for the genome band above the chromosome view
    this.refGMap = new LinearGenomeMap(this.ref.genome, this.width);

    // get syntenic block data
    this.getSyntenicBlocks(this.data.features.features);
  }

  /**
   * Triggers a download of the current view in the block view browser
   */
  download(): void {
    this.setObjectAttributes();
    this.downloader.downloadSVG('browser-svg', this.downloadFilename);
    this.filenameModalOpen = false;
    this.downloadFilename = '';
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
    chrViewOverlay.setAttribute('stroke-width', '1');

    let selectors = '#browser-axis line,#browser-axis path,' +
                    '#chr-view-axis line,#chr-view-axis path';
    document.querySelectorAll(selectors)
            .forEach(obj => obj.setAttribute('stroke-width', '0.5'));

    document.querySelectorAll('#browser-axis text, #chr-view-axis text')
            .forEach(obj => obj.setAttribute('font-size', '8px'));
  }

  /**
   * Returns a translate command in the form of a string to be used in the
   * template for custom translations
   * @param {number[]} coords - a two value array where [0] = dx and
   *                                [1] = dy translations
   */
  translate(coords: number[]): string {
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
    this.tooltip = {
      title: gene.symbol,
      content: gene.getTooltipData(),
      x: this.width / 2 - 75
    };

    if(!simple) {
      gene.highlight();

      // highlight gene's homologs comparison
      this.getComparisonHomologs(gene.homologIDs[0]).forEach(g => g.highlight());

      this.tooltip.y = 35;

    } else {
      this.tooltip.y = 100;
    }
  }

  /**
   * Highlights the specified (comparison) gene and all reference homolog genes
   * @param {Gene} gene - the gene to have its reference homologs highlighted
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   * @param {boolean} simple - a default false flag indicating whether the
   *                                 call is from the overview or browser
   */
  highlightCompGene(gene: Gene, e: MouseEvent, simple: boolean = false): void {
    this.tooltip = {
      title: gene.symbol,
      content: gene.getTooltipData(),
      x: this.width / 2 - 75
    };

    if(!simple) {
      gene.highlight();

      // highlight gene's homologs in the reference
      this.getReferenceHomologs(gene.homologIDs).forEach(g => g.highlight());

      this.tooltip.y = 350;
    } else {
      this.tooltip.y = 100;
    }
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

    // hide the tooltip
    this.tooltip = null
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
      this.tooltip = {
        title: this.ref.name,
        content: block.getTooltipData(isComp),
        x: this.width / 2 - 75,
        y: isComp ? 350 : 70
      };
    }
  }

  /**
   * Shows a tooltip for the specified QTL
   * @param {QTLMetadata} qtl - the qtl to generate the tooltip for
   * @param {MouseEvent} e - the mouseover event to get cursor coordinates
   */
  hoverQTL(qtl: QTL, e: MouseEvent): void {
    this.tooltip = {
      title: qtl.symbol,
      content: qtl.getTooltipData(),
      x: this.width / 2 - 75,
      y: 66
    }
  }

  /**
   * Retrieves the information necessary to show gene data in the clicktip dialog
   * @param {Gene} gene - the gene clicked to retrieve data for
   */
  showDataForGene(gene: Gene): void {
    this.clicktip = {
      title: gene.symbol,
      content: gene.getClicktipData(),
      resources: gene.species === 'ref' ? this.ref.resources : this.comp.resources,
      id: gene.id
    };

    this.clicktipOpen = true;
  }


  // Getter Methods

  /**
   * Returns the list of synteny blocks in the reference genome
   */
  getGenomeBlocks(): SyntenyBlock[] { return this.data.genomeData; }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   */
  getChrLabelPos(chr: string): string {
    return this.translate([this.refGMap.getChrPxWidth(chr) * 0.5, 13.5]);
  }

  /**
   * Returns a list of reference genes that are in the current browser's view
   */
  getRefGenesInView(): Gene[] {
    return this.refGenes.filter(g => {
                           return g.isInRefView(this.refBPToPixels, this.width);
                         });
  }

  /**
   * Returns a list of reference genes that are homologous (have at least one
   * syntenic homolog)
   */
  getHomologousRefGenes(): Gene[] {
    return this.refGenes.filter(g => g.isHomologous());
  }

  /**
   * Returns a list of comparison genes that are in the current browser's view
   */
  getCompGenesInView(): Gene[] {
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
  getNonMatchedBlocks(): SyntenyBlock[] {
    return this.blocks.filter(block => !block.orientationMatches);
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

  /**
   * Returns the keys of the tooltip's content attribute
   */
  getTTItems(tooltip: any): string[] { return Object.keys(tooltip.content); }

  /**
   * Returns the height the tooltip should be based on the number of data items
   * it will contain
   */
  getTTHeight(): number { return this.getTTItems(this.tooltip).length * 11 + 23; }


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
   * @param {Feature[]} features - list of features for gene coloring
   */
  private getSyntenicBlocks(features: Feature[]): void {
    let refID = this.ref.getID();
    let compID = this.comp.getID();
    let colors = this.data.genomeColorMap;

    this.http.getChrSynteny(refID, compID, this.refChr)
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
   * @param {Feature[]} features - the selected features from the genome view
   */
  private getGenes(refID: string, compID: string, features: Feature[]): void {
    this.homRefGenes = [];
    let featureIDs = features.map(f => f.id);

    this.http.getHomologs(refID, compID, this.refChr)
             .subscribe(homologs => {
               this.selectedCompGenes = [];
               this.compGenes = homologs.map(h => {
                 h.sel = false;
                 // reduce the homologs attribute to array of reference gene IDs
                 h.homologs = h.homologs.map(rh => {
                   // while we're doing this, check each of the homolog IDs
                   // against the list of selected features to determine if this
                   // gene should be marked as selected
                   if(!h.sel) { h.sel = featureIDs.indexOf(rh.id) > -1; }
                   return rh.id;
                 });

                 return new Gene(h, this.trackHeight, this.ref.taxonID, this.blocks);
               }).filter(h => {
                 let syntenic = h.isSyntenic();

                 // while we're here
                 if(syntenic) {
                   // if the gene is syntenic, take note of the homolog ID(s) so
                   // that we can mark the reference genes accordingly
                   this.homRefGenes.push(...h.homologIDs);
                   // if the gene is marked as selected, push it to the selected
                   // comparison gene array
                   if(h.selected) { this.selectedCompGenes.push(h); }
                 }

                 return syntenic;
               });

               this.homRefGenes = Array.from(new Set(this.homRefGenes));
             });

    this.http.getGenes(refID, this.refChr)
             .subscribe(genes => {
               this.selectedRefGenes = [];

               this.refGenes = genes.map(g => {
                 // if homologous, add a homologID array attribute with its ID
                 g.homologs = this.homRefGenes.indexOf(g.id) > -1 ? [g.id] : [];
                 // add selected attribute if it is listed as selected
                 g.sel = featureIDs.indexOf(g.id) > -1;

                 let gene = new Gene(g, this.trackHeight, this.ref.taxonID);

                 // if the gene is selected, push it to the selected reference
                 // gene array
                 if(gene.selected) { this.selectedRefGenes.push(gene); }

                 return gene
               });

               this.arrangeQTLs(features.filter(f => !f.gene));

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
   * Assigns offset values and heights for all of the selected QTLs so that they
   * can be viewed without overlapping in both the chromosome view and block view
   * @param {any[]} qtls - the selected QTLs in the chromosome
   */
  arrangeQTLs(qtls: any[]): void {
    // list of points of interest for QTLs (e.g. start and end points of QTLs)
    let points = [];

    // stores what happens at each point; id of QTL involved and type:
    // 1 (QTL starting) or -1 (QTL ending)
    let pointData = {};

    // stores QTL ids that map to their index in the QTL array for quick reference
    let qtlLookup = {};

    // function to either create a new point or add a new QTL to an existing point
    let checkPoint = (loc, q, type) => {
      if(points.indexOf(loc) < 0) {
        points.push(loc);
        pointData[loc] = [{id: q.id, type: type}];
      } else {
        pointData[loc].push({id: q.id, type: type});
      }
    };

    if(qtls.length > 1) {
      qtls = qtls.sort((a, b) => a.start - b.start);

      // get start and stop points of each QTL
      qtls.forEach((q, i) => {
        qtlLookup[q.id] = i;
        // check each endpoint of QTL
        checkPoint(q.start, q, 1);
        checkPoint(q.end, q, -1);
      });

      // sort points so we're processing from left to right
      points = points.sort((a, b) => a - b);

      // keeps track of QTLs that have been assigned a lane
      let arranged = {};

      // represents vertically stacked spaces (lanes) that can be assigned one
      // QTL at a time; the list must always have at least one element (default
      // state is one false element to indicate that there is currently one lane
      // and it's available for assignment)
      let lanes = [false];

      // keeps track of how many lanes are currently in use
      let activeLanes = 0;

      // function to check if the lane at the specified index is the last in the array
      let hasNext = (i) => {
        // can't check !lanes[i] because a lanes might have a 'false' value
        // if they're empty and they're between assigned lanes
        if(typeof lanes[i] === "undefined") {
          return false;
        } else if(lanes[i]) {
          return true;
        }

        // if lanes[i] = false and that it's not the end of the lanes array
        return hasNext(i + 1);
      };

      let qtlsToWatch = [];
      let maxLanesToWatch = 0;

      // go through each start/end point and assign/free lanes, as appropriate
      points.forEach(p => {
        pointData[p].forEach(qtl => {
          if(qtl.type > 0) {
            let lane;
            let assigned = false;
            lanes.forEach((l, i) => {
              if(!l && !assigned) {
                lanes[i] = qtl.id;
                assigned = true;
                lane = i;
              }
            });

            // make a new lane if there wasn't an open lane
            if(!assigned) {
              lanes.push(qtl.id);
              lane = lanes.indexOf(qtl.id);
            }

            // store lane data for the QTL; the height can change after this
            // point, but the lane (which is used to calculate the y position
            // of the QTL) won't change
            arranged[qtl.id] = { lane: lane };
            qtlsToWatch.push(qtl.id);
          } else {
            let laneToClear = arranged[qtl.id].lane;
            lanes[laneToClear] = false;

            // clear out any trailing ('trailing' is the keyword) empty lanes
            if(lanes.length > 1) {
              lanes.forEach((l, i) => {
                if(!hasNext(i)) {
                  lanes.splice(i, 1);
                }
              });
            }
          }

          // if type = -1, this means a QTL is ending and an active lane is
          // getting freed up. If type = 1, we need to assign a QTL to a lane
          activeLanes += qtl.type;

          // if all available lanes are used, we need another one
          if(activeLanes > maxLanesToWatch) {
            maxLanesToWatch = activeLanes;
          }

          // if all lanes are available, empty the lanes
          if(activeLanes === 0) {
            qtlsToWatch = [];
            maxLanesToWatch = 0;
          } else if(qtl.type > 0) {
            // if we're adding another QTL, we'll need to make sure that all
            // current QTLs have a numLanes value or if the number of lanes is
            // increasing, then we need to update the value
            qtlsToWatch.forEach(q => {
              if(!arranged[q].numLanes || arranged[q].numLanes < maxLanesToWatch) {
                arranged[q].numLanes = maxLanesToWatch;
              }
            });
          }
        });
      });

      // take the calculated values and assign them to the raw QTL dictionary,
      // make a QTL instance from the result, and store them all
      this.selectedQTLs = Object.keys(qtlLookup).map(q => {
        let arrangeData = arranged[q];
        let index = qtlLookup[q];
        let laneHeight = this.trackHeight / arrangeData.numLanes;
        let indLaneHeight = (this.chromosomeViewHeight - 25) / arrangeData.numLanes;

        qtls[index].height = laneHeight;
        qtls[index].offset = laneHeight * arrangeData.lane;
        qtls[index].indOffset = (indLaneHeight * arrangeData.lane) - 2;

        return new QTL(qtls[index], this.staticRefBPToPixels);
      });
    } else {
      // set the single QTL's height to be the reference track height and offset
      // the indicator in the chromosome view to be in the center
      this.selectedQTLs = qtls.map(q => {
        q.height = this.trackHeight;
        q.offset = 0;
        q.indOffset = (this.chromosomeViewHeight - 25) / 2;

        return new QTL(q, this.staticRefBPToPixels);
      });
    }
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
                  .extent([[0, 12], [this.width, this.chromosomeViewHeight - 7]])
                  .on('brush', () => {
                    let e = d3.event;

                    // ignore brush via zoom occurrences
                    if(e.sourceEvent && e.sourceEvent.type === "zoom") return;

                    let s: number[] = e.selection;

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
  private getAxisTickValues(start: number, end: number): number[] {
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
  private getComparisonHomologs(homID: string): Gene[] {
    return this.compGenes.filter(g => g.homologIDs.indexOf(homID) >= 0);
  }

  /**
   * Returns a list of reference genes that have a homolog ID that matches
   * the any of specified homolog IDs of a comparison gene
   * @param {number[]} homIDs - the homolog IDs to search for reference matches
   */
  private getReferenceHomologs(homIDs: string[]): Gene[] {
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
