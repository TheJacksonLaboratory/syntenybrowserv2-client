import {ComparisonBlockCoordinates} from './interfaces';
import {Gene} from './gene';
import {ScaleLinear} from 'd3-scale';
import * as d3 from 'd3';

export class SyntenyBlock {
  id: string;
  refChr: string;
  compChr: string;
  refStart: number;
  refEnd: number;
  color: string;

  // for use in the genome view
  tempChr: string;
  compStart: number;
  compEnd: number;

  // for use in the block view
  orientationMatches: boolean;
  trueCoords: ComparisonBlockCoordinates;
  matchCoords: ComparisonBlockCoordinates;
  refScale: ScaleLinear<number, number>;
  compMatchScale: ScaleLinear<number, number>;
  compTrueScale: ScaleLinear<number, number>;
  format: Function = d3.format(',');

  constructor(block: any, moreInfo: boolean = false) {
    this.id = block.id;
    this.refChr = block.ref_chr;
    this.compChr = block.comp_chr;
    this.refStart = block.ref_start;
    this.refEnd = block.ref_end;


    if(moreInfo) {
      this.orientationMatches = block.orientation_matches;
      this.trueCoords = {
        compStart: block.comp_start,
        compEnd: block.comp_end
      };
      this.matchCoords = {
        compStart: (block.orientation_matches) ? block.comp_start : block.comp_end,
        compEnd: (block.orientation_matches) ? block.comp_end : block.comp_start
      }
    } else {
      this.compStart = block.comp_start;
      this.compEnd = block.comp_end;
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

  setScales(refScale: ScaleLinear<number, number>): void {
    this.refScale = refScale;
    this.compTrueScale = this.createCompScale(this.trueCoords);
    this.compMatchScale = this.createCompScale(this.matchCoords);
  }

  // Getter Methods

  /**
   * Returns the color of the block if the specified chr (the chromsome hovered over) matches the
   * comparison chromosome or if the specified chromosome is null (indicating no current hover);
   * if neither of these conditions are true, then return grey
   */
  getColor(currChr: string): string { return (!currChr || currChr === this.compChr) ? this.color : '#AAA'; }

  /**
   * Returns the content for a tooltip for the specified syntenic block which includes the chromosome and
   * basepair start and end points
   * @param {boolean} isComp - boolean flag indicating if the block data should be from  reference or comparison species
   */
  getTooltipData(isComp: boolean): object {
    return {
      'Chromosome': isComp ? this.compChr : this.refChr,
      'Location': isComp ? `${this.getLabel(this.getTrueCompStart())} - ${this.getLabel(this.getTrueCompEnd())}` :
                           `${this.getLabel(this.refStart)} - ${this.getLabel(this.refEnd)}`
    };
  }

  /**
   * Returns the absolute value of the scaled width of the syntenic block in pixels
   */
  getPxWidth(): number { return Math.abs(this.refScale(this.refEnd) - this.refScale(this.refStart)); }

  getPxStart(): number { return this.refScale(this.refStart); }

  getBlockRefStartLabel(): string { return this.getLabel(this.refStart, this.refChr); }

  getBlockRefEndLabel(): string { return this.getLabel(this.refEnd, this.refChr); }

  getBlockCompStartLabel(): string { return this.getLabel(this.getTrueCompStart(), this.compChr); }

  getBlockCompEndLabel(): string { return this.getLabel(this.getTrueCompEnd(), this.compChr); }

  getScale(trueScale: boolean): ScaleLinear<number, number> {
    return trueScale ? this.compTrueScale : this.compMatchScale;
  }

  getStart(trueScale: boolean): number {
    return trueScale ? this.trueCoords.compStart : this.matchCoords.compStart;
  }

  getEnd(trueScale: boolean): number {
    return trueScale ? this.trueCoords.compEnd : this.matchCoords.compEnd;
  }

  // Condition Checks

  /**
   * Returns true/false if the reference chromosome matches the specified chromosome
   * @param {string} chr - the chromosome to compare to the reference chromosome
   */
  matchesRefChr(chr: string): boolean { return this.refChr === chr; }

  /**
   * Returns true/false if the comparison chromosome matches the specified chromosome
   * @param {string} chr - the chromosome to compare to the comparison chromosome
   */
  matchesCompChr(chr: string): boolean { return this.compChr === chr; }

  /**
   * Returns true/false if the specified gene is *contained* by the block; this is different from includes()
   * as it is used to filter out non-syntenic comparison homologs in the block view browser
   * @param {Gene} gene - the gene to check the location of
   */
  contains(gene: Gene): boolean {
    return (gene.start >= this.getTrueCompStart() && gene.start <= this.getTrueCompEnd()) &&
           (gene.end <= this.getTrueCompEnd() && gene.end >= this.getTrueCompStart());
  }

  /**
   * Returns true/false if the block is in the specified chromosome (extracted as feature.chr)
   * and if specified feature occurs in the block in any capacity
   * @param {any} feature - the feature (gene or QTL) to compare to the block
   */
  isAFeatureBlock(feature: any): boolean { return this.matchesRefChr(feature.chr) && this.includes(feature); }

  // Private Methods

  /**
   * Returns true/false if the specified feature occurs in the block (takes into consideration
   * orientation) in any capacity
   * @param {any} feature - the feature to check for its location in the specified block
   */
  private includes(feature: any): boolean {
    return (feature.start >= this.refStart && feature.start <= this.refEnd) ||
           (feature.end <= this.refEnd && feature.end >= this.refStart);
  }

  /**
   * Returns a scaling function for the specified block and orientation mode
   * @param {ComparisonBlockCoordinates} orientationCoords - the coordinates for current orientation
   */
  private createCompScale(orientationCoords: ComparisonBlockCoordinates): ScaleLinear<number, number> {
    return d3.scaleLinear()
             .domain([orientationCoords.compStart, orientationCoords.compEnd])
             .range([this.refScale(this.refStart), this.refScale(this.refEnd)]);
  }

  private getTrueCompStart(): number { return this.trueCoords.compStart; }

  private getTrueCompEnd(): number { return this.trueCoords.compEnd; }

  private getLabel(coord: number, chr: string = null): string {
    return chr ? `${chr}:${this.format(coord)}bp` : `${this.format(coord)}bp`;
  }
}
