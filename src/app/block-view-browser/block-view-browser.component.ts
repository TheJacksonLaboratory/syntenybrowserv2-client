import { Component, OnInit } from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {BrowserInterval, Gene, SyntenyBlock} from '../classes/interfaces';
import {zoom} from 'd3';

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
  scale: number = 1;
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

    let chrSize = this.getRefChrSize();

    // set the range maxto 'width - 1' to keep the last tick line from hiding on the right side of the svg
    // this one is going to get updated with transformations
    this.refBPToPixels = this.createRefScale(chrSize, this.width);

    // this one stays the same (to be used for chromosome view)
    this.staticRefBPToPixels = this.createRefScale(chrSize, this.width);

    this.http.getChromosomeSynteny(reference.getID(), comparison.getID(), chr).subscribe(blocks => {
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

        this.createCompScaleForBlock(blockContent);

        return blockContent;
      });

      this.setInterval(0, chrSize);
      this.renderChromosomeViewAxis();

      this.http.getGenes(reference.getID(),comparison.getID(), chr).subscribe(genes => {
        this.referenceGenes = genes.map((gene, i) => this.createHomologID(gene, i));

        this.comparisonGenes = [].concat
                                 .apply([], this.referenceGenes.filter(gene => gene.homologs)
                                                               .map(gene => this.addHomologDetails(gene))
                                 ).filter(gene => gene.block_id);

        let that = this;
        let width = Number(d3.select('#browser-bg').attr('width'));

        let browser = d3.select('#browser')
                        .call(d3.zoom()
                                .scaleExtent([1, (chrSize / this.minimumIntervalSize)])
                                .extent([[0, 0], [width, 0]])
                                .duration(500)
                                .on('zoom', () => {
                                  let t = d3.event.transform;

                                  let tempStart = that.refBPToPixels.invert(that.descaleThis((0 - t.x), t.k));
                                  let tempEnd = that.refBPToPixels.invert(that.descaleThis((that.width - t.x), t.k));

                                  let tempSize = tempEnd - tempStart;

                                  // handles end cases to keep from scrolling/zooming too far
                                  if (tempStart >= 0 && tempEnd <= chrSize) {
                                    t = that.changeInterval(tempStart, tempEnd, chrSize, t, that);
                                    browser.attr('transform', t);
                                  } else if (tempStart < 0 && tempEnd <= chrSize) {
                                    t = that.changeInterval(0, tempSize, chrSize, t, that);
                                    browser.attr('transform', t);
                                  } else if (tempStart >= 0 && tempEnd > chrSize) {
                                    t = that.changeInterval(chrSize - tempSize, chrSize, chrSize, t, that);
                                    browser.attr('transform', t);
                                  }
                                })
                        );
      });
    });
  }

  /**
   * Returns the 'descaled' value of the specified value. NOTE: Let me explain the purpose of this as it is here as a result of the
   * mild trainwreck that is my adaptation of d3.zoom(), scaling g#browser scales all child elements as a result. This includes
   * heights and y-values of all elements. Thusly, in order to keep these heights and y-values from gettings scaled (the desired
   * behavior is x-oriented stretching) we negate the scaling done by d3.zoom by dividing by the current scale factor. ~ A.L.
   * @param {number} value - the value to get 'descaled'
   * @param {number} scaleFactor - the scaling factor, if passed, or null if not (in which case, we assume the scaling factor is this.scale
   */
  descaleThis(value: number|string, scaleFactor: number = null): number {
    return (scaleFactor) ? value / scaleFactor : value / this.scale;
  }

  /**
   * Changes the interval (bp positions of view) and returns an altered trans object included in d3.zoom to change these values.
   * YOU MAY BE ASKING: "BUT WHY DO WE HAVE TO MANUALLY CHANGE THESE VALUES? DOESN'T THAT DEFEAT THE PURPOSE OF USING D3.ZOOM?"
   * and the answer to that is "sort of" but let me explain, as I've been working with several different approaches for about a
   * week, give or take, and it's been a journey. Firstly, we are using the zoom function on g#browser where as in the previous
   * version, we were applying transformations to every single element individually. Here, we are scaling the group which trickles
   * down to all of the children elements. This saves us time and lines of code. However, the default zoom transformation ends up
   * transforming 2-dimensionally (x AND y) where we only need x transformation; that's why we have to set the y value to
   * browserOffset as we don't want elements within g#browser to move vertically. Next let's address the scale variable (k). I
   * didn't really want to futz around with this but after playing around with the default scaling variable, it really wasn't
   * cutting it and since we are limiting zooming and translation by bp comparison, I figureed we might as well ensure the scale
   * factor is following through with our other values. Lastly, our translate x variable has been the most troubling of them all
   * and let me tell you why. D3.ZOOM DOESN'T WANT TO ZOOM BASED ON YOUR MOUSE LOCATION AT ALL. I kept finding that whatever I
   * did, the more you zoom in, the view continued to inch towards 0 bp, which would most likely keep draggin teh user out of
   * their desired view. So I decided to take matters into my own hands and manhandle the x value of the zoom transformation.
   * If you feel like you can do this right, PLEASE. BE MY GUEST. BLOW MY MIND. I BEG YOU. ~ A.L.
   * @param {number} newStart - the new start value for the interval
   * @param {number} newEnd - the new end value for the interval
   * @param {number} chrSize - the size of the current chromosome
   * @param {any} trans - the transformation object generated by d3.zoom to alter
   * @param {any} comp - what would be referred to as 'this' in any other circumstances but we're using this method within a
    *                    d3.zoom function and the 'this' reference ends up getting lost
   */
  private changeInterval(newStart: number, newEnd: number, chrSize: number, trans: any, comp: any): any {
    // adjust the interval values
    comp.interval.start = newStart;
    comp.interval.end = newEnd;
    comp.interval.width = newEnd - newStart;

    // compute and return new transformation values
    comp.scale = 1 / (comp.interval.width / comp.getRefChrSize());

    trans.k = comp.scale;
    trans.x = -comp.refBPToPixels(comp.interval.start) * comp.scale;
    trans.y = comp.browserOffset;

    return trans;
  }

  /**
   * Renders the static axis for the chromosome view axis (must be done here and not in template as HTML doesn't recognize D3's custom
   * element. Plus we don't actually ever interact with it, so it's completely safe to generate here)
   */
  private renderChromosomeViewAxis(): void {
    // create the axis
    d3.select('.axis')
      .call(d3.axisBottom(this.staticRefBPToPixels) // the scale to use
              .tickValues(this.getAxisTickValues(this.chromosome)) // tick values to use
              .tickFormat((d: number) => Math.round(d / 1000000).toString() + " Mb")) // format for tick labels
      .selectAll('text')
        .attr('text-anchor', (d, i) => this.getAxisTickLabelPosition(i)); // set positional attr for tick labels

  }

  /**
   * Takes a chromsome value/name and generates a list of 11 values including 0 and the last BP of the chromosome where the other
   * 9 values are equally spaced locations for tick values on the chromosome view axis
   * @param {string} chr - value of current chromosome to be used to reference width
   */
  private getAxisTickValues(chr: string): Array<number> {
    let total = this.reference.genome[chr];
    let values = [];

    // add all but the last interval values to the list
    // total - 2 ensures the final tick isn't added by rounding error
    for(let i = 0; i < total - 2; i += total / 10) {
      values.push(Math.round(i));
    }

    values.push(total);

    return values;
  }

  /**
   * This is a quick method that basically just generates anchor position to assign to each tick mark. All tick marks minus the first
   * and last should have their labels centered whereas the first label should appear to the right of its tick mark and the last label
   * should appear to the left of its tick mark so as both will be completely visible
   * @param {number} index - the index of the tick we're checking
   */
  private getAxisTickLabelPosition(index: number): string {
    if(index === 0) { // if it's the first tick label:
      return 'start';
    } else if(index === 10) { // if it's the last tick label (we know the list is 11 elements long)
      return 'end';
    } else { // otherwise, use default value
      return 'middle';
    }
  }

  /**
   * Returns the RGBA value of the specified hex with the specified opacity (used from template so this method can't be private)
   * @param {string} hex - hex color value
   * @param {number} opacity - opacity decimal for the faded color
   */
  fadeColor = function(hex, opacity): string {
    let color;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      color = hex.substring(1).split("");
      if(color.length === 3){
        color = [color[0], color[0], color[1], color[1], color[2], color[2]];
      }
      color= "0x"+color.join("");
      return "rgba("+[(color>>16)&255, (color>>8)&255, color&255].join(",")+"," + opacity +")";
    }
    throw new Error("Bad Hex");
  };

  /**
   * Quick method that assigns the three interval-associated variables based on specified start and end numeric values; NOTE, I don't
   * use this method within the changeInterval method as it would require passing 'this' into it in order to use it. I'm not sayin we
   * can't do that, I'm just choosing not to at this moment in time. ~ A.L.
   * @param {number} start - the starting value (bp) of the interval
   * @param {number} end - the end value (bp) of the interval
   */
  private setInterval(start: number, end: number): void {
    this.interval = {
      start: start,
      end: end,
      width: end - start
    }
  }

  /**
   * Helper method used in this file as well as the template to quickly access the size of the current reference chromosome
   */
  getRefChrSize() {
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
    return 'M ' + this.refBPToPixels(block.ref_start) + ', ' + this.descaleThis(this.trackHeight) +
           ' L ' + this.refBPToPixels(block.ref_end) + ', ' + this.descaleThis(this.trackHeight + 50) +
           ' M ' + this.refBPToPixels(block.ref_end) + ', ' + this.descaleThis(this.trackHeight) +
           ' L ' + this.refBPToPixels(block.ref_start) + ', ' + this.descaleThis(this.trackHeight + 50) +
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
    return (gene.gene_start_pos >= block.true_orientation.comp_start && gene.gene_start_pos <= block.true_orientation.comp_end) ||
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
    return d3.scaleLinear().domain([0, BPwidth]).range([0, pixelWidth - 1]);
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
   * Returns the domain array necessary to create a D3 linear scale for the specified block and orientation
   * @param {SyntenyBlock} block - the block to create the scale's domain for
   * @param {string} orientationKey - 'true_orientation' or 'match_orientation', depending on what the user has currently selected
   */
  getCompScaleDomain(block: SyntenyBlock, orientationKey: string): Array<number> {
    return [block[orientationKey].comp_start, block[orientationKey].comp_end];
  }

  /**
   * Returns a readonly (because Webstorm's d3 inspections are weird) array of the pixel values for the start and end of a
   * syntenic block to create a scale range
   * @param {SyntenyBlock} block - the syntenic block to convert to pixel positions
   */
  getCompScaleRange(block: SyntenyBlock): ReadonlyArray<number> {
    return [this.refBPToPixels(block.ref_start), this.refBPToPixels(block.ref_end)]
  }

}
