import { scaleLinear } from 'd3-scale';
import { SyntenyBlock } from './synteny-block';

export class LinearGenomeMap {
  spacing = 8; // spacing in px between chromosomes

  bpToPx: number;

  pxToBP: number;

  private scales = {};

  private sizes: number[];

  /**
   * Creates a genome map object that stores scaling functions for each
   * chromosome in the genome and can convert genomic positions (bp) to px
   * @param {any} chromosomes - a dictionary with keys being chromosome values,
   *                            and values being chromosome sizes
   * @param {number} width - the horizontal space allowed for the linear map
   */
  constructor(chromosomes: any, width: number) {
    this.sizes = Object.values(chromosomes);
    const chrs = Object.keys(chromosomes);

    // total number of BP of genome
    const totalGenomeLength = this.getSummation(this.sizes);

    // number of px taken by genome
    const pxGenome = width - this.spacing * (chrs.length - 1);

    // Px/Rad conversions
    this.bpToPx = pxGenome / Number(totalGenomeLength);
    this.pxToBP = Number(totalGenomeLength) / pxGenome;

    // for each chromosomes, create a scale we can use to determine locations
    // and sized of elements within each chromosome section in the plot
    let bp = 0;

    chrs.forEach((chr, i) => {
      // get starting point for the chromosome in px
      const start = this.spacing * i + bp * this.bpToPx;

      // get the end point by calculating the width and adding to the start
      const end = start + this.bpToPx * chromosomes[chr];

      // assign the scale of the result (domain: genomic bp, range: radians)
      this.scales[chr] = scaleLinear()
        .domain([0, chromosomes[chr]])
        .range([start, end]);

      // increment bp so that we know where to start calculating radians
      // for the next chromosome
      bp += chromosomes[chr];
    });
  }

  /**
   * Returns a pixel x value of a genomic position (in bp)
   * @param {string} chr - chromosome the specified position (bp) is in
   * @param {number} bp - the position (in bp) to be converted
   */
  bpToPxLocation(chr: string, bp: number): number {
    return this.scales[chr](bp);
  }

  /**
   * Returns a pixel x value of a genomic position (in bp) for a syntenic block
   * @param {SyntenyBlock} block - the syntenic block to get the x value for
   */
  getBlockStart(block: SyntenyBlock): number {
    return this.scales[block.refChr](block.refStart);
  }

  /**
   * Returns the pixel width for the specified synteny block
   * @param {SyntenyBlock} block - the syntenic block to get the width for
   */
  getBlockWidth(block: SyntenyBlock): number {
    const scale = this.scales[block.refChr];
    return scale(block.refEnd) - scale(block.refStart);
  }

  /**
   * Returns the size of the specified chromosome in pixels
   * @param {string} chr - the chromosome to get pixel size for
   */
  getChrPxWidth(chr: string): number {
    const range = this.scales[chr].range();
    return range[1] - range[0];
  }

  /**
   * Returns the pixel value for the start position of the chromosome at the
   * specified index (which includes the preceeding chromosomes and the spacing
   * between them)
   * @param {number} i - the index of the chromosome to get the pixel start for
   */
  getChrPxStart(i: number): number {
    const chrPx = this.getSummation(this.sizes.slice(0, i)) * this.bpToPx;
    const spacingPx = this.spacing * i;
    return chrPx + spacingPx;
  }

  /**
   * Reduce the array to a summation of the numeric elements
   * @param {number[]} array - the list of numbers to sum
   */
  private getSummation(array: number[]): number {
    return array.length > 0 ? array.reduce((a, b) => a + b) : 0;
  }
}
