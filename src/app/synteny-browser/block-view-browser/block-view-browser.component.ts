// d3 mouse events require defining unnamed callback functions (which is flagged by the
// func-names rule) and if the event referece is used in the callbacks 'this' needs to
// refer to the event, not the BlockViewBrowser component
/* eslint-disable func-names, @typescript-eslint/no-this-alias */

import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { BrowserInterval } from '../classes/browser-interval';
import { ApiService } from '../services/api.service';
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
import { GWASHit, GWASLocation } from '../classes/gwas-location';

@Component({
  selector: 'block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss'],
})
export class BlockViewBrowserComponent {
  // currently selected reference species
  ref: Species;

  // currently selected comparison species
  comp: Species;

  // legend class that generates the comparison chr legend below browser
  legend: Legend;

  // currently selected reference chromosome
  refChr: string;

  // specified interval that a user would enter to view
  refInterval = '';

  // settings for the block view including element visibility and orientation
  options: BlockViewBrowserOptions;

  // reference genes on the current reference chr that were selected in the feature search
  selectedRefGenes: Gene[] = [];

  // comparison genes syntenic to selected reference genes that were selected in the feature search
  selectedCompGenes: Gene[] = [];

  // (mouse ref only) QTLs that were selected in the feature search in the current reference chr
  selectedQTLs: QTL[] = [];

  // reference genes on the current reference chr that are affected by the block view filters
  filteredRefGenes: Gene[] = [];

  // comparison genes that are affected by the block view filters
  filteredCompGenes: Gene[] = [];

  // all currently active filters
  filters: Filter[] = [];

  // block view browser loading progress
  progress = 0;

  // d3 zooming handler
  zoom: d3.ZoomBehavior<any, any>;

  // d3 brushing handler
  brush: d3.BrushBehavior<any>;

  // width of the block view browser container
  width = 1200;

  // height of the blocke view browser container
  height = 430;

  // distance from top of SVG to the top of the chromosome view
  chromosomeViewOffset = 35;

  // height of the syntenic blocks in the chromosome view
  chromosomeViewHeight = 60;

  // distance from the top of the SVG to the top of the browser
  browserOffset = 150;

  // height of the syntenic blocks in the browser
  trackHeight = 80;

  // minimum genomic interval (in bp) that the user can zoom into
  minimumIntervalSize = 3000;

  // current visible interval in the browser
  interval: BrowserInterval;

  // all available cytogenetic bands for the current reference chr
  cytoBands: any[];

  // list of all syntenic blocks in the current reference chr
  blocks: SyntenyBlock[];

  // dictionary of all syntenic blocks accessible by block ID
  blockLookup: object = {};

  // all genes in the reference chromosome
  refGenes: Gene[];

  // all genes in the comparison syntenic regions
  compGenes: Gene[];

  // gene IDs of reference genes that are homologous
  homRefGenes: string[];

  // human GWAS locations either in the reference or comparison species
  // if reference, only locations in the reference chr, if comparison, only
  // locations in the syntenic regions from the comparison genome
  humanGWAS: GWASLocation[] = [];

  // scale used in chr view to draw reference indicators and syntenic blocks
  staticRefBPToPixels: d3.ScaleLinear<number, number>;

  // set of scales used in chr to draw comparison indicators
  staticCompBPToPixels: ComparisonScaling;

  // scale used to calculate pixel value from a base pair value
  refBPToPixels: d3.ScaleLinear<number, number>;

  // genome map used to generate the linear genome view above the chromosome view
  refGMap: LinearGenomeMap;

  // data for the currently "clicked" feature that should display in the dialog
  clicktip: any = null;

  // controls if the dialog containing feature metadata is visible
  clicktipOpen = false;

  // tooltip for genes and QTLs
  featureTip: any;

  // tooltip for syntenic blocks
  blockTip: any;

  // user-entered name they want their downloaded image saved as
  downloadFilename = '';

  // controls if the download dialog for the user to enter a filename is visible
  filenameModalOpen = false;

  // emits when the user wants to open the block view filters
  @Output() filter: EventEmitter<any> = new EventEmitter();

  // emits when the user wants to open the help dialog
  @Output() getHelp: EventEmitter<any> = new EventEmitter();

  constructor(
    private data: DataStorageService,
    private http: ApiService,
    private downloader: DownloadService,
    private cdr: ChangeDetectorRef,
  ) {
    this.options = {
      symbols: false,
      anchors: false,
      trueOrientation: false,
      GWAS: true,
    };
    this.staticCompBPToPixels = { match: {}, true: {} };
  }

