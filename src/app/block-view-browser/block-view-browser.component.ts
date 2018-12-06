import { Component, OnInit } from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {BrowserInterval, Gene, SyntenyBlock} from '../classes/interfaces';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent implements OnInit {
  reference: Species;
  comparison: Species;
  genomeColors: any;

  chromosome: string;
  selectedFeatures: Array<string>;

  width: number = 1200;
  height: number = 500;
  chromosomeViewHeight = 80;
  browserOffset = 175;
  trackHeight = 100;
  minimumIntervalSize = 500000;

  interval: BrowserInterval;
  blocks: Array<SyntenyBlock>;
  referenceGenes: Array<any>;
  comparisonGenes: Array<any>;
  staticRefBPToPixels: any;
  refBPToPixels: any;
  compBPToPixels: any = {
    match_orientation: {},
    true_orientation: {}
  };
  blockOrientation: string = 'match_orientation';


  constructor(private http: ApiService) { }

  ngOnInit() { }

  render(reference: Species, comparison: Species, genomeColors: any, chr: string, features: Array<string>): void {
    this.reference = reference;
    this.comparison = comparison;
    this.genomeColors = genomeColors;

    this.chromosome = chr;
    this.selectedFeatures = features;

    // this one is going to get updated with transformations
    this.refBPToPixels = this.createRefScale(this.getRefChrSize(), this.width);

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.createRefScale(this.getRefChrSize(), this.width);

    // get syntenic block data
    this.http.getChromosomeSynteny(reference.getID(), comparison.getID(), chr).subscribe(blocks => {
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

        // create the comparison scaling function for the current block using new dictionary object
        this.createCompScaleForBlock(blockContent);

        return blockContent;
      });

      // TODO: check for features; if there are features passed, determine an interval from there, otherwise, load entire chr
      this.setInterval(0, this.getRefChrSize());

      // create the chromosome view (static) axis
      this.renderChromosomeViewAxis();

      // set the zoom, brush and dynamic axis behaviors/interactions
      this.bindBrowserBehaviors();
    });

    // get gene data for the selected chromosome
    // KEEP AN EYE ON THIS. I'm fairly confident that http.getChromosomeSynteny() will return faster than http.getGenes()
    // but it is possible that we may run into a race condition in some weird case. It it becomes an issue, we can move
    // this directly after the binding of browser behaviors within the subscribe for http.getChromosomeSynteny().
    this.http.getGenes(reference.getID(),comparison.getID(), chr).subscribe(genes => {
      // add a homolog id to all of the reference genes
      this.referenceGenes = genes.map((gene, i) => this.createHomologID(gene, i));

      // create a list of comparison genes from the reference genes' homolog arrays, add the homolog id of the gene's reference
      // homolog, then filter that list to only the comparison genes that are located within a syntenic region
      this.comparisonGenes = [].concat
                               .apply([], this.referenceGenes.filter(gene => gene.homologs)
                                                             .map(gene => this.addHomologDetails(gene))
                               ).filter(gene => gene.block_id);
    });
  }



  /**
   * Returns the absolute value of the scaled width of a syntenic block in pixels
   * @param {SyntenyBlock} block - the syntenic block to get the width for
   */
  getBlockWidth(block: SyntenyBlock): number {
    return Math.abs(this.refBPToPixels(block.ref_end) - this.refBPToPixels(block.ref_start));
  }

  /**
   * Returns the absolute value of the scaled width of a gene in pixels
   * @param {Gene} gene - the gene to get the width for
   */
  getGeneWidth(gene: Gene): number {
    return Math.abs(this.refBPToPixels(gene.end_pos) - this.refBPToPixels(gene.start_pos));
  }

  /**
   * Returns a scaled width for the specified comparison gene using the respective scaling dictionary. NOTE: occasionally the scaling
   * functions will return negative values so we always return the absolute value of the calculated width as the width will always be
   * a positive value, regardless of orientation ~ A.L.
   * @param {Gene} gene - the gene to calculate the scaled width for
   */
  getCompWidth(gene: Gene): number {
    return Math.abs(this.compBPToPixels[this.blockOrientation][gene.block_id](gene.gene_end_pos) -
      this.compBPToPixels[this.blockOrientation][gene.block_id](gene.gene_start_pos));
  }

  /**
   * Returns the scaled x-value for the specified comparison gene using the respective scaling dictionary
   * @param {Gene} gene - the gene to calculate the scaled x-value for
   */
  getCompX(gene: Gene): number {
    // determine if the block the gene occurs in matches the reference in orientation; if it does, calculate the x-value
    // from the gene's start, else, use the gene's end
    let start = (this.blocks.filter(block => block.id === gene.block_id)[0].orientation_matches) ? gene.gene_start_pos : gene.gene_end_pos;

    return this.compBPToPixels[this.blockOrientation][gene.block_id](start);
  }

  /**
   * Returns the rgba value of the specified hex with the specified opacity (used from template so this method can't be private)
   * @param {string} hex - hex color value
   * @param {number} opacity - opacity decimal for the faded color
   */
  fadeColor(hex, opacity): string {
    let color = hex.substring(1).split("");

    // if the hex is only 3 characters, convert to 6
    if(color.length === 3){
      color = [color[0], color[0], color[1], color[1], color[2], color[2]];
    }

    // make into a bit string
    color= "0x"+color.join("");

    // return the conversion joined with the opacity in rgba format
    return "rgba("+[(color>>16)&255, (color>>8)&255, color&255].join(",")+"," + opacity +")";
  };

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
           ' L ' + this.refBPToPixels(block.ref_end) + ', ' + (this.trackHeight + 50) +
           ' M ' + this.refBPToPixels(block.ref_end) + ', ' + this.trackHeight +
           ' L ' + this.refBPToPixels(block.ref_start) + ', ' + (this.trackHeight + 50) +
           ' Z';
  }

  /**
   * Returns a y-value based on genomic location (used to reduce overlap of genes in the tracks)
   * @param {number} bp - a genomic location to be converted
   */
  jitter(bp: number): number {
    // 1.12 gets us close enough to edges without any elements overflowing
    let range = this.trackHeight / 1.12;
    // 1.13 pushes all elements down slightly to accomodate for the labels
    let offset = (((bp % 1000) / 1000) * range) - range / 1.13;

    return ((this.trackHeight - 10) / 1.12 + offset);
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
        let pxExtents = this.refBPToPixels.range().map(t.invertX, t);
        let bpExtents = this.refBPToPixels.domain();

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
   */
  private renderBrowserAxis(intervalStart: number, axis: any): void {
    (intervalStart === 0) ? d3.select('#browser-axis').call(axis).select('text').attr('text-anchor', 'start') :
      d3.select('#browser-axis').call(axis);
  }

  /**
   * Returns the id of the block that the specified gene occurs in or null if it doesn't occur in a block
   * @param {Gene} gene - the gene to get the block id for
   */
  private determineBlockForGene(gene: Gene): string {
    let block = this.blocks.filter(block => block.comp_chr === gene.gene_chr && this.isInBlock(gene, block));
    return (block.length > 0) ? block[0].id : null;
  }

  /**
   * Returns true/false if the specified gene occurs in the specified block (takes into consideration orientation)
   * @param {Gene} gene - the gene to check for it's location in the specified block
   * @param {SyntenyBlock} block - the block to check that the specified gene is in
   */
  private isInBlock(gene: Gene, block: SyntenyBlock): boolean {
    return (gene.gene_start_pos >= block.true_orientation.comp_start && gene.gene_start_pos <= block.true_orientation.comp_end) &&
           (gene.gene_end_pos <= block.true_orientation.comp_end && gene.gene_end_pos >= block.true_orientation.comp_start)
  }

  /**
   * Returns the same gene as the one passed into the method but with an altered homolog list
   * @param {Gene} gene - the reference gene of the homologs we're adding details for
   */
  private addHomologDetails(gene: Gene): Array<Gene> {
    return gene.homologs.map(g => {
      // assign the homolog id from the reference gene
      g['homolog_id'] = gene.homolog_id;

      // determine which id of the block the comparison gene is located in
      let block = this.determineBlockForGene(g);

      // if gene is located in a block (some aren't, so this is key), assign the block id to the comparison gene
      if(block) {
        g['block_id'] = block;
      }

      return g;
    });
  }

  /**
   * Returns the same gene as the one passed into the method but altered; if the gene doesn't have any homologs, get rid of the
   * homologs key/value pair, otherwise, assign a homolog id using the specified index (which is autogenerated index generated by .map
   * from the parent function
   * @param {Gene} gene - the gene to check for homologs
   * @param {number} i - the autogenerated value that will be made a homolog id if the specified gene has homologs to keep track of
   */
  private createHomologID(gene: Gene, i: number): Gene {
    // if there aren't any homologs, get rid of the empty array
    if(gene.homologs.length === 0) {
      delete gene.homologs;
    } else { // if there are homologs, assign a homolog id (by index)
      gene['homolog_id'] = i;
    }

    return gene;
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
  private createRefScale(BPwidth: number, pixelWidth: number): any {
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
