import { format, scaleLinear, ScaleLinear } from 'd3';
import { ComparisonBlockCoordinates } from './interfaces';
import { Gene } from './gene';

export class SyntenyBlock {
  // ID for the block
  id: string;

  // reference chromosome the block is located in
  refChr: string;

  // comparison chromosome the block is located in
  compChr: string;

  // starting genomic location of the block in the reference chromosome
  refStart: number;

  // ending genomic location of the block in the reference chromosome
  refEnd: number;

  // hex color value used when drawing based on the comparison chr it's located in
  color: string;

  // if the reference chr the block is located in is selected, tempChr will be
  // assigned to indicate that it's been selected (used in the genome view only)
  tempChr: string;

  // starting genomic location of the block to be drawn (may not be the true start
  // depending on visualization settings)
  compStart: number;

  // ending genomic location of the block to be drawn (may not be the true end depending
  // on visualization settings)
  compEnd: number;

  // indicates whether the block's "true" start/end is synonymous with "matching"
  // start/end (used in block view only)
  orientationMatches: boolean;

  // stores "true" start and end genomic locations where the start value will always be less
  // than the end value (used in block view only)
  trueCoords: ComparisonBlockCoordinates;

  // stores "matching" start and end genomic locations where the values may be reversed from
  // the syntenic features are located on opposite strands and thus, when visualizing the
  // block, genes line up better when displayed in reverse (used in block view only)
  matchCoords: ComparisonBlockCoordinates;

  // scale used to control drawing the block, features within it, and coordinates in the ref track
  refScale: ScaleLinear<number, number>;

  // scale used to control drawing the block, features within it, and coordinates in the
  // comp track when the matching orientation option is selected (used in block view only)
  compMatchScale: ScaleLinear<number, number>;

  // scale used to control drawing the block, features within it, and coordinates in the
  // comp track when the matching orientation option is NOT selected (used in block view only)
  compTrueScale: ScaleLinear<number, number>;

  // formatting function from d3 that adds commas to large numbers to help with readability
  format: Function = format(',');

  constructor(block: any, moreInfo = false) {
    this.id = block.id;
    this.refChr = block.ref_chr;
    this.compChr = block.comp_chr;
    this.refStart = block.ref_start;
    this.refEnd = block.ref_end;

    if (moreInfo) {
      this.orientationMatches = block.orientation_matches;
      this.trueCoords = {
        compStart: block.comp_start,
        compEnd: block.comp_end,
      };
      this.matchCoords = {
        compStart: this.orientationMatches ? block.comp_start : block.comp_end,
        compEnd: this.orientationMatches ? block.comp_end : block.comp_start,
      };
    } else {
      this.compStart = block.comp_start;
      this.compEnd = block.comp_end;
    }
  }

  /**
   * Sets the temporary chromosome and returns the changed SyntenyBlock object
   */
  markAsSelected(): SyntenyBlock {
    this.tempChr = `ref${this.refChr}`;
    return this;
  }

  /**
   * Sets the color of the block to the specified color
   * @param {string} hex - the hex value to use as the color for the block
   */
  setColor(hex: string): void {
    this.color = hex;
  }

  /**
   * Sets the reference scale as well as creating a new true comparison and
   * matching comparison scale
   * @param {ScaleLinear<number, number>} refScale - the new reference scale
   */
  setScales(refScale: ScaleLinear<number, number>): void {
    this.refScale = refScale;
    this.compTrueScale = this.createCompScale(this.trueCoords);
    this.compMatchScale = this.createCompScale(this.matchCoords);
  }

  /**
   * Returns the color of the block if the specified chr (the chromsome hovered
   * over) matches the comparison chromosome or if the specified chromosome is
   * null (indicating no current hover); if neither of these conditions are true,
   * then return grey
   */
  getColor(currChr: string = null): string {
    return !currChr || currChr === this.compChr ? this.color : '#AAA';
  }

  /**
   * Returns the content for a tooltip for the specified syntenic block which
   * includes the chromosome and basepair start and end points
   * @param {boolean} isComp - flag indicating if the block data should be from
   *                             reference or comparison species
   */
  getTooltipData(isComp: boolean): any {
    return {
      chr: isComp ? this.compChr : this.refChr,
      start: isComp ? this.getLabel(this.getTrueCompStart()) : this.getLabel(this.refStart),
      end: isComp ? this.getLabel(this.getTrueCompEnd()) : this.getLabel(this.refEnd),
    };
  }

  /**
   * Returns the absolute value of the scaled width of the syntenic block (px)
   */
  getPxWidth(): number {
    return Math.abs(this.refScale(this.refEnd) - this.refScale(this.refStart));
  }

  /**
   * Returns the scaled start position of the syntenic block (px)
   */
  getPxStart(): number {
    return this.refScale(this.refStart);
  }

  /**
   * Returns the scaled end position of the syntenic block (px)
   */
  getPxEnd(): number {
    return this.getPxStart() + this.getPxWidth();
  }

