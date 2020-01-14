import { scaleLinear } from 'd3';
import { CartesianCoordinate } from './interfaces';

export class CircularGenomeMap {
  spacing = 0.035; // approximately 2° in radians

  bpToRads: number;

  radsToBP: number;

  private scales = {};

  private sizes: number[];

  /**
   * Creates a genome map object that stores scaling functions for each
   * chromosome in the genome and can convert genomic positions (bp) to radians
   * or cartesian coordinates (x,y)
   * @param {any} chromosomes - a dictionary with keys being chromosome values,
   *                            and values being chromosome sizes
   * @param {number} rotate - the number of radians to rotate (default = 0)
   */
  constructor(chromosomes: any, rotate = 0) {
    this.sizes = Object.values(chromosomes);
    const chrs = Object.keys(chromosomes);
    // total number of BP of genome
    const totalGenomeLength = this.getSummation(this.sizes);

    // number of radians taken by genome
    const rads = 2 * Math.PI - this.spacing * chrs.length;

    // BP/Rad conversions
    this.bpToRads = rads / Number(totalGenomeLength);
    this.radsToBP = Number(totalGenomeLength) / rads;

    // for each chromosomes, create a scale we can use to determine locations
    // and sized of elements within each chromosome section in the plot
    let bp = rotate * this.radsToBP;
    chrs.forEach((chr, i) => {
      // get starting point for the chromosome in radians (clamped at 0 - 2PI)
      // 1.5π starts the genome from the top of the circle rather than the right
      const start = this.clamp(this.spacing * i + bp * this.bpToRads + 1.5 * Math.PI);

      // get the end point by calculating the width and adding to the start
      const end = start + this.bpToRads * chromosomes[chr];

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
   * Returns a cartesian coordinate (x, y) of a genomic position (in bp)
   * @param {string} chr - chromosome the specified position (bp) is in
   * @param {number} bp - the position (in bp) to be converted
   * @param {number} radius - radius for the conversion
   */
  bpToCartesian(chr: string, bp: number, radius: number): CartesianCoordinate {
    return this.polarToCartesian(this.scales[chr](bp), radius);
  }

  /**
   * Returns the size of the specified chromosome in radians
   * @param {string} chr - the chromosome to get radians for
   */
  getRadiansOfChromosome(chr: string): number {
    const range = this.scales[chr].range();
    return range[1] - range[0];
  }

  /**
   * Returns the radians for the start position of the chromosome at the
   * specified index (which includes the preceeding chromosomes and the spacing
   * between them)
   * @param {number} i - the index of the chromosome to get the radian start for
   */
  getChrRadianStart(i: number): number {
    const chrRads = this.getSummation(this.sizes.slice(0, i)) * this.bpToRads;
    const spacingRads = this.spacing * i;
    return this.clamp(chrRads + spacingRads);
  }

  /**
   * Reduce the array to a summation of the numeric elements
   * @param {number[]} array - the list of numbers to sum
   */
  private getSummation(array: number[]): number {
    return array.reduce((a, b) => a + b);
  }

  /**
   * Returns a clamped value (between 0 and 2PI)
   * @param {number} radians - the radian value to ensure is between 0 and 2PI
   */
  private clamp(radians: number): number {
    return radians % (2 * Math.PI);
  }

  /**
   * Returns a cartesian coordinate (a dictionary with an x and y value)
   * calculated from a radian value
   * @param {number} radians - the radian value to
   * @param {number} radius - radius for the conversion
   */
  private polarToCartesian(radians: number, radius: number): CartesianCoordinate {
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  }
}
