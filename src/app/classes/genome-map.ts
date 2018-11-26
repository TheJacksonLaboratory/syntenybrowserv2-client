import * as d3 from 'd3';
import {CartesianCoordinate} from './interfaces';

export class GenomeMap {
  private scales = {};

  /**
   * Creates a genome map object that stores scaling functions for each chromosome in the genome and
   * can convert genomic positions (bp) to radians or cartesian coordinates (x,y)
   * @param {any} chromosomes - a dictionary with keys being chromosome values, and values being chromsome sizes
   */
  constructor(chromosomes: any) {
    // spaces between the chromosome segments in the plot
    let spacing = this.degreesToRadians(2);

    // TODO: Typescript inspections gets mad if types aren't specified here in this line and I don't know why
    let totalGenomeLength: any = Object.values(chromosomes).reduce((a: number, b: number) => a + b);
    let radiansPerUnit = (2 * Math.PI - spacing * Object.keys(chromosomes).length) / totalGenomeLength;

    // for each of the chromosomes, create a usable scale we can use to determine locations
    // and sized of elements within each chromosome section in the plot
    let bp = 0;
    Object.keys(chromosomes).forEach((chr, i) => {
      // get the starting point for the chromosome in radians (clamped between 0 and 2PI)
      let start = this.clamp((spacing * i + bp * radiansPerUnit) + 1.5 * Math.PI);

      // get the end point by calculating the width and adding to the start
      let end = start + (radiansPerUnit * chromosomes[chr]);

      // assign the scale of the result (domain: genomic bp, range: radians) to the scales variable
      this.scales[chr] = d3.scaleLinear()
                           .domain([0, chromosomes[chr]])
                           .range([start, end]);

      // increment bp so that we know where to start calculating radians for the next chromsome
      bp += chromosomes[chr];
    });
  }

  /**
   * Returns a conversion of a position (in bp) to a radian value
   * @param {string} chromosome - the chromosome the specified position (in bp) is located in
   * @param {number} bpPosition - the position (in bp) to be converted
   */
  convertBPToRadians(chromosome: string, bpPosition: number): number {
    return this.scales[chromosome](bpPosition);
  }

  /**
   * Returns a conversion of a position (in bp) to a cartesian coordinate value (x, y)
   * @param {string} chromosome - the chromosome the specified position (in bp) is located in
   * @param {number} bpPosition - the position (in bp) to be converted
   * @param {number} radius - the radius at which the conversion needs to be calculated at
   */
  convertBPToCartesian(chromosome: string, bpPosition: number, radius: number): CartesianCoordinate {
    return this.polarToCartesian(this.convertBPToRadians(chromosome, bpPosition), radius);
  }

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
  private clamp(radians: number): number {
    return radians % (2 * Math.PI);
  }

  /**
   * Returns a cartesian coordinate (a dictionary with an x and y value) calculated from a radian value
   * @param {number} radians - the radian value to
   * @param {number} radius - the radius at which the conversion needs to be calculated at
   */
  private polarToCartesian(radians: number, radius: number): CartesianCoordinate {
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius
    }
  }
}