  /**
   * Returns the label for the reference block starting position in the form of
   * '<chr>:<start>bp'
   */
  getBlockRefStartLabel(): string {
    return this.getLabel(this.refStart, this.refChr);
  }

  /**
   * Returns the label for the reference block ending position in the form of
   * '<chr>:<end>bp'
   */
  getBlockRefEndLabel(): string {
    return this.getLabel(this.refEnd, this.refChr);
  }

  /**
   * Returns the label for the comparison block starting position in the form of
   * '<chr>:<start>bp'
   * @param {boolean} trueOrientation - whether the block is truly oriented
   */
  getBlockCompStartLabel(trueOrientation: boolean): string {
    return trueOrientation
      ? this.getLabel(this.trueCoords.compStart, this.compChr)
      : this.getLabel(this.matchCoords.compStart, this.compChr);
  }

  /**
   * Returns the label for the comparison block ending position in the form of
   * '<chr>:<end>bp'
   * @param {boolean} trueOrientation - whether the block is truly oriented
   */
  getBlockCompEndLabel(trueOrientation: boolean): string {
    return trueOrientation
      ? this.getLabel(this.trueCoords.compEnd, this.compChr)
      : this.getLabel(this.matchCoords.compEnd, this.compChr);
  }

  /**
   * Returns either the true comparison or matching comparison scale depending
   * on the trueScale boolean flag
   * @param {boolean} trueScale - whether the true or matching scale is needed
   */
  getScale(trueScale: boolean): ScaleLinear<number, number> {
    return trueScale ? this.compTrueScale : this.compMatchScale;
  }

  /**
   * Returns either the true start point or matching start point depending on
   * the trueCoords boolean flag
   * @param {boolean} trueCoords - whether the true or matching start is needed
   */
  getStart(trueCoords: boolean): number {
    return trueCoords ? this.getTrueCompStart() : this.matchCoords.compStart;
  }

  /**
   * Returns either the true end point or matching end point depending on the
   * trueCoords boolean flag
   * @param {boolean} trueCoords - whether the true or matching start is needed
   */
  getEnd(trueCoords: boolean): number {
    return trueCoords ? this.getTrueCompEnd() : this.matchCoords.compEnd;
  }

  /**
   * Returns true if the reference chromosome matches the specified chromosome
   * @param {string} chr - the chromosome to compare to the reference chromosome
   */
  matchesRefChr(chr: string): boolean {
    return this.refChr === chr;
  }

  /**
   * Returns true if the comparison chromosome matches the specified chromosome
   * @param {string} chr - the chromosome to compare to the comparison chromosome
   */
  matchesCompChr(chr: string): boolean {
    return this.compChr === chr;
  }

  /**
   * Returns true if the specified gene is *contained* by the block; this
   * is different from includes() as it is used to filter out non-syntenic
   * comparison homologs in the block view browser
   * @param {Gene} gene - the gene to check the location of
   */
  contains(gene: Gene): boolean {
    return (
      gene.start >= this.getTrueCompStart() &&
      gene.start <= this.getTrueCompEnd() &&
      gene.end <= this.getTrueCompEnd() &&
      gene.end >= this.getTrueCompStart()
    );
  }

  /**
   * Returns true if the block is in the specified chromosome (extracted
   * as feature.chr) and if specified feature occurs in the block in any capacity
   * @param {any} feature - the feature (gene or QTL) to compare to the block
   */
  isAFeatureBlock(feature: any): boolean {
    return this.matchesRefChr(feature.chr) && this.includes(feature);
  }

  /**
   * Returns true if the specified feature occurs in the block (takes into
   * consideration orientation) in any capacity
   * @param {any} feature - the feature to check for its location in the block
   */
  private includes(feature: any): boolean {
    return (
      (feature.start >= this.refStart && feature.start <= this.refEnd) ||
      (feature.end <= this.refEnd && feature.end >= this.refStart)
    );
  }

  /**
   * Returns a scaling function for the specified block and orientation mode
   * @param {ComparisonBlockCoordinates} coords - the coordinates for current orientation
   */
  private createCompScale(coords: ComparisonBlockCoordinates): ScaleLinear<number, number> {
    return scaleLinear()
      .domain([coords.compStart, coords.compEnd])
      .range([this.refScale(this.refStart), this.refScale(this.refEnd)]);
  }

  /**
   * Returns the true comparison start point
   */
  private getTrueCompStart(): number {
    return this.trueCoords.compStart;
  }

  /**
   * Returns the true comparison end point
   */
  private getTrueCompEnd(): number {
    return this.trueCoords.compEnd;
  }

  /**
   * Returns the string value containing a formatted coordinate and the specified
   * chromosome, if any is specified
   * @param {number} coord - the location to format
   * @param {string} chr - the default null value that if specified will be
   *                       prepended to the label
   */
  private getLabel(coord: number, chr: string = null): string {
    return chr ? `${chr}:${this.format(coord)}bp` : `${this.format(coord)}bp`;
  }
}