  /**
   * Renders the block view with the current reference and comparison species,
   * and a list of features to highlight on the current chromosome
   */
  render(): void {
    this.reset();

    this.declareTooltips();

    this.ref = this.data.refSpecies;
    this.comp = this.data.compSpecies;
    this.refChr = this.data.features.chr;

    this.http.getChrCytoBands(this.ref.getID(), this.refChr).subscribe(bands => {
      this.cytoBands = bands;
    });

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
   * Links a feature tooltip that applies to QTLs and genes and their associated
   * indicators and a block tooltip that applies to synteny blocks that are too
   * narrow to display coordinates in the SVG
   */
  declareTooltips(): void {
    this.featureTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html((d: Gene | QTL | GWASLocation) => {
        const data = d.getTooltipData();

        if (d.isGene) {
          return (
            `<span style="font-size: 14px;"><b>${data.symbol}</b></span><br/>` +
            `<span><b>Gene ID:</b> ${data.id}</span><br/>` +
            `<span><b>Type:</b> ${data.type}</span><br/>` +
            `<span><b>Chromosome:</b> ${data.chr}</span><br/>` +
            `<span><b>Start:</b> ${data.start}</span><br/>` +
            `<span><b>End:</b> ${data.end}</span><br/>` +
            `<span><b>Strand:</b> ${data.strand}</span>`
          );
        }
        if (d.isQTL) {
          return (
            `<span style="font-size: 14px;"><b>${data.symbol}</b></span><br/>` +
            `<span><b>QTL ID:</b> ${data.id}</span><br/>` +
            `<span><b>Chromosome:</b> ${data.chr}</span><br/>` +
            `<span><b>Start:</b> ${data.start}</span><br/>` +
            `<span><b>End:</b> ${data.end}</span><br/>`
          );
        }
        // TODO: quality when those are filled from the API
        const hitsData = data.hits
          .map(
            h =>
              '<hr>' +
              `<span><b>ID:</b> ${h.ID}</span><br/>` +
              `<span><b>Gene:</b> ${h.Gene}</span><br/>` +
              `<span><b>Frequency:</b> ${h.Frequency}</span><br/>`,
          )
          .join('');

        return `${`<span style="font-size: 14px;"><b>Chr${data.chr}, ${data.loc}bp</b></span><br/>` +
          `<span><b>Num Hits:</b> ${data.numHits}</span><br/>`}${hitsData}`;
      });

    this.blockTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-5, 0])
      .html((d: SyntenyBlock, species: string) => {
        const data = d.getTooltipData(species === 'comp');
        const speciesName = species === 'comp' ? this.comp.commonName : this.ref.commonName;

        return (
          `<span style="font-size: 14px;"><b>${speciesName}</b></span><br/>` +
          `<span><b>Chromosome:</b> ${data.chr}</span><br/>` +
          `<span><b>Start:</b> ${data.start}</span><br/>` +
          `<span><b>End:</b> ${data.end}</span><br/>`
        );
      });

    d3.select('svg').call(this.featureTip);
    d3.select('svg').call(this.blockTip);
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
    const chrViewOverlay = document.querySelector('rect.selection');
    chrViewOverlay.setAttribute('fill', '#DDD');
    chrViewOverlay.setAttribute('stroke', '#000');
    chrViewOverlay.setAttribute('stroke-width', '1');

    const selectors =
      '#browser-axis line,#browser-axis path,#chr-view-axis line,#chr-view-axis path';
    document.querySelectorAll(selectors).forEach(obj => obj.setAttribute('stroke-width', '0.5'));

