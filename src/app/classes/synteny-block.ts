export class SyntenyBlock {
  id: string;
  refChr: string;
  compChr: string;
  refStart: number;
  refEnd: number;
  compStart: number;
  compEnd: number;
  color: string;
  tempChr: string;

  constructor(block: any, type: string) {
    if(type === 'genome') {
      this.id = block.id;
      this.refChr = block.ref_chr;
      this.compChr = block.comp_chr;
      this.refStart = block.ref_start;
      this.refEnd = block.ref_end;
      this.compStart = block.comp_start;
      this.compEnd = block.comp_end;
    } else if(type === 'chromosome') {
      //console.log(block);
    }
  }

  // Operational Methods

  /**
   * Sets the temporary chromosome and returns the changed SyntenyBlock object
   */
  markAsSelected(): SyntenyBlock {
    this.tempChr = 'ref' + this.refChr;
    return this;
  }

  /**
   * Sets the color of the block to the specified color
   * @param {string} hex - the hex value to use as the color for the block
   */
  setColor(hex: string): void { this.color = hex; }

  // Getter Methods

  /**
   * Returns the color of the block
   */
  getColor(): string { return this.color; }

  // Condition Checks

  /**
   * Returns true/false if the reference chromosome of the block is the same as the specified chromosome
   * @param {string} chr - the chromosome to compare to the reference chromosome
   */
  isInRefChr(chr: string): boolean { return this.refChr === chr; }

  /**
   * Returns true/false if the block is in the specified chromosome (extracted as feature.chr)
   * and if specified feature occurs to some capacity in the block
   * @param {any} feature - the feature (gene or QTL) to compare to the block
   */
  isAFeatureBlock(feature: any): boolean { return this.isInRefChr(feature.chr) && this.contains(feature)}

  // Private Methods

  /**
   * Returns true/false if the specified gene occurs in the specified block (takes into consideration orientation)
   * @param {any} feature - the feature to check for its location in the specified block
   */
  private contains(feature: any): boolean {
    return (feature.start >= this.refStart && feature.start <= this.refEnd) ||
           (feature.end <= this.refEnd && feature.end >= this.refStart);
  }
}
