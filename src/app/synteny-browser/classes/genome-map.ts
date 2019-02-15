import { CartesianCoordinate } from './interfaces';
import { scaleLinear } from 'd3';

export class GenomeMap {
  private scales = {};

  /**
   * Creates a genome map object that stores scaling functions for each
   * chromosome in the genome and can convert genomic positions (bp) to radians
   * or cartesian coordinates (x,y)
   * @param {any} chromosomes - a dictionary with keys being chromosome values,
   *                            and values being chromosome sizes
   */
  constructor(chromosomes: any) {
    // spaces between the chromosome segments in the plot
    let spacing = this.degreesToRadians(2);

    let totalGenomeLength = Object.values(chromosomes)
                                  .reduce((a: number, b: number) => a + b);
    let rads = 2 * Math.PI - spacing * Object.keys(chromosomes).length;
    let radiansPerUnit = rads / Number(totalGenomeLength);

    // for each chromosomes, create a scale we can use to determine locations
    // and sized of elements within each chromosome section in the plot
    let bp = 0;
    Object.keys(chromosomes).forEach((chr, i) => {
      // get starting point for the chromosome in radians (clamped at 0 - 2PI)
      let start = this.clamp((spacing * i + bp * radiansPerUnit) + 1.5 * Math.PI);

      // get the end point by calculating the width and adding to the start
      let end = start + (radiansPerUnit * chromosomes[chr]);

      // assign the scale of the result (domain: genomic bp, range: radians)
      this.scales[chr] = scaleLinear().domain([0, chromosomes[chr]])
                                      .range([start, end]);

      // increment bp so that we know where to start calculating radians
      // for the next chromosome
      bp += chromosomes[chr];
    });
  }


  // Getter Methods

  /**
   * Returns a conversion of a position (in bp) to a radian value
   * @param {string} chr - chromosome the specified position (bp) is in
   * @param {number} bp - the position (in bp) to be converted
   */
  bpToRadians(chr: string, bp: number): number { return this.scales[chr](bp); }

  /**
   * Returns a cartesian coordinate (x, y) of a genomic position (in bp)
   * @param {string} chr - chromosome the specified position (bp) is in
   * @param {number} bp - the position (in bp) to be converted
   * @param {number} radius - radius for the conversion
   */
  bpToCartesian(chr: string, bp: number, radius: number): CartesianCoordinate {
    return this.polarToCartesian(this.bpToRadians(chr, bp), radius);
  }


  // Private Methods

  /**
   * Returns the radian conversion of a degree value
   * @param {number} degrees - the degree value to be converted to radians
   */
  private degreesToRadians(degrees: number): number {
    return Math.PI * degrees / 180;
  }

  /**
   * Returns a clamped value (between 0 and 2PI)
   * @param {number} radians - the radian value to ensure is between 0 and 2PI
   */
  private clamp(radians: number): number { return radians % (2 * Math.PI); }

  /**
   * Returns a cartesian coordinate (a dictionary with an x and y value)
   * calculated from a radian value
   * @param {number} radians - the radian value to
   * @param {number} radius - radius for the conversion
   */
  private polarToCartesian(radians: number, radius: number): CartesianCoordinate {
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius
    }
  }
}
