export class Legend {
  allChrs: Array<string>;
  activeChrs: Array<string>;
  hoverChr: string = null;

  offsetY = 460;
  offsetX;
  colors: object;

  constructor(genome: object, genomeColors: object, activeChrs: Array<string>, plotWidth: number) {
    this.allChrs = Object.keys(genome);
    this.activeChrs = activeChrs;
    this.colors = genomeColors;

    this.offsetX = (plotWidth - (((this.allChrs.length - 1) * 35) + 20)) / 2;
  }


  // Operational Methods

  /**
   * Sets hoverChr to the specified chromosome; if no chromosome is passed, set hoverChr to null
   * @param {string} chr - the specified chromosome, if any
   */
  hover(chr: string = null): void { this.hoverChr = chr; }


  // Getter Methods

  /**
   * Returns the horizontal translation for a specified chromosome label
   * @param {string} chr - the value of the chromosome to get the translation for
   */
  getXPos(chr: string): number { return this.allChrs.indexOf(chr) * 35; }

  /**
   * Returns the opacity for a chromosome label based on whether it is "active" (represented in the current chromosome)
   * @param {string} chr - the value of the chromosome to get the opacity for
   */
  getOpacity(chr: string): number { return this.isActive(chr) ? 1 : 0.1; }

  /**
   * Returns the hex value for the color of the specified chromosome
   * @param {string} chr - the chromosome to get the color for
   */
  getColor(chr: string): string { return this.colors[chr]; }


  // Condition Checks

  /**
   * Returns true/false if the specified chromosome is in the list of active chromosomes (is represented in block view)
   * @param {string} chr - the chromosome value to be searched for in active chromosomes
   */
  isActive(chr: string): boolean { return this.activeChrs.indexOf(chr) >= 0; }
}
