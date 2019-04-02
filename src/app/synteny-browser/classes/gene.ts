import {Exon, TooltipContent} from './interfaces';
import { format, ScaleLinear } from 'd3';
import { SyntenyBlock } from './synteny-block';

export class Gene {
  start: number;
  end: number;
  size: number;
  symbol: string;
  id: string;
  chr: string;
  homologIDs: Array<string>;
  strand: string;
  type: string;
  blockID: string;
  species: string;
  orientationMatches: boolean;
  yPos: number;
  transcript: Array<Exon>;

  highlighted: boolean = false;
  selected: boolean = false;
  filtered: boolean = false;
  hidden: boolean = false;

  format: Function = format(',');

  constructor(gene: any, ids: Array<string>, trackHeight: number,
              blocks: Array<SyntenyBlock> = null) {
    this.species = (gene.start_pos) ? 'ref' : 'comp';
    this.start = (gene.start_pos) ? gene.start_pos : gene.gene_start_pos;
    this.end = (gene.end_pos) ? gene.end_pos : gene.gene_end_pos;
    this.size = this.end - this.start;
    this.symbol = gene.gene_symbol;
    this.id = gene.gene_id;
    this.chr = gene.gene_chr;
    this.strand = (gene.strand) ? gene.strand : gene.gene_strand;
    this.type = gene.type;
    this.yPos = this.getYPos(trackHeight);

    this.homologIDs = ids;
    this.selected = gene.sel ? gene.sel : false;

    // set the block ID if the gene is in the comparison genome
    if(blocks) this.setBlockID(blocks);

    // get the transcript of the gene
    let t = gene.canonical_transcript.map(t => `${t.start_pos}-${t.end_pos}`);
    // remove any duplicated exons
    let newT: Array<string> = Array.from(new Set(t));
    this.transcript = newT.map(t => {
      let coords = t.split('-');
      return { start: Number(coords[0]), end: Number(coords[1])};
    })
  }


  // Operational Methods

  /**
   * Marks the gene as a highlighted gene (indicates it's being hovered over)
   */
  highlight(): void { this.highlighted = true; }

  /**
   * Marks the gene as a non-highlighed gene
   */
  unhighlight(): void { this.highlighted = false; }

  /**
   * Marks the gene as a selected gene (from the feature search)
   */
  select(): void { this.selected = true; }

  /**
   * Marks the gene as a non-selected gene
   */
  deselect(): void { this.selected = false; }

  /**
   * Marks the gene as a filtered gene (passes the filtration functions)
   */
  filter(): void { this.filtered = true; }

  /**
   * Marks the gene as an unfiltered gene
   */
  unfilter(): void { this.filtered = false; }

  /**
   * Marks the gene as hidden (used with filters)
   */
  hide(): void { this.hidden = true; }

  /**
   * Marks the gene as non-hidden (used with filters)
   */
  show(): void { this.hidden = false; }

  /**
   * Resets the gene's filter-based status to "normal" (unfiltered, and visible)
   */
  resetFilterStatus(): void {
    this.unfilter();
    this.show();
  }


  // Getter Methods

  /**
   * Returns a central X position (px) for the gene using the specified scale
   * @param {ScaleLinear<number, number>} scale - scale to use to get the position
   */
  getCenterXPos(scale: ScaleLinear<number, number>): number {
    return scale(this.start + (this.size / 2));
  }

  /**
   * Returns a Y position (px) based on genomic location (used to reduce
   * overlap of genes in the tracks)
   * @param {number} trackHeight - height of the genomic track
   */
  getYPos(trackHeight: number): number {
    // 1.11 gets us close enough to edges without any elements overflowing
    let range = trackHeight / 1.11;
    // 1.13 pushes all elements down slightly to accomodate for the labels
    let offset = (((this.start % 1000) / 1000) * range) - range / 1.13;

    return ((trackHeight - 10) / 1.12 + offset) + 6;
  }

