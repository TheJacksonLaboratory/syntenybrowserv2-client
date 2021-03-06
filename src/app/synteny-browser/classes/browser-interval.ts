import { format, ScaleLinear } from 'd3';
import { SyntenyBlock } from './synteny-block';

export class BrowserInterval {
  // starting genomic location in the reference chromosome
  refStart: number;

  // ending genomic location in the reference chromosome
  refEnd: number;

  // reference chromosome in the block view
  refChr: string;

  // size of the reference chromosome
  refChrSize: number;

  // scale used to convert genomic locations and pixel values
  refScale: ScaleLinear<number, number>;

  // genomic size of the current interval
  width: number;

  // the genomic location in the comparison genome that maps to the starting
  // location in the reference chromosome
  compStart: number;

  // comparison chromosome where the interval starting position is located in
  compStartChr: string;

  // the genomic location in the comparison genome that maps to the end location
  // in the reference chromosome
  compEnd: number;

  // comparison chromosome where the interval end position is located in
  compEndChr: string;

  // indicates if the user wants to see syntenic regions in their true orientation
  trueOrientation: boolean;

  // dictionary of reference genomic locations where a syntenic block starts
  // mapped to the block that is starting
  blockStarts: object = {};

  // dictionary of reference genomic locations where a syntenic block ends
  // mapped to the block that is ending
  blockEnds: object = {};

  // formatting function from d3 that adds commas to large numbers to help with readability
  format: Function = format(',');

  constructor(
    refChr: string,
    refChrWidth: number,
    blocks: SyntenyBlock[],
    refScale: ScaleLinear<number, number>,
    trueOrientation: boolean,
  ) {
    this.refChr = refChr;
    this.refChrSize = refChrWidth;
    this.trueOrientation = trueOrientation;

    blocks.forEach(block => {
      this.blockStarts[block.refStart] = block;
      this.blockEnds[block.refEnd] = block;
    });

    this.moveTo(0, refChrWidth, refScale);
  }

  /**
   * Moves the interval to the specified start and end points, and generates new
   * comparison interval points using the specified (reference) scale,
   * @param {number} start - the new (bp) start point for the interval
   * @param {number} end - the new (bp) start point for the interval
   * @param {ScaleLinear<number, number>} scale - the new ref scale to create
   *                                              the new comparison points
   */
  moveTo(start: number, end: number, scale: ScaleLinear<number, number>): void {
    this.refStart = Math.round(start);
    this.refEnd = Math.round(end);
    this.width = Math.round(end - start);
    this.refScale = scale;

    // update the comparison locations
    this.setCompStartForInterval();
    this.setCompEndForInterval();
  }

  /**
   * Returns the formatted reference chr, start point, and end point of the
   * current interval
   */
  getRefInterval(): string {
    return `${this.getRefStartLabel()} - ${this.format(this.refEnd)}bp`;
  }

  /**
   * Returns the label for the reference start point for the current interval
   */
  getRefStartLabel(): string {
    return `Chr${this.refChr}:${this.format(this.refStart)}bp`;
  }

  /**
   * Returns the label for the reference end point for the current interval
   */
  getRefEndLabel(): string {
    return `Chr${this.refChr}:${this.format(this.refEnd)}bp`;
  }

  /**
   * Returns the label for the comparison start point for the current interval
   */
  getCompStartLabel(): string {
    return `Chr${this.compStartChr}:${this.format(this.compStart)}bp`;
  }

  /**
   * Returns the label for the comparison end point for the current interval
   */
  getCompEndLabel(): string {
    return `Chr${this.compEndChr}:${this.format(this.compEnd)}bp`;
  }

  /**
   * Returns true if the interval is equivalent to the full reference chromosome
   */
  isFullChrView(): boolean {
    return this.refStart <= 0 && this.refEnd >= this.refChrSize;
  }

  /**
   * Sets the comparison start coordinate and chromosome in the browser view;
   * if the start of the interval is within a syntenic region, the location is a
   * conversion of the reference location; if the location is outside of a
   * region, the location is the start of the left-most block in view
   */
  private setCompStartForInterval(): void {
    // get the list of end positions of all the blocks and reverse
    // so we start checking from the end of the chromosome
    const ends = Object.keys(this.blockEnds).reverse();

    let block: SyntenyBlock;

    // iterate through the end positions
    for (let i = 0; i < ends.length; i += 1) {
      // if a block end point that is less than the start of the interval
      if (Number(ends[i]) < this.refStart) {
        // we want the previous block (which is the block to the right,
        // visually, since we reversed the array) and break from the loop
        block = i > 0 ? this.blockEnds[ends[i - 1]] : this.blockEnds[ends[0]];
        break;
      }
    }

    // if we didn't find a block, assume that the starting block is the first
    if (!block) {
      block = this.blockEnds[ends[ends.length - 1]];
    }

    this.compStartChr = block.compChr;

    // TODO: cases where the interval start AND end are in between regions
    // if start position is inside the region, convert it, else, get block start
    if (this.refStart <= block.refEnd && this.refStart >= block.refStart) {
      this.compStart = Math.round(
        block.getScale(this.trueOrientation).invert(this.refScale(this.refStart)),
      );
    } else {
      this.compStart = block.getStart(this.trueOrientation);
    }
  }

  /**
   * Sets the comparison end coordinate and chromosome in the browser view; if
   * the end of the interval is within a syntenic region, the location is a
   * conversion of the reference location; if the location is outside of a
   * region, the location is the end of the right-most block in view
   */
  private setCompEndForInterval(): void {
    // get the list of start positions of all the blocks
    const strts = Object.keys(this.blockStarts);

    let block;
    // iterate through the start positions
    for (let i = 0; i < strts.length; i += 1) {
      // if a block start point that is greater than the end of the interval
      if (Number(strts[i]) > this.refEnd) {
        // we want the previous block (which is the block to the left, visually)
        // and break from the loop
        block = i > 0 ? this.blockStarts[strts[i - 1]] : this.blockStarts[strts[0]];
        break;
      }
    }

    // if we didn't find a block, assume that the starting block is the last
    if (!block) {
      block = this.blockStarts[strts[strts.length - 1]];
    }

    this.compEndChr = block.compChr;

    // TODO: cases where the interval start AND end are in between regions
    // if end position is inside the region, convert it, else, get block end
    if (this.refStart <= block.refEnd && this.refStart >= block.refStart) {
      this.compEnd = Math.round(
        block.getScale(this.trueOrientation).invert(this.refScale(this.refStart)),
      );
    } else {
      this.compEnd = block.getEnd(this.trueOrientation);
    }
  }
}
