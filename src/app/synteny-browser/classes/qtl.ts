import { format, ScaleLinear } from 'd3';
import { QTLMetadata } from './interfaces';

export class QTL {
  id: string;
  symbol: string;
  chr: string;
  start: number;
  end: number;
  size: number;
  height: number;
  offset: number;

  indOffset: number;
  indScale: ScaleLinear<number, number>;

  format: Function = format(',');

  constructor(qtl: any, staticScale: ScaleLinear<number, number>) {
    this.id = qtl.id;
    this.symbol = qtl.symbol;
    this.chr = qtl.chr;
    this.start = qtl.start;
    this.end = qtl.end;
    this.size = qtl.end - qtl.start;
    this.height = qtl.height;
    this.offset = qtl.offset;

    this.indOffset = qtl.indOffset + 18;
    this.indScale = staticScale;
  }


  // Getter Methods

  /**
   * Returns the either the actual width of the QTL based on the specified scale
   * OR the specified default width (in px), whichever is larger
   * @param {ScaleLinear<number, number>} scale - scale to use to calculate width
   * @param {number} defaultSize - the width to use if the scaled width is less
   *                               than (i.e. 1 or 2 to make the QTL visible)
   */
  getWidth(scale: ScaleLinear<number, number>, defaultSize: number): number {
    return Math.max(defaultSize, Math.abs(scale(this.end) - scale(this.start)));
  }

  /**
   * Returns the either the actual width of the QTL indicator based on the static
   * scale OR the specified default width (in px), whichever is larger
   * @param {number} defaultSize - the width to use if the scaled width is less
   *                               than (i.e. 1 or 2 to make the QTL visible)
   */
  getIndWidth(defaultSize: number): number {
    return Math.max(defaultSize,
                    Math.abs(this.indScale(this.end) - this.indScale(this.start)));
  }

  /**
   * Returns the start position (px) of the QTL indicator using the static scale
   */
  getIndStart(): number { return this.indScale(this.start); }

  /**
   * Returns the start position (px) of the QTL based on the specified scale
   * @param {ScaleLinear<number, number>} scale - scale to use to get the position
   */
  getStart(scale: ScaleLinear<number, number>): number { return scale(this.start); }

  /**
   * Returns the content for a tooltip for the QTL which includes the id, the
   * chromosome it is located in as well and the basepair start and end points
   */
  getTooltipData(): object {
    return {
      'QTL ID': this.id,
      'Chromosome': this.chr,
      'Start': `${this.format(this.start)}bp`,
      'End': `${this.format(this.end)}bp`
    }
  }

}
