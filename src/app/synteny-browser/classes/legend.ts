export class Legend {
  // list of all comparison chromosomes
  allChrs: string[];

  // list of all comparison chromosomes that are represented in the block view
  activeChrs: string[];

  // current "hovered over" chromosome that causes all regions not belonging to that
  // chromosome to become grey to highlight the "hovered over" chromosome regions
  hoverChr: string = null;

  // distance from the top of the SVG to the top of the legend
  offsetY = 380;

  // distance from right side of the SVG to the start of the legend (is determined by
  // how many chromosomes there are as the legend should be centered)
  offsetX: number;

  // color dictionary for the comparison genome
  colors: object;

  constructor(genome: object, colors: object, chrs: string[], width: number) {
    this.allChrs = Object.keys(genome);
    this.activeChrs = chrs;
    this.colors = colors;

    // use the width to calculate the x translation for the legend
    this.offsetX = (width - ((this.allChrs.length - 1) * 35 + 20)) / 2;
  }

  /**
   * Sets hoverChr to the specified chromosome; if no chromosome, hoverChr = null
   * @param {string} chr - the specified chromosome, if any
   */
  hover(chr: string = null): void {
    this.hoverChr = chr;
  }

  /**
   * Returns the horizontal translation for a specified chromosome label
   * @param {string} chr - the value of the chromosome to get the translation for
   */
  getXPos(chr: string): number {
    return this.allChrs.indexOf(chr) * 35;
  }

  /**
   * Returns the opacity for a chromosome label based on whether it is "active"
   * (represented in the current chromosome)
   * @param {string} chr - the value of the chromosome to get the opacity for
   */
  getOpacity(chr: string): number {
    return this.isActive(chr) ? 1 : 0.1;
  }

  /**
   * Returns the hex value for the color of the specified chromosome
   * @param {string} chr - the chromosome to get the color for
   */
  getColor(chr: string): string {
    return this.colors[chr];
  }

  /**
   * Returns true if the specified chromosome is in the list of active
   * chromosomes (is represented in block view)
   * @param {string} chr - the chromosome to search for
   */
  isActive(chr: string): boolean {
    return this.activeChrs.indexOf(chr) >= 0;
  }
}
