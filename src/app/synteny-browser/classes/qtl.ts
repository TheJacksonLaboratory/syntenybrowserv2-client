import { format, ScaleLinear } from 'd3';

export class QTL {
  // QTL ID
  id: string;

  // QTL symbol
  symbol: string;

  // reference chromosome the QTL is located in
  chr: string;

  // genomic start position of the QTL
  start: number;

  // genomic end position of the QTL
  end: number;

  // genomic size of the QTL
  size: number;

  // height of the QTL when drawn
  height: number;

  // distance from top of reference track to top of the QTL when drawn
  offset: number;

  // distance from top of chromosome view to QTL indicator line when drawn
  indOffset: number;

  // scale to used when drawing indicators in the chromosome view
  indScale: ScaleLinear<number, number>;

  // formatting function from d3 that adds commas to large numbers to help with readability
  format: Function = format(',');

  // used when app queries list of features which contain a mix of genes and QTLs
  isGene = false;

  // used when app queries list of features which contain a mix of genes and
  // QTLs and GWASLocations
  isQTL = true;

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
    return Math.max(defaultSize, Math.abs(this.indScale(this.end) - this.indScale(this.start)));
  }

  /**
   * Returns the start position (px) of the QTL indicator using the static scale
   */
  getIndStart(): number {
    return this.indScale(this.start);
  }

  /**
   * Returns the start position (px) of the QTL based on the specified scale
   * @param {ScaleLinear<number, number>} scale - scale to use to get the position
   */
  getStart(scale: ScaleLinear<number, number>): number {
    return scale(this.start);
  }

  /**
   * Returns the content for a tooltip for the QTL which includes the id, the
   * chromosome it is located in as well and the basepair start and end points
   */
  getTooltipData(): any {
    return {
      symbol: this.symbol,
      id: this.id,
      chr: this.chr,
      start: `${this.format(this.start)}bp`,
      end: `${this.format(this.end)}bp`,
    };
  }
}