    document
      .querySelectorAll('#browser-axis text, #chr-view-axis text')
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
    this.brushView(
      Math.max(0, feature.start - 1000000),
      Math.min(this.getRefChrSize(), feature.end + 1000000),
    );
  }

  /**
   * Changes the current browser view to the interval emitted from the quick
   * navigation component validate that the start value isn't negative and the
   * end isn't past the reference chromosome's size
   */
  jumpToInterval(interval: number[]): void {
    const start = Math.max(interval[0], 0);
    const end = Math.min(interval[1], this.interval.refChrSize);
    this.brushView(start, end);
  }

  /**
   * Zooms the view in by a total of 30%, if the interval width would be at least
   * the minimum interval size; if not, zoom down to the minimum interval size
   */
  zoomIn(): void {
    const basesZoom = this.interval.width * 0.15;
    const intStart = this.interval.refStart;
    const intEnd = this.interval.refEnd;

    if (this.interval.width * 0.7 >= this.minimumIntervalSize) {
      this.brushView(intStart + basesZoom, intEnd - basesZoom);
    } else {
      const diff = (this.interval.width - this.minimumIntervalSize) / 2;
      this.brushView(intStart + diff, intEnd - diff);
    }
  }

  /**
   * Zooms the view out by a total of 30%, if chromosome boundaries aren't hit;
   * if zoom edges would go outside chromosome extents, zoom only to that extent
   */
  zoomOut(): void {
    const basesZoom = this.interval.width * 0.15;
    const intStart = this.interval.refStart;
    const intEnd = this.interval.refEnd;
    const chrEnd = this.getRefChrSize();

    // if the new width would still be a valid width, check for start and end points
    if (this.interval.width * 1.3 <= chrEnd) {
      // if both edges are inside chromosome start or end, zoom out 15% on each end
      if (intStart - basesZoom >= 0 && intEnd + basesZoom <= chrEnd) {
        this.brushView(intStart - basesZoom, intEnd + basesZoom);
        // if only new start edge of view is a problem,
        // set start to chromosome start and increment end
      } else if (intStart - basesZoom < 0) {
        this.brushView(0, intEnd + basesZoom);
        // if only new end edge of view is a problem,
        // set end to chromosome end and decrement start
      } else if (intEnd + basesZoom > chrEnd) {
        this.brushView(intStart - basesZoom, chrEnd);
      }
    } else {
      // get the difference of widths; divide by 2 to get the number for each edge
      const diff = (chrEnd - this.interval.width) / 2;

      // if both edges are in chromosome start or end, zoom out by diff on each end
      if (intStart - diff >= 0 && intEnd + diff <= chrEnd) {
        this.brushView(intStart - diff, intEnd + diff);
        // if only new start edge of view is a problem,
        // set start to chromosome start and increment end by 2 * diff
      } else if (intStart - diff < 0) {
        this.brushView(0, intEnd + 2 * diff);
        // if only new end edge of view is a problem,
        // set end to chromosome end and decrement start by 2 * diff
      } else if (intEnd + diff > chrEnd) {
        this.brushView(intStart - 2 * diff, chrEnd);
      }
    }
  }

  /**
   * Moves the view 15% of the current width to the left without changing the width
   */
  panLeft(): void {
    const basesPan = this.interval.width * 0.15;
    const intStart = this.interval.refStart;

    if (intStart - basesPan >= 0) {
      this.brushView(intStart - basesPan, this.interval.refEnd - basesPan);
    } else {
      this.brushView(0, this.interval.width);
    }
  }

  /**
   * Moves the view 15% of the current width to the right without changing the width
   */
  panRight(): void {
    const basesPan = this.interval.width * 0.15;
    const intStart = this.interval.refStart;
    const intEnd = this.interval.refEnd;

    if (intEnd + basesPan <= this.getRefChrSize()) {
      this.brushView(intStart + basesPan, intEnd + basesPan);
    } else {
      const diff = this.getRefChrSize() - intEnd;
      this.brushView(intStart + diff, this.getRefChrSize());
    }
  }

  /**
   * Highlights the specified (reference) gene and all comparison homolog genes
   * @param {Gene} gene - the gene to have its comparison homologs highlighted
   */
  highlightRefGene(gene: Gene): void {
    gene.highlight();

    // highlight gene's homologs comparison
    this.getComparisonHomologs(gene.homologIDs[0]).forEach(g => g.highlight());
  }

  /**
   * Highlights the specified (comparison) gene and all reference homolog genes
   * @param {Gene} gene - the gene to have its reference homologs highlighted
   */
  highlightCompGene(gene: Gene): void {
    gene.highlight();

    // highlight gene's homologs in the reference
    this.getReferenceHomologs(gene.homologIDs).forEach(g => g.highlight());
  }

  /**
   * Marks all genes that are currently highlighted as unhighighlighted
   */
  unhighlightGene(): void {
    // remove highlighted status of any genes marked as highlighted
    this.compGenes.filter(g => g.highlighted).forEach(g => g.unhighlight());
    this.refGenes.filter(g => g.highlighted).forEach(g => g.unhighlight());
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
      id: gene.id,
    };

    this.clicktipOpen = true;
  }

  /**
   * Retrieves the information necessary to show GWAS hit location data in the
   * clicktip dialog
   * @param {GWASLocation} loc - the hit location clicked to retrieve data for
   */
  showDataForHitLocation(loc: GWASLocation): void {
    const locData = loc.getClicktipData();

    this.clicktip = {
      title: `Chr${locData.chr}: ${locData.loc}bp`,
      hits: locData.hits
    };

    this.clicktipOpen = true;
  }

  /**
   * Returns the list of synteny blocks in the reference genome
   */
  getGenomeBlocks(): SyntenyBlock[] {
    return this.data.genomeData;
  }

  /**
   * Returns the translation string value for the label of a specified chromosome
   * @param {string} chr - the chromosome the label is for
   */
  getChrLabelPos(chr: string): string {
    // y = 13.5 will center the text vertically inside the chromosome
    return this.translate([this.refGMap.getChrPxWidth(chr) * 0.5, 13.5]);
  }

  /**
   * Returns a list of reference genes that are in the current browser's view
   */
  getRefGenesInView(): Gene[] {
    return this.refGenes.filter(g => g.isInRefView(this.refBPToPixels, this.width));
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
    if (this.compGenes) {
      return this.compGenes.filter(g =>
        g.isInCompView(this.getScale(g), this.width, this.options.trueOrientation),
      );
    }
  }

  /**
   * Returns the comparison scale matching the block ID of the specified feature
   * @param {Gene|GWASLocation} feature - the feature to get the comp scale for
   *                                     by its blockID
   */
  getScale(feature: Gene | GWASLocation): d3.ScaleLinear<number, number> {
    return this.blockLookup[feature.blockID].getScale(this.options.trueOrientation);
  }

  /**
   * Returns the scale of the syntenic block the specified comp gene is in
   * @param {Gene} gene - the gene to use to a block ID from
   */
  getStaticCompScale(gene: Gene): d3.ScaleLinear<number, number> {
    const type = this.options.trueOrientation ? 'true' : 'match';
    return this.staticCompBPToPixels[type][gene.blockID];
  }

  /**
   * Returns the size of the reference chromosome
   */
  getRefChrSize(): number {
    return this.ref.genome[this.refChr];
  }

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
    return `M${x},${start || 0}
            L${x},${start ? length + start : length}Z`;
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
    return `M${start || 0},${y}
            L${start ? length + start : length},${y}Z`;
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
    const refStart = this.refBPToPixels(gene.start);
    const refEnd = this.refBPToPixels(gene.end);
    const homologs = this.getComparisonHomologs(gene.homologIDs[0]);

    homologs.forEach(hom => {
      const scale = this.getScale(hom);
      const homStart = scale(hom.getStart(this.options.trueOrientation));
      const homEnd = scale(hom.getEnd(this.options.trueOrientation));

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
    return conditionTitle
      .replace(/=/g, ' = ')
      .replace(/!/g, '')
      .replace(/\+/g, ' ');
  }

  /**
   * Returns the keys of the tooltip's content attribute
   * @param {any} tooltipObject - the obect to get keys for
   */
  getTTItems(tooltipObject: any): string[] {
    return Object.keys(tooltipObject);
  }

  /**
   * Returns true if at least 1 QTL or gene is selected
   */
  featuresAreSelected(): boolean {
    return !!this.selectedQTLs.length || !!this.selectedRefGenes.length;
  }

  /**
   * Resets all of the core variables to make room for a new set of data
   */
  private reset(): void {
    this.refGenes = null;
    this.compGenes = null;
    this.progress = 0;
    this.blocks = null;
    this.blockLookup = {};
    this.cytoBands = [];
    this.refBPToPixels = null;
    this.staticRefBPToPixels = null;
    this.selectedRefGenes = [];
    this.selectedCompGenes = [];
    this.filteredRefGenes = [];
    this.filteredCompGenes = [];
    this.filters = []; // if we want to maintain filters between renders, remove
    this.selectedQTLs = [];
    this.humanGWAS = [];
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
    d3.select('#chr-view-inv-cover').call(this.brush.move, [
      this.staticRefBPToPixels(start),
      this.staticRefBPToPixels(end),
    ]);
  }

  /**
   * Gets the synteny information and constructs dictionaries with important
   * information for each syntenic region
   * @param {Feature[]} features - list of features for gene coloring
   */
  private getSyntenicBlocks(features: Feature[]): void {
    const refID = this.ref.getID();
    const compID = this.comp.getID();
    const colors = this.data.genomeColorMap;

    this.http.getChrSynteny(refID, compID, this.refChr).subscribe(blocks => {
      const activeChrs = [];
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
      this.legend = new Legend(this.comp.genome, colors, activeChrs, this.width);

      this.interval = new BrowserInterval(
        this.refChr,
        this.getRefChrSize(),
        blocks,
        this.refBPToPixels,
        this.options.trueOrientation,
      );

      this.progress += 0.4;

      // create the chromosome view (static) axis
      d3.select('#chr-view-axis')
        .call(
          d3
            .axisBottom(this.staticRefBPToPixels)
            .tickValues(this.getAxisTickValues(0, this.getRefChrSize()))
            .tickFormat((d: number) => `${Math.round(d / 1000000)} Mb`),
        )
        .selectAll('text')
        .attr('text-anchor', (d, i, x) => this.getLabelPos(i, x.length));

      this.getGWASLocations();
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
    const featureIDs = features.map(f => f.id);

    this.http.getHomologs(refID, compID, this.refChr).subscribe(homologs => {
      this.selectedCompGenes = [];

      this.progress += 0.3;

      this.compGenes = homologs
        .map(h => {
          h.sel = false;
          // reduce the homologs attribute to array of reference gene IDs
          h.homologs = h.homologs.map(rh => {
            // while we're doing this, check each of the homolog IDs
            // against the list of selected features to determine if this
            // gene should be marked as selected
            if (!h.sel) {
              h.sel = featureIDs.indexOf(rh.id) > -1;
            }
            return rh.id;
          });

          const blockInfo = this.getGeneBlock(h);
          h.blockID = blockInfo.blockID;
          h.orientationMatches = blockInfo.orientationMatches;

          return new Gene(h, this.trackHeight, this.ref.taxonID);
        })
        .filter(h => {
          const syntenic = h.isSyntenic();

          // while we're here
          if (syntenic) {
            // if the gene is syntenic, take note of the homolog ID(s) so
            // that we can mark the reference genes accordingly
            this.homRefGenes.push(...h.homologIDs);
            // if the gene is marked as selected, push it to the selected
            // comparison gene array
            if (h.selected) {
              this.selectedCompGenes.push(h);
            }
          }

          return syntenic;
        });

      this.homRefGenes = Array.from(new Set(this.homRefGenes));
    });

    this.http.getGenes(refID, this.refChr).subscribe(genes => {
      this.selectedRefGenes = [];
      this.progress += 0.3;

      this.refGenes = genes.map(g => {
        // if homologous, add a homologID array attribute with its ID
        g.homologs = this.homRefGenes.indexOf(g.id) > -1 ? [g.id] : [];
        // add selected attribute if it is listed as selected
        g.sel = featureIDs.indexOf(g.id) > -1;

        g.orientationMatches = null;

        const gene = new Gene(g, this.trackHeight, this.ref.taxonID);

        // if the gene is selected, push it to the selected reference gene array
        if (gene.selected) {
          this.selectedRefGenes.push(gene);
        }

        return gene;
      });

      this.arrangeQTLs(features.filter(f => !f.isGene));

      this.staticTooltipBehavior();

      // set interval to center around the first reference feature, if
      // features are selected, otherwise set interval to entire chr
      if (this.selectedRefGenes.length) {
        const mb = 2500000;
        const firstGene = this.selectedRefGenes[0];
        const start = Math.max(0, firstGene.start - mb);
        const end = Math.min(this.getRefChrSize(), firstGene.end + mb);

        this.interval.moveTo(start, end, this.refBPToPixels);
      } else {
        this.interval.moveTo(0, this.getRefChrSize(), this.refBPToPixels);
      }

      // set the zoom, brush and dynamic axis behaviors/interactions
      this.bindBrowserBehaviors();
      this.dynamicTooltipBehavior();
    });
  }

  /**
   * Gets any GWAS hits for human depending on if the human is reference or
   * comparison; if human is neither, then it won't get any data
   */
  private getGWASLocations(): void {
    const refID = this.ref.getID();
    const compID = this.comp.getID();
    // if the reference is human, get GWAS hits for the whole chromosome,
    // otherwise, we'll need the entire genome to filter through
    if (refID === '9606') {
      this.http.getChrGWASHits(refID, this.refChr, '0001360').subscribe(gwas => {
        const locations = {};

        gwas.forEach(h => {
          const locationID = `${h.chr}_${h.position}`;
          if (locations[locationID]) {
            locations[locationID].push(h);
          } else {
            locations[locationID] = [h];
          }
        });

        this.humanGWAS = (Object.values(locations) as GWASHit[][]).map(
          hits => new GWASLocation(hits),
        );
      });
    } else if (compID === '9606') {
      this.http.getGenomeGWASHits(compID, '0001360').subscribe(gwas => {
        const locations = {};

        gwas.forEach(h => {
          const blockID = this.getGWASBlock(h);

          if (blockID) {
            const locationID = `${h.chr}_${h.position}`;
            h.blockID = blockID;
            if (locations[locationID]) {
              locations[locationID].push(h);
            } else {
              locations[locationID] = [h];
            }
          }
        });

        this.humanGWAS = (Object.values(locations) as GWASHit[][]).map(
          hits => new GWASLocation(hits),
        );
      });
    }
  }

  /**
   * Sets tooltips for elements that aren't going to change; these include
   * indicators, QTLs, and synteny blocks since they aren't hidden at any point
   * in time (genes are though, so those are done dynamically)
   */
  private staticTooltipBehavior(): void {
    const bvb = this;
    const featureTip = bvb.featureTip;
    const blockTip = bvb.blockTip;

    this.cdr.detectChanges();

    // indicators in chromosome view
    d3.selectAll('.ref-selected-ind')
      .data(this.selectedRefGenes)
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    d3.selectAll('.ref-filtered-ind')
      .data(this.filteredRefGenes)
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    d3.selectAll('.comp-selected-ind')
      .data(this.selectedCompGenes)
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    d3.selectAll('.comp-filtered-ind')
      .data(this.filteredCompGenes)
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    d3.selectAll('.qtl-ind')
      .data(this.selectedQTLs)
      .on('mouseover', function(d: QTL) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    // QTLs
    d3.selectAll('.qtl')
      .data(this.selectedQTLs)
      .on('mouseover', function(d: QTL) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    // GWAS locations
    // vertical lines across the track
    d3.selectAll('.human-gwas')
      .data(this.humanGWAS)
      .on('mouseover', function(d: GWASLocation) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    // small squares at the top of vertical lines above the track
    d3.selectAll('.human-gwas-handle')
      .data(this.humanGWAS)
      .on('mouseover', function(d: GWASLocation) {
        featureTip.show(d, this);
      })
      .on('mouseout', function() {
        featureTip.hide();
      });

    // syntenic blocks
    d3.selectAll('.ref-block')
      .data(this.blocks)
      .on('mouseover', function(d: SyntenyBlock) {
        if (d.getPxWidth() <= 125) {
          blockTip.show(d, 'ref', this);
        }
      })
      .on('mouseout', function() {
        blockTip.hide();
      });

    d3.selectAll('.comp-block')
      .data(this.blocks)
      .on('mouseover', function(d: SyntenyBlock) {
        if (d.getPxWidth() <= 125) {
          blockTip.show(d, 'comp', this);
        }
      })
      .on('mouseout', function() {
        blockTip.hide();
      });
  }

  /**
   * Sets tooltips for genes; this function needs to be called every time the
   * block view browser is manipulated to change what's being viewed. Since the
   * genes rendered are using *ngIf, genes that are not in that array DO NOT
   * EXIST at a given moment unless they are returned in the array that returns
   * only genes in view. Thus, the data for genes needs to be passed into the
   * DOM elements every time the view changes to ensure that elements that
   * weren't previously in view have data (and the correct data)
   */
  private dynamicTooltipBehavior(): void {
    const bvb = this;
    const featureTip = bvb.featureTip;

    this.cdr.detectChanges();

    d3.selectAll('.ref-gene')
      .data(this.getRefGenesInView())
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
        bvb.highlightRefGene(d);
      })
      .on('mouseout', function() {
        featureTip.hide();
        bvb.unhighlightGene();
      });

    d3.selectAll('.comp-gene')
      .data(this.getCompGenesInView())
      .on('mouseover', function(d: Gene) {
        featureTip.show(d, this);
        bvb.highlightCompGene(d);
      })
      .on('mouseout', function() {
        featureTip.hide();
        bvb.unhighlightGene();
      });
  }

  /**
   * Returns the array of QTLs with added data about offset and height
   * @param {any[]} qtls - an array of QTLs
   */
  private arrangeQTLs(qtls: any[]): void {
    // list of points of interest for QTLs (e.g. start and end points of QTLs)
    let points = [];

    // stores what happens at each point; id of QTL involved and type:
    // 1 (QTL starting) or -1 (QTL ending)
    const pointData = {};

    // stores QTL ids that map to their index in the QTL array for quick reference
    const qtlLookup = {};

    // function to either create a new point or add a new QTL to an existing point
    const checkPoint = (loc, q, type): void => {
      if (points.indexOf(loc) < 0) {
        points.push(loc);
        pointData[loc] = [{ id: q.id, type }];
      } else {
        pointData[loc].push({ id: q.id, type });
      }
    };

    if (qtls.length > 1) {
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
      const arranged = {};

      // represents vertically stacked spaces (lanes) that can be assigned one
      // QTL at a time; the list must always have at least one element (default
      // state is one false element to indicate that there is currently one lane
      // and it's available for assignment)
      const lanes = [false];

      // keeps track of how many lanes are currently in use
      let activeLanes = 0;

      // function to check if the lane at the specified index is the last in the array
      const hasNext = (i): boolean => {
        // can't check !lanes[i] because a lanes might have a 'false' value
        // if they're empty and they're between assigned lanes
        if (typeof lanes[i] === 'undefined') {
          return false;
        }
        if (lanes[i]) {
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
          if (qtl.type > 0) {
            let lane;
            let assigned = false;
            lanes.forEach((l, i) => {
              if (!l && !assigned) {
                lanes[i] = qtl.id;
                assigned = true;
                lane = i;
              }
            });

            // make a new lane if there wasn't an open lane
            if (!assigned) {
              lanes.push(qtl.id);
              lane = lanes.indexOf(qtl.id);
            }

            // store lane data for the QTL; the height can change after this
            // point, but the lane (which is used to calculate the y position
            // of the QTL) won't change
            arranged[qtl.id] = { lane };
            qtlsToWatch.push(qtl.id);
          } else {
            const laneToClear = arranged[qtl.id].lane;
            lanes[laneToClear] = false;

            // clear out any trailing ('trailing' is the keyword) empty lanes
            if (lanes.length > 1) {
              lanes.forEach((l, i) => {
                if (!hasNext(i)) {
                  lanes.splice(i, 1);
                }
              });
            }
          }

          // if type = -1, this means a QTL is ending and an active lane is
          // getting freed up. If type = 1, we need to assign a QTL to a lane
          activeLanes += qtl.type;

          // if all available lanes are used, we need another one
          if (activeLanes > maxLanesToWatch) {
            maxLanesToWatch = activeLanes;
          }

          // if all lanes are available, empty the lanes
          if (activeLanes === 0) {
            qtlsToWatch = [];
            maxLanesToWatch = 0;
          } else if (qtl.type > 0) {
            // if we're adding another QTL, we'll need to make sure that all
            // current QTLs have a numLanes value or if the number of lanes is
            // increasing, then we need to update the value
            qtlsToWatch.forEach(q => {
              if (!arranged[q].numLanes || arranged[q].numLanes < maxLanesToWatch) {
                arranged[q].numLanes = maxLanesToWatch;
              }
            });
          }
        });
      });

      // take the calculated values and assign them to the raw QTL dictionary,
      // make a QTL instance from the result, and store them all
      this.selectedQTLs = Object.keys(qtlLookup).map(q => {
        const arrangeData = arranged[q];
        const index = qtlLookup[q];
        const laneHeight = this.trackHeight / arrangeData.numLanes;
        const indLaneHeight = (this.chromosomeViewHeight - 25) / arrangeData.numLanes;

        qtls[index].height = laneHeight;
        qtls[index].offset = laneHeight * arrangeData.lane;
        qtls[index].indOffset = indLaneHeight * arrangeData.lane - 2;

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
    const chrSize = this.getRefChrSize();

    // create an axis using the dynamic scale with more precise tick labels in Mb
    const browserAxis = d3
      .axisTop(this.refBPToPixels)
      .tickSizeOuter(0)
      .tickFormat((d: number) => `${d / 1000000}Mb`);

    /*
    CREDIT: I would not have been able to get these behaviors so clean and
            concise without dear Mike Bostock's example, found here:
            https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172.
            All hail Mike Bostock!

          ~ A.L.
     */
    this.brush = d3
      .brushX()
      .extent([
        [0, 12],
        [this.width, this.chromosomeViewHeight - 7],
      ])
      .on('brush', () => {
        const e = d3.event;

        // ignore brush via zoom occurrences
        if (e.sourceEvent && e.sourceEvent.type === 'zoom') return;

        const s: number[] = e.selection;

        // adjust refBPToPixels by scaling start, s[0], and end, s[1],
        // with static scale (used for chromosome view)
        this.refBPToPixels.domain(s.map(this.staticRefBPToPixels.invert, this.staticRefBPToPixels));

        // update the comparison scale dictionaries to use new ref scale
        this.blocks.forEach(b => b.setScales(this.refBPToPixels));

        // zoom the browser to same section
        d3.select('#browser').call(
          this.zoom.transform,
          d3.zoomIdentity.scale(this.width / (s[1] - s[0])).translate(-s[0], 0),
        );

        this.interval.moveTo(
          this.staticRefBPToPixels.invert(s[0]),
          this.staticRefBPToPixels.invert(s[1]),
          this.refBPToPixels,
        );

        // update the axis above the reference track
        d3.select('#browser-axis').call(browserAxis);

        this.dynamicTooltipBehavior();
      });

    this.zoom = d3
      .zoom()
      .scaleExtent([1, chrSize / this.minimumIntervalSize])
      .translateExtent([
        [0, 0],
        [this.width, this.height],
      ])
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .on('zoom', () => {
        const e = d3.event;

        // ignore zoom via brush occurrences
        if (e.sourceEvent && e.sourceEvent.type === 'brush') return;

        const t = e.transform;

        // adjust the refBPToPixels using a t's rescaled x on the
        // static scale (used for chromosome view)
        this.refBPToPixels.domain(t.rescaleX(this.staticRefBPToPixels).domain());

        // update the comparison scale dictionaries to use new ref scale
        this.blocks.forEach(b => b.setScales(this.refBPToPixels));

        // get start and end pixel and bp points of the current interval
        const pxExtents = this.refBPToPixels.range().map(t.invertX, t);
        const bpExtents = this.refBPToPixels.domain();

        // move the brush in the chromosome view to match
        d3.select('#chr-view-inv-cover').call(this.brush.move, pxExtents);

        // update the interval values
        this.interval.moveTo(bpExtents[0], bpExtents[1], this.refBPToPixels);

        // update the axis above the reference track
        d3.select('#browser-axis').call(browserAxis);

        this.dynamicTooltipBehavior();
      });

    // bind the zoom behavior
    d3.select('#browser').call(this.zoom);

    // bind the brush behavior and set the brush to match the current interval
    // (either the entire chr or the focused section)
    d3.select('#chr-view-inv-cover')
      .call(this.brush)
      .call(this.brush.move, [
        this.staticRefBPToPixels(this.interval.refStart),
        this.staticRefBPToPixels(this.interval.refEnd),
      ]);
  }

  /**
   * Returns a linear scale that will convert a genomic location or distance to
   * pixels (or the other way around if inverted)
   * @param {number} BPwidth - the size of the current reference chromosome
   */
  private getRefScale(BPwidth: number): d3.ScaleLinear<number, number> {
    // set the range max to 'width - 1' to keep the last tick line of axes
    // from hiding on the right side of the svg
    return d3
      .scaleLinear()
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
    const values = [];

    // add all but the last interval values to the list
    // total - 2 ensures the final tick isn't added by rounding error
    for (let i = start; i < end - 2; i += (end - start) / 10) {
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
    if (index === 0) {
      return 'start';
    }
    if (index === listLength - 1) {
      return 'end';
    }
    return 'middle';
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
   * Returns a list of reference genes that have a homolog ID that matches any of
   * specified homolog IDs of a comparison gene
   * @param {number[]} homIDs - the homolog IDs to search for reference matches
   */
  private getReferenceHomologs(homIDs: string[]): Gene[] {
    return this.refGenes.filter(g => {
      let match = false;

      for (let h = 0; h < g.homologIDs.length; h += 1) {
        if (homIDs.indexOf(g.homologIDs[h]) >= 0) {
          match = true;
          break;
        }
      }

      return match;
    });
  }

  /**
   * Return the block ID and orientation boolean for the syntenic block the gene
   * is located in; if the block doesn't fully contain the gene, the returned
   * blockID and orientation value will both be null
   * @param {gene: Gene} gene - the gene to get block info for
   */
  private getGeneBlock(gene: Gene): BlockInfo {
    const blk = this.blocks.filter(b => b.matchesCompChr(gene.chr) && b.contains(gene));

    const blockID = blk.length ? blk[0].id : null;
    const orientationMatches = blockID ? blk[0].orientationMatches : null;

    return { blockID, orientationMatches };
  }

  /**
   * Returns the ID of the syntenic block that contains the GWAS location; if the
   * block doesn't contain the gene, the returned value will be null
   * @param {GWASHit} hit - the hit to get the block location for
   */
  private getGWASBlock(hit: GWASHit): string {
    const blk = this.blocks.filter(
      b => b.matchesCompChr(hit.chr) && hit.position >= b.getStart() && hit.position <= b.getEnd(),
    );

    return blk.length ? blk[0].id : null;
  }
}

export interface ComparisonScaling {
  match: object;
  true: object;
}

export interface BlockViewBrowserOptions {
  symbols: boolean;
  anchors: boolean;
  trueOrientation: boolean;
  GWAS: boolean;
}

export interface BlockInfo {
  blockID: string;
  orientationMatches: boolean;
}