  /**
   * Returns a width (px) for the gene using the specified scale
   * @param {ScaleLinear<number, number>} scale - scale to use to get width
   */
  getWidth(scale: ScaleLinear<number, number>): number {
    return Math.abs(scale(this.end) - scale(this.start));
  }

  /**
   * Returns the width (px) of the specified exon using the specified scale
   * @param {Exon} exon - the exon to calculate the width for
   * @param {ScaleLinear<number, number>} scale - scale to use to get width of exon
   */
  getExonWidth(exon: Exon, scale: ScaleLinear<number, number>): number {
    return Math.abs(scale(exon.end) - scale(exon.start));
  }

  /**
   * Returns the appropriate color of the gene, depending on the status flag
   * states; order is important:
   * 1. We must check if the gene is being hovered over (highlighted) which
   *    should override selection/filtration status
   * 2. Selection is typically done before any filtering so we don't want to
   *    overwrite selection status
   * 3. Last resort to keep from it being colored black
   */
  getColor(): string {
    if(this.highlighted) {
      return '#080';
    } else if(this.selected) {
      return '#F00';
    } else if(this.filtered) {
      return '#00F';
    } else {
      return '#000';
    }
  }

  /**
   * Returns the data to be displayed in a tooltip
   */
  getTooltipData(): object {
    return {
      'Gene ID': this.id,
      'Chromosome': this.chr,
      'Type': this.type,
      'Location': `${this.format(this.start)}bp - ${this.format(this.end)}bp`,
      '# of Homologs': this.homologIDs.length,
      'Strand': this.strand
    }
  }

  /**
   * Returns the data necesarry to include for the gene in a download CSV of
   * filter results
   * @param {string} refSpeciesName - common name of the current ref species
   * @param {string} compSpeciesName - common name of the current comp species
   */
  getFilterMetadata(refSpeciesName: string, compSpeciesName: string): object {
    return {
      id: this.id,
      symbol: this.symbol,
      species: this.species === 'ref' ? refSpeciesName : compSpeciesName,
      type: this.type,
      chr: this.chr,
      start: this.start,
      end: this.end,
      status: this.hidden ? 'hidden' : 'highlighted'
    }
  }

  // Reference Getter Methods

  /**
   * Returns the scaled x position for the reference gene's start position (px)
   * @param {ScaleLinear<number, number>} scale - scale to use to get start point
   */
  getRefXPos(scale: ScaleLinear<number, number>): number { return scale(this.start); }

  /**
   * Returns the x, y positions (px) of a ref gene based on the specified scale
   * @param {ScaleLinear<number, number>} scale - scale to use to get the position
   */
  getRefPxCoords(scale: ScaleLinear<number, number>): Array<number> {
    return [this.getRefXPos(scale), this.yPos];
  }

  /**
   * Returns the x position (px) of the specified exon using the specified scale
   * @param {Exon} exon - the exon to calculate the width for
   * @param {ScaleLinear<number, number>} scale - scale to use to get the width
   *                                              of the exon
   */
  getRefExonXPos(exon: Exon, scale: ScaleLinear<number, number>): number {
    return Math.abs(scale(exon.start) - scale(this.start));
  }

  // Comparison Getter Methods

  /**
   * Returns the scaled x position for the comparison gene's start position (px)
   * @param {ScaleLinear<number, number>} scale - scale to use to get start point
   * @param {boolean} trueCoords - the flag for getting either the true starting
 *                                 point or matching starting point
   */
  getCompXPos(scale: ScaleLinear<number, number>, trueCoords: boolean): number {
    return scale(this.getStart(trueCoords));
  }

  /**
   * Returns the x and y positions (in px) of a copmarison gene based on the
   * specified scale, using either true coordinates or matching coordinates based
   * on the trueCoords flag
   * @param {ScaleLinear<number, number>} scale - scale to use to get start point
   * @param {boolean} trueCoords - the flag for getting either the true starting
   *                               point or matching starting point
   */
  getCompPxCoords(scale: ScaleLinear<number, number>,
                  trueCoords: boolean): Array<number> {
    return [this.getCompXPos(scale, trueCoords), this.yPos] ;
  }

