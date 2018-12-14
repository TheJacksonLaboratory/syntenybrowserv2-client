import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {BrowserInterval, ComparisonMapping, ComparisonScaling, Metadata, QTLMetadata, SyntenyBlock} from '../classes/interfaces';
import {Axis, ScaleLinear} from 'd3';
import {Gene} from '../classes/gene';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent implements OnInit {
  reference: Species;
  comparison: Species;
  genomeColors: object;
  activeChromosomes: Array<string> = [];
  currentChromosome: string = null;

  chromosome: string;
  selectedFeatures = {
    reference: [],
    comparison: []
  };
  selectedQTLs: Array<QTLMetadata> = [];
  progress: number = 0;

  width: number = 1200;
  height: number = 500;
  chromosomeViewHeight = 80;
  browserOffset = 175;
  legendOffset = 450;
  trackHeight = 100;
  minimumIntervalSize = 500;

  interval: BrowserInterval;
  blocks: Array<SyntenyBlock>;
  blockStartPts: object = {};
  blockEndPts: object = {};
  referenceGenes: Array<Gene>;
  comparisonGenes: Array<Gene>;
  staticRefBPToPixels: ScaleLinear<number, number>;
  staticCompBPToPixels: ComparisonScaling = {
    match_orientation: {},
    true_orientation: {}
  };
  refBPToPixels: ScaleLinear<number, number>;
  compBPToPixels: ComparisonScaling = {
    match_orientation: {},
    true_orientation: {}
  };
  blockOrientation: string = 'match_orientation';


  constructor(private http: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit() { }

  /**
   * Renders the block view with the specified reference and comparison species, using the specified color dictionary for the
   * genomes, a list of features to highlight on the specified chromsome
   * @param {Species} reference - the reference species
   * @param {Species} comparison - the comparison species
   * @param {object} genomeColors - the genome color dictionary
   * @param {string} chr - the chromsome to get syntenic blocks and features for
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
    this.getSyntenicBlocks();

    // get gene data for the selected chromosome
    // KEEP AN EYE ON THIS. I'm fairly confident that http.getChromosomeSynteny() will return faster than http.getGenes()
    // but it is possible that we may run into a race condition in some weird case. It it becomes an issue, we can move
    // this directly after the binding of browser behaviors within the subscribe for http.getChromosomeSynteny().
    this.getGenes(features);
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
    this.currentChromosome = null;
    this.selectedFeatures.reference = [];
    this.selectedFeatures.comparison = [];
    this.selectedQTLs = [];
    this.staticCompBPToPixels.match_orientation = {};
    this.staticCompBPToPixels.true_orientation = {};
    this.compBPToPixels.match_orientation = {};
    this.compBPToPixels.true_orientation = {};
    this.activeChromosomes = [];
  }

  /**
   * Returns a list of the reference genes that are in the current interval
   */
  getRefGenesInView(): Array<Gene> {
    return this.referenceGenes.filter(gene => this.isInView(gene));
  }

  /**
   * Returns a comparison location of the start of the interval in view in the browser; if the start of the interval is within a
   * syntenic region, the location is a conversion of the reference location; if the location is outside of a region, the location
   * is the start of the left-most block in view
   */
  getCompStartForInterval(): any {
    // get the list of end positions of all the blocks and reverse so we start checking from the end of the chromsome
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
    if(this.interval.start <= startBlock.ref_end && this.interval.start >= startBlock.ref_start) {
      return {
        chr: startBlock.comp_chr,
        loc: Math.round(this.compBPToPixels[this.blockOrientation][startBlock.id].invert(this.refBPToPixels(this.interval.start)))
      };
    } else {
      return {
        chr: startBlock.comp_chr,
        loc: startBlock[this.blockOrientation].comp_start
      };
    }
  }

  /**
   * Returns a comparison location of the end of the interval in view in the browser; if the end of the interval is within a
   * syntenic region, the location is a conversion of the reference location; if the location is outside of a region, the location
   * is the end of the right-most block in view
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
    if(this.interval.start <= endBlock.ref_end && this.interval.start >= endBlock.ref_start) {
      return {
        chr: endBlock.comp_chr,
        loc: Math.round(this.compBPToPixels[this.blockOrientation][endBlock.id].invert(this.refBPToPixels(this.interval.start)))
      };
    } else {
      return {
        chr: endBlock.comp_chr,
        loc: endBlock[this.blockOrientation].comp_end
      };
    }
  }

  /**
   * Returns the absolute value of the scaled width of a syntenic block in pixels
   * @param {SyntenyBlock} block - the syntenic block to get the width for
   */
  getBlockWidth(block: SyntenyBlock): number {
    return Math.abs(this.refBPToPixels(block.ref_end) - this.refBPToPixels(block.ref_start));
  }

  /**
   * Returns the absolute value of the specified QTL based on the specified scale
   * @param {QTLMetadata} qtl - the specified QTL to calcule the width of
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the width
   */
  getQTLWidth(qtl: QTLMetadata, scale: ScaleLinear<number, number>): number {
    return Math.abs(scale(qtl.end) - scale(qtl.start));
  }

  /**
   * Returns the comparison scale matching the block ID of the specified gene
   * @param {Gene} gene - the gene to get the comparison scale for by the block ID of the block it's located in
   */
  getScale(gene: Gene): ScaleLinear<number, number> {
    return this.compBPToPixels[this.blockOrientation][gene.blockID];
  }

  /**
   * Returns the start position to be used of a comparison gene (based on orientation)
   * @param {Gene} gene - the gene to get the proper start point based on orientation
   */
  getStart(gene: Gene): number {
    return (this.blocks.filter(block => block.id === gene.blockID)[0].orientation_matches) ? gene.start : gene.end;
  }

  getStaticCompScale(gene: Gene): ScaleLinear<number, number> {
    return this.staticCompBPToPixels[this.blockOrientation][gene.blockID];
  }

  translate(dx: number, dy: number): string {
    return 'translate(' + dx + ', ' + dy + ')';
  }

  getLegendXTrans(): number {
    return (this.width - (((this.getCompChromosomes().length - 1) * 35) + 20)) / 2;
  }

  isChrActive(chr: string): boolean {
    return this.activeChromosomes.indexOf(chr) >= 0;
  }

  getLegendItemXTrans(chr: string): number {
    return this.getCompChromosomes().indexOf(chr) * 35;
  }

  getLegendItemOpacity(chr: string): number {
    return (this.isChrActive(chr)) ? 1 : 0.1;
  }

  getQTLMarkerYPos(qtl: QTLMetadata): number {
    return (this.selectedQTLs.map(qtl => qtl.qtl_symbol).indexOf(qtl.qtl_symbol) * 10) + 20;
  }

  setCurrentChr(chr: string): void {
    this.currentChromosome = chr;
  }

  clearCurrentChr(): void {
    this.currentChromosome = null;
  }

  getBlockColor(block: SyntenyBlock): number {
    return (!this.currentChromosome || block.comp_chr === this.currentChromosome) ? this.genomeColors[block.comp_chr] : '#AAA';
  }

  highlightRef(gene: Gene): void {
    gene.highlight();
    this.comparisonGenes.filter(g => g.homologIDs.indexOf(gene.homologIDs[0]) >= 0).forEach(g => g.highlight());
  }

  highlightComp(gene: Gene): void {
    gene.highlight();
    this.referenceGenes.filter(g => gene.homologIDs.indexOf(g.homologIDs[0]) >= 0).forEach(g => g.highlight());
  }

  unhighlight(): void {
    this.comparisonGenes.filter(gene => gene.highlighted).forEach(gene => gene.unhighlight());
    this.referenceGenes.filter(gene => gene.highlighted).forEach(gene => gene.unhighlight());
  }

  /**
   * Helper method used in this file as well as the template to quickly access the size of the current reference chromosome
   */
  getRefChrSize(): number {
    return this.reference.genome[this.chromosome];
  }

  /**
   * Returns the list of syntenic blocks where orientation between reference and comparison regions do not align
   */
  getNonMatchedBlocks(): Array<SyntenyBlock> {
    return this.blocks.filter(block => !block.orientation_matches)
  }

  /**
   * Returns the X-like path command for the orientation indicators between the reference and comparison tracks
   * @param {SyntenyBlock} block - the syntenic block to draw orientation indicators for
   */
  getOrientationIndPathCommand(block: SyntenyBlock): string {
    return 'M ' + this.refBPToPixels(block.ref_start) + ', ' + this.trackHeight +
           ' L ' + this.refBPToPixels(block.ref_end) + ', ' + (this.trackHeight + 39) +
           ' M ' + this.refBPToPixels(block.ref_end) + ', ' + this.trackHeight +
           ' L ' + this.refBPToPixels(block.ref_start) + ', ' + (this.trackHeight + 39) +
           ' Z';
  }

  /**
   * Returns true/false if the specified gene/features has been selected (shown in red) from the specified genome's
   * list of highlighted features
   * @param {Gene} gene - gene to check if it should be selected (shown in red)
   * @param {string} type - lookup key to search for features ('reference' if reference genome, 'comparison' if comparison genome)
   */
  isFeatureSelected(gene: any, type: string): boolean {
    return this.selectedFeatures[type].map(feature => feature.gene_symbol).indexOf(gene.gene_symbol) >= 0;
  }

  getCompChromosomes(): Array<string> {
    return Object.keys(this.comparison.genome);
  }

  private getSyntenicBlocks(): void {
    this.http.getChromosomeSynteny(this.reference.getID(), this.comparison.getID(), this.chromosome).subscribe(blocks => {
      // create list of necessary block data dictionaries
      this.blocks = blocks.map(block => {
        let blockContent = {
          ref_chr: block.ref_chr,
          ref_start: block.ref_start,
          ref_end: block.ref_end,
          comp_chr: block.comp_chr,
          orientation_matches: block.orientation_matches,
          match_orientation: {
            comp_start: (block.orientation_matches) ? block.comp_start : block.comp_end,
            comp_end: (block.orientation_matches) ? block.comp_end : block.comp_start
          },
          true_orientation: {
            comp_start: block.comp_start,
            comp_end: block.comp_end
          },
          id: block.id
        };

        // don't worry about repeats
        this.activeChromosomes.push(block.comp_chr);

        this.blockStartPts[block.ref_start] = blockContent;
        this.blockEndPts[block.ref_end] = blockContent;

        // create the comparison scaling function for the current block using new dictionary object
        this.createCompScaleForBlock(blockContent);

        this.staticCompBPToPixels.match_orientation[block.id] = d3.scaleLinear()
          .domain(this.getCompScaleDomain(blockContent, 'match_orientation'))
          .range(this.getCompScaleRange(blockContent));

        this.staticCompBPToPixels.true_orientation[block.id] = d3.scaleLinear()
          .domain(this.getCompScaleDomain(blockContent, 'true_orientation'))
          .range(this.getCompScaleRange(blockContent));

        return blockContent;
      });

      this.progress += 0.10;

      // create the chromosome view (static) axis
      this.renderChromosomeViewAxis();

      this.progress += 0.05;
    });
  }

  private getGenes(features: Array<any>): void {
    this.http.getGenes(this.reference.getID(), this.comparison.getID(), this.chromosome).subscribe(genes => {
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
              hom.block_id = this.getBlockForGene(hom);
            });
            return new Gene(gene, [i], true);
          }
        }

        return new Gene(gene, [i], false);
      });

      this.progress += 0.25;

      // create a list of comparison genes from the temp compGenes array, add the list of homolog IDs for each, as found from
      // homLookup, and add a block ID for genes in a syntenic region, then filter that list to only the genes that have a block ID
      this.comparisonGenes = compGenes.map(gene => {
        this.progress += (0.4 / length);
        return new Gene(gene, homIDs[gene.gene_symbol], gene.sel, this.getBlockForGene(gene))
      }).filter(gene => gene.isSyntenic());

      this.progress += 0.4;

      // get selected features
      this.selectedFeatures.reference = this.referenceGenes.filter(gene => gene.selected);
      this.selectedFeatures.comparison = this.comparisonGenes.filter(gene => gene.selected);
      this.selectedQTLs = features.filter(feature => feature.qtl_id);

      this.progress += 0.1;

      // set interval to roughly 5Mb with the first reference feature centered if features are selected, otherwise set interval to entire chr
      (this.selectedFeatures.reference.length > 0) ?
        this.setInterval(Math.max(0, this.selectedFeatures.reference[0].start - 2500000),
          Math.min(this.getRefChrSize(), this.selectedFeatures.reference[0].end + 2500000)) :
        this.setInterval(0, this.getRefChrSize());

      this.progress += 0.1;

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
    let brush = d3.brushX()
                  .extent([[0, 10], [this.width, this.chromosomeViewHeight - 4]])
                  .on('brush', () => {
                    // ignore brush via zoom occurrences
                    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;

                    let s = d3.event.selection;

                    // adjust refBPToPixels by scaling s's start, s[0], and end, s[1], with the static scale (used for chromosome view)
                    this.refBPToPixels.domain(s.map(this.staticRefBPToPixels.invert, this.staticRefBPToPixels));

                    // update the comparison scale dictionaries that use refBPToPixels to use new ref scale
                    this.blocks.forEach(block => this.createCompScaleForBlock(block));

                    // zoom the browser to same section
                    d3.select('#browser')
                      .call(zoom.transform, d3.zoomIdentity.scale(this.width / (s[1] - s[0])).translate(-s[0], 0));

                    this.setInterval(this.staticRefBPToPixels.invert(s[0]), this.staticRefBPToPixels.invert(s[1]));

                    // update the axis above the reference track (if interval starts at 0, format the first tick label)
                    this.renderBrowserAxis(s[0], browserAxis);
                  });

    let zoom = d3.zoom()
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
                   this.blocks.forEach(block => this.createCompScaleForBlock(block));

                   // get the start and end pixel and bp points of the current interval
                   let pxExtents: Array<number> = this.refBPToPixels.range().map(t.invertX, t);
                   let bpExtents: Array<number> = this.refBPToPixels.domain();

                   // move the brush in the chromosome view to match
                   d3.select('#chr-view-inv-cover').call(brush.move, pxExtents);

                   // update the interval values
                   this.setInterval(bpExtents[0], bpExtents[1]);

                   // update the axis above the reference track (if interval starts at 0, format the first tick label)
                   this.renderBrowserAxis(pxExtents[0], browserAxis);
                 });

    // bind the zoom behavior
    d3.select('#browser')
      .call(zoom);

    // bind the brush behavior and set the brush to match the current interval (either the entire chr or the focused section)
    d3.select('#chr-view-inv-cover')
      .call(brush)
      .call(brush.move, [this.staticRefBPToPixels(this.interval.start), this.staticRefBPToPixels(this.interval.end)]);
  }

  /**
   * Renders the static axis for the chromosome view (must be done here and not in template as HTML doesn't recognize D3's custom
   * element. Plus we don't actually ever interact with it, so it's completely safe to generate here)
   */
  private renderChromosomeViewAxis(): void {
    // create the axis
    d3.select('#chr-view-axis')
      .call(d3.axisBottom(this.staticRefBPToPixels) // the scale to use
        .tickValues(this.getAxisTickValues(0, this.reference.genome[this.chromosome])) // tick values to use
        .tickFormat((d: number) => Math.round(d / 1000000).toString() + " Mb")) // format for tick labels
      .selectAll('text')
        .attr('text-anchor', (d, i, x) => this.getAxisTickLabelPosition(i, x.length)); // set positional attr for tick labels

  }

  /**
   * Renders the dynamic axis for the browser (must be done here and not in template as HTML doesn't recognize D3's custom
   * element. Plus we don't actually ever interact with it, so it's completely safe to generate here)
   * @param {number} intervalStart - the bp location of the start of interval in view
   * @param {any} axis - the axis object for the browser
   */
  private renderBrowserAxis(intervalStart: number, axis: any): void {
    (intervalStart === 0) ? d3.select('#browser-axis').call(axis).select('text').attr('text-anchor', 'start') :
                            d3.select('#browser-axis').call(axis);
  }

  /**
   * Returns the id of the block that the specified gene occurs in or null if it doesn't occur in a block
   * @param {Gene} gene - the gene to get the block id for
   */
  private getBlockForGene(gene: any): string {
    let block = this.blocks.filter(block => block.comp_chr === gene.gene_chr && this.isInBlock(gene, block));
    return (block.length > 0) ? block[0].id : null;
  }

  /**
   * Returns true/false if the specified gene occurs in the specified block (takes into consideration orientation)
   * @param {Gene} gene - the gene to check for it's location in the specified block
   * @param {SyntenyBlock} block - the block to check that the specified gene is in
   */
  private isInBlock(gene: any, block: SyntenyBlock): boolean {
    return (gene.gene_start_pos >= block.true_orientation.comp_start && gene.gene_start_pos <= block.true_orientation.comp_end) &&
           (gene.gene_end_pos <= block.true_orientation.comp_end && gene.gene_end_pos >= block.true_orientation.comp_start)
  }

  private isInView(gene: Gene): boolean {
    return (gene.start >= this.interval.start && gene.start <= this.interval.end) ||
      (gene.end <= this.interval.end && gene.end >= this.interval.start)
  }

  /**
   * Creates two scaling functions, one for compBPToPixels' 'match_orientation' dictionary and one for it's 'true_orientation'
   * dictionary; the core difference between the two dictionaries is that 'match_orientation' contains scales from the
   * 'match_orientation' comp locations from the syntenic block data (meaning that if the orientation doesn't match, the start value
   * will be greater than the end value) and 'true_orientation' contains scales from the 'true_orientation' comp locations from the
   * syntenic block data (meaning that the start value will be less than the end value, regardless of orientation)
   * @param {SyntenyBlock} block - the block to create the scales for
   */
  private createCompScaleForBlock(block: SyntenyBlock): void {
    this.compBPToPixels.match_orientation[block.id] = d3.scaleLinear()
                                                        .domain(this.getCompScaleDomain(block, 'match_orientation'))
                                                        .range(this.getCompScaleRange(block));

    this.compBPToPixels.true_orientation[block.id] = d3.scaleLinear()
                                                       .domain(this.getCompScaleDomain(block, 'true_orientation'))
                                                       .range(this.getCompScaleRange(block));
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
   * Quick method that assigns the three interval-associated variables based on specified start and end numeric values; NOTE, I don't
   * use this method within the changeInterval method as it would require passing 'this' into it in order to use it. I'm not sayin we
   * can't do that, I'm just choosing not to at this moment in time. ~ A.L.
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
   * Takes a chromsome value/name and generates a list of 11 values including 0 and the last BP of the chromosome where the other
   * 9 values are equally spaced locations for tick values on the chromosome view axis
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
   * This is a quick method that basically just generates anchor position to assign to each tick mark. All tick marks minus the first
   * and last should have their labels centered whereas the first label should appear to the right of its tick mark and the last label
   * should appear to the left of its tick mark so as both will be completely visible
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

  /**
   * Returns the domain array necessary to create a D3 linear scale for the specified block and orientation
   * @param {SyntenyBlock} block - the block to create the scale's domain for
   * @param {string} orientationKey - 'true_orientation' or 'match_orientation', depending on what the user has currently selected
   */
  private getCompScaleDomain(block: SyntenyBlock, orientationKey: string): Array<number> {
    return [block[orientationKey].comp_start, block[orientationKey].comp_end];
  }

  /**
   * Returns a readonly (because Webstorm's d3 inspections are weird) array of the pixel values for the start and end of a
   * syntenic block to create a scale range
   * @param {SyntenyBlock} block - the syntenic block to convert to pixel positions
   */
  private getCompScaleRange(block: SyntenyBlock): ReadonlyArray<number> {
    return [this.refBPToPixels(block.ref_start), this.refBPToPixels(block.ref_end)];
  }
}