  /**
   * Returns an X position (in px) for the specified exon, using the specified
   * scale and gene start position
   * @param {Exon} exon - the exon to calculate the X position for
   * @param {ScaleLinear<number, number>} scale - scale to use to get start point
   * @param {boolean} trueCoords - the flag for getting either the true starting
   *                               point or matching starting point
   */
  getCompExonXPos(exon: Exon, scale: ScaleLinear<number, number>,
                  trueCoords: boolean): number {
    let start = this.getStart(trueCoords);
    return start === this.start ?
           Math.abs(scale(exon.start) - scale(start)) :
           Math.abs(scale(start) - scale(exon.end));
  }

  /**
   * Returns a comparison gene's *visual* start point (either start or end point
   * based on whether true coords or matching coords are needed and if the
   * gene's orientation matches)
   * @param {boolean} trueCoords - the flag for getting either the true starting
   *                               point or matching starting point
   */
  getStart(trueCoords: boolean): number {
    return trueCoords ?
           this.start : (this.orientationMatches ? this.start : this.end);
  }

  /**
   * Returns a comparison gene's *visual* end point (either start or end point
   * based on whether true coords or matching coords are needed and if the
   * gene's orientation matches)
   * @param {boolean} trueCoords - the flag for getting either the true starting
   *                               point or matching starting point
   */
  getEnd(trueCoords: boolean): number {
    return trueCoords ?
      this.end : (this.orientationMatches ? this.end : this.start);
  }


  // Condition Checks

  /**
   * Returns true/false if the gene is located in a syntenic region
   */
  isSyntenic(): boolean { return !(!this.blockID); }

  /**
   * Returns true/false if the gene has at least one homolog
   */
  isHomologous(): boolean { return this.homologIDs.length > 0; }

  /**
   * Returns true/false if any of the status flags are true; essentially, if the
   * gene has a color, it should have a label
   */
  hasVisibleLabel(): boolean {
    return this.highlighted || this.selected || this.filtered;
  }

  /**
   * Returns true/false if the gene (ref) is in the current browser view (px)
   * @param {ScaleLinear<number, number>} scale - scale to use to get gene's
   *                                              edge positions
   * @param {number} width - the width of the browser
   */
  isInRefView(scale: ScaleLinear<number, number>, width: number): boolean {
    return !(this.getRefXPos(scale) + this.getWidth(scale) < 0 ||
             this.getRefXPos(scale) > width);
  }

  /**
   * Returns true/false if the gene (comp) is in the current browser view (px)
   * @param {ScaleLinear<number, number>} scale - scale to use to get gene's
   *                                              edge positions
   * @param {number} width - the width of the browser
   * @param {boolean} trueCoords - the flag for getting either the true starting
   *                               point or matching starting point
   */
  isInCompView(scale: ScaleLinear<number, number>,
               width: number, trueCoords: boolean): boolean {
    return !(this.getCompXPos(scale, trueCoords) + this.getWidth(scale) < 0 ||
             this.getCompXPos(scale, trueCoords) > width);
  }


  // Private Methods

  /**
   * Sets the block ID to that of the block the gene is contained in; if the
   * block doesn't fully contain the gene, it won't be considered syntenic
   * @param {Array<SyntenyBlock>} blocks - blocks to use identify the gene's blockID
   */
  private setBlockID(blocks: Array<SyntenyBlock>): void {
    // get the block that contains the gene
    let b = blocks.filter(block => {
      return block.matchesCompChr(this.chr) && block.contains(this)
    });

    // if the gene is contained in a block, assign the block's id to
    // this.blockID, otherwise keep it null
    this.blockID = b.length > 0 ? b[0].id : null;

    // if an ID was just assigned, it's important to note the orientation
    if(this.blockID) this.orientationMatches = b[0].orientationMatches;
  }
}
